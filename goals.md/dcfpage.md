HEDGER — DCF MODEL PAGE

Complete Product, UI/UX, Financial Logic, Interaction, Data, Engineering & Design Specification

⸻

1. DCF PAGE — PRODUCT DEFINITION

The DCF Model page is one of the most important pages inside Hedger.

It should function as a professional discounted-cash-flow modeling workspace where the user can build, inspect, modify, stress-test, and save a company’s intrinsic valuation.

The DCF page should not look like a simple calculator.

It should look like a serious financial model.

The user should be able to understand the entire valuation chain:

Company

→ Historical Financials

→ Revenue Forecast

→ Operating Forecast

→ Free Cash Flow

→ Discount Rate

→ Terminal Value

→ Enterprise Value

→ Equity Value

→ Implied Share Price

→ Sensitivity

→ Scenario Analysis

→ Investment Conclusion

The page should make this chain visually obvious.

The DCF page should be powerful enough for experienced investors while remaining understandable to someone learning valuation.

⸻

2. CORE DCF PHILOSOPHY

The central principle is:

The user should always be able to explain where the DCF valuation came from.

If Hedger displays:

Fair Value: $145.50

the user should be able to trace that number through:

Revenue
→ EBIT
→ NOPAT
→ D&A
→ CapEx
→ Change in NWC
→ UFCF
→ Discount Factor
→ PV of UFCF
→ Terminal Value
→ Enterprise Value
→ Net Debt
→ Equity Value
→ Diluted Shares
→ Implied Share Price.

Nothing important should be hidden.

The DCF page should therefore prioritize:

Transparency

Traceability

Editability

Consistency

Auditability

Speed

Professional presentation

⸻

3. DCF PAGE EXPERIENCE

The page should feel like a combination of:

Professional equity-research terminal

Financial-modeling spreadsheet

Modern analytical software

It should NOT feel like:

Generic SaaS dashboard

AI chatbot

Crypto trading interface

Consumer finance app

Gaming dashboard

Marketing landing page

The interface should be quiet.

The calculations should be the visual focus.

⸻

4. PAGE ARCHITECTURE

Recommended page hierarchy:

GLOBAL NAVIGATION

↓

COMPANY HEADER

↓

MODEL TOOLBAR

↓

DCF SUMMARY

↓

MODEL ASSUMPTIONS

↓

FORECAST MODEL

↓

FREE CASH FLOW

↓

DISCOUNTING

↓

TERMINAL VALUE

↓

VALUATION BRIDGE

↓

SENSITIVITY

↓

SCENARIOS

↓

VALUATION DIAGNOSTICS

↓

INVESTMENT CONCLUSION

⸻

5. GLOBAL NAVIGATION

The global navigation should remain identical to the rest of Hedger.

Example:

HEDGER

Search

Markets

Companies

Valuation

Watchlist

Portfolio

Research

Models

Account

The active section should indicate that the user is currently inside:

Valuation → DCF

Navigation should remain compact.

Do not consume excessive vertical space.

⸻

6. COMPANY HEADER

Immediately below the navigation:

APPLE INC.

AAPL · NASDAQ

Technology · Consumer Electronics

$232.15

+1.42%

Market Cap
$3.46T

Enterprise Value
$3.39T

The company context should remain persistent.

The user should never wonder which company they are modeling.

⸻

7. MODEL TOOLBAR

Below the company header:

DCF MODEL

Base Case

5-Year Forecast

USD

Last saved:
Just now

Controls:

Save

Save As

Duplicate

Reset

Export

More

The toolbar should remain visually restrained.

⸻

8. MODEL NAME

The model should have a clear editable title.

Example:

AAPL — DCF — Base Case

Clicking the title allows editing.

Possible model names:

Apple Base DCF

Apple Conservative DCF

Apple FY2030 DCF

Apple Long-Term Model

Model naming should make saved models easy to identify.

⸻

9. MODEL STATUS

The toolbar should show:

Saved

or:

Unsaved Changes

or:

Saving…

or:

Calculation Error

This is important because DCF models contain many user edits.

Never allow users to wonder whether their work was saved.

⸻

10. DCF SUMMARY

The first major section should provide the valuation result.

Example:

DCF VALUATION

Current Price

$232.15

DCF Value

$248.60

Implied Upside

+7.1%

Enterprise Value

$3.52T

Equity Value

$3.61T

Scenario

Base

Forecast

2026E–2030E

The DCF Value should be the primary visual output.

⸻

11. VALUATION RANGE

A DCF should not communicate false precision.

Show:

Bear
$172

Base
$249

Bull
$311

Current Price
$232

Example visual:

$172 ───────── $232 ───── $249 ───────── $311
Bear          Current     Base          Bull

This gives the user immediate context.

⸻

12. MODEL HEALTH

Near the summary:

Model Health

✓ Historical financials
✓ Forecast complete
✓ WACC calculated
✓ Terminal value valid
✓ Capital structure complete
✓ Diluted shares available

