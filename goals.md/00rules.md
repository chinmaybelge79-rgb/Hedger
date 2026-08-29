Hedger — Engineering & Product Rules

the inspiration website is :- https://www.koyfin.com

1. Purpose

Hedger is a professional financial analysis and valuation platform designed to make institutional-quality company research, financial modeling, valuation, and investment analysis accessible through a clean, precise, and trustworthy interface.

Hedger must feel like a serious financial terminal and research product—not a generic SaaS dashboard, AI-generated website, template, or “vibe-coded” application.

Every implementation decision must prioritize:

1. Financial correctness
2. Data integrity
3. Explainability
4. UX consistency
5. Performance
6. Maintainability
7. Reliability
8. Security
9. Professional visual design
10. Extensibility

The application should communicate confidence, precision, restraint, and professionalism.

⸻

2. Core Product Principles

2.1 Financial accuracy comes first

Never sacrifice financial correctness for visual simplicity.

All financial calculations must:

* Use clearly defined formulas.
* Use consistent units.
* Handle missing values explicitly.
* Handle negative values correctly.
* Avoid silent assumptions.
* Avoid accidental double counting.
* Preserve source precision internally.
* Round only for presentation.
* Clearly distinguish historical, estimated, projected, and calculated values.
* Clearly distinguish enterprise value from equity value.
* Clearly distinguish market capitalization from enterprise value.
* Clearly distinguish reported financials from derived metrics.

Any valuation output must be traceable back to its inputs.

⸻

2.2 Explainability is mandatory

Hedger should never behave like a black box.

When a user sees:

* Enterprise Value
* Equity Value
* DCF Value
* WACC
* Terminal Value
* Revenue Growth
* EBITDA Margin
* Free Cash Flow
* Net Debt
* Multiples
* Implied Share Price
* Upside / Downside
* Target Price
* Sensitivity results

the application should make it possible to understand where the number came from.

Prefer:

Input → Formula → Intermediate calculation → Output

over:

Input → mysterious output

⸻

2.3 Never invent financial data

Do not fabricate:

* Revenue
* EBITDA
* EBIT
* Net income
* EPS
* Free cash flow
* Shares outstanding
* Debt
* Cash
* Enterprise value
* Market capitalization
* Stock price
* Growth rates
* Analyst estimates
* Valuation multiples
* WACC
* Risk-free rate
* Beta
* Equity risk premium

If data is unavailable:

* show unavailable state,
* show an appropriate placeholder,
* or require the user to provide the input.

Never silently substitute fabricated numbers.

⸻

3. Product Architecture

Hedger should be organized around distinct functional layers.

3.1 Presentation layer

Responsible for:

* Pages
* Components
* Layout
* Tables
* Charts
* Forms
* Navigation
* Interaction states
* Loading states
* Error states

Presentation components must not contain large amounts of financial calculation logic.

⸻

3.2 Application layer

Responsible for:

* User workflows
* Model orchestration
* State management
* Validation
* API orchestration
* Calculation execution
* User actions

⸻

3.3 Financial modeling layer

Responsible for:

* Valuation formulas
* Financial statements
* Ratio calculations
* DCF calculations
* Comparable-company calculations
* Transaction multiples
* Sensitivity analysis
* Scenario analysis

Financial formulas should be isolated from UI components whenever practical.

⸻

3.4 Data layer

Responsible for:

* Company data
* Historical financial statements
* Market data
* Estimates
* Fundamentals
* Metadata
* Data normalization
* Caching
* API responses

External data must be normalized before entering financial models.

⸻

3.5 API layer

APIs must have:

* Explicit schemas
* Validation
* Error handling
* Authentication where necessary
* Rate limiting where necessary
* Consistent response formats
* Clear failure states

Do not allow arbitrary unvalidated data to flow directly into valuation calculations.

⸻

4. Repository Rules

Before modifying the repository:

1. Inspect the existing architecture.
2. Identify the framework.
3. Identify the routing system.
4. Identify the state-management approach.
5. Identify the component system.
6. Identify existing API patterns.
7. Identify existing financial calculation utilities.
8. Identify existing styling conventions.
9. Identify existing testing conventions.
10. Reuse existing abstractions where appropriate.

Do not create a parallel architecture simply because it is easier.

Do not replace working infrastructure without a strong reason.

Do not introduce unnecessary dependencies.

⸻

5. Existing UI Must Be Respected

The existing Hedger visual language is authoritative.

When implementing new functionality:

* Match existing typography.
* Match existing spacing.
* Match existing borders.
* Match existing card treatment.
* Match existing table treatment.
* Match existing navigation.
* Match existing interaction patterns.
* Match existing responsive behavior.
* Match existing iconography.

Do not redesign unrelated sections while implementing a feature.

Do not introduce a completely different design language into one page.

⸻

6. Visual Design Rules

Hedger should maintain a restrained financial-terminal aesthetic.

6.1 General aesthetic

Preferred characteristics:

* Minimal
* Clean
* Precise
* Editorial
* Professional
* Data-dense where appropriate
* High information hierarchy
* Strong typography
* Subtle borders
* Controlled whitespace
* Neutral visual language

Avoid:

* Excessive gradients
* Neon colors
* Giant glowing elements
* Excessive glassmorphism
* Floating blobs
* Decorative 3D objects
* Excessive rounded cards
* Artificial AI imagery
* Generic SaaS illustrations
* Unnecessary animations
* Gamification
* Oversized decorative headings

⸻

6.2 Color

Use the existing Hedger color system.

If a new color is required:

1. Prefer an existing semantic token.
2. Extend the design token system.
3. Do not hardcode arbitrary colors throughout components.

Colors should communicate meaning.

Examples:

* Positive → positive financial movement
* Negative → negative financial movement
* Neutral → informational state
* Warning → attention required
* Error → invalid or failed state

Do not use color as the only way to communicate meaning.

⸻

7. Typography

Typography should prioritize readability of financial information.

Important hierarchy:

1. Page title
2. Section title
3. Metric title
4. Primary metric
5. Supporting metric
6. Table header
7. Table value
8. Secondary metadata
9. Helper text

Financial values should be visually scannable.

Do not use excessively decorative fonts.

Do not use inconsistent font sizes for equivalent components.

⸻

8. Navigation

Navigation must remain predictable.

Users should always understand:

* Where they are.
* Which company they are analyzing.
* Which model they are using.
* Which section they are viewing.
* How to return to the previous context.

Company context should persist throughout relevant workflows.

Avoid unnecessary navigation depth.

⸻

9. Search

The company/search system should support:

* Company name
* Ticker
* Exchange
* Symbol
* Common company aliases where supported

Search results should prioritize:

1. Exact ticker
2. Exact company name
3. Prefix match
4. Strong semantic match
5. Secondary metadata

Results should show enough context to disambiguate companies.

Example:

Apple Inc. — AAPL — NASDAQ

is preferable to:

Apple

when multiple entities could be confused.

Search must handle:

* Empty queries
* Slow responses
* No results
* API errors
* Partial matches
* Duplicate entities
* Invalid symbols

⸻

10. Company Context

Once a company is selected, the selected company should remain consistent across the relevant application flow.

Never accidentally mix:

* Company A’s financial statements
* Company B’s market price
* Company C’s estimates

into the same model.

Company identity must be part of the model context.

⸻

11. Financial Data Rules

Every financial data point should ideally have metadata describing:

* Source
* Period
* Fiscal year
* Fiscal quarter
* Currency
* Units
* Reported vs calculated status
* Historical vs estimate status
* Last updated timestamp

Financial data should not be treated as generic numbers.

For example:

100

is insufficient.

The system should understand whether this means:

$100 million revenue in FY2025

or:

$100 billion enterprise value

⸻

12. Units

Internally preserve explicit units.

Possible units include:

* USD
* INR
* EUR
* GBP
* Millions
* Billions
* Thousands
* Per-share
* Percentage
* Basis points

Never silently mix units.

Example:

If revenue is stored in millions and debt is stored in billions, normalize before calculation.

⸻

13. Currency

Currency conversions must be explicit.

Do not silently convert currencies unless the workflow explicitly requires it.

Every converted value should preserve:

* Original currency
* Conversion currency
* FX rate
* FX date/source when applicable

⸻

14. Historical vs Estimates

Hedger must distinguish between:

* Actual historical data
* Consensus estimates
* Company guidance
* User assumptions
* Model-derived forecasts

Never visually imply that an estimate is reported historical data.

⸻

15. Valuation Model Rules

The valuation model must be modular.

A valuation model should conceptually follow:

Inputs → Assumptions → Calculations → Outputs → Sensitivity → Interpretation

Do not mix all logic into one UI component.

⸻

16. Valuation Model Inputs

Inputs may include:

* Current share price
* Shares outstanding
* Revenue
* EBITDA
* EBIT
* Net income
* Cash
* Debt
* Minority interest
* Preferred stock
* Growth assumptions
* Margin assumptions
* Tax rate
* Capital expenditure
* Working capital
* Valuation multiples
* Discount rates

Every editable assumption must have:

* Label
* Current value
* Unit
* Optional source
* Validation
* Reasonable bounds where appropriate

⸻

17. Enterprise Value

Enterprise value should follow a clearly defined formula.

A standard framework is:

EV = Equity Value + Debt + Preferred Stock + Minority Interest - Cash

The implementation must use the exact components supported by the underlying dataset.

Do not blindly apply a formula if the source data has already incorporated a component.

Avoid double counting.

⸻

18. Equity Value

Where applicable:

Equity Value = Enterprise Value - Net Debt - Other Senior Claims + Non-operating Assets

The exact implementation must depend on the selected valuation methodology.

⸻

19. Multiples-Based Valuation

Supported multiples may include:

* EV / Revenue
* EV / EBITDA
* EV / EBIT
* P / E
* P / Book
* PEG
* FCF Yield

The application must clearly define numerator and denominator.

Never compare incompatible metrics.

For example:

Do not calculate EV / Net Income without explicitly defining why such a metric is being used.

⸻

20. Comparable Companies

Comparable-company analysis must distinguish:

* Selected peers
* Peer universe
* Median
* Mean
* Quartiles
* Minimum
* Maximum

Users should understand which companies are included.

The model should allow peer-level inspection.

Do not hide the peer selection methodology.

⸻

21. DCF Model

The DCF engine should follow a clearly separated structure.

Typical sequence:

Revenue Forecast

↓

EBITDA

↓

EBIT

↓

Taxes

↓

NOPAT

↓

+ D&A

↓

- Capex

↓

- Change in NWC

↓

Unlevered FCF

↓

Discount FCF

↓

Terminal Value

↓

Enterprise Value

↓

Equity Value

↓

Implied Share Price

⸻

22. DCF Forecasting

Forecast periods must be explicit.

Example:

* Historical
* Year 1
* Year 2
* Year 3
* Year 4
* Year 5

Do not silently change the forecast horizon.

Every projected line should be traceable to assumptions.

⸻

23. DCF WACC

WACC should be transparent.

Typical structure:

WACC = (E / (D + E)) × Cost of Equity + (D / (D + E)) × After-tax Cost of Debt

Cost of equity may use:

Cost of Equity = Risk-free Rate + Beta × Equity Risk Premium

Inputs must be clearly displayed.

⸻

24. Terminal Value

Supported approaches may include:

Perpetuity Growth

TV = FCF_(n+1) / (WACC - g)

where:

FCF_(n+1) = FCF_n × (1 + g)

Exit Multiple

TV = Terminal Metric × Exit Multiple

The selected method must be visible to the user.

Never allow:

WACC <= Terminal Growth Rate

without explicit handling.

The UI must flag invalid assumptions rather than returning a misleading valuation.

⸻

25. DCF Sensitivity Analysis

DCF sensitivity tables should support combinations of:

* WACC
* Terminal growth rate
* Exit multiple where applicable

Sensitivity tables must use the same underlying model engine as the primary DCF.

