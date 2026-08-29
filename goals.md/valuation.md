HEDGER — VALUATION MODEL

Detailed Product, UX, UI, Financial Logic & Engineering Specification

1. PRODUCT DEFINITION

Hedger’s Valuation Model is the central analytical workspace where a user converts a company’s financial performance, operating assumptions, market data, and valuation methodology into an estimated intrinsic value.

The purpose of the module is not simply to output one number.

The model should answer five questions:

1. What is the company worth under the selected methodology?
2. What assumptions produce that valuation?
3. How does the estimated value compare with the current market price?
4. How sensitive is the valuation to changes in assumptions?
5. How much confidence should the user place in the output?

The Valuation Model should therefore be designed as a complete analytical workflow rather than a calculator.

The experience should move naturally from:

Company → Financials → Assumptions → Methodology → Valuation → Sensitivity → Scenarios → Conclusion.

The user should never feel like they are jumping between unrelated pages.

The selected company should remain persistent throughout the entire workflow.

The valuation model should behave like a professional financial model while retaining the simplicity and visual discipline of Hedger’s existing product language.

⸻

2. CORE DESIGN PRINCIPLE

The most important principle is:

Every valuation output must be traceable to an assumption, and every important assumption must be traceable to financial data or user judgment.

Hedger should never behave like a black box.

For example:

If Hedger displays:

Estimated Value: $184.50

the user should be able to understand:

* Revenue assumptions
* Growth assumptions
* Margin assumptions
* Tax assumptions
* Capital expenditure assumptions
* Working-capital assumptions
* Discount rate
* Terminal growth
* Terminal value
* Net debt
* Diluted shares

that ultimately produce the $184.50 figure.

The user should be able to inspect the calculation chain.

⸻

3. OVERALL PAGE STRUCTURE

The valuation page should have the following structure:

1. Global navigation
2. Company context header
3. Valuation summary strip
4. Methodology selector
5. Main model workspace
6. Assumption panel
7. Financial projection table
8. Valuation bridge
9. Sensitivity analysis
10. Scenario analysis
11. Methodology comparison
12. Model diagnostics
13. Investment conclusion
14. Save/export controls

The page should feel like one continuous workstation.

Avoid designing every section as an isolated floating card.

The model should visually resemble a premium financial terminal or institutional research application.

⸻

4. GLOBAL NAVIGATION

The top navigation should remain consistent with Hedger.

Recommended structure:

Hedger logo | Search | Markets | Companies | Valuation | Watchlist | Portfolio | Research | Models | User

The current page should be highlighted subtly.

Do not use huge navigation elements.

The navigation should remain compact.

The valuation page should have a clear active state.

⸻

5. COMPANY CONTEXT HEADER

Immediately below the global navigation, display the company being valued.

Example:

APPLE INC.
AAPL · NASDAQ

$232.15
+1.42%

Market Cap
$3.46T

Enterprise Value
$3.39T

Sector
Technology

Industry
Consumer Electronics

The company header should remain visible while working on the model.

If the user scrolls deeply, a compact sticky version can appear.

The sticky version should contain:

AAPL | Apple Inc. | $232.15 | Valuation: $248.60 | +7.1%

This lets users maintain context.

⸻

6. VALUATION SUMMARY

The first analytical section should provide an immediate answer.

Example:

VALUATION

Estimated Value
$248.60

Current Price
$232.15

Implied Upside
+7.1%

Enterprise Value
$3.52T

Equity Value
$3.61T

Method
DCF

Scenario
Base Case

Model Status
Complete

The estimated value should be the strongest visual element.

However, do not make the number enormous.

It should feel like a financial research terminal rather than a marketing landing page.

⸻

7. VALUATION RANGE

A single valuation number can create false precision.

Hedger should therefore support a valuation range.

Example:

Bear
$172

Base
$249

Bull
$311

Visually:

$172 ───────── $249 ───────── $311
Bear           Base           Bull

Current price:

$232

This immediately communicates:

* Current market price
* Base valuation
* Downside scenario
* Upside scenario

The valuation range should be directly connected to scenario assumptions.

⸻

8. METHODOLOGY SELECTOR

The user should be able to choose the valuation methodology.

Possible tabs:

DCF
Comparable Companies
Precedent Transactions
Sum-of-the-Parts
Asset-Based
Dividend Discount
Residual Income

Only methodologies supported by the company and data should be enabled.

Example:

Valuation Method

[ DCF ] [ Comps ] [ Precedents ] [ SOTP ]

The active methodology should be visually obvious but restrained.

Do not use large colorful tabs.

Use a simple professional segmented control.

⸻

9. METHODOLOGY EXPLANATION

When a methodology is selected, provide a small explanation.

Example:

Discounted Cash Flow

Values the company based on the present value of expected future unlevered free cash flows and terminal value.

Inputs:

Revenue
Margins
Tax Rate
Capex
Working Capital
WACC
Terminal Growth

This explanation should be collapsible.

Experienced users should be able to hide it.

⸻

10. MAIN WORKSPACE

The primary valuation workspace should use a two-column architecture.

LEFT:

Financial model

RIGHT:

Assumptions / controls

Suggested layout:

┌───────────────────────────────────────────────┬─────────────────────┐
│                                               │                     │
│           FINANCIAL MODEL                     │   ASSUMPTIONS       │
│                                               │                     │
│ Historical → Forecast                         │   Revenue Growth    │
│                                               │   Margins            │
│ Revenue                                       │   Tax Rate           │
│ EBITDA                                        │   WACC                │
│ EBIT                                          │   Terminal Growth     │
│ UFCF                                          │   Capex               │
│                                               │                     │
├───────────────────────────────────────────────┤                     │
│                                               │                     │
│ VALUATION BRIDGE                              │                     │
│                                               │                     │
└───────────────────────────────────────────────┴─────────────────────┘