Status:

READY

This should be subtle.

It should not dominate the interface.

⸻

13. DCF MODEL NAVIGATION

Because the page can become long, add a local navigation bar:

Overview

Forecast

Cash Flow

WACC

Terminal Value

Sensitivity

Scenarios

Conclusion

Clicking a section should scroll to it.

This improves navigation without adding clutter.

⸻

14. MODEL INPUT/OUTPUT DISTINCTION

One of the most important UX rules:

Inputs and outputs must be visually different.

INPUT:

Revenue Growth
7.5%

OUTPUT:

Revenue
$452B

CALCULATION:

EBIT
$104B

HISTORICAL DATA:

2025A Revenue
$420B

The user should immediately understand what they can change.

⸻

15. ACTUAL VS ESTIMATE

Use:

A = Actual

E = Estimate

Example:

2022A
2023A
2024A
2025A
2026E
2027E
2028E
2029E
2030E

Actual and forecast periods should be separated by a subtle vertical divider.

For example:

2025A | 2026E | 2027E | 2028E | 2029E | 2030E

The forecast boundary should never be ambiguous.

⸻

16. HISTORICAL FINANCIALS

Before forecasting, show historical data.

Example:

$B	2022A	2023A	2024A	2025A
Revenue	394	383	391	420
Growth	—	-2.8%	2.1%	7.4%
EBITDA	130	125	132	145
EBITDA Margin	33.0%	32.6%	33.8%	34.5%
EBIT	120	115	125	135
EBIT Margin	30.5%	30.0%	32.0%	32.1%
CapEx	10	11	12	13
FCF	70	65	72	78

The user should understand the historical business before accepting the forecast.

⸻

17. FORECAST TABLE

The primary DCF table should look like a professional financial model.

Example:

$B	2025A	2026E	2027E	2028E	2029E	2030E
Revenue	420	452	482	510	535	560
Growth	7.4%	7.6%	6.6%	5.8%	4.9%	4.7%
EBIT Margin	32.1%	32.5%	33.0%	33.5%	34.0%	34.2%
EBIT	135	147	159	171	182	192

The table should support horizontal scrolling on smaller screens.

⸻

18. REVENUE FORECAST

The basic calculation:

Revenue_t

=

Revenue_(t−1)

×

(1 + Revenue Growth_t)

Example:

2025 Revenue:

$420B

2026 Growth:

7.6%

2026 Revenue:

$420B × 1.076

=

$451.92B

The model calculates the result automatically.

⸻

19. REVENUE ASSUMPTION DESIGN

The assumption panel should show:

Revenue Growth

2026E
7.6%

2027E
6.6%

2028E
5.8%

2029E
4.9%

2030E
4.7%

Historical CAGR:

6.2%

The historical context helps the user assess whether the forecast is reasonable.

⸻

20. REVENUE GROWTH CHART

A small supporting chart can display:

Historical Growth

vs.

Forecast Growth

Example:

2022A → 2023A → 2024A → 2025A → 2026E → 2027E → 2028E

The forecast should visually transition from historical performance.

Avoid decorative charts.

⸻

21. SEGMENT FORECAST

For companies where segment economics matter:

Revenue

→ Product A

→ Product B

→ Services

→ Other

Each segment can have:

Revenue

Growth

Margin

Example:

Services

2025A:
$100B

2026E Growth:
12%

2027E Growth:
11%

The total revenue should aggregate segment forecasts.

⸻

22. GROSS PROFIT

If the model includes gross margin:

Gross Profit

=

Revenue × Gross Margin

Example:

Revenue
$452B

Gross Margin
47%

Gross Profit
$212.4B

The margin should be editable.

⸻

23. OPERATING EXPENSES

The DCF can either forecast EBIT directly or build EBIT from operating expenses.

Advanced structure:

Revenue

− Cost of Revenue

= Gross Profit

− R&D

− Sales & Marketing

− G&A

− Other OpEx

= EBIT

This should be expandable.

⸻

24. EBITDA

If EBITDA is displayed:

EBITDA

=

EBIT

D&A

Example:

EBIT
$147B

D&A
$12B

EBITDA
$159B

The model should distinguish reported EBITDA from calculated EBITDA.

⸻

25. EBIT

EBIT can be calculated using:

Revenue × EBIT Margin

Example:

Revenue
$452B

EBIT Margin
32.5%

EBIT
$146.9B

This should feed directly into NOPAT.

⸻

26. TAX RATE

The assumption panel:

Tax Rate

2026E
19.0%

2027E
19.5%

2028E
20.0%

2029E
20.0%

2030E
20.0%

The user can optionally apply:

Flat Tax Rate

or:

Year-by-Year Tax Rate

⸻

27. NOPAT

NOPAT:

EBIT × (1 − Tax Rate)

Example:

EBIT
$147B

Tax
19%

NOPAT
$119.1B

NOPAT should be visible in advanced mode.

