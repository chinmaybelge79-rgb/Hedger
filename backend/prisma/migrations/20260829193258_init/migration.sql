-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "exchange" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'US',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "sector" TEXT,
    "industry" TEXT,
    "description" TEXT,
    "cik" TEXT,
    "lei" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyAlias" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'SEARCH',

    CONSTRAINT "CompanyAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exchange" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Exchange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Security" (
    "id" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "exchangeId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'EQUITY',
    "currency" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "figi" TEXT,
    "isin" TEXT,
    "cusip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Security_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialPeriod" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "fiscalYear" INTEGER NOT NULL,
    "fiscalQuarter" INTEGER,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "reportDate" TIMESTAMP(3),
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncomeStatement" (
    "id" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "revenue" BIGINT,
    "costOfRevenue" BIGINT,
    "grossProfit" BIGINT,
    "operatingExpense" BIGINT,
    "sellingGeneralAdmin" BIGINT,
    "researchDevelopment" BIGINT,
    "operatingIncome" BIGINT,
    "interestExpense" BIGINT,
    "interestIncome" BIGINT,
    "otherIncomeExpense" BIGINT,
    "pretaxIncome" BIGINT,
    "taxExpense" BIGINT,
    "netIncome" BIGINT,
    "dilutedEPS" DECIMAL(10,4),
    "basicEPS" DECIMAL(10,4),
    "sharesDiluted" BIGINT,
    "sharesBasic" BIGINT,

    CONSTRAINT "IncomeStatement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BalanceSheet" (
    "id" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "cashAndEquivalents" BIGINT,
    "marketableSecurities" BIGINT,
    "accountsReceivable" BIGINT,
    "inventory" BIGINT,
    "currentAssets" BIGINT,
    "propertyPlantEquipment" BIGINT,
    "goodwill" BIGINT,
    "intangibleAssets" BIGINT,
    "totalAssets" BIGINT,
    "accountsPayable" BIGINT,
    "currentLiabilities" BIGINT,
    "shortTermDebt" BIGINT,
    "longTermDebt" BIGINT,
    "totalDebt" BIGINT,
    "totalLiabilities" BIGINT,
    "shareholdersEquity" BIGINT,
    "retainedEarnings" BIGINT,
    "treasuryStock" BIGINT,

    CONSTRAINT "BalanceSheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashFlowStatement" (
    "id" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "netIncome" BIGINT,
    "depreciationAmortization" BIGINT,
    "stockBasedCompensation" BIGINT,
    "changeInWorkingCapital" BIGINT,
    "operatingCashFlow" BIGINT,
    "capitalExpenditure" BIGINT,
    "acquisitions" BIGINT,
    "investingCashFlow" BIGINT,
    "debtIssued" BIGINT,
    "debtRepaid" BIGINT,
    "shareRepurchases" BIGINT,
    "dividendsPaid" BIGINT,
    "financingCashFlow" BIGINT,
    "freeCashFlow" BIGINT,
    "freeCashFlowPerShare" DECIMAL(10,4),

    CONSTRAINT "CashFlowStatement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareData" (
    "id" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "sharesOutstanding" BIGINT,
    "sharesDiluted" BIGINT,
    "sharePrice" DECIMAL(15,4),

    CONSTRAINT "ShareData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DerivedMetrics" (
    "id" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "revenueGrowth" DECIMAL(10,6),
    "grossMargin" DECIMAL(10,6),
    "ebitMargin" DECIMAL(10,6),
    "ebitdaMargin" DECIMAL(10,6),
    "netMargin" DECIMAL(10,6),
    "roe" DECIMAL(10,6),
    "roic" DECIMAL(10,6),
    "roa" DECIMAL(10,6),
    "fcfMargin" DECIMAL(10,6),
    "fcfConversion" DECIMAL(10,6),
    "debtToEbitda" DECIMAL(10,6),
    "netDebtToEbitda" DECIMAL(10,6),
    "currentRatio" DECIMAL(10,6),
    "quickRatio" DECIMAL(10,6),
    "assetTurnover" DECIMAL(10,6),
    "workingCapital" BIGINT,
    "epsGrowth" DECIMAL(10,6),
    "bookValueGrowth" DECIMAL(10,6),

    CONSTRAINT "DerivedMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketPrice" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "open" DECIMAL(15,4) NOT NULL,
    "high" DECIMAL(15,4) NOT NULL,
    "low" DECIMAL(15,4) NOT NULL,
    "close" DECIMAL(15,4) NOT NULL,
    "volume" BIGINT NOT NULL,
    "adjustedClose" DECIMAL(15,4) NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketSnapshot" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "price" DECIMAL(15,4) NOT NULL,
    "change" DECIMAL(10,4) NOT NULL,
    "changePercent" DECIMAL(10,4) NOT NULL,
    "marketCap" BIGINT,
    "sharesOutstanding" BIGINT,
    "peRatio" DECIMAL(10,4),
    "pbRatio" DECIMAL(10,4),
    "beta" DECIMAL(10,4),
    "fiftyTwoWeekHigh" DECIMAL(15,4),
    "fiftyTwoWeekLow" DECIMAL(15,4),
    "avgVolume" BIGINT,
    "dividendYield" DECIMAL(10,6),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValuationRun" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "inputs" JSONB NOT NULL,
    "result" JSONB NOT NULL,
    "confidence" DECIMAL(5,2),
    "riskScore" INTEGER,
    "durationMs" INTEGER,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ValuationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DCFModel" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "wacc" DECIMAL(10,6) NOT NULL,
    "terminalGrowth" DECIMAL(10,6) NOT NULL,
    "forecastYears" INTEGER NOT NULL,
    "revenueGrowth" JSONB NOT NULL,
    "ebitMargins" JSONB NOT NULL,
    "taxRate" DECIMAL(10,6) NOT NULL,
    "enterpriseValue" BIGINT NOT NULL,
    "equityValue" BIGINT NOT NULL,
    "fairValuePerShare" DECIMAL(15,4) NOT NULL,
    "currentPrice" DECIMAL(15,4) NOT NULL,
    "upside" DECIMAL(10,6) NOT NULL,
    "forecasts" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DCFModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReverseDCFModel" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "currentPrice" DECIMAL(15,4) NOT NULL,
    "wacc" DECIMAL(10,6) NOT NULL,
    "terminalGrowth" DECIMAL(10,6) NOT NULL,
    "impliedRevenueGrowth" DECIMAL(10,6) NOT NULL,
    "impliedTerminalMargin" DECIMAL(10,6) NOT NULL,
    "impliedFcfGrowth" DECIMAL(10,6) NOT NULL,
    "interpretation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReverseDCFModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompsModel" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "peerGroup" JSONB NOT NULL,
    "multiples" JSONB NOT NULL,
    "medianMultiples" JSONB NOT NULL,
    "impliedEV" BIGINT NOT NULL,
    "impliedEquity" BIGINT NOT NULL,
    "fairValuePerShare" DECIMAL(15,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompsModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SOTPModel" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "segments" JSONB NOT NULL,
    "totalEV" BIGINT NOT NULL,
    "netDebt" BIGINT NOT NULL,
    "investments" BIGINT NOT NULL,
    "equityValue" BIGINT NOT NULL,
    "fairValuePerShare" DECIMAL(15,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SOTPModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScenarioModel" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "bear" JSONB NOT NULL,
    "base" JSONB NOT NULL,
    "bull" JSONB NOT NULL,
    "weightedValue" DECIMAL(15,4) NOT NULL,
    "weights" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScenarioModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SensitivityModel" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "rows" JSONB NOT NULL,
    "columns" JSONB NOT NULL,
    "values" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SensitivityModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonteCarloModel" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "iterations" INTEGER NOT NULL,
    "variables" JSONB NOT NULL,
    "mean" DECIMAL(15,4) NOT NULL,
    "median" DECIMAL(15,4) NOT NULL,
    "p10" DECIMAL(15,4) NOT NULL,
    "p25" DECIMAL(15,4) NOT NULL,
    "p75" DECIMAL(15,4) NOT NULL,
    "p90" DECIMAL(15,4) NOT NULL,
    "distribution" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonteCarloModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskScore" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "businessRisk" INTEGER NOT NULL,
    "financialRisk" INTEGER NOT NULL,
    "valuationRisk" INTEGER NOT NULL,
    "growthRisk" INTEGER NOT NULL,
    "marginRisk" INTEGER NOT NULL,
    "leverageRisk" INTEGER NOT NULL,
    "cashFlowRisk" INTEGER NOT NULL,
    "marketRisk" INTEGER NOT NULL,
    "factors" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfidenceScore" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "grade" TEXT NOT NULL,
    "dataQuality" INTEGER NOT NULL,
    "modelAgreement" INTEGER NOT NULL,
    "assumptionStability" INTEGER NOT NULL,
    "financialQuality" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConfidenceScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "baseUrl" TEXT,
    "apiKey" TEXT,
    "rateLimit" INTEGER,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataRefreshLog" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "records" INTEGER NOT NULL,
    "errorMessage" TEXT,
    "durationMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataRefreshLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_ticker_key" ON "Company"("ticker");

-- CreateIndex
CREATE UNIQUE INDEX "Company_cik_key" ON "Company"("cik");

-- CreateIndex
CREATE UNIQUE INDEX "Company_lei_key" ON "Company"("lei");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyAlias_companyId_alias_key" ON "CompanyAlias"("companyId", "alias");

-- CreateIndex
CREATE UNIQUE INDEX "Exchange_code_key" ON "Exchange"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Security_ticker_key" ON "Security"("ticker");

-- CreateIndex
CREATE UNIQUE INDEX "Security_figi_key" ON "Security"("figi");

-- CreateIndex
CREATE UNIQUE INDEX "Security_isin_key" ON "Security"("isin");

-- CreateIndex
CREATE UNIQUE INDEX "Security_cusip_key" ON "Security"("cusip");

-- CreateIndex
CREATE INDEX "FinancialPeriod_companyId_fiscalYear_fiscalQuarter_idx" ON "FinancialPeriod"("companyId", "fiscalYear", "fiscalQuarter");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialPeriod_companyId_period_key" ON "FinancialPeriod"("companyId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "IncomeStatement_periodId_key" ON "IncomeStatement"("periodId");

-- CreateIndex
CREATE UNIQUE INDEX "BalanceSheet_periodId_key" ON "BalanceSheet"("periodId");

-- CreateIndex
CREATE UNIQUE INDEX "CashFlowStatement_periodId_key" ON "CashFlowStatement"("periodId");

-- CreateIndex
CREATE UNIQUE INDEX "ShareData_periodId_key" ON "ShareData"("periodId");

-- CreateIndex
CREATE UNIQUE INDEX "DerivedMetrics_periodId_key" ON "DerivedMetrics"("periodId");

-- CreateIndex
CREATE INDEX "MarketPrice_companyId_date_idx" ON "MarketPrice"("companyId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "MarketPrice_companyId_date_key" ON "MarketPrice"("companyId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "MarketSnapshot_companyId_key" ON "MarketSnapshot"("companyId");

-- CreateIndex
CREATE INDEX "ValuationRun_companyId_model_createdAt_idx" ON "ValuationRun"("companyId", "model", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DCFModel_runId_key" ON "DCFModel"("runId");

-- CreateIndex
CREATE UNIQUE INDEX "ReverseDCFModel_runId_key" ON "ReverseDCFModel"("runId");

-- CreateIndex
CREATE UNIQUE INDEX "CompsModel_runId_key" ON "CompsModel"("runId");

-- CreateIndex
CREATE UNIQUE INDEX "SOTPModel_runId_key" ON "SOTPModel"("runId");

-- CreateIndex
CREATE UNIQUE INDEX "ScenarioModel_runId_key" ON "ScenarioModel"("runId");

-- CreateIndex
CREATE UNIQUE INDEX "SensitivityModel_runId_key" ON "SensitivityModel"("runId");

-- CreateIndex
CREATE UNIQUE INDEX "MonteCarloModel_runId_key" ON "MonteCarloModel"("runId");

-- CreateIndex
CREATE UNIQUE INDEX "RiskScore_runId_key" ON "RiskScore"("runId");

-- CreateIndex
CREATE UNIQUE INDEX "ConfidenceScore_runId_key" ON "ConfidenceScore"("runId");

-- CreateIndex
CREATE UNIQUE INDEX "DataSource_name_key" ON "DataSource"("name");

-- CreateIndex
CREATE INDEX "DataRefreshLog_entityType_entityId_createdAt_idx" ON "DataRefreshLog"("entityType", "entityId", "createdAt");

-- AddForeignKey
ALTER TABLE "CompanyAlias" ADD CONSTRAINT "CompanyAlias_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Security" ADD CONSTRAINT "Security_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Security" ADD CONSTRAINT "Security_exchangeId_fkey" FOREIGN KEY ("exchangeId") REFERENCES "Exchange"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialPeriod" ADD CONSTRAINT "FinancialPeriod_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncomeStatement" ADD CONSTRAINT "IncomeStatement_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "FinancialPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BalanceSheet" ADD CONSTRAINT "BalanceSheet_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "FinancialPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashFlowStatement" ADD CONSTRAINT "CashFlowStatement_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "FinancialPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareData" ADD CONSTRAINT "ShareData_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "FinancialPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DerivedMetrics" ADD CONSTRAINT "DerivedMetrics_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "FinancialPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketPrice" ADD CONSTRAINT "MarketPrice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketSnapshot" ADD CONSTRAINT "MarketSnapshot_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValuationRun" ADD CONSTRAINT "ValuationRun_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DCFModel" ADD CONSTRAINT "DCFModel_runId_fkey" FOREIGN KEY ("runId") REFERENCES "ValuationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReverseDCFModel" ADD CONSTRAINT "ReverseDCFModel_runId_fkey" FOREIGN KEY ("runId") REFERENCES "ValuationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompsModel" ADD CONSTRAINT "CompsModel_runId_fkey" FOREIGN KEY ("runId") REFERENCES "ValuationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SOTPModel" ADD CONSTRAINT "SOTPModel_runId_fkey" FOREIGN KEY ("runId") REFERENCES "ValuationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScenarioModel" ADD CONSTRAINT "ScenarioModel_runId_fkey" FOREIGN KEY ("runId") REFERENCES "ValuationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensitivityModel" ADD CONSTRAINT "SensitivityModel_runId_fkey" FOREIGN KEY ("runId") REFERENCES "ValuationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonteCarloModel" ADD CONSTRAINT "MonteCarloModel_runId_fkey" FOREIGN KEY ("runId") REFERENCES "ValuationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskScore" ADD CONSTRAINT "RiskScore_runId_fkey" FOREIGN KEY ("runId") REFERENCES "ValuationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfidenceScore" ADD CONSTRAINT "ConfidenceScore_runId_fkey" FOREIGN KEY ("runId") REFERENCES "ValuationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataRefreshLog" ADD CONSTRAINT "DataRefreshLog_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "DataSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