The left side is analytical.

The right side is interactive.

This distinction should remain consistent.

⸻

11. HISTORICAL VS FORECAST

One of the most important visual distinctions in the model is:

ACTUAL vs ESTIMATE.

Example:

$B	2022A	2023A	2024A	2025E	2026E	2027E	2028E
Revenue	394	383	391	420	452	482	510
Growth	—	-2.8%	2.1%	7.4%	7.6%	6.6%	5.8%
EBITDA	130	125	132	145	158	170	182
EBITDA Margin	33.0%	32.6%	33.8%	34.5%	35.0%	35.3%	35.7%

Actual periods should visually differ from estimates.

For example:

2022A 2023A 2024A

then a subtle vertical divider:

2025E 2026E 2027E 2028E

The distinction should be unmistakable.

⸻

12. FINANCIAL MODEL TABLE

The financial table is the core of the valuation engine.

Recommended sections:

Revenue
Growth
Gross Profit
Gross Margin
Operating Expenses
EBITDA
EBITDA Margin
D&A
EBIT
Tax
NOPAT
D&A
Capex
Change in NWC
Unlevered FCF

The table should support expandable rows.

For example:

Revenue
Organic Revenue
Acquisitions
Other Revenue

Operating Expenses
R&D
Sales & Marketing
G&A
Other Operating Expenses

This allows advanced users to inspect the model without overwhelming beginners.

⸻

13. INPUT TYPES

Every number in the model should have a defined type.

There are four primary categories:

1. Historical data
2. Forecast assumptions
3. Derived calculations
4. User overrides

Historical data should normally be locked.

Forecast assumptions should be editable.

Derived calculations should be locked.

User overrides should be clearly indicated.

Example:

Revenue Growth
2026E
7.6%

The interface should show whether 7.6% comes from:

System Forecast
User Input
Historical Trend
Analyst Estimate

⸻

14. ASSUMPTION PANEL

The right-side assumption panel should be one of the strongest UX components in Hedger.

Sections:

Revenue
Margins
Taxes
Working Capital
Capital Expenditure
Discount Rate
Terminal Value
Capital Structure

Each section should be collapsible.

Example:

Revenue

2026E Growth
[ 7.6% ]

2027E Growth
[ 6.8% ]

2028E Growth
[ 6.1% ]

2029E Growth
[ 5.4% ]

2030E Growth
[ 4.8% ]

Each input should support:

* Editing
* Reset
* Historical reference
* Source
* Validation
* Tooltip

⸻

15. INPUT DESIGN

Inputs should not look like generic web forms.

Avoid:

[Enter value here]

Instead use financial-model styling.

Example:

Revenue Growth
2026E

7.6%

Historical Average
6.4%

System Estimate
7.2%

User Override
7.6%

This allows the user to understand the context behind the assumption.

⸻

16. ASSUMPTION SOURCES

Every major assumption should optionally display a source.

Example:

WACC
8.4%

Source:
Calculated

Cost of Equity
9.1%

Source:
CAPM

Terminal Growth
2.5%

Source:
User assumption

Revenue Growth
7.6%

Source:
Historical trend + analyst estimate

This makes the model more trustworthy.

⸻

17. REVENUE FORECAST

Revenue should be modeled explicitly.

Basic model:

Revenue_t = Revenue_(t-1) × (1 + Growth_t)

For example:

2025 Revenue = $420B

2026 Growth = 7.6%

2026 Revenue:

$420B × 1.076

= $451.92B

The model should calculate this automatically.

Users should be able to override growth assumptions.

⸻

18. SEGMENT FORECASTING

For advanced users, Hedger should support segment-level forecasting.

Example:

iPhone
Services
Mac
iPad
Wearables

Each segment can have:

Revenue
Growth
Margin

Then:

Total Revenue = Sum of Segment Revenue

This becomes especially valuable for diversified companies.

⸻

19. MARGIN FORECASTING

Margins should be modeled independently.

Example:

Gross Margin

2025A: 46.2%

2026E: 46.8%

2027E: 47.2%

2028E: 47.5%

Operating Margin

2025A: 31.2%

2026E: 32.0%

2027E: 32.8%

2028E: 33.5%

The model should show the historical trend.

A small sparkline can appear next to each assumption.

⸻

20. MARGIN LOGIC

For a simple model:

Gross Profit = Revenue × Gross Margin

EBIT = Revenue × EBIT Margin

EBITDA = EBIT + D&A

Taxes should be based on the applicable tax assumption.

The model should avoid mixing reported and adjusted metrics without clear labeling.

⸻

21. FREE CASH FLOW

For DCF valuation, Hedger should calculate unlevered free cash flow.

Core formula:

UFCF = EBIT × (1 − Tax Rate)

* D&A
    − CapEx
    − Change in NWC

Example:

EBIT = $100B

Tax Rate = 20%

NOPAT = $80B

D&A = $10B

CapEx = $15B

Change in NWC = $5B

UFCF:

$80B + $10B − $15B − $5B

= $70B

Every component should be visible.

⸻

22. WACC SECTION

WACC should have its own dedicated section.

Display:

WACC
8.4%

Cost of Equity
9.1%

Cost of Debt
4.8%

Tax Rate
18.0%

Equity Weight
95%

Debt Weight
5%

The user should be able to expand the calculation.

⸻

23. COST OF EQUITY

If CAPM is used:

Cost of Equity =
Risk-Free Rate
+
Beta × Equity Risk Premium

Example:

Risk-Free Rate = 4.2%

Beta = 1.15

Equity Risk Premium = 5.0%

Cost of Equity:

4.2% + (1.15 × 5.0%)

= 9.95%

Hedger should expose this calculation.