⸻

28. D&A

Depreciation and amortization should be forecast.

Possible approaches:

% of Revenue

% of CapEx

Historical Ratio

User Forecast

Example:

D&A / Revenue

2025A:
2.8%

2026E:
2.7%

2027E:
2.6%

The selected methodology should be visible.

⸻

29. CAPITAL EXPENDITURE

CapEx is one of the key DCF drivers.

Example:

CapEx

2026E
$15B

2027E
$16B

2028E
$17B

or:

CapEx / Revenue

2026E
3.3%

The user should be able to choose the forecasting approach.

⸻

30. WORKING CAPITAL

The DCF should include working capital assumptions.

Possible drivers:

NWC / Revenue

or:

DSO
DIO
DPO

For a simplified model:

NWC / Revenue

2025A:
4.2%

2026E:
4.0%

2027E:
3.9%

Then calculate:

Change in NWC

This feeds UFCF.

⸻

31. FREE CASH FLOW SECTION

The central cash-flow section should show:

EBIT

− Taxes

= NOPAT

* D&A

− CapEx

− Change in NWC

= UFCF

Example:

$B	2026E	2027E	2028E	2029E	2030E
EBIT	147	159	171	182	192
Tax	28	31	34	36	38
NOPAT	119	128	137	146	154
D&A	12	13	14	15	16
CapEx	-15	-16	-17	-18	-19
Change in NWC	-4	-4	-5	-5	-5
UFCF	112	121	129	138	146

⸻

32. UFCF DEFINITION

Hedger should explicitly define:

UFCF

Unlevered Free Cash Flow

=

NOPAT

D&A

−

CapEx

−

Change in Net Working Capital

This definition should be accessible through a tooltip.

⸻

33. UFCF MARGIN

Show:

UFCF Margin

2026E
24.8%

2027E
25.1%

2028E
25.3%

This helps users understand cash-generation quality.

⸻

34. UFCF GROWTH

Display:

UFCF Growth

2026E
+12.4%

2027E
+8.0%

2028E
+6.6%

This can reveal whether the model assumes unrealistic acceleration.

⸻

35. DISCOUNT RATE SECTION

The WACC section should be a dedicated module.

WACC

8.4%

Components:

Risk-Free Rate
4.2%

Beta
1.15

Equity Risk Premium
5.0%

Cost of Equity
9.95%

Pre-Tax Cost of Debt
5.1%

Tax Rate
20%

After-Tax Cost of Debt
4.08%

Equity Weight
95%

Debt Weight
5%

⸻

36. WACC CALCULATION

Formula:

WACC

=

E/(D+E) × Cost of Equity

D/(D+E) × Cost of Debt × (1 − Tax Rate)

The interface should allow users to expand:

Show WACC Calculation

Advanced users can inspect every component.

⸻

37. CAPM

Cost of Equity:

Risk-Free Rate

Beta × Equity Risk Premium

Example:

4.2%

1.15 × 5.0%

=

9.95%

Hedger should show the formula.

⸻

38. WACC ASSUMPTION SOURCE

The WACC panel should identify:

Calculated

or:

User Override

Example:

WACC
8.4%

Calculated

[Override]

If the user overrides:

WACC
9.0%

User Override

Reset

This makes model changes obvious.

⸻

39. DISCOUNT PERIOD

For each forecast year:

2026E
1

2027E
2

2028E
3

2029E
4

2030E
5

Then:

Discount Factor

1/(1+WACC)^t

The user can optionally enable:

Mid-Year Convention

or:

Year-End Convention.

⸻

40. DISCOUNT FACTOR TABLE

Advanced display:

Year	UFCF	Discount Factor	PV
2026E	$112B	0.922	$103B
2027E	$121B	0.851	$103B
2028E	$129B	0.785	$101B
2029E	$138B	0.724	$100B
2030E	$146B	0.667	$97B

This makes the discounting mechanism transparent.

⸻

41. PRESENT VALUE OF FORECAST CASH FLOWS

The model should sum:

PV of 2026 UFCF

PV of 2027 UFCF

PV of 2028 UFCF

PV of 2029 UFCF

PV of 2030 UFCF

=

PV of Forecast FCF

Example:

$504B

⸻

42. TERMINAL VALUE SECTION

Terminal value should be visually separated.

TERMINAL VALUE

Method:

Perpetuity Growth

Terminal Growth:

2.5%

Final Year UFCF:

$146B

Next Year UFCF:

$149.7B

WACC:

8.4%

Terminal Value:

$2.54T

⸻

43. PERPETUITY GROWTH FORMULA

Terminal Value:

TV

=

FCF_(n+1)

/

(WACC − Terminal Growth)

The formula should be accessible.

The user should not need to leave the page to understand it.

⸻

44. TERMINAL VALUE WARNING

If:

Terminal Growth ≥ WACC

display:

INVALID TERMINAL ASSUMPTION

Terminal growth must be below WACC for the selected perpetuity-growth method.