Do not implement a separate simplified formula for the sensitivity table.

The displayed base-case cell must match the primary valuation output.

⸻

26. Scenario Analysis

Where supported, scenarios may include:

* Bear
* Base
* Bull

Each scenario must contain explicit assumptions.

Do not simply multiply the final valuation by arbitrary percentages to create scenarios.

Scenarios should change underlying assumptions.

⸻

27. Financial Statements

Statements should maintain accounting relationships.

Income Statement

Common lines:

* Revenue
* Cost of Revenue
* Gross Profit
* Operating Expenses
* EBITDA
* D&A
* EBIT
* Interest
* Taxes
* Net Income

Balance Sheet

Common lines:

* Cash
* Accounts Receivable
* Inventory
* PP&E
* Goodwill
* Other Assets
* Accounts Payable
* Debt
* Other Liabilities
* Equity

Cash Flow Statement

Common lines:

* Net Income
* D&A
* Working Capital Changes
* Operating Cash Flow
* Capex
* Investing Cash Flow
* Debt Changes
* Financing Cash Flow
* Ending Cash

⸻

28. Accounting Integrity

Where a three-statement model is implemented:

Assets = Liabilities + Equity

must remain valid.

Cash flow changes should reconcile with balance-sheet cash changes where the model structure requires it.

Do not patch accounting inconsistencies with arbitrary balancing numbers.

If a source dataset does not reconcile, flag the discrepancy.

⸻

29. Ratios

Ratios must use consistent periods and definitions.

Examples:

* Gross Margin
* EBITDA Margin
* EBIT Margin
* Net Margin
* ROE
* ROIC
* Current Ratio
* Debt / EBITDA
* Net Debt / EBITDA
* Interest Coverage
* FCF Margin

Definitions should be centralized rather than reimplemented throughout the application.

⸻

30. Charts

Charts must communicate information rather than decorate the interface.

Charts should:

* Have meaningful titles.
* Use consistent axes.
* Show units.
* Handle missing values.
* Avoid misleading scales.
* Provide tooltips where appropriate.
* Remain readable on smaller screens.

Do not create charts merely because there is empty space.

⸻

31. Tables

Financial tables are core Hedger components.

Tables should support:

* Proper alignment
* Numeric formatting
* Negative numbers
* Units
* Historical/projected distinction
* Sticky headers where useful
* Horizontal scrolling on smaller screens
* Clear row hierarchy
* Optional sorting
* Optional filtering

Numbers should generally be right-aligned.

Text should generally be left-aligned.

⸻

32. Number Formatting

Use consistent formatting.

Examples:

$1,234.5M

$12.4B

14.2%

1.8x

$142.50

Avoid unnecessary precision.

Do not round internally.

Presentation precision should be configurable where appropriate.

⸻

33. Negative Numbers

Negative financial values must be visually unambiguous.

Examples:

-$120M

or an equivalent established Hedger convention.

Do not hide negative values.

Do not convert negative numbers into absolute values unless the formula explicitly requires it.

⸻

34. Loading States

Every asynchronous workflow must have a proper loading state.

Avoid:

* Frozen interfaces
* Blank screens
* Layout jumps
* Fake data
* Infinite spinners

Prefer skeletons or contextual loading indicators where appropriate.

⸻

35. Error States

Errors must be understandable.

Bad:

Something went wrong.

Better:

Unable to retrieve FY2025 financial statements. Please retry.

Where appropriate, provide:

* Retry
* Back
* Refresh
* Alternative workflow

Never expose raw stack traces to users.

⸻

36. Empty States

Empty states should explain:

1. What is missing.
2. Why it matters.
3. What the user can do next.

Do not leave blank cards without context.

⸻

37. Forms and Inputs

Financial inputs must validate:

* Data type
* Range
* Required status
* Units
* Currency
* Dependencies

Examples:

WACC should not accept arbitrary text.

Terminal growth should not silently accept an invalid relationship with WACC.

Percent inputs must clearly indicate percentage semantics.

⸻

38. API Rules

All API requests must:

* Validate inputs.
* Handle failures.
* Handle timeouts.
* Handle empty responses.
* Avoid unnecessary duplicate calls.
* Respect caching where appropriate.
* Avoid exposing secrets to the client.

Never put secret API keys directly into frontend source code.

⸻

39. Secrets

Never commit:

* API keys
* Access tokens
* Private credentials
* Database passwords
* Authentication secrets
* Provider credentials

Use environment variables or the appropriate secure secret-management mechanism.

If a secret appears in source code, stop and remediate it.

⸻

40. Security

Never trust client-side input.

Validate important inputs server-side.

Protect:

* Authentication
* Authorization
* User data
* Financial data
* API credentials
* Internal endpoints

Do not expose internal implementation details through public APIs.

⸻

41. Performance

Hedger should feel fast.

Prioritize:

* Efficient API calls
* Caching
* Lazy loading
* Memoization where appropriate
* Pagination for large datasets
* Virtualized tables where necessary
* Avoiding unnecessary re-renders
* Optimized chart rendering

Do not optimize prematurely.

Measure first when possible.

⸻

42. Responsiveness

The application must work across:

* Desktop
* Laptop
* Tablet
* Smaller screens

Financial tables may require horizontal scrolling.

Do not destroy information hierarchy merely to force every table into a narrow mobile layout.

⸻

43. Accessibility

Interactive components must support:

* Keyboard navigation
* Visible focus
* Semantic labels
* Accessible controls
* Sufficient contrast
* Screen-reader-friendly structure
* Meaningful error messages

Do not rely exclusively on color.

⸻

44. Animation

Animation should be subtle and purposeful.

Acceptable:

* Small transitions
* Loading transitions
* Navigation transitions
* Expand/collapse
* Chart entrance where useful

Avoid:

* Excessive motion
* Bouncing elements
* Constant movement
* Decorative animations
* Slow transitions that interfere with workflow

⸻

45. Component Architecture

Components should have clear responsibilities.

Avoid massive components containing:

* API calls
* Financial formulas
* UI
* State management
* Formatting
* Validation
* Routing

all at once.

Extract reusable logic where it improves maintainability.

Do not over-engineer tiny components.

⸻

46. Reuse Before Creating

Before creating a new component:

1. Search for an existing equivalent.
2. Determine whether it can be reused.
3. Extend it if appropriate.
4. Create a new component only when the behavior is materially different.

Avoid duplicate:

* Buttons
* Cards
* Tables
* Modals
* Tabs
* Input fields
* Formatting utilities
* API wrappers

⸻

47. Naming

Use descriptive names.

Good:

DCFValuationSummary

EnterpriseValueBridge

FinancialStatementTable

SensitivityMatrix

Bad:

Box2

Thing

CardNew

ComponentFinal2

Names should communicate purpose.

⸻

48. Comments

Comments should explain why, not merely what.

Bad:

// Calculate enterprise value

Good:

// Cash is subtracted because EV represents the value of operating assets independent of capital structure.

Do not litter obvious code with unnecessary comments.

⸻

49. Testing

Important financial calculations must have automated tests.

At minimum, test:

* EV calculation
* Equity value
* Revenue growth
* Margins
* FCF
* WACC
* DCF discounting
* Terminal value
* Implied share price
* Sensitivity analysis
* Scenario calculations

Test edge cases.

⸻

50. Financial Model Test Cases

Tests should include:

Normal case

Valid historical and forecast data.

Negative FCF

The model must remain mathematically valid.

Negative net debt

Cash exceeds debt.

Zero debt

Debt weighting should behave correctly.

Missing data

The model should fail gracefully.

Invalid WACC

Reject or flag.

Terminal growth >= WACC

Reject or clearly flag.

Zero revenue

Avoid division-by-zero errors.

Negative earnings

P/E calculations must be handled appropriately.

Extreme assumptions

Prevent numerical explosions where appropriate.

⸻

51. Regression Protection

Before merging a feature:

* Existing pages must still load.
* Existing navigation must still work.
* Existing API calls must still work.
* Existing valuation calculations must still work.
* Existing responsive layouts must still work.

Do not consider a feature complete if it breaks unrelated functionality.

⸻

52. Database Rules

Database schemas should prioritize:

* Referential integrity
* Explicit relationships
* Stable identifiers
* Proper indexing
* Migration safety
* Auditability where appropriate

Do not store important financial values as unstructured strings when numeric types are appropriate.

⸻

53. Data Normalization

External financial APIs often provide inconsistent formats.

Normalize:

* Currency
* Units
* Dates
* Fiscal periods
* Company identifiers
* Statement line items
* Missing values
* Sign conventions

before feeding data into model calculations.

⸻

54. Source Attribution

Where data providers permit and where applicable, display data-source information.

Users should be able to distinguish:

* Market data
* Company filings
* Estimates
* User assumptions
* Hedger-derived calculations

Never imply that a Hedger-derived calculation is an externally reported figure.

⸻

55. Auditability

Important model outputs should be reproducible.

Given the same:

* Company
* Data snapshot
* Assumptions
* Model version

the same valuation should be generated.

Avoid hidden mutable state that changes valuation results unpredictably.

⸻

56. Model Versioning

Major financial-model changes should be versionable.

A valuation should ideally be associated with:

* Model type
* Model version
* Company
* Timestamp
* Assumptions
* Data snapshot

This makes saved analyses reproducible.

⸻

57. Saved Models

If users can save models, preserve:

* Company
* Valuation method
* Assumptions
* Forecast period
* Model outputs
* Sensitivity settings
* Timestamp
* Model version

Do not save only the final valuation number.

⸻

58. User Experience

The user should not need to understand the internal software architecture.

The experience should feel:

Select company → Analyze → Adjust assumptions → Understand valuation → Compare → Decide

not:

Configure system → configure data → configure model → configure API → finally see output

⸻

59. Progressive Disclosure

Do not overwhelm users with every advanced parameter immediately.

Show:

* Important outputs first.
* Core assumptions second.
* Detailed calculations when needed.
* Advanced controls progressively.

Expert users should still be able to inspect the underlying calculations.

⸻

60. Financial Terminology

Use standard financial terminology.

Prefer:

* Enterprise Value
* Equity Value
* Free Cash Flow
* WACC
* Terminal Value
* Net Debt
* EBITDA
* EBIT
* NOPAT

Do not rename standard financial concepts merely for branding.

⸻

61. AI Features

If AI functionality is introduced:

AI must assist analysis rather than fabricate financial facts.

AI may:

* Explain valuation changes.
* Summarize financial trends.
* Explain model assumptions.
* Compare scenarios.
* Identify unusual movements.
* Generate research questions.

AI must not:

* Invent financial figures.
* Invent sources.
* Present guesses as facts.
* Modify financial assumptions without user visibility.
* Hide calculation logic.

AI-generated claims should be clearly distinguishable where appropriate.

⸻

62. AI Coding Agent Rules

Any AI agent modifying Hedger must:

1. Inspect before changing.
2. Understand before refactoring.
3. Reuse existing patterns.
4. Make the smallest reasonable change.
5. Avoid unrelated modifications.
6. Preserve existing behavior.
7. Validate financial logic.
8. Test affected functionality.
9. Check for regressions.
10. Report exactly what changed.

Never blindly rewrite a page.

Never replace working code merely to make implementation easier.

⸻

63. No Vibe Coding

Hedger must not look AI-generated.

Avoid:

* Random gradients
* Generic dashboard cards
* Excessive rounded rectangles
* Arbitrary icons
* Fake statistics
* Placeholder charts presented as real
* Lorem ipsum
* “AI-powered” marketing clichés
* Excessive badges
* Decorative UI without purpose
* Random animations
* Inconsistent spacing
* Inconsistent typography
* Unexplained numbers

Every UI element should have a reason to exist.

⸻

64. No Fake Functionality

Never create buttons that appear functional but do nothing.

Never create:

* Fake export buttons
* Fake refresh buttons
* Fake filters
* Fake AI analysis
* Fake valuation results
* Fake market data
* Fake notifications

If functionality is not implemented:

* disable it,
* hide it,
* or explicitly mark it as unavailable.

⸻

65. No Placeholder Data in Production

Development fixtures may exist during development.

Production UI must never accidentally display:

* John Doe
* Example Corp
* $123.45 placeholder valuations
* Random fake percentages
* Dummy financial statements

unless explicitly identified as demo/sample data.

⸻

66. Error Prevention

Before completing work, inspect for:

* Undefined variables
* Missing imports
* Broken routes
* Invalid API calls
* Incorrect types
* Race conditions
* Division by zero
* Null handling failures
* Currency mismatches
* Unit mismatches
* Incorrect formulas
* Stale state
* Duplicate requests
* Console errors

⸻

67. Git Rules

Commits should be:

* Focused
* Descriptive
* Small enough to review
* Related to one logical change

Avoid massive commits containing unrelated redesigns.

Do not commit secrets.

Do not commit build artifacts unless the repository explicitly requires them.

⸻

68. Pull Request Rules

Every significant change should explain:

* What changed
* Why it changed
* Which files changed
* Financial logic affected
* API changes
* UI changes
* Tests performed
* Known limitations

⸻

69. Documentation

Major systems should have documentation.

Important documentation includes:

* Architecture
* API contracts
* Financial formulas
* Data sources
* Model assumptions
* Environment variables
* Deployment
* Testing
* Troubleshooting

Documentation should reflect the actual implementation.

⸻

70. Environment Configuration

Separate:

* Development
* Testing
* Production

configuration.

Do not hardcode environment-specific values.

Required environment variables should be documented.

⸻

71. Deployment

Production deployment must verify:

* Build succeeds.
* Environment variables exist.
* API endpoints work.
* Database migrations are applied.
* Authentication works.
* Financial calculations work.
* No secret is exposed.
* No development-only data is displayed.
* No console-critical errors exist.

⸻

72. Observability

Where appropriate, track:

* API failures
* Model calculation errors
* Slow requests
* Authentication failures
* Data-provider failures
* Client-side errors

Do not log sensitive information unnecessarily.

⸻

73. Data Provider Failures

External data providers can fail.

Hedger should gracefully handle:

* Timeout
* Rate limit
* Invalid symbol
* Missing filing
* Partial response
* Provider outage
* Stale data

Do not crash the entire application because one external provider failed.

⸻

74. Caching

Cache data where appropriate.

But do not allow stale data to masquerade as live data.

Where freshness matters, expose:

* Last updated timestamp
* Data status
* Refresh capability where appropriate

⸻

75. Market Data

Market-sensitive information should clearly indicate its timestamp.

Do not imply real-time pricing unless the underlying source actually provides real-time data.

Distinguish:

* Real-time
* Delayed
* End-of-day
* Historical

⸻

76. Date Handling

Financial periods must use explicit dates.

Avoid ambiguous strings such as:

Q1

without a fiscal-year context.

Prefer:

Q1 FY2026

or equivalent.

Handle companies with non-calendar fiscal years correctly.

⸻

77. Fiscal Years

Never assume every company has a December fiscal year-end.

The model must respect the company’s actual fiscal calendar.

⸻

78. Data Availability

If a company lacks a required metric:

Do not invent it.

Possible approaches:

* Derive it from valid source data.
* Mark it unavailable.
* Allow user input.
* Use an explicitly documented fallback methodology.

⸻

79. Calculation Engine

Financial calculations should ideally be pure functions.

A calculation should depend on:

* Inputs

and return:

* Outputs

without unexpected external side effects.

This improves:

* Testing
* Reproducibility
* Debugging
* Sensitivity analysis
* Scenario analysis

⸻

80. Precision

Maintain high precision internally.

Example:

Do not calculate:

10.4%

and then use the rounded value throughout the model if the underlying input is:

10.43782%

Instead:

* preserve precision internally,
* display 10.4%,
* calculate using the full precision.

⸻

81. Rounding

Round only at presentation boundaries.

Never use display-formatted strings in financial calculations.

Bad:

"$1.2B" → calculation

Good:

1200000000 → calculation → "$1.2B" presentation

⸻

82. Null Handling

Never assume missing values equal zero.

These are different:

* 0
* null
* unknown
* not applicable

Financial logic must preserve these distinctions.

⸻

83. Division by Zero

Every ratio calculation must define zero-denominator behavior.

Possible outputs:

* N/A
* NM
* unavailable state

Never return:

Infinity

or:

NaN

to users.

⸻

84. Negative Multiples

Certain multiples become meaningless with negative denominators.

For example:

P/E with negative earnings should generally be treated as:

NM

rather than presenting a misleading multiple.

⸻

85. User Overrides

If users override an assumption:

* clearly mark it as user-defined,
* preserve the value,
* recalculate dependent outputs,
* do not silently overwrite it with refreshed data.

⸻

86. Reset Behavior

If the user resets assumptions:

* restore the documented default/base assumptions,
* recalculate the model,
* update dependent outputs,
* preserve company context.

⸻

87. Undo / Revert

Where practical, user assumption changes should be easy to reverse.

Do not make experimentation difficult.

⸻

88. Model Dependencies

Changing an upstream assumption must update all downstream calculations.

Example:

Revenue growth

→ Revenue

→ EBITDA

→ EBIT

→ Taxes

→ NOPAT

→ FCF

→ DCF Value

→ Equity Value

→ Implied Share Price

Avoid stale outputs.

⸻

89. Sensitivity Dependencies

Sensitivity analysis must recompute from the underlying model.

Never use a visual approximation.

⸻

90. Scenario Dependencies

Bear/Base/Bull scenarios should share the same calculation engine.

Only assumptions should differ unless the model methodology explicitly changes.

⸻

91. UX Feedback

Every important user action should have clear feedback.

Examples:

* Save successful
* Calculation updated
* Data refreshed
* Export completed
* Invalid assumption
* API unavailable