⸻

24. COST OF DEBT

Cost of debt should be calculated based on appropriate debt assumptions.

Example:

Pre-tax Cost of Debt
5.1%

Tax Rate
20%

After-tax Cost of Debt
4.08%

The model should explain:

After-tax Cost of Debt =
Pre-tax Cost of Debt × (1 − Tax Rate)

⸻

25. WACC CALCULATION

WACC:

WACC =
E/(D+E) × Cost of Equity
+
D/(D+E) × Cost of Debt × (1−Tax Rate)

The UI should provide an expandable calculation.

The final WACC should be prominent.

⸻

26. TERMINAL VALUE

Hedger should support the perpetuity growth method.

Terminal Value:

TV =
FCF_(n+1) / (WACC − g)

where:

FCF_(n+1) = Final forecast FCF × (1 + g)

g = Terminal Growth Rate

The model should clearly display:

Terminal Growth
2.5%

WACC
8.4%

Terminal FCF
$105B

Terminal Value
$1.78T

⸻

27. TERMINAL VALUE WARNING

If:

Terminal Growth >= WACC

the model should immediately flag an error.

Example:

Terminal Growth
9.0%

WACC
8.4%

ERROR

Terminal growth must remain below WACC for the selected perpetuity-growth calculation.

Do not allow the system to silently produce an invalid valuation.

⸻

28. DISCOUNTING CASH FLOWS

Each projected FCF should be discounted.

PV of FCF:

FCF_t / (1 + WACC)^t

The table should optionally show:

2026E FCF
$70B

Discount Factor
0.922

Present Value
$64.5B

Advanced users can expand this information.

⸻

29. ENTERPRISE VALUE

Enterprise Value should be calculated as:

PV of Forecast FCF
+
PV of Terminal Value

Example:

PV of Forecast FCF
$350B

PV of Terminal Value
$1.15T

Enterprise Value
$1.50T

The bridge should be visually clear.

⸻

30. ENTERPRISE VALUE TO EQUITY VALUE

The model should provide a clear bridge.

Enterprise Value
$1.50T

Less:
Debt
$100B

Add:
Cash
$60B

Less:
Minority Interest
$5B

Less:
Preferred Equity
$0B

Equity Value
$1.455T

Then:

Diluted Shares
10.0B

Implied Share Price
$145.50

This bridge should never be hidden.

⸻

31. VALUATION WATERFALL

A waterfall visualization can be used sparingly.

Enterprise Value
↓
− Debt
↓

* Cash
    ↓
    − Minority Interest
    ↓
    Equity Value
    ↓
    ÷ Diluted Shares
    ↓
    Implied Share Price

This provides a powerful mental model.

⸻

32. IMPLIED UPSIDE

Current Market Price:

$132.00

Intrinsic Value:

$145.50

Upside:

($145.50 / $132.00) − 1

= 10.23%

Display:

Estimated Value
$145.50

Current Price
$132.00

Implied Upside
+10.2%

Do not label this as a guaranteed return.

⸻

33. SCENARIO ENGINE

Hedger should support:

Bear
Base
Bull

Each scenario should contain its own assumptions.

Example:

Assumption	Bear	Base	Bull
Revenue CAGR	3.0%	6.0%	9.0%
EBIT Margin	18%	22%	26%
WACC	9.5%	8.5%	7.8%
Terminal Growth	1.5%	2.5%	3.0%
Implied Value	$92	$145	$198

This table should be directly connected to the valuation engine.

⸻

34. SCENARIO PROBABILITY

Optional probability weighting:

Bear
25%

Base
50%

Bull
25%

Probability-weighted value:

Bear Value × Bear Probability
+
Base Value × Base Probability
+
Bull Value × Bull Probability

The probability-weighted result should be clearly labeled.

Do not imply that probability percentages are objectively calculated unless the methodology actually supports that.

⸻

35. SENSITIVITY ANALYSIS

Sensitivity analysis should be immediately accessible.

Primary DCF matrix:

WACC vs Terminal Growth.

Example:

WACC \ g	1.5%	2.0%	2.5%	3.0%	3.5%
7.5%	$171	$185	$201	$220	$245
8.0%	$159	$171	$185	$201	$222
8.5%	$149	$159	$171	$185	$201
9.0%	$139	$149	$159	$171	$185
9.5%	$131	$139	$149	$159	$171

The current assumption should be highlighted.

⸻

36. SENSITIVITY INTERACTION

Users should be able to click a sensitivity cell.

For example:

8.5% WACC
2.5% terminal growth

Clicking the cell should update the valuation preview.

The user should immediately see:

Selected assumptions:
WACC: 8.5%
Terminal Growth: 2.5%

Implied Value:
$171

This turns sensitivity analysis into an interactive analytical tool.

⸻

37. DRIVER ANALYSIS

Hedger should identify which assumptions have the greatest impact.

Example:

Valuation Drivers

Revenue Growth
High Impact

Operating Margin
High Impact

WACC
Very High Impact

Terminal Growth
High Impact

CapEx
Medium Impact

Working Capital
Low Impact

This should be calculated from sensitivity analysis where possible rather than generated as an arbitrary score.

⸻

38. MODEL DIAGNOSTICS

The model should contain a diagnostics panel.

Example:

MODEL STATUS

✓ Financial statements loaded
✓ Forecast periods complete
✓ Revenue assumptions complete
✓ Margin assumptions complete
✓ WACC calculated
✓ Terminal value valid
✓ Capital structure complete
✓ Diluted shares available

Status:

READY

If something is missing:

⚠ Missing diluted shares

The system should explain what must be fixed.

⸻

39. DATA QUALITY

Hedger should distinguish:

Verified
Estimated
Calculated
Missing
Stale

For example:

Revenue
$420B
Verified

