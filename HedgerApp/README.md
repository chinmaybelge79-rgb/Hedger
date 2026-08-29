# Hedger App

A simplified valuation platform inspired by the Hedger concept, featuring multiple valuation models, community features, and financial analysis tools.

## Features

- **Home View**: Search for companies and see live price movements
- **Models View**: Compare 11 different valuation methodologies (DCF, DDM, Comps, Precedent, SOTP, LBO, Residual Income, Reverse DCF, EPV, Asset-Based, APV)
- **Ticker View**: Detailed analysis of a selected company with financial statements, valuation trace, and sensitivity analysis
- **Community View**: Share and discuss investment analyses
- **AI Feed View**: Market news and events affecting stocks and commodities
- **About View**: Information about the platform and its founder
- **Pricing View**: Subscription plans for different user tiers

## Technical Stack

- **Backend**: Node.js with Express.js
- **Frontend**: HTML, CSS, JavaScript (vanilla)
- **Styling**: CSS with CSS variables for theming
- **Responsive Design**: Mobile-friendly layouts

## Installation

1. Clone or copy this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```
4. Visit http://localhost:3000 in your browser

## Design Principles

- **Minimalism**: Clean, grayscale interface focused on readability
- **Traceability**: Every valuation output is traceable to its assumptions
- **Progressive Disclosure**: Simple views summarize, advanced views expose detail
- **Professional Identity**: Designed for serious investors, not generated templates
- **Assumption Visibility**: All key assumptions are visible and editable

## Valuation Models

The platform implements 11 valuation methodologies:
1. DCF (Discounted Cash Flow)
2. DDM (Dividend Discount Model)
3. Comps (Trading Comparables)
4. Precedent (Precedent Transactions)
5. SOTP (Sum of the Parts)
6. LBO (Leveraged Buyout)
7. Residual Income
8. Reverse DCF (Implied Growth)
9. EPV (Earnings Power Value)
10. Asset-Based
11. APV (Adjusted Present Value)

## Data

The application uses sample data for companies like MSFT, AAPL, NVDA, and GOOGL with financial statements and valuation model outputs.

## Running the Application

The server is currently running on http://localhost:3000. You can access the application by opening this URL in your web browser.

To stop the server, you can use the following command in the terminal:
```bash
pkill -f "node server.js"
```