Feedback should be subtle and professional.

⸻

92. Notifications

Do not spam users.

Notifications should be:

* Relevant
* Short
* Actionable
* Dismissible where appropriate

⸻

93. Export

If exporting financial models:

Exports should preserve:

* Company
* Date
* Model type
* Assumptions
* Units
* Currency
* Outputs
* Relevant sensitivity tables

Do not export unexplained numbers.

⸻

94. Accessibility of Financial Data

Do not encode critical information exclusively through:

* color,
* chart position,
* icons.

Tables and text should communicate the underlying values.

⸻

95. Mobile

On smaller screens:

Prioritize:

1. Company context
2. Key valuation output
3. Important assumptions
4. Core financial data
5. Detailed tables
6. Secondary metadata

Do not hide the primary valuation result behind unnecessary navigation.

⸻

96. Desktop

Desktop layouts may use higher information density.

Use available horizontal space for:

* Financial tables
* Charts
* Sensitivity matrices
* Peer comparisons
* Multi-column analysis

Do not unnecessarily enlarge everything.

⸻

97. Empty Dashboard

An empty state should guide users toward the primary workflow.

The user should understand:

Search company → Analyze company → Build valuation

within seconds.

⸻

98. Onboarding

Onboarding should be minimal.

Do not force users through unnecessary tutorials.

The product should be understandable through the interface itself.

⸻

99. Trust

Hedger must communicate trust through:

* Correct numbers
* Clear assumptions
* Transparent formulas
* Data provenance
* Consistent UI
* Professional typography
* Predictable behavior
* Honest limitations

Never manufacture trust through visual decoration.

⸻

100. Feature Completion Standard

A feature is not complete merely because the UI exists.

A feature is complete when:

* UI exists.
* Data flow works.
* API works where required.
* Validation works.
* Loading state works.
* Empty state works.
* Error state works.
* Calculations are correct.
* Responsive behavior works.
* Accessibility is reasonable.
* Existing functionality remains intact.
* Tests cover important logic.
* No critical console errors remain.
* Documentation is updated where necessary.

⸻

101. Change Management

Before making a large change:

1. Understand the current implementation.
2. Identify dependencies.
3. Identify potential regressions.
4. Define the smallest viable change.
5. Implement incrementally.
6. Test.
7. Review.
8. Only then expand the implementation.

⸻

102. Refactoring Rules

Refactoring is allowed when it improves:

* Correctness
* Maintainability
* Performance
* Testability
* Reusability

Do not refactor simply because the existing implementation looks different from an agent’s preferred style.

Do not combine a feature implementation with an unrelated architectural rewrite.

⸻

103. Dependency Rules

Before adding a dependency:

* Check whether existing functionality already solves the problem.
* Check bundle impact.
* Check maintenance status.
* Check security implications.
* Check compatibility with the project.

Avoid dependency proliferation.

⸻

104. Third-Party Services

Third-party services should be abstracted behind internal interfaces when practical.

This makes it possible to replace providers without rewriting the entire application.

⸻

105. Provider Independence

Do not hardwire financial logic to a particular provider’s response format.

Normalize provider data first.

The financial model should operate on Hedger’s normalized financial schema.

⸻

106. API Contracts

API responses should be predictable.

Prefer structured responses such as:

data
metadata
errors

rather than inconsistent endpoint-specific structures.

⸻

107. Validation Errors

Validation errors should identify:

* Field
* Problem
* Expected value/range
* Suggested correction

Example:

Terminal growth must be below WACC.

is better than:

Invalid input.

⸻

108. Logging

Logs should help diagnose problems without exposing secrets.

Never log:

* API keys
* Passwords
* Access tokens
* Sensitive user information

⸻

109. Production Safety

Never run destructive operations automatically.

Examples:

* Database deletion
* Data migration without backup strategy
* Removing major routes
* Replacing financial datasets
* Deleting user models

Require deliberate implementation and verification.

⸻

110. Backward Compatibility

Existing saved models should remain readable after model updates whenever practical.

If a breaking model change is required:

* version the model,
* migrate data,
* or provide a compatibility layer.

⸻

111. Financial Model Integrity

Any change to financial formulas is a high-risk change.

Before changing a formula:

1. Identify current behavior.
2. Document the intended formula.
3. Determine affected outputs.
4. Add/update tests.
5. Implement.
6. Compare before/after results.
7. Verify edge cases.

⸻

112. Formula Documentation

Every major valuation formula should be documented in developer documentation.

Documentation should include:

* Formula
* Variable definitions
* Units
* Assumptions
* Edge cases

⸻

113. Output Integrity

A valuation result should never be displayed without sufficient context.

For example:

$142.30

should ideally be understood as:

Implied Share Price

with relevant:

* model
* date
* assumptions
* currency

⸻

114. Comparative Context

Where appropriate, valuation outputs should allow comparison against:

* Current market price
* Historical valuation
* Peer valuation
* Base case
* Bear case
* Bull case

Do not imply investment recommendations unless the product explicitly supports and appropriately frames them.

⸻

115. Investment Language

Use neutral analytical language.

Prefer:

Implied upside of 18%

over:

This stock will rise 18%.

Prefer:

The model implies

over:

The stock is definitely worth

⸻

116. Model Assumption Transparency

If an assumption materially affects valuation, it should not be hidden.

Examples:

* Terminal growth
* WACC
* Exit multiple
* Revenue CAGR
* Margin expansion
* Tax rate

⸻

117. Base Case

Every model should clearly identify the base case where applicable.

Users should not have to infer which scenario is considered the default.

⸻

118. Bear / Bull Cases

Bear and bull cases should have rational assumptions.

Avoid arbitrary:

-30% valuation

or:

+30% valuation

adjustments.

⸻

119. Historical Data Integrity

Never overwrite historical reported data with model estimates.

Historical values should remain identifiable as historical.

⸻

120. Forecast Integrity

Forecast values must clearly differ from reported historical values.

Use consistent visual treatment throughout the product.

⸻

121. User-Entered Data