Terminal Growth
2.5%
User Assumption

WACC
8.4%
Calculated

Debt
$100B
Verified

This improves transparency.

⸻

40. MODEL VERSIONING

Users should be able to save model versions.

Example:

Apple DCF
v1.0

Created:
Aug 28, 2026

Scenario:
Base

WACC:
8.4%

Terminal Growth:
2.5%

Estimated Value:
$145.50

Then:

Apple DCF
v1.1

WACC:
8.8%

Estimated Value:
$137.20

Users should be able to compare versions.

⸻

41. MODEL SAVE SYSTEM

Primary controls:

Save Model

Save As

Duplicate

Reset

Export

The save button should indicate state.

Saved

Saving…

Unsaved Changes

Save Failed

This prevents silent data loss.

⸻

42. MODEL NAMING

Default model name:

AAPL — DCF — Base Case

Users can rename:

Apple Base Case
Apple Conservative
Apple Long-Term DCF
Apple FY2030 Thesis

Model names should be searchable.

⸻

43. METHODOLOGY COMPARISON

Hedger should eventually provide a valuation-method comparison.

Example:

Method	Implied Value	Upside
DCF	$145	+10.2%
Comps	$157	+18.9%
Precedents	$164	+24.2%
SOTP	$151	+14.4%

Then:

Blended Range

$145–$164

The user can inspect each methodology independently.

⸻

44. VALUATION RANGE VISUALIZATION

A clean horizontal valuation range should show:

Bear
$92

Current
$132

Base
$145

Bull
$198

This is more useful than a giant “BUY” indicator.

Do not turn the valuation page into a trading signal dashboard.

⸻

45. NO GENERIC BUY/SELL SCORE

Hedger should avoid simplistic:

BUY 92/100

outputs.

Instead:

Estimated Value
$145.50

Current Price
$132.00

Implied Upside
10.2%

Model Confidence
Moderate

Key Risks
Margin compression
Lower growth
Higher discount rate

This preserves analytical nuance.

⸻

46. CONFIDENCE FRAMEWORK

If Hedger implements confidence scoring, it should be based on model characteristics.

Possible inputs:

Data completeness
Forecast uncertainty
Historical stability
Sensitivity
Assumption dispersion
Model agreement

Example:

Model Confidence
Moderate

Why?

High sensitivity to WACC and terminal growth.

This explanation matters more than the score.

⸻

47. INVESTMENT CONCLUSION

At the bottom of the model:

Valuation Conclusion

Estimated Value
$145.50

Current Price
$132.00

Base Case Upside
10.2%

Bear Case
$92

Bull Case
$198

Key Drivers:

1. Revenue growth remains above historical average.
2. Operating margins expand gradually.
3. Capital intensity remains controlled.
4. Discount rate remains near 8.5%.

Key Risks:

1. Revenue growth slows.
2. Margins contract.
3. WACC increases.
4. Terminal assumptions prove optimistic.

The user can then write:

Investment Thesis

[Text editor]

The thesis should remain user-controlled.

⸻

48. THESIS TEMPLATE

Optional structured fields:

Why I Like It

[Text]

What Needs To Go Right

[Text]

Key Catalysts

[Text]

Key Risks

[Text]

What Would Break My Thesis

[Text]

Target / Fair Value

[Linked model output]

This connects valuation with actual investment reasoning.

⸻

49. USER EXPERIENCE FLOW

The ideal user flow should be:

1. Search company.
2. Open company overview.
3. Click Valuation.
4. Select methodology.
5. Review historical financials.
6. Review default assumptions.
7. Modify assumptions.
8. Observe projected financials.
9. Review free cash flow.
10. Review discount rate.
11. Review terminal value.
12. Review enterprise value.
13. Review equity bridge.
14. Review implied share price.
15. Review sensitivity.
16. Review scenarios.
17. Compare methodologies.
18. Write thesis.
19. Save model.
20. Return to company page.

This should feel like one continuous workflow.

⸻

50. VISUAL DESIGN SYSTEM

Hedger’s valuation interface should follow the broader product philosophy:

Pure white
Black
Soft gray
Minimal accent

Avoid:

* Neon gradients
* Glassmorphism
* Excessive shadows
* Giant rounded cards
* Floating blobs
* Animated backgrounds
* AI-style glowing borders
* Excessive icons
* Excessive pill components

The interface should feel institutional.

⸻

51. TYPOGRAPHY

Use typography to create hierarchy.

Page title:

Valuation

Section title:

Discounted Cash Flow

Table labels:

Revenue

Large output:

$145.50

Supporting text:

Implied value per diluted share

Numbers should be highly legible.

Financial numbers should use tabular numerals where possible.

This ensures columns align correctly.

⸻

52. TABLE DESIGN

Financial tables should be extremely clean.

Recommended:

* Minimal vertical borders
* Subtle horizontal separators
* Strong header hierarchy
* Right-aligned numbers
* Left-aligned labels
* Consistent decimal precision
* Consistent currency notation
* Actual/estimate distinction

Do not put every row inside a card.

⸻

53. NUMBER FORMATTING

Use context-aware formatting.

Examples:

$1.42T
$452.3B
$18.2B
$145.50
8.4%
1.15x

Avoid:

$1,420,000,000,000

unless the user explicitly requests raw values.

⸻

54. DECIMAL PRECISION

Use appropriate precision.

Revenue:

$452.3B

Margins:

34.8%

Share price:

$145.50

WACC:

8.4%

Beta:

1.15

Avoid displaying:

8.437291%

unless advanced precision is intentionally requested.

⸻

55. CHART DESIGN

Charts should be restrained.

Recommended charts:

Revenue history
EBITDA history
FCF history
Projected FCF
Valuation range
Sensitivity
Scenario valuation

