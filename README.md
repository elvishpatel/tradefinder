# TradeFinder: Market Intelligence Platform

TradeFinder is a dark-mode-first, production-grade Market Intelligence Platform for the Indian stock market. It performs real-time technical analysis calculations, indices monitoring, money flow tracking, and sector rotation analysis using the Fyers API.

> [!NOTE]
> TradeFinder is **NOT** a broker, **NOT** a trading tool, and **NOT** a portfolio manager. Its sole purpose is to discover high-probability intraday and swing setups based on objective calculations.

---

## Folder Structure

```text
tradefinder/
├── client/                 # Vite + React 19 + TypeScript + Tailwind CSS Frontend
│   ├── src/
│   │   ├── components/     # Navigation guards, layout elements
│   │   ├── hooks/          # Custom Hooks (Socket feeds, UI indicators)
│   │   ├── layouts/        # Sidebar nav shell
│   │   ├── pages/          # Dashboard, Sector details, Scanners
│   │   ├── services/       # Axios API client wrapper
│   │   └── store/          # Zustand global states (auth, market data)
│
├── server/                 # Express.js + Node.js + TypeScript + Socket.IO Backend
│   ├── src/
│   │   ├── config/         # Supabase & Fyers parameters loading
│   │   ├── controllers/    # API endpoint request processors
│   │   ├── engines/        # Indicator math, Scoring computations, Scanner rules
│   │   ├── middleware/     # JWT authentication and validators
│   │   ├── repositories/   # Supabase DB connectors
│   │   ├── routes/         # REST endpoint bindings
│   │   ├── socket/         # Socket.io emitter manager
│   │   └── utils/          # Winston logging, cryptographic helpers, seed scripts
│
├── database/
│   └── supabase/           # PostgreSQL schemas & migrations
```

---

## Supabase Schema

Deploy the SQL definitions located in `database/supabase/schema.sql` to your Supabase PostgreSQL editor:

```sql
-- Creates core tables:
-- public.users (credential accounts)
-- public.fyers_sessions (symmetrically encrypted broker tokens)
-- public.sectors (NSE index weights)
-- public.stocks (NSE stock universe)
-- public.historical_metrics (250-period EOD cached bars)
-- public.sector_metrics (breadths & index stats)
```

---

## Environment Variables Configuration

Create a `.env` file under the `/server` directory:

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Supabase Configurations
SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
SUPABASE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY

# Fyers OAuth Credentials
FYERS_CLIENT_ID=YOUR_FYERS_APP_ID
FYERS_SECRET_KEY=YOUR_FYERS_SECRET_KEY
FYERS_REDIRECT_URI=http://localhost:5000/api/v1/auth/fyers/callback

# Security Keys
JWT_SECRET=your-jwt-signing-secret
ENCRYPTION_KEY=64_HEX_CHARACTERS_FOR_AES_256_CBC
```

---

## Installation & Launch Manual

### 1. Backend Server Setup
```bash
cd server
npm install
# Seed the initial stocks/sectors registry in Supabase (if keys are configured)
npm run seed
# Start backend in development reload mode
npm run dev
```

### 2. Frontend Client Setup
```bash
cd client
npm install --legacy-peer-deps
# Start frontend dev server
npm run dev
```

### Standalone Previewing Mode
To preview the platform without Fyers credentials or database connections:
- Log in with email `demo@tradefinder.com` and password `password123`.
- The system will bypass authentication hurdles, auto-initialize the historical data cache, and launch the real-time quote simulator.

---

## Quantitative Scoring Mathematics

### 1. Momentum Score (0-100)
Evaluates RSI ranges, MACD histogram crossovers, and price distance from the EMA 20:
- **Bullish**: Max score given when RSI resides in the range of 55 to 70 and MACD histogram slope is positive.
- **Bearish**: Max score given when RSI is below 45 and MACD histogram slope is negative.

### 2. Trend Score (0-100)
Uses ADX strength filters overlaid on EMA structures:
- **Bullish**: $EMA_{20} > EMA_{50} > EMA_{200}$ combined with Higher Highs/Higher Lows.
- **Bearish**: $EMA_{20} < EMA_{50} < EMA_{200}$ combined with Lower Highs/Lower Lows.

### 3. Breakout Score (0-100)
- Measures proximity to 20-day high (bullish breakouts) or 20-day low (bearish breakdowns).
- Validated by volume ratios: $Volume_{today} / Volume_{Avg20} > 1.5$.
- Multiplied by ATR volatility expansion.

### 4. Opportunity Score (0-100)
Weighted compiler integrating all technical analysis factors:
$$OS = 0.25 \times Trend + 0.25 \times Momentum + 0.20 \times Breakout + 0.15 \times RFactor + 0.15 \times SectorStrength$$
where **R-Factor** measures performance of stock vs sector, and **Sector Strength** measures sector index vs Nifty 50.
