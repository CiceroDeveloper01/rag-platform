import { BlockCardToolService } from "./block-card.tool";
import { GetCardInfoToolService } from "./get-card-info.tool";
import { GetCreditLimitToolService } from "./get-credit-limit.tool";
import { GetCustomerProfileToolService } from "./get-customer-profile.tool";
import { GetCustomerSummaryToolService } from "./get-customer-summary.tool";
import { SimulateCreditToolService } from "./simulate-credit.tool";
import { SimulateInvestmentToolService } from "./simulate-investment.tool";

describe("Banking tools api-business integration", () => {
  const bankingClient = {
    blockCard: jest.fn(),
    getCardInfo: jest.fn(),
    simulateInvestment: jest.fn(),
    getCustomerProfile: jest.fn(),
    getCustomerSummary: jest.fn(),
    simulateCredit: jest.fn(),
    getCreditLimit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("BlockCardTool calls api-business block endpoint", async () => {
    bankingClient.blockCard.mockResolvedValue({
      cardId: "card-001",
      action: "block",
      status: "completed",
      message: "ok",
    });
    const tool = new BlockCardToolService(bankingClient as any);

    const result = await tool.execute({
      userId: "user-1",
      tenantId: "tenant-a",
      correlationId: "corr-1",
      payload: {
        cardId: "card-001",
        reason: "lost_card",
      },
    });

    expect(bankingClient.blockCard).toHaveBeenCalledWith(
      expect.objectContaining({
        cardId: "card-001",
        correlationId: "corr-1",
      }),
    );
    expect(result.success).toBe(true);
  });

  it("BlockCardTool returns structured error when cardId is missing", async () => {
    const tool = new BlockCardToolService(bankingClient as any);

    const result = await tool.execute({
      userId: "user-1",
      tenantId: "tenant-a",
      correlationId: "corr-2",
      payload: {},
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("missing_card_id");
  });

  it("GetCardInfoTool calls api-business card endpoints through the banking client", async () => {
    bankingClient.getCardInfo.mockResolvedValue({
      card: {
        id: "card-001",
        brand: "Visa Infinite",
        last4: "4432",
        status: "ACTIVE",
        holderName: "Ada",
      },
      limit: {
        cardId: "card-001",
        totalLimit: 25000,
        availableLimit: 18000,
        usedLimit: 7000,
      },
      invoice: {
        cardId: "card-001",
        dueDate: "2026-04-10",
        amount: 1280.44,
        minimumPayment: 320.11,
      },
    });
    const tool = new GetCardInfoToolService(bankingClient as any);

    const result = await tool.execute({
      userId: "user-1",
      tenantId: "tenant-a",
      correlationId: "corr-3",
      payload: {
        cardId: "card-001",
      },
    });

    expect(bankingClient.getCardInfo).toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.data).toEqual(
      expect.objectContaining({
        invoiceAmount: 1280.44,
        totalLimit: 25000,
      }),
    );
  });

  it("SimulateInvestmentTool calls api-business simulation endpoint", async () => {
    bankingClient.simulateInvestment.mockResolvedValue({
      investedAmount: 5000,
      productType: "cdb",
      projectedAmount: 5590,
      annualRate: 0.118,
      periodInDays: 365,
    });
    const tool = new SimulateInvestmentToolService(bankingClient as any);

    const result = await tool.execute({
      userId: "user-2",
      tenantId: "tenant-a",
      correlationId: "corr-4",
      payload: {
        amount: 5000,
        productType: "cdb",
        periodInDays: 365,
      },
    });

    expect(bankingClient.simulateInvestment).toHaveBeenCalled();
    expect(result.success).toBe(true);
  });

  it("SimulateInvestmentTool returns structured error for invalid payload", async () => {
    const tool = new SimulateInvestmentToolService(bankingClient as any);

    const result = await tool.execute({
      userId: "user-2",
      tenantId: "tenant-a",
      correlationId: "corr-5",
      payload: {},
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("invalid_amount");
  });

  it("customer and credit tools call api-business banking client", async () => {
    bankingClient.getCustomerProfile.mockResolvedValue({ id: "cust-001" });
    bankingClient.getCustomerSummary.mockResolvedValue({ activeProducts: 4 });
    bankingClient.simulateCredit.mockResolvedValue({ monthlyInstallment: 504.17 });
    bankingClient.getCreditLimit.mockResolvedValue({ availableLimit: 18000 });

    const profileTool = new GetCustomerProfileToolService(bankingClient as any);
    const summaryTool = new GetCustomerSummaryToolService(bankingClient as any);
    const simulateCreditTool = new SimulateCreditToolService(
      bankingClient as any,
    );
    const creditLimitTool = new GetCreditLimitToolService(
      bankingClient as any,
    );

    await profileTool.execute({
      userId: "user-3",
      tenantId: "tenant-a",
      correlationId: "corr-6",
      payload: {},
    });
    await summaryTool.execute({
      userId: "user-3",
      tenantId: "tenant-a",
      correlationId: "corr-7",
      payload: {},
    });
    await simulateCreditTool.execute({
      userId: "user-3",
      tenantId: "tenant-a",
      correlationId: "corr-8",
      payload: {
        requestedAmount: 10000,
        installmentCount: 24,
      },
    });
    await creditLimitTool.execute({
      userId: "user-3",
      tenantId: "tenant-a",
      correlationId: "corr-9",
      payload: {},
    });

    expect(bankingClient.getCustomerProfile).toHaveBeenCalled();
    expect(bankingClient.getCustomerSummary).toHaveBeenCalled();
    expect(bankingClient.simulateCredit).toHaveBeenCalled();
    expect(bankingClient.getCreditLimit).toHaveBeenCalled();
  });

  it("tools return structured errors when api-business fails", async () => {
    bankingClient.getCardInfo.mockRejectedValue(new Error("http_503"));
    const tool = new GetCardInfoToolService(bankingClient as any);

    const result = await tool.execute({
      userId: "user-1",
      tenantId: "tenant-a",
      correlationId: "corr-10",
      payload: {
        cardId: "card-001",
      },
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("http_503");
  });
});