Avoid unnecessary chart types.

Line charts should be used for trends.

Bar charts should be used for discrete comparisons.

Waterfalls should be used for value bridges.

Heatmaps should be used for sensitivity.

⸻

56. INTERACTIVE CHART BEHAVIOR

Hovering over a chart should display:

Period
Value
Growth
Actual/Estimate

Example:

2027E

Revenue
$482.1B

Growth
6.6%

Status
Estimate

Charts should not rely exclusively on hover for essential information.

⸻

57. RESPONSIVE DESIGN

Desktop should be the primary experience.

The valuation model is inherently information-dense.

On smaller screens:

* Assumption panel becomes a drawer.
* Tables become horizontally scrollable.
* Summary remains sticky.
* Methodology controls remain accessible.
* Charts resize.
* Non-critical secondary information can collapse.

Do not simply shrink the desktop layout.

⸻

58. KEYBOARD EXPERIENCE

Professional users should be able to operate the model efficiently.

Suggested shortcuts:

Cmd/Ctrl + K
Global search

Cmd/Ctrl + S
Save model

Cmd/Ctrl + Shift + S
Save as

Esc
Close panel

Tab
Move through inputs

Enter
Confirm input

Arrow keys
Navigate table

This is particularly important for advanced users.

⸻

59. INPUT VALIDATION

Examples:

Revenue Growth:

-999% to +999%

Tax Rate:

0–100%

WACC:

Must be > 0

Terminal Growth:

Must be < WACC

Debt:

Must not be negative unless explicitly supported

Shares:

Must be > 0

Validation should occur immediately.

⸻

60. ERROR HANDLING

Never show:

Something went wrong.

Instead:

Unable to calculate valuation.

Reason:
Terminal growth rate is greater than WACC.

Fix:
Set terminal growth below 8.4%.

[Review Assumption]

Errors should tell users:

What happened
Why it happened
How to fix it

⸻

61. EMPTY STATES

If a company lacks sufficient financial data:

Valuation unavailable

This company does not have enough financial information to construct the selected valuation model.

Missing:

Historical FCF
Debt
Diluted Shares

[Review Financial Data]

Never fabricate missing information.

⸻

62. LOADING STATES

When calculating:

Updating model…

The layout should remain stable.

Do not show a full-screen spinner.

Only affected sections should update.

⸻

63. PERFORMANCE

The valuation model should feel instantaneous.

Assumption changes should update calculated values quickly.

The system should avoid recalculating unrelated modules.

Large sensitivity matrices should be efficiently computed.

The frontend should not repeatedly request the same data.

Financial data should be cached appropriately.

⸻

64. ARCHITECTURE

Recommended logical architecture:

Company Data Layer
↓
Financial Statement Layer
↓
Normalized Metrics Layer
↓
Forecast Engine
↓
Valuation Engine
↓
Scenario Engine
↓
Sensitivity Engine
↓
Presentation Layer

This separation is critical.

Do not place valuation formulas directly inside UI components.

⸻

65. DATA MODEL

A valuation model should conceptually contain:

model_id
user_id
company_id
security_id
currency
methodology
scenario
historical_periods
forecast_periods
assumptions
financials
capital_structure
valuation_outputs
sensitivity_settings
created_at
updated_at
version

This allows models to remain reproducible.

⸻

66. ASSUMPTION OBJECT

Each assumption should conceptually include:

name
value
unit
period
source
source_type
default_value
user_override
last_updated
validation_status

Example:

revenue_growth
7.6%
percentage
2026
historical_plus_estimate
true
valid

⸻

67. CALCULATION ENGINE

The valuation engine should be independent from the UI.

For example:

calculateRevenue()

calculateEBITDA()

calculateEBIT()

calculateNOPAT()

calculateUFCF()

calculateWACC()

calculateTerminalValue()

calculateEnterpriseValue()

calculateEquityValue()

calculateImpliedSharePrice()

calculateSensitivity()

This makes the system testable.

⸻

68. API STRUCTURE

Potential API architecture:

GET /companies/:id

GET /companies/:id/financials

GET /companies/:id/metrics

GET /companies/:id/valuation

POST /valuation/models

GET /valuation/models/:id

PATCH /valuation/models/:id

POST /valuation/models/:id/calculate

POST /valuation/models/:id/sensitivity

POST /valuation/models/:id/scenarios

POST /valuation/models/:id/duplicate

GET /valuation/models/:id/versions

The exact routes should follow the existing Hedger backend conventions.

⸻

69. FRONTEND COMPONENT STRUCTURE

Possible component hierarchy:

ValuationPage

CompanyHeader

ValuationSummary

MethodologySelector

ModelWorkspace

FinancialProjectionTable

AssumptionPanel

RevenueAssumptions

MarginAssumptions

CashFlowAssumptions

WACCSection

TerminalValueSection

ValuationBridge

SensitivityMatrix

ScenarioTable

MethodologyComparison

ModelDiagnostics

InvestmentThesis

ModelToolbar

Each component should remain modular.

⸻

70. STATE MANAGEMENT

The model should have a clear state hierarchy.

Global state:

Selected company
User
Preferences

Model state:

Methodology
Scenario
Assumptions
Forecast periods
Model version

Calculated state:

Revenue
EBIT
UFCF
PV
Terminal value
Enterprise value
Equity value
Share price

UI state:

Expanded sections
Open dialogs
Loading states
Errors

Do not mix UI state and financial calculation state unnecessarily.

⸻

71. AUTOSAVE

Autosave can be enabled.

However, it should not create confusion.

Show:

Saved just now

or:

Unsaved changes

The user should always know whether the current model is persisted.

⸻

72. RESET BEHAVIOR

Every major assumption section should have:

Reset

Reset should restore the system/default assumption.

