import { expect } from "chai";
import { ethers } from "hardhat";
import { ArcQRPayments, MockERC20 } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

const ZERO = ethers.ZeroAddress;

describe("ArcQRPayments", function () {
  let arcQRPayments: ArcQRPayments;
  let mockUSDC: MockERC20;
  let owner: SignerWithAddress;
  let creator: SignerWithAddress;
  let recipient: SignerWithAddress;
  let payer: SignerWithAddress;

  beforeEach(async function () {
    [owner, creator, recipient, payer] = await ethers.getSigners();

    const ArcQRPaymentsFactory = await ethers.getContractFactory("ArcQRPayments");
    arcQRPayments = (await ArcQRPaymentsFactory.deploy()) as unknown as ArcQRPayments;

    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    mockUSDC = (await MockERC20Factory.deploy(
      "Mock USDC",
      "USDC",
      ethers.parseEther("10000")
    )) as unknown as MockERC20;

    await mockUSDC.transfer(payer.address, ethers.parseEther("1000"));
  });

  async function lastInvoiceId(): Promise<string> {
    const events = await arcQRPayments.queryFilter(arcQRPayments.filters.PaymentRequestCreated);
    return events[events.length - 1].args.invoiceId;
  }

  describe("createPaymentRequest", function () {
    it("creates a native invoice and emits event", async function () {
      const tx = await arcQRPayments
        .connect(creator)
        .createPaymentRequest(
          recipient.address,
          ZERO,
          ethers.parseEther("1.5"),
          "Server rental",
          "Monthly server fee",
          3600
        );
      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;

      const id = await lastInvoiceId();
      const req = await arcQRPayments.getRequest(id);
      expect(req.creator).to.equal(creator.address);
      expect(req.recipient).to.equal(recipient.address);
      expect(req.token).to.equal(ZERO);
      expect(req.amount).to.equal(ethers.parseEther("1.5"));
      expect(req.title).to.equal("Server rental");
      expect(req.paid).to.be.false;
      expect(req.cancelled).to.be.false;
    });

    it("reverts when recipient is zero", async function () {
      await expect(
        arcQRPayments
          .connect(creator)
          .createPaymentRequest(ZERO, ZERO, ethers.parseEther("1"), "x", "", 100)
      ).to.be.revertedWith("Recipient=0");
    });

    it("reverts when amount is zero", async function () {
      await expect(
        arcQRPayments
          .connect(creator)
          .createPaymentRequest(recipient.address, ZERO, 0, "x", "", 100)
      ).to.be.revertedWith("Amount=0");
    });
  });

  describe("pay", function () {
    let nativeInvoiceId: string;
    let erc20InvoiceId: string;
    const nativeAmount = ethers.parseEther("2.0");
    const erc20Amount = ethers.parseEther("50.0");
    const duration = 3600;

    beforeEach(async function () {
      const tx1 = await arcQRPayments
        .connect(creator)
        .createPaymentRequest(recipient.address, ZERO, nativeAmount, "Native", "", duration);
      await tx1.wait();
      nativeInvoiceId = await lastInvoiceId();

      const tx2 = await arcQRPayments
        .connect(creator)
        .createPaymentRequest(
          recipient.address,
          await mockUSDC.getAddress(),
          erc20Amount,
          "ERC20",
          "",
          duration
        );
      await tx2.wait();
      erc20InvoiceId = await lastInvoiceId();
    });

    it("pays a native invoice", async function () {
      const before = await ethers.provider.getBalance(recipient.address);
      await expect(arcQRPayments.connect(payer).pay(nativeInvoiceId, { value: nativeAmount }))
        .to.emit(arcQRPayments, "PaymentCompleted")
        .withArgs(nativeInvoiceId, payer.address, recipient.address, nativeAmount);

      const req = await arcQRPayments.getRequest(nativeInvoiceId);
      expect(req.paid).to.be.true;
      expect(req.payer).to.equal(payer.address);
      const after = await ethers.provider.getBalance(recipient.address);
      expect(after - before).to.equal(nativeAmount);
    });

    it("reverts on wrong native value", async function () {
      await expect(
        arcQRPayments.connect(payer).pay(nativeInvoiceId, { value: ethers.parseEther("1.0") })
      ).to.be.revertedWith("Wrong amount");
    });

    it("pays an ERC20 invoice", async function () {
      await mockUSDC
        .connect(payer)
        .approve(await arcQRPayments.getAddress(), erc20Amount);
      const before = await mockUSDC.balanceOf(recipient.address);
      await expect(arcQRPayments.connect(payer).pay(erc20InvoiceId))
        .to.emit(arcQRPayments, "PaymentCompleted")
        .withArgs(erc20InvoiceId, payer.address, recipient.address, erc20Amount);
      const after = await mockUSDC.balanceOf(recipient.address);
      expect(after - before).to.equal(erc20Amount);
    });

    it("reverts when paying ERC20 with native attached", async function () {
      await expect(
        arcQRPayments.connect(payer).pay(erc20InvoiceId, { value: ethers.parseEther("0.1") })
      ).to.be.revertedWith("Don't send native");
    });

    it("reverts on double pay", async function () {
      await arcQRPayments.connect(payer).pay(nativeInvoiceId, { value: nativeAmount });
      await expect(
        arcQRPayments.connect(payer).pay(nativeInvoiceId, { value: nativeAmount })
      ).to.be.revertedWith("Paid");
    });

    it("reverts on expired invoice", async function () {
      const tx = await arcQRPayments
        .connect(creator)
        .createPaymentRequest(recipient.address, ZERO, ethers.parseEther("1"), "exp", "", 1);
      await tx.wait();
      const expiredId = await lastInvoiceId();
      await ethers.provider.send("evm_increaseTime", [2]);
      await ethers.provider.send("evm_mine", []);
      await expect(
        arcQRPayments.connect(payer).pay(expiredId, { value: ethers.parseEther("1") })
      ).to.be.revertedWith("Expired");
    });
  });

  describe("cancel", function () {
    let invoiceId: string;
    const amount = ethers.parseEther("1.0");

    beforeEach(async function () {
      const tx = await arcQRPayments
        .connect(creator)
        .createPaymentRequest(recipient.address, ZERO, amount, "x", "", 3600);
      await tx.wait();
      invoiceId = await lastInvoiceId();
    });

    it("lets creator cancel an unpaid invoice", async function () {
      await expect(arcQRPayments.connect(creator).cancel(invoiceId))
        .to.emit(arcQRPayments, "PaymentCancelled")
        .withArgs(invoiceId);
      const req = await arcQRPayments.getRequest(invoiceId);
      expect(req.cancelled).to.be.true;
    });

    it("reverts when stranger cancels", async function () {
      await expect(arcQRPayments.connect(payer).cancel(invoiceId)).to.be.revertedWith("Only creator");
    });

    it("reverts paying a cancelled invoice", async function () {
      await arcQRPayments.connect(creator).cancel(invoiceId);
      await expect(
        arcQRPayments.connect(payer).pay(invoiceId, { value: amount })
      ).to.be.revertedWith("Cancelled");
    });

    it("reverts cancelling a paid invoice", async function () {
      await arcQRPayments.connect(payer).pay(invoiceId, { value: amount });
      await expect(arcQRPayments.connect(creator).cancel(invoiceId)).to.be.revertedWith(
        "Already paid"
      );
    });
  });

  // ============================================================
  //  NANOPAYMENTS
  // ============================================================
  describe("NanoPayments", function () {
    const ratePerTick = ethers.parseEther("0.001"); // 0.001 USDC / tick
    const interval = 60;                              // 60s per tick
    const duration = 600;                             // 10 ticks total

    it("opens a nano channel with correct deposit", async function () {
      const ticks = duration / interval;
      const expectedDeposit = ratePerTick * BigInt(ticks);

      const tx = await arcQRPayments
        .connect(payer)
        .openNanoChannel(recipient.address, ZERO, ratePerTick, interval, duration, {
          value: expectedDeposit,
        });

      const receipt = await tx.wait();
      const events = await arcQRPayments.queryFilter(arcQRPayments.filters.NanoChannelOpened);
      expect(events.length).to.be.equal(1);

      const channelId = events[0].args.channelId;
      const ch = await arcQRPayments.getNanoChannel(channelId);
      expect(ch.payer).to.equal(payer.address);
      expect(ch.receiver).to.equal(recipient.address);
      expect(ch.deposit).to.equal(expectedDeposit);
      expect(ch.ratePerTick).to.equal(ratePerTick);
      expect(ch.intervalSeconds).to.equal(interval);
      expect(ch.closed).to.be.false;
      expect(receipt).to.not.be.null;
    });

    it("accrues ticks and allows settle", async function () {
      const ticks = duration / interval;
      const deposit = ratePerTick * BigInt(ticks);

      await arcQRPayments
        .connect(payer)
        .openNanoChannel(recipient.address, ZERO, ratePerTick, interval, duration, {
          value: deposit,
        });

      const events = await arcQRPayments.queryFilter(arcQRPayments.filters.NanoChannelOpened);
      const channelId = events[0].args.channelId;

      // advance 3 intervals (180s)
      await ethers.provider.send("evm_increaseTime", [180]);
      await ethers.provider.send("evm_mine", []);

      // Receiver claims via a relayer (payer) so its ETH balance isn't affected by gas.
      const tx = await arcQRPayments.connect(payer).settleNanoChannel(channelId);
      await expect(tx).to.emit(arcQRPayments, "NanoTickSettled");
      const ch = await arcQRPayments.getNanoChannel(channelId);
      expect(ch.withdrawn).to.equal(ratePerTick * 3n);
    });

    it("does nothing when no new ticks have accrued", async function () {
      const ticks = duration / interval;
      const deposit = ratePerTick * BigInt(ticks);

      await arcQRPayments
        .connect(payer)
        .openNanoChannel(recipient.address, ZERO, ratePerTick, interval, duration, {
          value: deposit,
        });

      const events = await arcQRPayments.queryFilter(arcQRPayments.filters.NanoChannelOpened);
      const channelId = events[0].args.channelId;

      const tx = await arcQRPayments.connect(payer).settleNanoChannel(channelId);
      const settled = await arcQRPayments.queryFilter(
        arcQRPayments.filters.NanoTickSettled,
        tx.blockNumber
      );
      // No tick event for this call (tx confirmed, but no event means zero ticks)
      const thisBlockEvents = settled.filter((e) => e.blockNumber === tx.blockNumber);
      expect(thisBlockEvents.length).to.equal(0);
    });

    it("caps owed by remaining deposit", async function () {
      const ticks = duration / interval;
      const deposit = ratePerTick * BigInt(ticks);

      await arcQRPayments
        .connect(payer)
        .openNanoChannel(recipient.address, ZERO, ratePerTick, interval, duration, {
          value: deposit,
        });
      const events = await arcQRPayments.queryFilter(arcQRPayments.filters.NanoChannelOpened);
      const channelId = events[0].args.channelId;

      // run past the channel lifetime
      await ethers.provider.send("evm_increaseTime", [duration * 2]);
      await ethers.provider.send("evm_mine", []);

      await arcQRPayments.connect(payer).settleNanoChannel(channelId);
      const ch = await arcQRPayments.getNanoChannel(channelId);
      expect(ch.withdrawn).to.equal(deposit);
    });

    it("refunds leftover on close", async function () {
      const ticks = duration / interval;
      const deposit = ratePerTick * BigInt(ticks);

      await arcQRPayments
        .connect(payer)
        .openNanoChannel(recipient.address, ZERO, ratePerTick, interval, duration, {
          value: deposit,
        });
      const events = await arcQRPayments.queryFilter(arcQRPayments.filters.NanoChannelOpened);
      const channelId = events[0].args.channelId;

      // advance 2 intervals
      await ethers.provider.send("evm_increaseTime", [120]);
      await ethers.provider.send("evm_mine", []);
      await arcQRPayments.connect(payer).settleNanoChannel(channelId);

      const before = await ethers.provider.getBalance(payer.address);
      await arcQRPayments.connect(payer).closeNanoChannel(channelId);
      const after = await ethers.provider.getBalance(payer.address);

      const ch = await arcQRPayments.getNanoChannel(channelId);
      expect(ch.closed).to.be.true;
      // payer got back: deposit - 2 ticks (gas aside)
      // use ch.withdrawn instead of balance to remove gas noise
      expect(ch.withdrawn).to.equal(ratePerTick * 2n);
      expect(after).to.be.lessThan(before + (deposit - ch.withdrawn) + ethers.parseEther("0.01"));
      expect(after).to.be.greaterThan(before); // got something back
    });

    it("reverts on bad params", async function () {
      await expect(
        arcQRPayments.connect(payer).openNanoChannel(
          ethers.ZeroAddress,
          ZERO,
          ratePerTick,
          interval,
          duration,
          { value: ratePerTick * 10n }
        )
      ).to.be.revertedWith("Receiver=0");

      await expect(
        arcQRPayments.connect(payer).openNanoChannel(
          recipient.address,
          ZERO,
          0,
          interval,
          duration,
          { value: 0 }
        )
      ).to.be.revertedWith("Rate=0");

      await expect(
        arcQRPayments.connect(payer).openNanoChannel(
          recipient.address,
          ZERO,
          ratePerTick,
          0,
          duration,
          { value: 0 }
        )
      ).to.be.revertedWith("Interval=0");

      await expect(
        arcQRPayments.connect(payer).openNanoChannel(
          recipient.address,
          ZERO,
          ratePerTick,
          100,
          50, // duration < interval
          { value: 0 }
        )
      ).to.be.revertedWith("Dur<Interval");
    });

    it("reverts when wrong deposit sent", async function () {
      await expect(
        arcQRPayments.connect(payer).openNanoChannel(
          recipient.address,
          ZERO,
          ratePerTick,
          interval,
          duration,
          { value: ethers.parseEther("0.005") }
        )
      ).to.be.revertedWith("Wrong deposit");
    });

    it("estimateOwed returns correct values", async function () {
      const ticks = duration / interval;
      const deposit = ratePerTick * BigInt(ticks);

      await arcQRPayments
        .connect(payer)
        .openNanoChannel(recipient.address, ZERO, ratePerTick, interval, duration, {
          value: deposit,
        });
      const events = await arcQRPayments.queryFilter(arcQRPayments.filters.NanoChannelOpened);
      const channelId = events[0].args.channelId;

      await ethers.provider.send("evm_increaseTime", [150]); // 2.5 intervals
      await ethers.provider.send("evm_mine", []);

      const [newTicks, owed] = await arcQRPayments.estimateOwed(channelId);
      expect(newTicks).to.equal(2n);
      expect(owed).to.equal(ratePerTick * 2n);
    });
    });
});