The model should stop calculating the affected output until corrected.

⸻

45. TERMINAL VALUE CONTRIBUTION

Show:

Terminal Value

$2.54T

PV of Terminal Value

$1.69T

Contribution to Enterprise Value

77%

This is critical.

If terminal value contributes 77% of EV, the user should immediately know the valuation is highly dependent on terminal assumptions.

⸻

46. EXIT MULTIPLE METHOD

Hedger should optionally support:

Terminal Method

[Perpetuity Growth]

[Exit Multiple]

For Exit Multiple:

2030 EBITDA
$208B

Exit Multiple
18.0x

Terminal Value
$3.74T

The resulting valuation should be compared with the perpetuity-growth method.

⸻

47. TERMINAL METHOD COMPARISON

Example:

Perpetuity Growth

$145.50

Exit Multiple

$151.20

Difference

+3.9%

This provides a useful reasonableness check.

⸻

48. ENTERPRISE VALUE

The EV calculation should be shown as:

PV of Forecast FCF
$504B

PV of Terminal Value
$1.69T

=

Enterprise Value
$2.19T

This should be one of the clearest calculations on the page.

⸻

49. VALUATION BRIDGE

The bridge should continue:

Enterprise Value
$2.19T

− Debt
$100B

* Cash
    $60B

− Minority Interest
$5B

− Preferred Equity
$0B

=

Equity Value
$2.145T

⸻

50. SHARE COUNT

The model should then show:

Basic Shares
9.8B

Dilutive Options
0.2B

Restricted Shares
0.1B

Diluted Shares
10.1B

The share count should be transparent.

⸻

51. IMPLIED SHARE PRICE

Equity Value:

$2.145T

Diluted Shares:

10.1B

Implied Share Price:

$212.38

This becomes the final DCF output.

⸻

52. IMPLIED UPSIDE

Current Price:

$190.00

DCF Value:

$212.38

Implied Upside:

11.8%

The UI should avoid saying:

“Guaranteed 11.8% return.”

Instead:

Implied Upside

11.8%

based on current model assumptions.

⸻

53. DCF SENSITIVITY

The primary sensitivity matrix should be:

WACC × Terminal Growth

Example:

WACC / g	1.5%	2.0%	2.5%	3.0%	3.5%
7.5%	171	185	201	220	245
8.0%	159	171	185	201	222
8.5%	149	159	171	185	201
9.0%	139	149	159	171	185
9.5%	131	139	149	159	171

The current model assumptions should be highlighted.

⸻

54. SENSITIVITY CELL INTERACTION

Clicking a cell:

WACC
8.5%

Terminal Growth
2.5%

should show:

Implied Share Price

$171

Valuation Change

−$41

The user should be able to return to the base case immediately.

⸻

55. REVENUE/MARGIN SENSITIVITY

A second sensitivity matrix can be:

Revenue CAGR × EBIT Margin

This is particularly useful because operating assumptions can have significant valuation impact.

Example:

Revenue CAGR / Margin	20%	22%	24%	26%
4%	$105	$117	$130	$143
6%	$121	$135	$149	$164
8%	$139	$154	$171	$189
10%	$158	$175	$193	$213

⸻

56. SCENARIO SYSTEM

The DCF should support:

Bear

Base

Bull

Each scenario should have independent assumptions.

⸻

57. BASE CASE

Example:

Revenue CAGR
6.0%

EBIT Margin
23%

WACC
8.5%

Terminal Growth
2.5%

DCF Value
$145

⸻

58. BULL CASE

Example:

Revenue CAGR
8.5%

EBIT Margin
26%

WACC
7.8%

Terminal Growth
3.0%

DCF Value
$198

⸻

59. BEAR CASE

Example:

Revenue CAGR
3.0%

EBIT Margin
19%

WACC
9.5%

Terminal Growth
1.5%

DCF Value
$92

⸻

60. SCENARIO TABLE

Display:

Metric	Bear	Base	Bull
Revenue CAGR	3.0%	6.0%	8.5%
EBIT Margin	19%	23%	26%
WACC	9.5%	8.5%	7.8%
Terminal Growth	1.5%	2.5%	3.0%
DCF Value	$92	$145	$198
Upside	-30%	+10%	+50%

⸻

61. SCENARIO PROBABILITIES

Optional:

Bear
25%

Base
50%

Bull
25%

Probability Weighted Value:

$145

The user should be able to modify probabilities.

⸻

62. STRESS TESTING

Advanced users should be able to apply shocks.

Example:

Revenue Growth
−200 bps

EBIT Margin
−150 bps

WACC
+100 bps

Then:

DCF Value

$145 → $109

The model should display the impact.

⸻

63. DRIVER ANALYSIS

Hedger should identify important DCF drivers.

Example:

Valuation Sensitivity

WACC
Very High

Revenue Growth
High

EBIT Margin
High

Terminal Growth
High

CapEx
Medium

Working Capital
Low

