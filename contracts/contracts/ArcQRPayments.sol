// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ArcQRPayments
 * @author Arc QR — Programmable Money Hackathon (Encode Club + Circle)
 * @notice Pagamentos on-chain USDC-nativos na Arc Network, com suporte a
 *         invoices QR-coded E um módulo de nanopayments (streaming/micro-ticks)
 *         entre agentes de IA — track Agentic Economy.
 *
 * Design notes:
 *  - Na Arc Network, USDC é a moeda nativa (gas token). Logo `address(0)` é USDC nativo.
 *  - Nanopayments usam o mesmo canal: payer deposita USDC nativo; receiver saca ticks
 *    acumulados on-chain a cada `intervalSeconds` (state-channel simplificado).
 *  - Compilável direto no Remix (sem imports externos).
 */
contract ArcQRPayments {
    // ============================================================
    //  PAYMENT REQUESTS (QR-coded invoices)
    // ============================================================

    struct PaymentRequest {
        bytes32 invoiceId;
        address creator;
        address recipient;
        address token; // address(0) = USDC nativo (Arc). Outros = ERC20.
        uint256 amount;
        string  title;
        string  description;
        uint256 createdAt;
        uint256 expiresAt;
        bool    paid;
        bool    cancelled;
        address payer;
    }

    mapping(bytes32 => PaymentRequest) private _requests;
    uint256 private _invoiceNonce;

    event PaymentRequestCreated(
        bytes32 indexed invoiceId,
        address indexed creator,
        address indexed recipient,
        address token,
        uint256 amount,
        string title,
        uint256 expiresAt
    );
    event PaymentCompleted(
        bytes32 indexed invoiceId,
        address indexed payer,
        address indexed recipient,
        uint256 amount
    );
    event PaymentCancelled(bytes32 indexed invoiceId);

    modifier onlyCreator(bytes32 invoiceId) {
        require(_requests[invoiceId].creator == msg.sender, "Only creator");
        _;
    }

    function createPaymentRequest(
        address recipient,
        address token,
        uint256 amount,
        string calldata title,
        string calldata description,
        uint256 durationInSeconds
    ) external returns (bytes32) {
        require(recipient != address(0), "Recipient=0");
        require(amount > 0, "Amount=0");
        require(durationInSeconds > 0, "Duration=0");

        _invoiceNonce++;
        bytes32 invoiceId = keccak256(
            abi.encodePacked(msg.sender, recipient, amount, _invoiceNonce, block.timestamp)
        );

        uint256 expiresAt = block.timestamp + durationInSeconds;

        _requests[invoiceId] = PaymentRequest({
            invoiceId: invoiceId,
            creator:   msg.sender,
            recipient: recipient,
            token:     token,
            amount:    amount,
            title:     title,
            description: description,
            createdAt: block.timestamp,
            expiresAt: expiresAt,
            paid:      false,
            cancelled: false,
            payer:     address(0)
        });

        emit PaymentRequestCreated(invoiceId, msg.sender, recipient, token, amount, title, expiresAt);
        return invoiceId;
    }

    function pay(bytes32 invoiceId) external payable {
        PaymentRequest storage r = _requests[invoiceId];
        require(r.invoiceId != bytes32(0), "Not found");
        require(!r.paid, "Paid");
        require(!r.cancelled, "Cancelled");
        require(block.timestamp <= r.expiresAt, "Expired");

        r.paid = true;
        r.payer = msg.sender;

        if (r.token == address(0)) {
            require(msg.value == r.amount, "Wrong amount");
            (bool ok, ) = r.recipient.call{value: msg.value}("");
            require(ok, "Transfer fail");
        } else {
            require(msg.value == 0, "Don't send native");
            _transferFromERC20(r.token, msg.sender, r.recipient, r.amount);
        }

        emit PaymentCompleted(invoiceId, msg.sender, r.recipient, r.amount);
    }

    function cancel(bytes32 invoiceId) external onlyCreator(invoiceId) {
        PaymentRequest storage r = _requests[invoiceId];
        require(!r.paid, "Already paid");
        require(!r.cancelled, "Already cancelled");
        r.cancelled = true;
        emit PaymentCancelled(invoiceId);
    }

    function getRequest(bytes32 invoiceId) external view returns (PaymentRequest memory) {
        require(_requests[invoiceId].invoiceId != bytes32(0), "Not found");
        return _requests[invoiceId];
    }

    // ============================================================
    //  NANOPAYMENTS — agent-to-agent micro streams
    // ============================================================
    //
    //  Resumão: o payer abre um canal depositando USDC nativo. Cada `intervalSeconds`,
    //  o receiver (ou qualquer parte) chama `settleNanoChannel` para sacar a quantia
    //  acumulada de ticks. O canal pode ser fechado a qualquer momento, devolvendo
    //  o saldo restante ao payer.
    //
    //  Caso de uso: agentes IA consumindo API de outro agente. Em vez de pagar
    //  por request HTTP (caro + latência), eles abrem 1 canal e cobram 0.0001 USDC
    //  por tick (segundo). Settlement é batch e atômica on-chain.

    struct NanoChannel {
        address payer;
        address receiver;
        address token;        // address(0) = USDC nativo Arc
        uint256 deposit;
        uint256 withdrawn;
        uint256 ratePerTick;    // wei (USDC = 6 decimals)
        uint256 intervalSeconds;
        uint256 lastTickAt;
        uint256 openedAt;
        bool    closed;
    }

    uint256 private _channelNonce;
    mapping(bytes32 => NanoChannel) private _channels;

    event NanoChannelOpened(
        bytes32 indexed channelId,
        address indexed payer,
        address indexed receiver,
        address token,
        uint256 deposit,
        uint256 ratePerTick,
        uint256 intervalSeconds
    );
    event NanoTickSettled(
        bytes32 indexed channelId,
        address indexed receiver,
        uint256 amount,
        uint256 totalWithdrawn
    );
    event NanoChannelClosed(
        bytes32 indexed channelId,
        address indexed payer,
        uint256 refunded
    );

    function openNanoChannel(
        address receiver,
        address token,
        uint256 ratePerTick,
        uint256 intervalSeconds,
        uint256 durationInSeconds
    ) external payable returns (bytes32) {
        require(receiver != address(0), "Receiver=0");
        require(ratePerTick > 0, "Rate=0");
        require(intervalSeconds > 0, "Interval=0");
        require(durationInSeconds >= intervalSeconds, "Dur<Interval");

        uint256 ticks = durationInSeconds / intervalSeconds;
        uint256 deposit = ratePerTick * ticks;

        if (token == address(0)) {
            require(msg.value == deposit, "Wrong deposit");
        } else {
            require(msg.value == 0, "No native w/ ERC20");
            _transferFromERC20(token, msg.sender, address(this), deposit);
        }

        _channelNonce++;
        bytes32 channelId = keccak256(
            abi.encodePacked(msg.sender, receiver, ratePerTick, _channelNonce, block.timestamp)
        );

        _channels[channelId] = NanoChannel({
            payer:           msg.sender,
            receiver:        receiver,
            token:           token,
            deposit:         deposit,
            withdrawn:       0,
            ratePerTick:     ratePerTick,
            intervalSeconds: intervalSeconds,
            lastTickAt:      block.timestamp,
            openedAt:        block.timestamp,
            closed:          false
        });

        emit NanoChannelOpened(channelId, msg.sender, receiver, token, deposit, ratePerTick, intervalSeconds);
        return channelId;
    }

    function settleNanoChannel(bytes32 channelId) external {
        NanoChannel storage ch = _channels[channelId];
        require(ch.payer != address(0), "Not found");
        require(!ch.closed, "Closed");

        uint256 elapsed = block.timestamp - ch.lastTickAt;
        uint256 newTicks = elapsed / ch.intervalSeconds;
        if (newTicks == 0) return;

        uint256 owed = newTicks * ch.ratePerTick;
        uint256 remaining = ch.deposit - ch.withdrawn;
        if (owed > remaining) owed = remaining;

        ch.withdrawn   += owed;
        ch.lastTickAt  += newTicks * ch.intervalSeconds;

        if (ch.token == address(0)) {
            (bool ok, ) = ch.receiver.call{value: owed}("");
            require(ok, "Settle fail");
        } else {
            _transferERC20(ch.token, ch.receiver, owed);
        }

        emit NanoTickSettled(channelId, ch.receiver, owed, ch.withdrawn);
    }

    function closeNanoChannel(bytes32 channelId) external {
        NanoChannel storage ch = _channels[channelId];
        require(ch.payer != address(0), "Not found");
        require(!ch.closed, "Closed");
        require(msg.sender == ch.payer || msg.sender == ch.receiver, "Not party");

        ch.closed = true;
        uint256 leftover = ch.deposit - ch.withdrawn;
        if (leftover > 0) {
            if (ch.token == address(0)) {
                (bool ok, ) = ch.payer.call{value: leftover}("");
                require(ok, "Refund fail");
            } else {
                _transferERC20(ch.token, ch.payer, leftover);
            }
        }

        emit NanoChannelClosed(channelId, ch.payer, leftover);
    }

    function getNanoChannel(bytes32 channelId) external view returns (NanoChannel memory) {
        return _channels[channelId];
    }

    function estimateOwed(bytes32 channelId) external view returns (uint256 newTicks, uint256 owed) {
        NanoChannel storage ch = _channels[channelId];
        if (ch.payer == address(0) || ch.closed) return (0, 0);
        uint256 elapsed = block.timestamp - ch.lastTickAt;
        newTicks = elapsed / ch.intervalSeconds;
        uint256 remaining = ch.deposit - ch.withdrawn;
        owed = newTicks * ch.ratePerTick;
        if (owed > remaining) owed = remaining;
    }

    // ============================================================
    //  Minimal ERC20 helper (no OZ import — Remix-friendly)
    // ============================================================
    function _transferERC20(address token, address to, uint256 amount) internal {
        (bool ok, bytes memory data) = token.call(
            abi.encodeWithSignature("transfer(address,uint256)", to, amount)
        );
        require(ok && (data.length == 0 || abi.decode(data, (bool))), "ERC20 transfer fail");
    }

    function _transferFromERC20(address token, address from, address to, uint256 amount) internal {
        (bool ok, bytes memory data) = token.call(
            abi.encodeWithSignature("transferFrom(address,address,uint256)", from, to, amount)
        );
        require(ok && (data.length == 0 || abi.decode(data, (bool))), "ERC20 transferFrom fail");
    }
}
