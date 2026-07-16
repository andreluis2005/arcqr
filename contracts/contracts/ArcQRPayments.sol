// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ArcQRPayments
 * @dev Contrato para criação, pagamento e cancelamento de cobranças em blockchain na rede Arc.
 */
contract ArcQRPayments is ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct PaymentRequest {
        bytes32 invoiceId;
        address creator;
        address recipient;
        address token; // address(0) para moeda nativa (ex: USDC na Arc), caso contrário ERC-20
        uint256 amount;
        string title;
        string description;
        uint256 createdAt;
        uint256 expiresAt;
        bool paid;
        bool cancelled;
        address payer;
    }

    // Mapeamento de invoiceId para PaymentRequest
    mapping(bytes32 => PaymentRequest) private _requests;
    
    // Contador para garantir unicidade do invoiceId
    uint256 private _nonce;

    // Eventos
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

    // Modificadores
    modifier onlyCreator(bytes32 invoiceId) {
        require(_requests[invoiceId].creator == msg.sender, "Only creator can cancel");
        _;
    }

    /**
     * @dev Cria uma solicitação de pagamento.
     * @param recipient Endereço que receberá os fundos.
     * @param token Endereço do token ERC-20 (ou address(0) para moeda nativa).
     * @param amount Quantidade a ser paga.
     * @param title Título da cobrança.
     * @param description Descrição detalhada da cobrança.
     * @param durationInSeconds Tempo de expiração em segundos a partir do momento atual.
     * @return invoiceId O ID gerado para a cobrança.
     */
    function createPaymentRequest(
        address recipient,
        address token,
        uint256 amount,
        string calldata title,
        string calldata description,
        uint256 durationInSeconds
    ) external returns (bytes32) {
        require(recipient != address(0), "Recipient cannot be zero address");
        require(amount > 0, "Amount must be greater than zero");
        require(durationInSeconds > 0, "Duration must be greater than zero");

        _nonce++;
        bytes32 invoiceId = keccak256(
            abi.encodePacked(msg.sender, recipient, amount, _nonce, block.timestamp)
        );

        uint256 createdAt = block.timestamp;
        uint256 expiresAt = createdAt + durationInSeconds;

        _requests[invoiceId] = PaymentRequest({
            invoiceId: invoiceId,
            creator: msg.sender,
            recipient: recipient,
            token: token,
            amount: amount,
            title: title,
            description: description,
            createdAt: createdAt,
            expiresAt: expiresAt,
            paid: false,
            cancelled: false,
            payer: address(0)
        });

        emit PaymentRequestCreated(
            invoiceId,
            msg.sender,
            recipient,
            token,
            amount,
            title,
            expiresAt
        );

        return invoiceId;
    }

    /**
     * @dev Efetua o pagamento de uma cobrança ativa.
     * @param invoiceId O ID da cobrança.
     */
    function pay(bytes32 invoiceId) external payable nonReentrant {
        PaymentRequest storage request = _requests[invoiceId];

        require(request.invoiceId != bytes32(0), "Payment request does not exist");
        require(!request.paid, "Already paid");
        require(!request.cancelled, "Payment request cancelled");
        require(block.timestamp <= request.expiresAt, "Payment request expired");

        request.paid = true;
        request.payer = msg.sender;

        if (request.token == address(0)) {
            // Pagamento com moeda nativa da rede (e.g. USDC nativo na rede Arc ou ETH na testnet)
            require(msg.value == request.amount, "Incorrect payment amount");
            
            (bool success, ) = request.recipient.call{value: msg.value}("");
            require(success, "Native transfer failed");
        } else {
            // Pagamento com token ERC-20 específico
            require(msg.value == 0, "Do not send native tokens with ERC-20 payment");
            
            IERC20(request.token).safeTransferFrom(msg.sender, request.recipient, request.amount);
        }

        emit PaymentCompleted(invoiceId, msg.sender, request.recipient, request.amount);
    }

    /**
     * @dev Cancela uma cobrança não paga. Somente o criador pode realizar o cancelamento.
     * @param invoiceId O ID da cobrança.
     */
    function cancel(bytes32 invoiceId) external onlyCreator(invoiceId) {
        PaymentRequest storage request = _requests[invoiceId];
        
        require(!request.paid, "Cannot cancel a paid request");
        require(!request.cancelled, "Already cancelled");

        request.cancelled = true;

        emit PaymentCancelled(invoiceId);
    }

    /**
     * @dev Retorna os detalhes de uma solicitação de pagamento.
     * @param invoiceId O ID da cobrança.
     * @return Os dados da struct PaymentRequest.
     */
    function getRequest(bytes32 invoiceId) external view returns (PaymentRequest memory) {
        require(_requests[invoiceId].invoiceId != bytes32(0), "Payment request does not exist");
        return _requests[invoiceId];
    }
}