If the user has made significant edits, consider:

Reset Revenue Assumptions?

This will remove your custom assumptions.

[Cancel] [Reset]

⸻

73. UNDO

Model editing should ideally support undo.

For example:

Changed WACC:
8.4% → 9.1%

[Undo]

This dramatically improves experimentation.

⸻

74. MODEL COMPARISON

Users should be able to compare:

Base Case
Bull Case
Bear Case

or:

Model v1
Model v2

Example:

Metric	Original	Revised
Revenue CAGR	7.1%	6.4%
EBIT Margin	25%	23%
WACC	8.2%	8.8%
Terminal Growth	2.5%	2.3%
Fair Value	$162	$141

This is extremely useful for serious research.

⸻

75. EXPORT

If implemented, export should support:

PDF
CSV
Excel
Model JSON

PDF should be research-report friendly.

Excel should preserve model structure where possible.

CSV should export tables.

JSON should preserve model configuration.

⸻

76. RESEARCH REPORT OUTPUT

A saved valuation can generate:

Company Overview

Investment Thesis

Financial Performance

Valuation Methodology

Forecast Assumptions

DCF

Comparable Valuation

Scenario Analysis

Sensitivity Analysis

Risks

Conclusion

This can eventually become Hedger’s research-report engine.

⸻

77. AUDIT TRAIL

Every important model change can be recorded.

Example:

Aug 28, 20:14

WACC
8.4% → 8.8%

Fair Value
$145.50 → $139.20

This provides model history.

⸻

78. DATA PROVENANCE

Users should be able to ask:

Where did this number come from?

For example:

Revenue 2024

$391.0B

Source:
Company financial statement

Reported:
Jan 30, 2025

This improves credibility.

⸻

79. AI EXPLANATION LAYER

A small optional action:

Explain this model

could generate:

The valuation is primarily driven by projected revenue growth, gradual margin expansion, and the selected discount rate. Terminal value represents approximately X% of enterprise value, making the valuation sensitive to long-term assumptions.

The explanation should reference actual model values.

⸻

80. AI CHALLENGE MODE

An advanced feature could be:

Challenge My Assumptions

The system reviews:

Revenue growth
Margins
WACC
Terminal growth
CapEx
Working capital

and identifies assumptions that appear aggressive relative to historical performance or selected peer data.

Example:

Revenue growth of 9.5% exceeds the company’s five-year historical CAGR of 6.2%.

This is not a recommendation.

It is an analytical prompt.

⸻

81. MODEL QUALITY SCORE

If implemented, the model-quality system should evaluate:

Data completeness
Forecast completeness
Historical consistency
Sensitivity
Assumption dispersion
Methodology coverage

Example:

Model Quality
82 / 100

Primary weakness:
High dependence on terminal value.

The score should never replace the actual model.

⸻

82. TERMINAL VALUE DEPENDENCE

The platform should explicitly show:

Terminal Value Contribution

72%

Forecast Cash Flow Contribution

28%

This is valuable because users should know whether the valuation depends heavily on distant assumptions.

⸻

83. FORECAST PERIOD CONTROL

Users should be able to choose:

5 years
7 years
10 years

The default should be appropriate for the company.

Changing the forecast horizon should recalculate:

Revenue
Margins
FCF
Terminal value
Enterprise value
Equity value
Share price

⸻

84. MID-YEAR CONVENTION

Advanced DCF models can support mid-year discounting.

Setting:

Discount Convention

[Year-End]
[Mid-Year]

This should be hidden under advanced settings.

Default users should not be overwhelmed.

⸻

85. TERMINAL MULTIPLE METHOD

DCF can optionally support:

Exit EBITDA Multiple

Example:

Terminal EBITDA
$220B

Exit Multiple
18.0x

Terminal Value
$3.96T

This can be compared with perpetuity-growth valuation.

⸻

86. DCF METHOD COMPARISON

Example:

Perpetuity Growth

$145.50

Exit Multiple

$151.20

Difference

+3.9%

This provides a useful reasonableness check.

⸻

87. COMPS VALUATION DESIGN

Comparable-company valuation should contain:

Peer selector
Peer table
Multiple selector
Statistics
Implied valuation
Valuation bridge

Example:

Selected Multiple:

EV / EBITDA

Median:
17.4x

Target EBITDA:
$100B

Implied EV:
$1.74T

Then bridge to equity value.

⸻

88. PEER SELECTION

The peer selector should show:

Company
Ticker
Market Cap
Revenue
Growth
EBITDA Margin
EV/EBITDA

Users can select or remove peers.

The system should never force a peer set.

⸻

89. PEER OUTLIERS

If a peer has:

EV/EBITDA = 92x

while the peer median is:

18x

the platform should flag:

Potential Outlier

The user can:

Keep
Exclude

The platform should not automatically delete it without explanation.

⸻

90. MULTIPLE NORMALIZATION

Different companies can have different capital structures.

Hedger should distinguish:

EV-based multiples

from:

Equity-value multiples.

EV/Revenue
EV/EBITDA
EV/EBIT

versus:

P/E
P/B

The model should prevent conceptually incorrect calculations.

⸻

91. SUM-OF-THE-PARTS

For diversified businesses:

Segment A
Revenue
Margin
Multiple
Value

Segment B
Revenue
Margin
Multiple
Value

Segment C
Revenue
Margin
Multiple
Value

Then:

Enterprise Value
− Corporate Costs
− Net Debt
+
Other Assets

Equity Value

Per Share Value

This should be a separate methodology.

⸻

92. VALUATION CONSENSUS

Hedger can eventually create:

Valuation Summary

DCF
$145

Comps
$157

SOTP
$151

Precedents
$164

Blended Range
$145–164

The user should see why methodologies disagree.

⸻

93. METHOD WEIGHTING