These should be derived from the model’s sensitivity behavior.

⸻

64. VALUATION CHANGE ANALYSIS

When a user changes assumptions:

Before:

DCF Value
$145

After:

DCF Value
$158

Show:

Change
+$13

Drivers:

Revenue Growth
+$8

Margin
+$5

WACC
+$2

Terminal Growth
−$2

This is an extremely useful feature.

⸻

65. MODEL DIAGNOSTICS

The diagnostics section should identify:

Missing data

Invalid assumptions

Extreme assumptions

High terminal-value dependency

High sensitivity

Potential inconsistencies

Example:

MODEL DIAGNOSTICS

✓ Financial data complete

✓ Forecast complete

⚠ Terminal value represents 77% of EV

⚠ Revenue growth exceeds historical CAGR

✓ WACC valid

✓ Diluted shares available

This is much more valuable than a generic “model score.”

⸻

66. ASSUMPTION FLAGS

If historical CAGR is:

5.2%

and user forecasts:

12.5%

Hedger can display:

ASSUMPTION CHECK

2026–2030 revenue CAGR of 12.5% is materially above the historical 5-year CAGR of 5.2%.

[Review]

This is not a rejection.

It is a prompt to investigate.

⸻

67. MARGIN CHECK

If historical EBIT margin:

20%

Forecast:

30%

Display:

ASSUMPTION CHECK

Forecast EBIT margin expands by 10 percentage points relative to the historical level.

Potential drivers:
Operating leverage
Pricing
Cost reduction

[Add Note]

⸻

68. TERMINAL CHECK

If terminal growth:

3.5%

Historical long-term growth:

2.5%

Display:

ASSUMPTION CHECK

Terminal growth exceeds the historical long-term growth assumption.

[Review]

⸻

69. MODEL NOTES

Every assumption can optionally have a note.

Example:

Revenue Growth
7.5%

Note:

“Management expects Services growth to remain above company average.”

The note should be saved with the model.

⸻

70. ASSUMPTION HISTORY

Users should be able to see:

Revenue Growth

Aug 20
8.0%

Aug 24
7.8%

Aug 28
7.5%

DCF Value:

$152
→
$149
→
$145

This makes the model a living research document.

⸻

71. MODEL VERSIONING

Each saved version should preserve:

Assumptions

Outputs

Scenario

Methodology

Timestamp

Notes

Data version where applicable

Example:

AAPL DCF
v1.3

Aug 28, 2026

Fair Value:
$145.50

WACC:
8.5%

Terminal Growth:
2.5%

⸻

72. VERSION COMPARISON

Users should be able to compare:

v1.2

vs.

v1.3

Example:

Revenue CAGR
6.4% → 6.0%

WACC
8.2% → 8.5%

Terminal Growth
2.6% → 2.5%

Fair Value
$154 → $145

This is extremely useful for ongoing research.

⸻

73. MODEL CLONING

The user should be able to:

Duplicate Base Case

Then create:

Bear Case

without manually rebuilding the model.

The cloned model should inherit the original assumptions.

⸻

74. RESET

Each section should support:

Reset

For example:

Reset WACC

This returns the assumption to its calculated/default value.

⸻

75. UNDO

When a user changes:

WACC

8.5% → 9.0%

show:

WACC changed to 9.0%

[Undo]

Undo should ideally work across model changes.

⸻

76. ASSUMPTION PANEL DESIGN

The right-hand panel should contain:

REVENUE

Growth assumptions

MARGINS

Gross margin
EBIT margin

TAX

Tax rate

CASH FLOW

D&A
CapEx
Working capital

DISCOUNT RATE

Risk-free rate
Beta
ERP
Debt
WACC

TERMINAL

Terminal growth
Exit multiple

CAPITAL STRUCTURE

Debt
Cash
Shares

The panel should be collapsible.

⸻

77. ASSUMPTION PANEL STICKINESS

On desktop, the assumption panel can remain sticky.

As the user scrolls through the model:

Forecast

Cash Flow

WACC

Terminal Value

the assumption panel remains available.

However, avoid making it so tall that it obstructs content.

⸻

78. QUICK EDITING

Clicking a model number should allow direct editing.

Example:

7.5%

Click

→

7.8%

Enter

→

model recalculates.

Do not force users to open separate dialogs for every number.

⸻

79. INPUT FORMATTING

Typing:

0.075

should display:

7.5%

Typing:

7.5%

should also display:

7.5%

Typing:

150000000000

should display:

$150B

The interface should handle formatting intelligently.

⸻

80. INPUT VALIDATION

Examples:

Tax Rate:

0–100%

WACC:

0%

Terminal Growth:

< WACC

Revenue Growth:

reasonable numerical range

Shares:

0

Debt:

≥ 0 unless special treatment is supported

Invalid inputs should be rejected immediately.

⸻

81. KEYBOARD WORKFLOW

Advanced users should be able to:

Tab through assumptions

Enter to confirm

