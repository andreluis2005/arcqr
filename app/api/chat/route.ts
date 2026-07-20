import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createPublicClient, http, parseAbiItem, defineChain } from "viem";
import { ARC_QR_PAYMENTS_ABI, CONTRACT_ADDRESS } from "@/constants/contracts";

// Define a rede Arc Testnet para o cliente viem
const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USD Coin", symbol: "USDC", decimals: 6 },
  rpcUrls: {
    default: { http: ["https://rpc.testnet.arc.network"] },
  },
});

const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.testnet.arc.network"),
});

// Inicializa a API do Gemini
const geminiApiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

// Regex para detectar invoiceId (hash bytes32 com prefixo 0x + 64 caracteres hexadecimais)
const INVOICE_ID_REGEX = /0x[a-fA-F0-9]{64}/g;

export async function POST(req: Request) {
  try {
    if (!geminiApiKey) {
      return NextResponse.json(
        {
          message: "O assistente de IA está indisponível porque a chave GEMINI_API_KEY não foi configurada nas variáveis de ambiente. Por favor, adicione GEMINI_API_KEY ao arquivo .env.local para testar esta funcionalidade.",
          action: { type: "NONE" },
        },
        { status: 200 }
      );
    }

    const { messages, walletAddress } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array is required" }, { status: 400 });
    }

    // Pega a última mensagem do usuário para analisar se há menção a algum invoiceId
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content || "";
    const matches = lastUserMessage.match(INVOICE_ID_REGEX);
    
    let blockchainContext = "";

    // Se detectou um invoiceId, busca os detalhes direto na blockchain Arc Testnet
    if (matches && matches.length > 0) {
      const invoiceId = matches[0];
      try {
        const rawRequest = await publicClient.readContract({
          address: CONTRACT_ADDRESS as `0x${string}`,
          abi: ARC_QR_PAYMENTS_ABI,
          functionName: "getRequest",
          args: [invoiceId as `0x${string}`],
        });

        if (rawRequest && rawRequest.invoiceId) {
          // Converte BigInt para string para o JSON do prompt
          const tokenAddress = rawRequest.token;
          const isNative = tokenAddress === "0x0000000000000000000000000000000000000000";
          const decimals = isNative ? 6 : 18;
          const rawAmount = rawRequest.amount;
          const amountFormatted = (Number(rawAmount) / 10 ** decimals).toString();

          let status = "active";
          const now = Math.floor(Date.now() / 1000);
          if (rawRequest.paid) status = "paid";
          else if (rawRequest.cancelled) status = "cancelled";
          else if (now > Number(rawRequest.expiresAt)) status = "expired";

          blockchainContext = `\n[CONTEXTO DA BLOCKCHAIN: Encontrei os dados on-chain para a fatura informada (${invoiceId}):
          - Título: "${rawRequest.title}"
          - Descrição: "${rawRequest.description}"
          - Valor: ${amountFormatted} USDC
          - Destinatário (Recipient): ${rawRequest.recipient}
          - Criador (Creator): ${rawRequest.creator}
          - Status Atual: ${status.toUpperCase()} (pago: ${rawRequest.paid}, cancelado: ${rawRequest.cancelled}, expirado: ${now > Number(rawRequest.expiresAt)})
          - Pagar com este ID de Fatura é possível se o status for ACTIVE.
          Diga isso ao usuário amigavelmente e ofereça a ação correspondente no JSON.]\n`;
        }
      } catch (err) {
        console.warn("Erro ao ler contrato no backend para invoice:", invoiceId, err);
        blockchainContext = `\n[CONTEXTO DA BLOCKCHAIN: Tentei buscar os dados para a fatura ${invoiceId} na blockchain Arc Testnet, mas ela parece não existir no contrato ou ocorreu um erro de conexão.]\n`;
      }
    }

    // Se informou a carteira do usuário, busca faturas recentes na blockchain para enriquecer o contexto
    let userInvoicesContext = "";
    if (walletAddress) {
      try {
        const PAYMENT_REQUEST_CREATED_EVENT = parseAbiItem(
          "event PaymentRequestCreated(bytes32 indexed invoiceId, address indexed creator, address indexed recipient, address token, uint256 amount, string title, uint256 expiresAt)"
        );

        // Busca logs criados
        const createdLogs = await publicClient.getLogs({
          address: CONTRACT_ADDRESS as `0x${string}`,
          event: PAYMENT_REQUEST_CREATED_EVENT,
          fromBlock: 0n,
          toBlock: "latest",
          args: { creator: walletAddress },
        });

        // Busca logs recebidos
        const receivedLogs = await publicClient.getLogs({
          address: CONTRACT_ADDRESS as `0x${string}`,
          event: PAYMENT_REQUEST_CREATED_EVENT,
          fromBlock: 0n,
          toBlock: "latest",
          args: { recipient: walletAddress },
        });

        const allLogs = [...createdLogs, ...receivedLogs];
        const uniqueLogsMap = new Map();
        for (const log of allLogs) {
          if (log.args.invoiceId) {
            uniqueLogsMap.set(log.args.invoiceId, log.args);
          }
        }

        const uniqueInvoices = Array.from(uniqueLogsMap.values());

        if (uniqueInvoices.length > 0) {
          userInvoicesContext = `\n[CONTEXTO DA BLOCKCHAIN - FATURAS DA CARTEIRA DO USUÁRIO (${walletAddress}):\n`;
          for (const inv of uniqueInvoices.slice(-5)) { // mostra até 5 recentes
            const isCreator = inv.creator?.toLowerCase() === walletAddress.toLowerCase();
            const amountFormatted = (Number(inv.amount) / 10 ** 6).toFixed(2);
            userInvoicesContext += `- InvoiceId: ${inv.invoiceId} | Título: "${inv.title}" | Valor: ${amountFormatted} USDC | Tipo: ${isCreator ? "Criada por você" : "Recebida por você"} | Expira em (timestamp): ${inv.expiresAt}\n`;
          }
          userInvoicesContext += `Sempre que o usuário perguntar sobre suas faturas, liste-as de forma amigável com seus títulos e valores. Se ele quiser interagir com uma delas, use o invoiceId correspondente no campo action.]\n`;
        }
      } catch (err) {
        console.warn("Erro ao buscar faturas do usuário no backend:", err);
      }
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
      systemInstruction: `Você é o Arc AI Assistant, um assistente financeiro inteligente integrado ao aplicativo "Arc QR" na blockchain Arc Network (desenvolvida pela Circle, onde USDC é a moeda nativa e usada para taxas de gas).

Seu objetivo é ajudar os usuários a gerenciar faturas on-chain e realizar pagamentos de forma fácil.

Sempre responda em português do Brasil e siga estritamente o formato JSON de resposta:
{
  "message": "Escreva aqui sua resposta amigável em formato markdown para o usuário. Seja breve e cordial.",
  "action": {
    "type": "NONE" | "CREATE_INVOICE" | "PAY_INVOICE" | "CANCEL_INVOICE" | "SHOW_INVOICE_DETAILS",
    "params": {
      "invoiceId": "string (ID hexadecimal de 32 bytes 0x...)",
      "amount": "string (valor em USDC, ex: '15.50')",
      "recipient": "string (endereço Ethereum do destinatário 0x...)",
      "title": "string (título da fatura)",
      "description": "string (descrição opcional)",
      "durationDays": 7
    }
  }
}

Regras Importantes de Ação:
1. Se o usuário quiser criar uma fatura (por exemplo: "Crie uma cobrança de 10 USDC para 0xABC..."), preencha type como "CREATE_INVOICE" e forneça os parâmetros necessários. Se faltar dados (ex: destinatário ou valor), pergunte primeiro definindo type como "NONE".
2. Se o usuário quiser pagar uma fatura (ex: "Pague a fatura 0x123..."), preencha type como "PAY_INVOICE" com o invoiceId correspondente.
3. Se o usuário quiser ver os detalhes ou status de uma fatura (ex: "Consulte a fatura 0x123..."), preencha type como "SHOW_INVOICE_DETAILS" com o invoiceId correspondente.
4. Se o usuário quiser cancelar uma fatura (ex: "Cancele a fatura 0x123..."), preencha type como "CANCEL_INVOICE" com o invoiceId correspondente.
5. Se for apenas conversa fiada ou tirar dúvidas sobre o app, defina type como "NONE".
6. Nunca invente IDs de faturas. Só utilize os IDs de faturas ou endereços explicitados pelo usuário ou trazidos no contexto.

Use o contexto da blockchain fornecido nas mensagens para informar o usuário sobre detalhes reais de faturas.`,
    });

    // Formata o histórico de mensagens para a API do Gemini
    const contents = [];
    
    // Adiciona o contexto da blockchain na última mensagem de usuário se disponível
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      let text = msg.content;
      
      // Se for a última mensagem de usuário, anexa o contexto da blockchain se houver
      if (i === messages.length - 1 && msg.role === "user") {
        if (blockchainContext) {
          text += blockchainContext;
        }
        if (userInvoicesContext) {
          text += userInvoicesContext;
        }
      }
      
      contents.push({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: text }],
      });
    }

    const result = await model.generateContent({
      contents: contents,
    });

    const responseText = result.response.text();
    
    // Faz parse do JSON retornado pelo Gemini para garantir que é válido antes de enviar ao frontend
    try {
      const parsed = JSON.parse(responseText);
      return NextResponse.json(parsed);
    } catch {
      // Se falhar o parse, tenta higienizar ou retorna como mensagem normal
      return NextResponse.json({
        message: responseText,
        action: { type: "NONE" },
      });
    }
  } catch (error: any) {
    console.error("Erro na API de Chat:", error);
    return NextResponse.json(
      {
        message: "Ocorreu um erro ao processar sua mensagem com o modelo de IA.",
        error: error.message,
        action: { type: "NONE" },
      },
      { status: 500 }
    );
  }
}
