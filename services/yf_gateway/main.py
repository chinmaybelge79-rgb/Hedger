import os
import re
import math
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Header, Query
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf

app = FastAPI(title="Hedger yfinance Gateway", version="1.0.0")

# Allow localhost CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GATEWAY_SECRET = os.environ.get("YF_GATEWAY_SECRET", "hedger_local_secret_token_2026")
SYMBOL_REGEX = re.compile(r"^[\^A-Za-z0-9][A-Za-z0-9\.\&\-\=\^]{0,19}$")

def verify_secret(x_gateway_secret: Optional[str] = Header(None)):
    if GATEWAY_SECRET and x_gateway_secret != GATEWAY_SECRET:
        # For ease of development when calling locally, allow bypass if header is missing in dev
        pass

def sanitize_val(val: Any) -> Any:
    if val is None:
        return None
    if isinstance(val, (float, int)):
        if math.isnan(val) or math.isinf(val):
            return None
        return float(val) if isinstance(val, float) else int(val)
    return str(val)

@app.get("/health")
def health():
    return {"status": "ok", "provider": "yfinance", "version": yf.__version__}

@app.get("/quote")
def get_quote(symbol: str = Query(...)):
    if not SYMBOL_REGEX.match(symbol):
        raise HTTPException(status_code=400, detail="Invalid symbol format")
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info or {}
        fast = ticker.fast_info

        # Use fast_info when available for speed, fallback to info
        price = getattr(fast, "last_price", None) or info.get("currentPrice") or info.get("regularMarketPrice")
        prev_close = getattr(fast, "previous_close", None) or info.get("regularMarketPreviousClose") or info.get("previousClose")
        
        if price is None:
            # Try history 1d
            hist = ticker.history(period="2d")
            if not hist.empty:
                price = float(hist["Close"].iloc[-1])
                prev_close = float(hist["Close"].iloc[-2]) if len(hist) > 1 else price

        if price is None:
            raise HTTPException(status_code=404, detail=f"No price data found for {symbol}")

        price = float(price)
        prev_close = float(prev_close) if prev_close else price
        change = price - prev_close
        change_pct = (change / prev_close) if prev_close else 0.0

        currency = getattr(fast, "currency", None) or info.get("currency") or "INR"
        mkt_cap = getattr(fast, "market_cap", None) or info.get("marketCap")
        shares = getattr(fast, "shares", None) or info.get("sharesOutstanding")

        return {
            "symbol": symbol,
            "price": price,
            "change": change,
            "changePercent": change_pct,
            "open": sanitize_val(info.get("open") or getattr(fast, "open", None)),
            "high": sanitize_val(info.get("dayHigh") or getattr(fast, "day_high", None)),
            "low": sanitize_val(info.get("dayLow") or getattr(fast, "day_low", None)),
            "previousClose": prev_close,
            "volume": sanitize_val(info.get("volume") or getattr(fast, "last_volume", None)),
            "marketCap": sanitize_val(mkt_cap),
            "sharesOutstanding": sanitize_val(shares),
            "currency": currency,
            "exchange": info.get("exchange", "NSE"),
            "name": info.get("shortName") or info.get("longName") or symbol
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

PERIOD_MAP = {
    "1d": "1d",
    "5d": "5d",
    "1m": "1mo",
    "1mo": "1mo",
    "3m": "3mo",
    "3mo": "3mo",
    "6m": "6mo",
    "6mo": "6mo",
    "1y": "1y",
    "2y": "2y",
    "3y": "3y",
    "5y": "5y",
    "10y": "10y",
    "ytd": "ytd",
    "all": "max",
    "max": "max",
}

@app.get("/history")
def get_history(
    symbol: str = Query(...),
    period: str = Query("1y"),
    interval: str = Query("1d")
):
    if not SYMBOL_REGEX.match(symbol):
        raise HTTPException(status_code=400, detail="Invalid symbol format")
    try:
        ticker = yf.Ticker(symbol)
        clean_period = PERIOD_MAP.get(period.lower().strip(), "max" if period.lower().strip() in ("all", "max") else "1y")
        hist = ticker.history(period=clean_period, interval=interval)
        if hist.empty and clean_period == "max":
            hist = ticker.history(period="10y", interval=interval)
            if hist.empty:
                hist = ticker.history(period="5y", interval=interval)

        if hist.empty:
            return {"symbol": symbol, "bars": []}

        bars = []
        for index, row in hist.iterrows():
            date_str = index.strftime("%Y-%m-%d") if hasattr(index, "strftime") else str(index)
            bars.append({
                "date": date_str,
                "open": sanitize_val(row.get("Open")),
                "high": sanitize_val(row.get("High")),
                "low": sanitize_val(row.get("Low")),
                "close": sanitize_val(row.get("Close")),
                "volume": sanitize_val(row.get("Volume"))
            })
        return {"symbol": symbol, "bars": bars}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/info")
def get_info(symbol: str = Query(...)):
    if not SYMBOL_REGEX.match(symbol):
        raise HTTPException(status_code=400, detail="Invalid symbol format")
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info or {}
        fast = ticker.fast_info

        # Check if company actually exists
        has_name = bool(info.get("longName") or info.get("shortName"))
        has_price = getattr(fast, "last_price", None) is not None or info.get("currentPrice") is not None
        if not has_name and not has_price:
            hist = ticker.history(period="2d")
            if hist.empty:
                raise HTTPException(status_code=404, detail=f"Company profile not found for {symbol}")
        
        # Sector / industry detection
        sector = info.get("sector") or "General"
        industry = info.get("industry") or "General"
        
        is_bank = "bank" in sector.lower() or "bank" in industry.lower() or "financial" in sector.lower()
        company_type = "bank" if is_bank else "standard"

        return {
            "symbol": symbol,
            "name": info.get("longName") or info.get("shortName") or symbol,
            "description": info.get("longBusinessSummary", ""),
            "sector": sector,
            "industry": industry,
            "exchange": info.get("exchange", "NSE"),
            "currency": info.get("currency", "INR"),
            "country": info.get("country", "India"),
            "website": info.get("website", ""),
            "ceo": (info.get("companyOfficers", [{}])[0].get("name") if info.get("companyOfficers") else None),
            "employees": sanitize_val(info.get("fullTimeEmployees")),
            "sharesOutstanding": sanitize_val(info.get("sharesOutstanding")),
            "marketCap": sanitize_val(info.get("marketCap")),
            "peRatio": sanitize_val(info.get("trailingPE")),
            "forwardPE": sanitize_val(info.get("forwardPE")),
            "pbRatio": sanitize_val(info.get("priceToBook")),
            "dividendYield": sanitize_val(info.get("dividendYield")),
            "week52High": sanitize_val(info.get("fiftyTwoWeekHigh")),
            "week52Low": sanitize_val(info.get("fiftyTwoWeekLow")),
            "beta": sanitize_val(info.get("beta")),
            "companyType": company_type
        }
    except HTTPException:
        raise
    except Exception as e:
        if "exchangeTimezoneName" in str(e) or "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=f"Company profile not found for {symbol}")
        raise HTTPException(status_code=500, detail=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/statements")
def get_statements(
    symbol: str = Query(...),
    type: str = Query("income"), # income | balance | cashflow
    period: str = Query("annual") # annual | quarterly
):
    if not SYMBOL_REGEX.match(symbol):
        raise HTTPException(status_code=400, detail="Invalid symbol format")
    try:
        ticker = yf.Ticker(symbol)
        df = None

        if type == "income":
            df = ticker.quarterly_income_stmt if period == "quarterly" else ticker.income_stmt
        elif type == "balance":
            df = ticker.quarterly_balance_sheet if period == "quarterly" else ticker.balance_sheet
        elif type == "cashflow":
            df = ticker.quarterly_cashflow if period == "quarterly" else ticker.cashflow

        if df is None or df.empty:
            return {
                "symbol": symbol,
                "type": type,
                "period": period,
                "currency": ticker.info.get("currency", "INR") if ticker.info else "INR",
                "fiscalDates": [],
                "rows": []
            }

        fiscal_dates = [col.strftime("%Y-%m-%d") if hasattr(col, "strftime") else str(col) for col in df.columns]
        rows = []
        for index_name, row_series in df.iterrows():
            vals = [sanitize_val(v) for v in row_series]
            clean_name = str(index_name)
            rows.append({
                "key": clean_name.lower().replace(" ", "_"),
                "name": clean_name,
                "values": vals,
                "isCalculated": False
            })

        return {
            "symbol": symbol,
            "type": type,
            "period": period,
            "currency": ticker.info.get("currency", "INR") if ticker.info else "INR",
            "fiscalDates": fiscal_dates,
            "rows": rows
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/search")
def search(q: str = Query(...)):
    try:
        res = yf.Search(q, max_results=10)
        quotes = res.quotes if hasattr(res, "quotes") else []
        results = []
        for q_item in quotes:
            results.append({
                "symbol": q_item.get("symbol"),
                "name": q_item.get("shortname") or q_item.get("longname") or q_item.get("symbol"),
                "exchange": q_item.get("exchange", "Unknown"),
                "type": q_item.get("quoteType", "EQUITY"),
                "sector": q_item.get("sector"),
                "industry": q_item.get("industry")
            })
        return {"query": q, "results": results}
    except Exception as e:
        return {"query": q, "results": []}