Esc to cancel

Arrow keys to move through tables

Cmd/Ctrl + S to save

Cmd/Ctrl + K to search

This makes the product much faster.

⸻

82. FORMULA INSPECTION

Advanced users can click:

UFCF

and see:

NOPAT
$119B

D&A
$12B

−
CapEx
$15B

−
Change in NWC
$4B

=

UFCF
$112B

This is far better than hiding the calculation.

⸻

83. FORMULA BAR

An advanced mode can provide a formula bar similar to spreadsheet software.

Example:

UFCF 2026E

Formula:

=NOPAT + D&A - CapEx - ChangeNWC

This would significantly increase professional usability.

⸻

84. CELL REFERENCES

Advanced users could eventually see:

Revenue[2026E]

EBITMargin[2026E]

WACC

This provides model transparency without requiring users to understand the backend.

⸻

85. NO HARDCODED OUTPUTS

The frontend should never contain hardcoded:

Fair value

Upside

DCF value

Terminal value

WACC

These must always come from the calculation engine.

⸻

86. CALCULATION ENGINE

The DCF engine should contain independent functions such as:

calculateRevenue()

calculateEBIT()

calculateTaxes()

calculateNOPAT()

calculateDA()

calculateCapex()

calculateNWC()

calculateUFCF()

calculateWACC()

calculateDiscountFactor()

calculatePV()

calculateTerminalValue()

calculateEnterpriseValue()

calculateEquityValue()

calculateImpliedSharePrice()

calculateSensitivity()

calculateScenario()

The UI should consume the outputs.

⸻

87. FRONTEND ARCHITECTURE

Suggested structure:

DCFPage

DCFHeader

DCFToolbar

DCFSummary

ForecastSection

RevenueForecast

MarginForecast

CashFlowSection

UFCFTable

WACCSection

TerminalValueSection

DiscountingSection

ValuationBridge

SensitivitySection

ScenarioSection

DiagnosticsSection

ThesisSection

Each should remain modular.

⸻

88. BACKEND ARCHITECTURE

Suggested conceptual architecture:

Company Data

↓

Financial Normalization

↓

Forecast Engine

↓

DCF Engine

↓

Scenario Engine

↓

Sensitivity Engine

↓

Model Persistence

↓

API

↓

Frontend

Do not place financial calculations directly inside React components or equivalent UI files.

⸻

89. API

Potential routes:

GET /companies/:id/financials

GET /companies/:id/market-data

GET /companies/:id/capital-structure

POST /dcf/models

GET /dcf/models/:id

PATCH /dcf/models/:id

POST /dcf/models/:id/calculate

POST /dcf/models/:id/sensitivity

POST /dcf/models/:id/scenarios

POST /dcf/models/:id/duplicate

GET /dcf/models/:id/versions

POST /dcf/models/:id/export

The exact implementation should follow Hedger’s existing API conventions.

⸻

90. DCF MODEL OBJECT

Conceptually:

model_id

company_id

security_id

currency

forecast_years

historical_periods

revenue_assumptions

margin_assumptions

tax_assumptions

da_assumptions

capex_assumptions

nwc_assumptions

wacc_assumptions

terminal_assumptions

capital_structure

scenario

valuation_outputs

sensitivity_settings

notes

version

created_at

updated_at

⸻

91. ASSUMPTION OBJECT

Each assumption should contain:

name

value

unit

period

source

source_type

default_value

user_override

validation_status

updated_at

Example:

revenue_growth

value: 0.075

unit: percentage

period: 2026

source_type: user_override

status: valid

⸻

92. DATA PROVENANCE

Users should be able to ask:

Where did this number come from?

Example:

2025 Revenue

$420B

Source:

Company filing

Reported:

January 2026

This is particularly important for historical data.

⸻

93. DATA TYPES

Hedger should distinguish:

Reported

Estimated

Calculated

User Input

AI Generated

Derived

Missing

Stale

These labels should be available where ambiguity exists.

⸻

94. STALE DATA

If financial data has not been refreshed:

Data Last Updated

August 12, 2026

The user should know.

Do not claim real-time information unless it is actually real-time.

⸻

95. CURRENCY

The DCF should clearly display:

Currency:
USD

All financial values should use the same currency unless explicit conversion is supported.

If conversion is used:

Source Currency
EUR

Model Currency
USD

FX Rate
1.09

The conversion should be visible.

⸻

96. UNIT SYSTEM

Users should be able to choose:

Millions

Billions

Trillions

The default should be appropriate for the company.

The model must remain internally consistent.

⸻

97. ROUNDING

Calculations should use full internal precision.

Display should use rounded values.

Example:

Internal:

145.503821

Display:

$145.50

This prevents rounding errors.

⸻

98. ERROR STATES

Example:

DCF unavailable

Reason:

Diluted share count is missing.

Required:

Diluted shares > 0

[Resolve Data]

The system should never crash.

⸻

99. PARTIAL DATA

