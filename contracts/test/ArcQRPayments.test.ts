import { expect } from "chai";
import { ethers } from "hardhat";
import { ArcQRPayments, MockERC20 } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("ArcQRPayments", function () {
  let arcQRPayments: ArcQRPayments;
  let mockUSDC: MockERC20;
  let owner: SignerWithAddress;
  let creator: SignerWithAddress;
  let recipient: SignerWithAddress;
  let payer: SignerWithAddress;

  beforeEach(async function () {
    [owner, creator, recipient, payer] = await ethers.getSigners();

    // Deploy do contrato principal
    const ArcQRPaymentsFactory = await ethers.getContractFactory("ArcQRPayments");
    arcQRPayments = await ArcQRPaymentsFactory.deploy();

    // Deploy do token MockERC20 (USDC)
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    mockUSDC = await MockERC20Factory.deploy("Mock USDC", "USDC", ethers.parseEther("10000"));
    
    // Distribuir tokens para o pagador
    await mockUSDC.transfer(payer.address, ethers.parseEther("1000"));
  });

  describe("Criação de Cobranças (createPaymentRequest)", function () {
    it("Deve criar uma cobrança nativa com sucesso e emitir evento", async function () {
      const amount = ethers.parseEther("1.5");
      const title = "Aluguel de Equipamento";
      const description = "Pagamento do aluguel do servidor mensal";
      const duration = 3600; // 1 hora

      const tx = await arcQRPayments.connect(creator).createPaymentRequest(
        recipient.address,
        ethers.ZeroAddress,
        amount,
        title,
        description,
        duration
      );

      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;

      // Pegar o evento
      const filter = arcQRPayments.filters.PaymentRequestCreated;
      const events = await arcQRPayments.queryFilter(filter);
      expect(events.length).to.equal(1);
      
      const invoiceId = events[0].args.invoiceId;
      expect(invoiceId).to.not.be.undefined;

      // Buscar a solicitação criada
      const request = await arcQRPayments.getRequest(invoiceId);
      expect(request.invoiceId).to.equal(invoiceId);
      expect(request.creator).to.equal(creator.address);
      expect(request.recipient).to.equal(recipient.address);
      expect(request.token).to.equal(ethers.ZeroAddress);
      expect(request.amount).to.equal(amount);
      expect(request.title).to.equal(title);
      expect(request.description).to.equal(description);
      expect(request.paid).to.be.false;
      expect(request.cancelled).to.be.false;
    });

    it("Deve falhar se o destinatário for o endereço zero", async function () {
      await expect(
        arcQRPayments.connect(creator).createPaymentRequest(
          ethers.ZeroAddress,
          ethers.ZeroAddress,
          ethers.parseEther("1"),
          "Falha",
          "",
          100
        )
      ).to.be.revertedWith("Recipient cannot be zero address");
    });

    it("Deve falhar se a quantia for zero", async function () {
      await expect(
        arcQRPayments.connect(creator).createPaymentRequest(
          recipient.address,
          ethers.ZeroAddress,
          0,
          "Falha",
          "",
          100
        )
      ).to.be.revertedWith("Amount must be greater than zero");
    });
  });

  describe("Pagamento de Cobranças (pay)", function () {
    let nativeInvoiceId: string;
    let erc20InvoiceId: string;
    const nativeAmount = ethers.parseEther("2.0");
    const erc20Amount = ethers.parseEther("50.0"); // 50 USDC
    const duration = 3600;

    beforeEach(async function () {
      // Criar cobrança nativa
      let tx = await arcQRPayments.connect(creator).createPaymentRequest(
        recipient.address,
        ethers.ZeroAddress,
        nativeAmount,
        "Serviço Nativo",
        "Pagar em ETH/USDC Nativo",
        duration
      );
      let receipt = await tx.wait();
      let events = await arcQRPayments.queryFilter(arcQRPayments.filters.PaymentRequestCreated);
      nativeInvoiceId = events[0].args.invoiceId;

      // Criar cobrança ERC20
      tx = await arcQRPayments.connect(creator).createPaymentRequest(
        recipient.address,
        await mockUSDC.getAddress(),
        erc20Amount,
        "Serviço ERC20",
        "Pagar em USDC Token",
        duration
      );
      receipt = await tx.wait();
      events = await arcQRPayments.queryFilter(arcQRPayments.filters.PaymentRequestCreated);
      // O segundo evento criado
      erc20InvoiceId = events[1].args.invoiceId;
    });

    it("Deve pagar uma cobrança nativa com sucesso", async function () {
      const balanceBefore = await ethers.provider.getBalance(recipient.address);

      const tx = await arcQRPayments.connect(payer).pay(nativeInvoiceId, {
        value: nativeAmount,
      });

      await expect(tx)
        .to.emit(arcQRPayments, "PaymentCompleted")
        .withArgs(nativeInvoiceId, payer.address, recipient.address, nativeAmount);

      const request = await arcQRPayments.getRequest(nativeInvoiceId);
      expect(request.paid).to.be.true;
      expect(request.payer).to.equal(payer.address);

      const balanceAfter = await ethers.provider.getBalance(recipient.address);
      expect(balanceAfter - balanceBefore).to.equal(nativeAmount);
    });

    it("Deve falhar se pagar com valor incorreto de moeda nativa", async function () {
      await expect(
        arcQRPayments.connect(payer).pay(nativeInvoiceId, {
          value: ethers.parseEther("1.0"), // menos que o amount
        })
      ).to.be.revertedWith("Incorrect payment amount");
    });

    it("Deve pagar uma cobrança ERC20 com sucesso", async function () {
      const usdcAddress = await mockUSDC.getAddress();
      
      // Payer precisa aprovar o contrato antes de pagar
      await mockUSDC.connect(payer).approve(await arcQRPayments.getAddress(), erc20Amount);

      const balanceBefore = await mockUSDC.balanceOf(recipient.address);

      const tx = await arcQRPayments.connect(payer).pay(erc20InvoiceId);

      await expect(tx)
        .to.emit(arcQRPayments, "PaymentCompleted")
        .withArgs(erc20InvoiceId, payer.address, recipient.address, erc20Amount);

      const request = await arcQRPayments.getRequest(erc20InvoiceId);
      expect(request.paid).to.be.true;
      expect(request.payer).to.equal(payer.address);

      const balanceAfter = await mockUSDC.balanceOf(recipient.address);
      expect(balanceAfter - balanceBefore).to.equal(erc20Amount);
    });

    it("Deve falhar se pagar ERC20 enviando moeda nativa", async function () {
      await expect(
        arcQRPayments.connect(payer).pay(erc20InvoiceId, {
          value: ethers.parseEther("0.1"),
        })
      ).to.be.revertedWith("Do not send native tokens with ERC-20 payment");
    });

    it("Deve falhar se tentar pagar duas vezes", async function () {
      await arcQRPayments.connect(payer).pay(nativeInvoiceId, {
        value: nativeAmount,
      });

      await expect(
        arcQRPayments.connect(payer).pay(nativeInvoiceId, {
          value: nativeAmount,
        })
      ).to.be.revertedWith("Already paid");
    });

    it("Deve falhar se tentar pagar cobrança expirada", async function () {
      // Criar cobrança com duração de 1 segundo
      const tx = await arcQRPayments.connect(creator).createPaymentRequest(
        recipient.address,
        ethers.ZeroAddress,
        ethers.parseEther("1"),
        "Expira Rápido",
        "",
        1 // 1 segundo
      );
      const receipt = await tx.wait();
      const events = await arcQRPayments.queryFilter(arcQRPayments.filters.PaymentRequestCreated);
      const expiredInvoiceId = events[events.length - 1].args.invoiceId;

      // Esperar 2 segundos para expirar
      await ethers.provider.send("evm_increaseTime", [2]);
      await ethers.provider.send("evm_mine", []);

      await expect(
        arcQRPayments.connect(payer).pay(expiredInvoiceId, {
          value: ethers.parseEther("1"),
        })
      ).to.be.revertedWith("Payment request expired");
    });
  });

  describe("Cancelamento de Cobranças (cancel)", function () {
    let invoiceId: string;
    const amount = ethers.parseEther("1.0");

    beforeEach(async function () {
      const tx = await arcQRPayments.connect(creator).createPaymentRequest(
        recipient.address,
        ethers.ZeroAddress,
        amount,
        "Cobrança Cancelável",
        "",
        3600
      );
      await tx.wait();
      const events = await arcQRPayments.queryFilter(arcQRPayments.filters.PaymentRequestCreated);
      invoiceId = events[0].args.invoiceId;
    });

    it("Deve permitir o criador cancelar cobrança não paga", async function () {
      const tx = await arcQRPayments.connect(creator).cancel(invoiceId);

      await expect(tx)
        .to.emit(arcQRPayments, "PaymentCancelled")
        .withArgs(invoiceId);

      const request = await arcQRPayments.getRequest(invoiceId);
      expect(request.cancelled).to.be.true;
    });

    it("Deve falhar se outra pessoa tentar cancelar", async function () {
      await expect(
        arcQRPayments.connect(payer).cancel(invoiceId)
      ).to.be.revertedWith("Only creator can cancel");
    });

    it("Deve falhar ao tentar pagar uma cobrança cancelada", async function () {
      await arcQRPayments.connect(creator).cancel(invoiceId);

      await expect(
        arcQRPayments.connect(payer).pay(invoiceId, {
          value: amount,
        })
      ).to.be.revertedWith("Payment request cancelled");
    });

    it("Deve falhar ao tentar cancelar cobrança já paga", async function () {
      await arcQRPayments.connect(payer).pay(invoiceId, { value: amount });

      await expect(
        arcQRPayments.connect(creator).cancel(invoiceId)
      ).to.be.revertedWith("Cannot cancel a paid request");
    });
  });
});
