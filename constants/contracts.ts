export const ARC_QR_PAYMENTS_ABI = [
  {
    "anonymous": false,
    "inputs": [{ "indexed": true, "internalType": "bytes32", "name": "invoiceId", "type": "bytes32" }],
    "name": "PaymentCancelled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "bytes32", "name": "invoiceId", "type": "bytes32" },
      { "indexed": true, "internalType": "address", "name": "payer", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "recipient", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "PaymentCompleted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "bytes32", "name": "invoiceId", "type": "bytes32" },
      { "indexed": true, "internalType": "address", "name": "creator", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "recipient", "type": "address" },
      { "indexed": false, "internalType": "address", "name": "token", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "indexed": false, "internalType": "string", "name": "title", "type": "string" },
      { "indexed": false, "internalType": "uint256", "name": "expiresAt", "type": "uint256" }
    ],
    "name": "PaymentRequestCreated",
    "type": "event"
  },
  // ===== NanoPayments events =====
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "bytes32", "name": "channelId", "type": "bytes32" },
      { "indexed": true, "internalType": "address", "name": "payer", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "receiver", "type": "address" },
      { "indexed": false, "internalType": "address", "name": "token", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "deposit", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "ratePerTick", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "intervalSeconds", "type": "uint256" }
    ],
    "name": "NanoChannelOpened",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "bytes32", "name": "channelId", "type": "bytes32" },
      { "indexed": true, "internalType": "address", "name": "receiver", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "totalWithdrawn", "type": "uint256" }
    ],
    "name": "NanoTickSettled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "bytes32", "name": "channelId", "type": "bytes32" },
      { "indexed": true, "internalType": "address", "name": "payer", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "refunded", "type": "uint256" }
    ],
    "name": "NanoChannelClosed",
    "type": "event"
  },
  // ===== Invoice functions =====
  {
    "inputs": [{ "internalType": "bytes32", "name": "invoiceId", "type": "bytes32" }],
    "name": "cancel",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "recipient", "type": "address" },
      { "internalType": "address", "name": "token", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "internalType": "string", "name": "title", "type": "string" },
      { "internalType": "string", "name": "description", "type": "string" },
      { "internalType": "uint256", "name": "durationInSeconds", "type": "uint256" }
    ],
    "name": "createPaymentRequest",
    "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "bytes32", "name": "invoiceId", "type": "bytes32" }],
    "name": "getRequest",
    "outputs": [
      {
        "components": [
          { "internalType": "bytes32", "name": "invoiceId", "type": "bytes32" },
          { "internalType": "address", "name": "creator", "type": "address" },
          { "internalType": "address", "name": "recipient", "type": "address" },
          { "internalType": "address", "name": "token", "type": "address" },
          { "internalType": "uint256", "name": "amount", "type": "uint256" },
          { "internalType": "string", "name": "title", "type": "string" },
          { "internalType": "string", "name": "description", "type": "string" },
          { "internalType": "uint256", "name": "createdAt", "type": "uint256" },
          { "internalType": "uint256", "name": "expiresAt", "type": "uint256" },
          { "internalType": "bool", "name": "paid", "type": "bool" },
          { "internalType": "bool", "name": "cancelled", "type": "bool" },
          { "internalType": "address", "name": "payer", "type": "address" }
        ],
        "internalType": "struct ArcQRPayments.PaymentRequest",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "bytes32", "name": "invoiceId", "type": "bytes32" }],
    "name": "pay",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  // ===== NanoPayments functions =====
  {
    "inputs": [
      { "internalType": "address", "name": "receiver", "type": "address" },
      { "internalType": "address", "name": "token", "type": "address" },
      { "internalType": "uint256", "name": "ratePerTick", "type": "uint256" },
      { "internalType": "uint256", "name": "intervalSeconds", "type": "uint256" },
      { "internalType": "uint256", "name": "durationInSeconds", "type": "uint256" }
    ],
    "name": "openNanoChannel",
    "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "bytes32", "name": "channelId", "type": "bytes32" }],
    "name": "settleNanoChannel",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "bytes32", "name": "channelId", "type": "bytes32" }],
    "name": "closeNanoChannel",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "bytes32", "name": "channelId", "type": "bytes32" }],
    "name": "getNanoChannel",
    "outputs": [
      {
        "components": [
          { "internalType": "address", "name": "payer", "type": "address" },
          { "internalType": "address", "name": "receiver", "type": "address" },
          { "internalType": "address", "name": "token", "type": "address" },
          { "internalType": "uint256", "name": "deposit", "type": "uint256" },
          { "internalType": "uint256", "name": "withdrawn", "type": "uint256" },
          { "internalType": "uint256", "name": "ratePerTick", "type": "uint256" },
          { "internalType": "uint256", "name": "intervalSeconds", "type": "uint256" },
          { "internalType": "uint256", "name": "lastTickAt", "type": "uint256" },
          { "internalType": "uint256", "name": "openedAt", "type": "uint256" },
          { "internalType": "bool", "name": "closed", "type": "bool" }
        ],
        "internalType": "struct ArcQRPayments.NanoChannel",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "bytes32", "name": "channelId", "type": "bytes32" }],
    "name": "estimateOwed",
    "outputs": [
      { "internalType": "uint256", "name": "newTicks", "type": "uint256" },
      { "internalType": "uint256", "name": "owed", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export const CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`) ||
  "0x0000000000000000000000000000000000000000";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

export const TOKENS = [
  {
    symbol: "USDC",
    name: "USD Coin (Native)",
    address: ZERO_ADDRESS,
    decimals: 6,
    isNative: true,
  },
] as const;