If one optional metric is missing:

D&A
Unavailable

The system should either:

use a supported alternative

or:

explain why the model cannot continue.

Never invent a value.

⸻

100. PERFORMANCE

Changing one assumption should recalculate the model quickly.

For example:

WACC

8.5% → 9.0%

The following should update:

Discount Factors

PV of FCF

PV of Terminal Value

Enterprise Value

Equity Value

Implied Share Price

Sensitivity

Scenario comparison

The system should not reload the entire application.

⸻

101. AUTOSAVE

Autosave should preserve user work.

Show:

Saved

Saving…

Unsaved Changes

If autosave fails:

Unable to save changes.

[Retry]

Do not silently lose model edits.

⸻

102. EXPORT

The DCF model should eventually support:

PDF

Excel

CSV

JSON

PDF should provide a clean research-ready representation.

Excel should preserve model structure.

CSV should export tables.

JSON should preserve the model state.

⸻

103. RESEARCH REPORT

A DCF model can generate a research report containing:

Company Overview

Investment Thesis

Historical Financials

Forecast Assumptions

DCF

WACC

Terminal Value

Sensitivity

Scenario Analysis

Risks

Conclusion

This can become a major premium feature.

⸻

104. DCF CHARTS

Recommended charts:

Revenue

EBIT Margin

UFCF

UFCF Margin

DCF Valuation Range

Sensitivity

Scenario Valuation

Terminal Value Contribution

Do not add charts simply because the page has empty space.

⸻

105. REVENUE CHART

Historical:

2021A
2022A
2023A
2024A
2025A

Forecast:

2026E
2027E
2028E
2029E
2030E

A vertical divider should distinguish actual from estimates.

⸻

106. UFCF CHART

Display:

Historical FCF

and:

Projected UFCF

The chart should visually communicate whether cash generation is accelerating or slowing.

⸻

107. VALUATION RANGE CHART

Show:

Bear
Base
Bull

alongside:

Current Price

This should be a simple horizontal range.

⸻

108. TERMINAL VALUE CHART

A small contribution chart can show:

PV of Forecast FCF
23%

PV of Terminal Value
77%

This makes terminal dependence immediately obvious.

⸻

109. SCENARIO CHART

Show:

Bear
$92

Base
$145

Bull
$198

Current
$132

This should be simple and highly readable.

⸻

110. VISUAL LANGUAGE

The DCF page should follow Hedger’s core visual identity.

Primary:

White

Black

Soft Gray

Secondary semantic:

Muted Green

Muted Red

Muted Amber

Avoid:

Neon

Purple gradients

Glassmorphism

Large glowing borders

Excessive shadows

AI-style effects

⸻

111. CARD DESIGN

Not every section should be a card.

Use:

Large section containers

Tables

Dividers

Panels

Subsections

Only major outputs should use cards.

The financial table should feel like a financial model rather than a collection of SaaS cards.

⸻

112. BORDER SYSTEM

Use subtle borders.

For example:

#E5E5E5

Avoid thick black boxes around every cell.

Important rows can use stronger separators.

⸻

113. TABLE ALIGNMENT

Labels:

Left aligned

Numbers:

Right aligned

Headers:

Right aligned for numeric columns

Financial values should align vertically.

⸻

114. ROW HIERARCHY

Primary rows:

Revenue

EBIT

UFCF

Enterprise Value

Equity Value

Implied Share Price

Secondary rows:

Growth

Margins

Tax

D&A

CapEx

Change in NWC

Use indentation to establish hierarchy.

⸻

115. SECTION EXPANSION

Users should be able to collapse advanced sections.

Example:

WACC

▼ Basic

Cost of Equity
Cost of Debt
WACC

▼ Advanced

Risk-Free Rate
Beta
ERP
Capital Structure
Tax Shield

This keeps the default interface clean.

⸻

116. BASIC VS ADVANCED MODE

Basic mode:

Revenue

Growth

EBIT Margin

Tax

CapEx

WACC

Terminal Growth

Advanced mode:

CAPM

Capital structure

D&A methodology

NWC methodology

Discount convention

Terminal multiple

Detailed formulas

This allows Hedger to serve different users.

⸻

117. PROFESSIONAL DENSITY

Professional users should be able to switch to:

Compact Mode

This reduces:

Vertical spacing

Table row height

Section padding

Chart size

The information itself should remain unchanged.

⸻

118. BEGINNER EXPLANATIONS

Hover:

UFCF

shows:

Unlevered Free Cash Flow measures cash generated by the business before financing decisions such as debt and equity funding.

Hover:

WACC

shows:

Weighted Average Cost of Capital is the discount rate used to convert future cash flows into today’s value.

This should be concise.

⸻

119. FORMULA EXPLANATIONS

Terminal Value:

FCF × (1 + g) / (WACC − g)

Explain:

The terminal value estimates the value of cash flows beyond the explicit forecast period.

This should be available without interrupting the workflow.

⸻