User-entered assumptions should be distinguishable from external data.

Do not silently overwrite user assumptions after data refresh.

⸻

122. Refresh

Refreshing market or financial data should not unexpectedly destroy saved assumptions.

Data refresh and assumption reset are separate actions.

⸻

123. Autosave

If autosave exists:

* avoid excessive writes,
* indicate save status,
* handle network failure,
* prevent accidental data loss.

⸻

124. Browser State

Do not depend entirely on browser state for critical persisted data.

Important user models should be persisted appropriately.

⸻

125. URL State

Where useful, URLs may encode:

* Company
* Page
* Model
* Selected scenario

This improves shareability and navigation.

Do not encode secrets in URLs.

⸻

126. Deep Links

Deep-linked pages must load correctly without requiring the user to navigate from the homepage first.

⸻

127. Browser Refresh

Refreshing a page should not unexpectedly reset the user’s current analysis.

⸻

128. Back Navigation

Browser back navigation should behave predictably.

Do not hijack browser navigation unnecessarily.

⸻

129. Search Performance

Search should debounce requests when appropriate.

Do not issue an API request for every keystroke if the underlying provider cannot handle it efficiently.

⸻

130. API Rate Limits

Respect provider limits.

Use:

* Debouncing
* Caching
* Request deduplication
* Backoff
* Appropriate retry strategies

Avoid retry storms.

⸻

131. Retry Logic

Retries should be used for transient errors only.

Do not endlessly retry invalid requests.

⸻

132. Financial Data Freshness

A cached value is acceptable only when its freshness is appropriate for the workflow.

Display timestamps where relevant.

⸻

133. Model Calculation Speed

Financial calculations should execute quickly enough for interactive assumption changes.

Avoid unnecessary server round trips for deterministic calculations that can safely execute locally.

⸻

134. Client vs Server Calculations

Use client-side calculations when:

* deterministic,
* lightweight,
* non-sensitive,
* based on already available data.

Use server-side calculations when:

* data access is required,
* computation is expensive,
* secrets are involved,
* centralized consistency is required.

⸻

135. Architecture Consistency

Do not arbitrarily mix:

* multiple state systems,
* multiple styling systems,
* multiple API paradigms,
* multiple component libraries

unless there is a clear architectural reason.

⸻

136. UI Consistency

Equivalent actions must look and behave similarly.

For example:

Every primary action should use the established primary button treatment.

Every financial table should follow the established table pattern.

⸻

137. Icons

Icons should have functional meaning.

Do not add icons purely to make the interface look more complex.

⸻

138. Tooltips

Use tooltips for:

* Technical terminology
* Abbreviations
* Non-obvious controls
* Data-source information

Do not hide essential information exclusively in tooltips.

⸻

139. Modals

Use modals sparingly.

Do not use a modal when a normal page or inline interaction is clearer.

⸻

140. Tabs

Tabs should represent genuinely related views.

Do not create tabs merely to split arbitrary content.

⸻

141. Cards

Cards should group meaningful information.

Do not put every individual metric into its own oversized card.

⸻

142. Whitespace

Whitespace should improve hierarchy.

Do not introduce huge empty gaps simply to make the interface appear “premium.”

⸻

143. Density

Hedger is a financial analysis tool.

Information density is acceptable when it improves analysis.

Do not oversimplify professional financial workflows for aesthetic reasons.

⸻

144. User Control

Users should control important model assumptions.

Do not automatically change material assumptions without explaining the change.

⸻

145. Defaults

Defaults should be:

* documented,
* reasonable,
* consistent,
* reproducible.

Never use arbitrary defaults simply because they make the valuation look attractive.

⸻

146. Recommendation Safety

Hedger is an analytical tool.

Do not present deterministic investment outcomes.

Outputs should communicate model-based estimates and uncertainty.

⸻

147. Uncertainty

Where appropriate, show:

* Scenario ranges
* Sensitivity
* Key assumptions
* Data limitations

A single valuation number should not imply false precision.

⸻

148. False Precision

Do not display:

$147.38291

if the model assumptions do not justify that level of precision.

Presentation should match analytical confidence.

⸻

149. Model Comparability

When comparing two valuation methods:

* use compatible company data,
* use consistent timestamps,
* disclose different methodologies,
* avoid misleading comparisons.

⸻

150. Valuation Reconciliation

Where multiple valuation methods are available, Hedger may provide a valuation overview showing:

* DCF
* Trading Comparables
* Transaction Comparables
* Other supported methods

The methodology for each output must remain visible.

⸻

151. Weighted Valuation

If a blended valuation is implemented:

Blended Value = Σ(Method Value × Method Weight)

Weights must:

* sum to 100%,
* be visible,
* be editable where appropriate,
* be validated.

⸻

152. Peer Data Integrity

Peer comparisons must ensure:

* same valuation date where appropriate,
* compatible metrics,
* consistent currency,
* consistent fiscal period treatment.

⸻

153. Market Capitalization

Market capitalization should be based on the appropriate share count and price definition used by the dataset.

Do not mix basic and diluted share counts without explicit methodology.

⸻

154. Per-Share Calculations

Per-share values must use the appropriate diluted/basic share count depending on the model.

Document the methodology.

⸻

155. Debt

Debt calculations should clearly distinguish:

* Short-term debt
* Long-term debt
* Lease liabilities where included
* Other debt-like obligations

Do not double count debt components.

⸻

156. Cash

Cash calculations should distinguish:

* Cash
* Cash equivalents
* Restricted cash where relevant

The treatment must follow the selected valuation methodology.

⸻

157. Non-Operating Assets

Non-operating assets should only be included when the methodology explicitly calls for them.

⸻

158. Minority Interest

Minority interest treatment must be consistent between enterprise value and operating metrics.

⸻

159. Preferred Stock

Preferred stock should be included only where relevant and supported by the underlying data.

⸻

160. Capital Structure

Capital structure calculations should use consistent market values where required.

Do not accidentally use book debt and market equity without understanding the methodology.

⸻

161. Tax Rate

