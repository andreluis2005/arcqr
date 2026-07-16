export const ARC_TESTNET = {
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 6,
  },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.testnet.arc.network",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "Arc Explorer",
      url:
        process.env.NEXT_PUBLIC_EXPLORER_URL ||
        "https://explorer.testnet.arc.network",
    },
  },
  testnet: true,
} as const;