120. DCF PAGE FINAL STATE

The ideal final DCF page should allow a user to look at one screen and understand:

Company:

AAPL

Current Price:

$232.15

DCF Value:

$248.60

Upside:

+7.1%

Forecast:

2026–2030

WACC:

8.4%

Terminal Growth:

2.5%

Terminal Value Contribution:

77%

Bear:

$172

Base:

$249

Bull:

$311

Then the user can inspect:

Revenue

Margins

UFCF

Discounting

Terminal Value

Enterprise Value

Equity Value

Sensitivity

Scenarios

Risks

Thesis

⸻

121. FINAL UX PRINCIPLE

The DCF page should always answer:

What am I assuming?

What am I forecasting?

How does that become cash flow?

How is that cash flow discounted?

How much comes from terminal value?

How does enterprise value become equity value?

What is the implied share price?

What happens if I am wrong?

That sequence is the heart of the entire page.

⸻

122. THE HEDGER DCF STANDARD

The finished DCF page should feel like:

A professional financial model.

Not a calculator.

Not a dashboard.

Not an AI interface.

Not a marketing page.

Not a spreadsheet copied into a browser.

It should combine the analytical rigor of institutional modeling with the usability of a modern web application.

The model should be:

Transparent.

Editable.

Traceable.

Fast.

Auditable.

Scenario-driven.

Sensitivity-aware.

Visually disciplined.

Technically robust.

⸻

123. NON-NEGOTIABLE IMPLEMENTATION RULES

1. Do not hard-code valuation outputs.
2. Do not hard-code DCF assumptions into visual components.
3. Do not place calculation formulas directly inside presentation components.
4. Keep the DCF calculation engine independent.
5. Validate every financial input.
6. Never allow invalid terminal-growth calculations.
7. Never silently fabricate missing financial data.
8. Clearly distinguish historical and forecast periods.
9. Clearly distinguish inputs from outputs.
10. Clearly distinguish reported values from calculated values.
11. Preserve full calculation precision internally.
12. Round only at presentation level.
13. Keep WACC calculation transparent.
14. Keep terminal value calculation transparent.
15. Keep enterprise-to-equity bridge transparent.
16. Keep diluted share count transparent.
17. Make sensitivity calculations dynamically connected to the model.
18. Make scenarios dynamically connected to the model.
19. Preserve model versions.
20. Preserve user notes.
21. Preserve user assumptions.
22. Support undo where practical.
23. Support reset-to-default.
24. Prevent accidental data loss.
25. Provide clear error states.
26. Provide clear empty states.
27. Provide clear loading states.
28. Keep the interface responsive.
29. Keep financial tables readable.
30. Keep the existing Hedger UI language intact.
31. Avoid unnecessary gradients.
32. Avoid excessive cards.
33. Avoid excessive rounded elements.
34. Avoid excessive animations.
35. Avoid AI-looking UI.
36. Avoid fake valuation confidence.
37. Avoid simplistic BUY/SELL scores.
38. Avoid false precision.
39. Avoid unsupported financial claims.
40. Make every major valuation output explainable.

⸻

124. THE IDEAL HEDGER DCF WORKFLOW

User searches:

Apple

↓

Opens:

Apple Company Page

↓

Clicks:

Valuation

↓

Selects:

DCF

↓

Hedger loads:

Historical Financials

↓

User reviews:

Revenue

Margins

EBIT

FCF

↓

User modifies:

Revenue Growth

Margin

CapEx

WACC

Terminal Growth

↓

Hedger recalculates:

Revenue

EBIT

NOPAT

UFCF

PV

Terminal Value

EV

Equity Value

Share Price

↓

User reviews:

Sensitivity

↓

User switches:

Bear / Base / Bull

↓

User reviews:

Valuation Range

↓

User compares:

DCF vs Comps

↓

User writes:

Investment Thesis

↓

User saves:

AAPL — DCF — Base Case

↓

Hedger stores:

Assumptions

Outputs

Notes

Version

Timestamp

This is the complete DCF experience.

⸻

125. END-STATE PRODUCT VISION

Hedger’s DCF model should ultimately become the place where a user can construct an entire valuation thesis without needing to constantly move between:

Excel

Financial websites

Market-data terminals

Research documents

Calculators

Notes

Charts

The platform should connect all of these analytical activities into one continuous system.

The final mental model should be:

Company → Financial History → Forecast → Free Cash Flow → Discount Rate → Terminal Value → Enterprise Value → Equity Value → Fair Value → Sensitivity → Scenario → Thesis.

If this chain is implemented correctly, the DCF page becomes one of the strongest components of Hedger.

The user should finish the model not merely knowing:

“Hedger says this stock is worth $145.”

They should know:

“I believe this company is worth approximately $145 because I expect these revenues, these margins, this cash generation, this discount rate, and this terminal growth rate — and here is exactly how the valuation changes if those assumptions are wrong.”

That is the standard the Hedger DCF page should be designed around.