Tax assumptions must be explicit.

Do not automatically use a tax rate that creates unrealistic model outputs without clear justification.

⸻

162. NOPAT

For unlevered DCF:

NOPAT = EBIT × (1 - Tax Rate)

Ensure the tax treatment is consistent with the model.

⸻

163. Free Cash Flow

A standard unlevered FCF framework may be:

FCF = NOPAT + D&A - Capex - Change in NWC

The exact definition must remain consistent throughout the model.

⸻

164. Working Capital

Working capital calculations must clearly define included accounts.

Avoid changing the definition between historical analysis and forecasting.

⸻

165. Capex

Capital expenditure should maintain consistent sign conventions.

Do not subtract an already-negative Capex value twice.

⸻

166. D&A

Depreciation and amortization should be handled consistently between:

* EBITDA
* EBIT
* NOPAT
* FCF

⸻

167. Terminal Growth

Terminal growth should represent a sustainable long-term growth assumption.

It should not exceed WACC in a conventional perpetuity-growth DCF.

⸻

168. Terminal Multiple

Exit multiples should be clearly identified as assumptions rather than guarantees.

⸻

169. Discount Periods

DCF discount periods must be explicit.

Do not accidentally discount Year 1 as Year 0.

⸻

170. Mid-Year Convention

If a mid-year convention is supported, clearly identify it and apply it consistently.

⸻

171. Sensitivity Grid

Sensitivity grids must:

* Label both axes.
* Identify units.
* Highlight base case.
* Recalculate correctly.
* Avoid misleading color scales.

⸻

172. Model Debugging

When a valuation is wrong:

Debug in this order:

1. Input data
2. Units
3. Sign conventions
4. Intermediate calculations
5. Formula
6. Discounting
7. Terminal value
8. Capital structure bridge
9. Per-share conversion
10. Presentation formatting

Do not immediately patch the final output.

⸻

173. Financial Formula Changes

Never modify formulas simply to match a desired valuation.

The desired output must never determine the formula.

⸻

174. No Outcome Engineering

Never manipulate:

* WACC
* Growth
* Multiples
* Forecasts
* Shares
* Debt
* Cash
* Terminal value

to make a company appear cheaper or more expensive.

⸻

175. Neutrality

Hedger’s calculations should remain methodology-driven.

The software should not intentionally bias outputs toward:

* bullish outcomes,
* bearish outcomes,
* higher valuations,
* lower valuations.

⸻

176. UI Copy

Use concise, professional language.

Avoid:

* “Boom!”
* “Awesome!”
* “Let’s crush it!”
* “AI magic”
* “Your stock is about to 🚀”

Financial software should sound professional.

⸻

177. Empty Copy

Do not use vague copy.

Prefer:

Select a company to begin valuation analysis.

over:

Your journey starts here.

⸻

178. Error Copy

Errors should be factual.

Prefer:

Market data is temporarily unavailable.

over:

Oops! Something went wrong 😅

⸻

179. Documentation Language

Technical documentation should be precise.

Avoid marketing language inside engineering documentation.

⸻

180. Code Quality

Code should be:

* Readable
* Predictable
* Typed where applicable
* Modular
* Testable
* Consistent with the repository

Avoid clever code when simple code is clearer.

⸻

181. Type Safety

Use strong types for financial objects where the framework supports them.

Examples:

* Money
* Percentage
* Multiple
* Currency
* FinancialPeriod
* CompanyId
* ValuationResult

Do not represent every financial concept as an untyped number.

⸻

182. Financial Object Semantics

Where practical, distinguish:

100

from:

100%

from:

100x

from:

$100M

The data model should prevent accidental semantic mixing.

⸻

183. API Type Validation

Validate API responses.

Do not assume providers always return the expected schema.

⸻

184. Defensive Programming

External data should be considered unreliable until validated.

Handle:

* Missing fields
* Unexpected nulls
* Wrong types
* Invalid dates
* Duplicate records
* Unexpected units

⸻

185. Browser Errors

Production pages should not have recurring:

* console errors,
* hydration errors,
* unhandled promise rejections,
* broken network requests,
* accessibility warnings caused by implementation mistakes.

⸻

186. Final Verification

Before declaring a feature complete:

Functional

* Primary workflow works.
* Secondary workflow works.
* Error handling works.
* Loading states work.
* Empty states work.

Financial

* Formulas are correct.
* Units are correct.
* Currency is correct.
* Sign conventions are correct.
* Edge cases are handled.
* Outputs reconcile.

UI

* Existing Hedger design language is preserved.
* Typography is consistent.
* Spacing is consistent.
* Tables are readable.
* Charts are meaningful.
* Responsive behavior works.

Engineering

* No unnecessary dependencies.
* No secrets.
* No debug code.
* No fake data.
* No broken routes.
* No critical console errors.
* Tests pass.

⸻

187. Agent Operating Procedure

For every development request, the AI coding agent should follow:

Phase 1 — Inspect

Understand the existing implementation.

Phase 2 — Plan

Define the smallest change required.

Phase 3 — Implement

Modify only necessary files.

Phase 4 — Validate

Run appropriate tests and checks.

Phase 5 — Review

Look for:

* regressions,
* UI inconsistencies,
* financial errors,
* edge cases,
* security problems.

Phase 6 — Report

Summarize:

* files changed,
* functionality added,
* formulas affected,
* tests performed,
* unresolved issues.

⸻

188. Priority Order

When requirements conflict, use this priority:

1. Safety
2. Financial correctness
3. Data integrity
4. Security
5. Existing functionality
6. User experience
7. Performance
8. Visual consistency
9. Code elegance
10. Convenience

Never sacrifice a higher-priority principle for a lower-priority one.

⸻

189. Golden Rule

Do not change Hedger merely to make it different. Change Hedger only when the change makes it more correct, useful, reliable, understandable, or maintainable.

Hedger should always feel like one coherent product.

Every page, calculation, API, component, and interaction should reinforce the same identity:

Precise. Minimal. Financial. Trustworthy. Professional.