Advanced users can assign:

DCF
50%

Comps
30%

SOTP
20%

Weighted Value:

DCF × 50%
+
Comps × 30%
+
SOTP × 20%

The weighting should be user-controlled.

⸻

94. NO HIDDEN BLENDING

Never silently blend valuation methodologies.

If Hedger produces a blended value, the UI must show:

Methodology Weighting

DCF 50%
Comps 30%
SOTP 20%

Blended Value
$151.20

Transparency is essential.

⸻

95. FINANCIAL MODEL COLOR SEMANTICS

Because Hedger’s identity is monochrome, color should be used sparingly.

Recommended semantic system:

Neutral:
Black / gray

Positive:
Subtle green

Negative:
Subtle red

Warning:
Subtle amber

Do not use color everywhere.

Numbers should remain understandable without color.

⸻

96. HOVER DETAILS

Hovering over:

WACC

should show:

Weighted Average Cost of Capital

Used to discount projected unlevered free cash flow.

Current:
8.4%

Calculated from:
Cost of Equity
Cost of Debt
Capital Structure

This is educational without being intrusive.

⸻

97. CONTEXTUAL HELP

Every advanced financial concept should have concise help.

Examples:

WACC
Terminal Growth
Enterprise Value
Equity Value
NOPAT
UFCF
Beta
ERP
Diluted Shares

The help should explain the concept in plain English.

⸻

98. ADVANCED MODE

Hedger should have an optional:

Advanced Mode

Advanced mode reveals:

Formula rows
Discount factors
Capital structure
CAPM
Terminal-value mechanics
Detailed bridge
Segment assumptions
Model diagnostics

Default mode remains cleaner.

⸻

99. PROFESSIONAL MODE

Eventually Hedger can support:

Compact density
Keyboard shortcuts
Persistent assumption panel
Multi-model comparison
Expanded financial tables
More visible formulas

This would target professional users.

⸻

100. BEGINNER MODE

Beginner mode should simplify:

Complex formulas
Advanced assumptions
Detailed capital structure
Technical terminology

The user still receives the same underlying calculation.

Only presentation changes.

⸻

101. MODEL INTERACTION PHILOSOPHY

Every interaction should answer:

What changed?

Why did it change?

What impact did it have?

For example:

User changes Revenue Growth:

7.0% → 8.0%

Immediately display:

Fair Value
$145 → $152

Change
+$7

This makes model experimentation extremely intuitive.

⸻

102. DELTA ANALYSIS

When assumptions change, Hedger can show:

Valuation Impact

Revenue Growth
+$8.40

Margin
+$3.20

WACC
−$11.10

Terminal Growth
+$2.30

Net Change
+$2.80

This is an advanced but highly valuable feature.

⸻

103. MODEL WATERFALL

Starting Value:

$145

Change Revenue Growth:
+$8

Change Margin:
+$3

Change WACC:
−$11

Change Terminal Growth:
+$2

New Value:

$147

This shows exactly why valuation changed.

⸻

104. USER NOTES

Users should be able to annotate assumptions.

Example:

Revenue Growth
7.5%

Note:

“Management expects cloud growth to accelerate after FY27.”

These notes should remain attached to the model.

⸻

105. ASSUMPTION HISTORY

Each assumption can maintain a history.

Example:

WACC

Aug 20:
8.2%

Aug 24:
8.5%

Aug 28:
8.8%

This helps users understand their own evolving thesis.

⸻

106. MODEL LOCK

Users should optionally lock assumptions.

Example:

Lock Historical Data
✓

Lock Market Data
✓

Lock Base Case
□

Locked assumptions cannot be accidentally changed.

⸻

107. MODEL CLONING

A user can create:

Apple Base

then:

Duplicate → Apple Bear

Then modify:

Revenue
Margins
WACC

This is faster than rebuilding models.

⸻

108. SCENARIO LINKING

Scenarios should inherit from a base model.

Base model:

Revenue Growth
7%

Bull:

Base + 2%

Bear:

Base − 3%

This creates coherent scenario construction.

⸻

109. ASSUMPTION SHOCKS

Advanced users can apply shocks.

Example:

Revenue Growth
−200 bps

Operating Margin
−150 bps

WACC
+100 bps

The model instantly shows valuation impact.

This is useful for stress testing.

⸻

110. STRESS TEST

A dedicated stress-test view can show:

Mild Stress
Severe Stress
Extreme Stress

Example:

Revenue
−5%
−10%
−20%

Margin
−2%
−5%
−8%

WACC
+50bps
+150bps
+300bps

Resulting valuation:

$135
$108
$72

This provides downside analysis.

⸻

111. MODEL OUTPUT PRIORITY

The user should always be able to identify:

1. Estimated value
2. Current price
3. Upside/downside
4. Valuation range
5. Methodology
6. Key assumptions
7. Key risks

Everything else is secondary.

⸻

112. PAGE INFORMATION HIERARCHY

The visual hierarchy should follow:

Company

↓
Valuation Result

↓
Assumptions

↓
Financial Forecast

↓
Calculation

↓
Sensitivity

↓
Scenarios

↓
Conclusion

This is the fundamental information architecture.

⸻

113. SCROLL EXPERIENCE

The page should not feel like endless unrelated cards.

Use large section headings.

Example:

VALUATION

DCF MODEL

FORECAST

CASH FLOW

VALUATION BRIDGE

SENSITIVITY

SCENARIOS

CONCLUSION

This creates a clear analytical narrative.

⸻

114. STICKY ELEMENTS

Recommended sticky elements:

Global navigation
Compact company header
Valuation summary
Optional assumption panel

Do not make everything sticky.

Too many sticky elements create visual clutter.

⸻

115. URL STRUCTURE

Potential structure:

/company/AAPL

/company/AAPL/valuation

/company/AAPL/valuation/dcf

/company/AAPL/valuation/comps

/company/AAPL/valuation/sensitivity

/company/AAPL/valuation/scenarios

/company/AAPL/models/:modelId

This creates a logical information architecture.

⸻

116. MODEL PERMISSIONS

For future multi-user functionality:

Viewer

Can inspect models.

Editor

Can modify assumptions.

Owner

Can modify, delete, share.

Admin

Can manage workspace.

Permissions should be enforced backend-side.

⸻

117. COLLABORATION

Future functionality could support:

Share Model

Copy Link

View Only

Edit

Comments

Users could collaborate on valuation models.

⸻

118. COMMENT SYSTEM

Users could comment:

“WACC seems aggressive here.”

Another user could respond:

“Updated based on new risk-free rate.”

Comments should attach to model assumptions.

⸻

119. MODEL REVIEW

A future professional feature:

Request Review

The model can be submitted for review.

Reviewer sees:

Assumptions
Changes
Risks
Sensitivity
Conclusion

This can make Hedger useful for investment teams.

⸻

120. FINAL PRODUCT EXPERIENCE

The finished Hedger Valuation Model should feel like this:

The user searches for a company.

The company context immediately appears.

They enter valuation.

They see:

Current Price: $132

Estimated Value: $145

Upside: +10.2%

They can immediately understand how the valuation was generated.

They inspect revenue.

They inspect margins.

They inspect cash flow.

They inspect WACC.

They inspect terminal value.

They test different assumptions.

The valuation updates immediately.

They compare:

Bear
Base
Bull

They inspect sensitivity.

They compare DCF with comparable-company valuation.

They identify the major valuation drivers.

They document their investment thesis.

They save the model.

Later, they can return and see exactly what changed.

That is the core Hedger experience.

⸻

121. THE MOST IMPORTANT DESIGN RULES

The implementation agent should follow these rules without exception:

1. Do not redesign Hedger into a generic SaaS dashboard.
2. Preserve the existing Hedger visual identity.
3. Maintain the clean black-and-white aesthetic.
4. Do not introduce unnecessary gradients.
5. Do not introduce excessive rounded cards.
6. Do not introduce glassmorphism.
7. Do not introduce excessive animations.
8. Do not make the interface look AI-generated.
9. Do not hide financial calculations.
10. Do not hard-code valuation outputs.
11. Do not mix historical and forecast data visually.
12. Do not mix enterprise value and equity value.
13. Do not silently substitute missing financial data.
14. Do not silently modify user assumptions.
15. Do not create invalid DCF calculations.
16. Do not allow terminal growth to exceed WACC in a standard perpetuity model.
17. Do not use false precision.
18. Do not create fake financial data.
19. Do not create fake citations or sources.
20. Do not make unsupported investment recommendations.
21. Do not create arbitrary valuation scores.
22. Keep formulas centralized in the calculation engine.
23. Keep UI components separate from financial logic.
24. Validate all financial inputs.
25. Make every important calculation inspectable.
26. Make assumptions editable.
27. Make model changes reversible.
28. Preserve model versions.
29. Make scenario analysis real rather than cosmetic.
30. Make sensitivity analysis mathematically connected to the model.
31. Make valuation outputs update consistently.
32. Make errors understandable.
33. Make loading states stable.
34. Make empty states useful.
35. Make the model keyboard-friendly.
36. Make the model responsive without destroying financial-table usability.
37. Keep the primary output visible.
38. Keep company context persistent.
39. Make the model fast.
40. Make the entire experience feel like professional financial research software.

⸻

122. THE HEDGER STANDARD

Hedger should not compete by adding the largest number of financial widgets.

It should compete by creating the clearest analytical workflow.

A user should be able to open Hedger and understand:

“What am I valuing?”

“What assumptions am I making?”

“What does my model imply?”

“What could make me wrong?”

“What happens if my assumptions change?”

That is the fundamental product philosophy.

The valuation model should therefore be:

Transparent enough for a beginner to understand.

Deep enough for an analyst to inspect.

Fast enough for repeated scenario testing.

Structured enough for professional research.

Flexible enough for different valuation methodologies.

Reliable enough that calculations can be trusted.

Minimal enough that the interface never distracts from the financial analysis.

⸻

123. ONE-SCREEN MENTAL MODEL

The ideal user should be able to understand the entire valuation at a glance:

COMPANY
Apple Inc. · AAPL

CURRENT PRICE
$232.15

ESTIMATED VALUE
$248.60

UPSIDE
+7.1%

RANGE
$172 — $311

METHOD
DCF

SCENARIO
Base

KEY DRIVERS
Revenue Growth
Margin
WACC
Terminal Growth

VALUATION BRIDGE
UFCF → PV → Terminal Value → EV → Equity Value → Share Price

SENSITIVITY
WACC × Terminal Growth

SCENARIOS
Bear → Base → Bull

CONCLUSION
User’s investment thesis

This is the conceptual heart of Hedger’s Valuation Model.

⸻

124. END STATE

The final valuation product should not feel like:

“an app that calculates a stock price.”

It should feel like:

“a professional valuation environment where an investor can construct, inspect, challenge, compare, save, and continuously improve an investment thesis.”

Hedger’s strongest differentiator should be the connection between:

DATA

→

FINANCIALS

→

ASSUMPTIONS

→

VALUATION

→

SENSITIVITY

→

SCENARIOS

→

THESIS

Every layer should connect to the next.

No black boxes.

No unnecessary decoration.

No fake sophistication.

No unexplained numbers.

No disconnected dashboards.

Just a clean, rigorous, deeply interactive financial modeling environment built around the fundamental question:

What is this company actually worth, and what would have to be true for that valuation to be correct?