"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = seedDatabase;
const supabase_1 = __importDefault(require("../config/supabase"));
const logger_1 = __importDefault(require("./logger"));
const SECTORS_SEED = [
    { name: 'NIFTY_BANK', displayName: 'Nifty Bank', indexSymbol: 'NSE:NIFTYBANK-INDEX', weightage: 25.0 },
    { name: 'NIFTY_IT', displayName: 'Nifty IT', indexSymbol: 'NSE:NIFTYIT-INDEX', weightage: 15.0 },
    { name: 'NIFTY_AUTO', displayName: 'Nifty Auto', indexSymbol: 'NSE:NIFTYAUTO-INDEX', weightage: 10.0 },
    { name: 'NIFTY_METAL', displayName: 'Nifty Metal', indexSymbol: 'NSE:NIFTYMETAL-INDEX', weightage: 8.0 },
    { name: 'NIFTY_PHARMA', displayName: 'Nifty Pharma', indexSymbol: 'NSE:NIFTYPHARMA-INDEX', weightage: 7.0 },
    { name: 'NIFTY_FMCG', displayName: 'Nifty FMCG', indexSymbol: 'NSE:NIFTYFMCG-INDEX', weightage: 12.0 },
    { name: 'NIFTY_ENERGY', displayName: 'Nifty Energy', indexSymbol: 'NSE:NIFTYENERGY-INDEX', weightage: 13.0 },
    { name: 'NIFTY_INFRA', displayName: 'Nifty Infra', indexSymbol: 'NSE:NIFTYINFRA-INDEX', weightage: 7.0 },
    { name: 'NIFTY_REALTY', displayName: 'Nifty Realty', indexSymbol: 'NSE:NIFTYREALTY-INDEX', weightage: 3.0 }
];
const STOCKS_SEED = [
    // Nifty Bank
    { symbol: 'NSE:HDFCBANK-EQ', companyName: 'HDFC Bank Ltd.', sectorName: 'NIFTY_BANK' },
    { symbol: 'NSE:ICICIBANK-EQ', companyName: 'ICICI Bank Ltd.', sectorName: 'NIFTY_BANK' },
    { symbol: 'NSE:SBIN-EQ', companyName: 'State Bank of India', sectorName: 'NIFTY_BANK' },
    { symbol: 'NSE:KOTAKBANK-EQ', companyName: 'Kotak Mahindra Bank Ltd.', sectorName: 'NIFTY_BANK' },
    { symbol: 'NSE:AXISBANK-EQ', companyName: 'Axis Bank Ltd.', sectorName: 'NIFTY_BANK' },
    { symbol: 'NSE:INDUSINDBK-EQ', companyName: 'IndusInd Bank Ltd.', sectorName: 'NIFTY_BANK' },
    { symbol: 'NSE:FEDERALBNK-EQ', companyName: 'The Federal Bank Ltd.', sectorName: 'NIFTY_BANK' },
    { symbol: 'NSE:AUBANK-EQ', companyName: 'AU Small Finance Bank Ltd.', sectorName: 'NIFTY_BANK' },
    // Nifty IT
    { symbol: 'NSE:TCS-EQ', companyName: 'Tata Consultancy Services Ltd.', sectorName: 'NIFTY_IT' },
    { symbol: 'NSE:INFY-EQ', companyName: 'Infosys Ltd.', sectorName: 'NIFTY_IT' },
    { symbol: 'NSE:WIPRO-EQ', companyName: 'Wipro Ltd.', sectorName: 'NIFTY_IT' },
    { symbol: 'NSE:HCLTECH-EQ', companyName: 'HCL Technologies Ltd.', sectorName: 'NIFTY_IT' },
    { symbol: 'NSE:TECHM-EQ', companyName: 'Tech Mahindra Ltd.', sectorName: 'NIFTY_IT' },
    { symbol: 'NSE:LTIM-EQ', companyName: 'LTIMindtree Ltd.', sectorName: 'NIFTY_IT' },
    { symbol: 'NSE:COFORGE-EQ', companyName: 'Coforge Ltd.', sectorName: 'NIFTY_IT' },
    // Nifty Auto
    { symbol: 'NSE:TATAMOTORS-EQ', companyName: 'Tata Motors Ltd.', sectorName: 'NIFTY_AUTO' },
    { symbol: 'NSE:M&M-EQ', companyName: 'Mahindra & Mahindra Ltd.', sectorName: 'NIFTY_AUTO' },
    { symbol: 'NSE:MARUTI-EQ', companyName: 'Maruti Suzuki India Ltd.', sectorName: 'NIFTY_AUTO' },
    { symbol: 'NSE:EICHERMOT-EQ', companyName: 'Eicher Motors Ltd.', sectorName: 'NIFTY_AUTO' },
    { symbol: 'NSE:BAJAJ-AUTO-EQ', companyName: 'Bajaj Auto Ltd.', sectorName: 'NIFTY_AUTO' },
    { symbol: 'NSE:HEROMOTOCO-EQ', companyName: 'Hero MotoCorp Ltd.', sectorName: 'NIFTY_AUTO' },
    { symbol: 'NSE:TVSMOTOR-EQ', companyName: 'TVS Motor Company Ltd.', sectorName: 'NIFTY_AUTO' },
    // Nifty Metal
    { symbol: 'NSE:TATASTEEL-EQ', companyName: 'Tata Steel Ltd.', sectorName: 'NIFTY_METAL' },
    { symbol: 'NSE:JSWSTEEL-EQ', companyName: 'JSW Steel Ltd.', sectorName: 'NIFTY_METAL' },
    { symbol: 'NSE:HINDALCO-EQ', companyName: 'Hindalco Industries Ltd.', sectorName: 'NIFTY_METAL' },
    { symbol: 'NSE:COALINDIA-EQ', companyName: 'Coal India Ltd.', sectorName: 'NIFTY_METAL' },
    { symbol: 'NSE:VEDL-EQ', companyName: 'Vedanta Ltd.', sectorName: 'NIFTY_METAL' },
    { symbol: 'NSE:NMDC-EQ', companyName: 'NMDC Ltd.', sectorName: 'NIFTY_METAL' },
    { symbol: 'NSE:NATIONALUM-EQ', companyName: 'National Aluminium Co. Ltd.', sectorName: 'NIFTY_METAL' },
    // Nifty Pharma
    { symbol: 'NSE:SUNPHARMA-EQ', companyName: 'Sun Pharmaceutical Industries Ltd.', sectorName: 'NIFTY_PHARMA' },
    { symbol: 'NSE:CIPLA-EQ', companyName: 'Cipla Ltd.', sectorName: 'NIFTY_PHARMA' },
    { symbol: 'NSE:DRREDDY-EQ', companyName: 'Dr. Reddy\'s Laboratories Ltd.', sectorName: 'NIFTY_PHARMA' },
    { symbol: 'NSE:DIVISLAB-EQ', companyName: 'Divi\'s Laboratories Ltd.', sectorName: 'NIFTY_PHARMA' },
    { symbol: 'NSE:LUPIN-EQ', companyName: 'Lupin Ltd.', sectorName: 'NIFTY_PHARMA' },
    { symbol: 'NSE:APOLLOHOSP-EQ', companyName: 'Apollo Hospitals Enterprise Ltd.', sectorName: 'NIFTY_PHARMA' },
    { symbol: 'NSE:AUBROPHARMA-EQ', companyName: 'Aurobindo Pharma Ltd.', sectorName: 'NIFTY_PHARMA' },
    // Nifty FMCG
    { symbol: 'NSE:ITC-EQ', companyName: 'ITC Ltd.', sectorName: 'NIFTY_FMCG' },
    { symbol: 'NSE:HINDUNILVR-EQ', companyName: 'Hindustan Unilever Ltd.', sectorName: 'NIFTY_FMCG' },
    { symbol: 'NSE:NESTLEIND-EQ', companyName: 'Nestle India Ltd.', sectorName: 'NIFTY_FMCG' },
    { symbol: 'NSE:BRITANNIA-EQ', companyName: 'Britannia Industries Ltd.', sectorName: 'NIFTY_FMCG' },
    { symbol: 'NSE:TATACONSUM-EQ', companyName: 'Tata Consumer Products Ltd.', sectorName: 'NIFTY_FMCG' },
    { symbol: 'NSE:DABUR-EQ', companyName: 'Dabur India Ltd.', sectorName: 'NIFTY_FMCG' },
    { symbol: 'NSE:MARICO-EQ', companyName: 'Marico Ltd.', sectorName: 'NIFTY_FMCG' },
    // Nifty Energy
    { symbol: 'NSE:RELIANCE-EQ', companyName: 'Reliance Industries Ltd.', sectorName: 'NIFTY_ENERGY' },
    { symbol: 'NSE:ONGC-EQ', companyName: 'Oil & Natural Gas Corporation Ltd.', sectorName: 'NIFTY_ENERGY' },
    { symbol: 'NSE:POWERGRID-EQ', companyName: 'Power Grid Corporation of India Ltd.', sectorName: 'NIFTY_ENERGY' },
    { symbol: 'NSE:NTPC-EQ', companyName: 'NTPC Ltd.', sectorName: 'NIFTY_ENERGY' },
    { symbol: 'NSE:BPCL-EQ', companyName: 'Bharat Petroleum Corporation Ltd.', sectorName: 'NIFTY_ENERGY' },
    { symbol: 'NSE:IOC-EQ', companyName: 'Indian Oil Corporation Ltd.', sectorName: 'NIFTY_ENERGY' },
    { symbol: 'NSE:GAIL-EQ', companyName: 'GAIL (India) Ltd.', sectorName: 'NIFTY_ENERGY' },
    // Nifty Infra
    { symbol: 'NSE:LT-EQ', companyName: 'Larsen & Toubro Ltd.', sectorName: 'NIFTY_INFRA' },
    { symbol: 'NSE:ADANIPORTS-EQ', companyName: 'Adani Ports & Special Economic Zone Ltd.', sectorName: 'NIFTY_INFRA' },
    { symbol: 'NSE:GRASIM-EQ', companyName: 'Grasim Industries Ltd.', sectorName: 'NIFTY_INFRA' },
    { symbol: 'NSE:ULTRACEMCO-EQ', companyName: 'UltraTech Cement Ltd.', sectorName: 'NIFTY_INFRA' },
    { symbol: 'NSE:AMBUJACEM-EQ', companyName: 'Ambuja Cements Ltd.', sectorName: 'NIFTY_INFRA' },
    // Nifty Realty
    { symbol: 'NSE:DLF-EQ', companyName: 'DLF Ltd.', sectorName: 'NIFTY_REALTY' },
    { symbol: 'NSE:GODREJPROP-EQ', companyName: 'Godrej Properties Ltd.', sectorName: 'NIFTY_REALTY' },
    { symbol: 'NSE:OBEROIRLTY-EQ', companyName: 'Oberoi Realty Ltd.', sectorName: 'NIFTY_REALTY' },
    { symbol: 'NSE:PRESTIGE-EQ', companyName: 'Prestige Estates Projects Ltd.', sectorName: 'NIFTY_REALTY' }
];
async function seedDatabase() {
    logger_1.default.info('Starting database seed...');
    try {
        // 1. Seed Sectors
        for (const sec of SECTORS_SEED) {
            const { data, error } = await supabase_1.default
                .from('sectors')
                .select('id')
                .eq('name', sec.name)
                .maybeSingle();
            if (error) {
                logger_1.default.error(`Error querying sector ${sec.name}: ${error.message}`);
                continue;
            }
            if (!data) {
                const { error: insErr } = await supabase_1.default
                    .from('sectors')
                    .insert({
                    name: sec.name,
                    display_name: sec.displayName,
                    index_symbol: sec.indexSymbol,
                    weightage: sec.weightage
                });
                if (insErr) {
                    logger_1.default.error(`Error inserting sector ${sec.name}: ${insErr.message}`);
                }
                else {
                    logger_1.default.info(`Seeded sector: ${sec.displayName}`);
                }
            }
        }
        // Load sectors lookup mapping (name -> id)
        const { data: sectorsDb, error: secErr } = await supabase_1.default
            .from('sectors')
            .select('id, name');
        if (secErr || !sectorsDb) {
            throw new Error(`Could not fetch sectors for stock mapping: ${secErr?.message}`);
        }
        const sectorMap = new Map();
        sectorsDb.forEach(s => sectorMap.set(s.name, s.id));
        // 2. Seed Stocks
        for (const stock of STOCKS_SEED) {
            const sectorId = sectorMap.get(stock.sectorName) || null;
            if (!sectorId) {
                logger_1.default.warn(`No sector found for stock ${stock.symbol} under ${stock.sectorName}`);
                continue;
            }
            const { data, error } = await supabase_1.default
                .from('stocks')
                .select('id')
                .eq('symbol', stock.symbol)
                .maybeSingle();
            if (error) {
                logger_1.default.error(`Error querying stock ${stock.symbol}: ${error.message}`);
                continue;
            }
            if (!data) {
                const { error: insErr } = await supabase_1.default
                    .from('stocks')
                    .insert({
                    symbol: stock.symbol,
                    company_name: stock.companyName,
                    sector_id: sectorId,
                    is_active: true
                });
                if (insErr) {
                    logger_1.default.error(`Error inserting stock ${stock.symbol}: ${insErr.message}`);
                }
                else {
                    logger_1.default.info(`Seeded stock: ${stock.symbol} (${stock.companyName})`);
                }
            }
        }
        logger_1.default.info('Database seed complete!');
    }
    catch (err) {
        logger_1.default.error(`Database seeding failed: ${err.message}`);
    }
}
// Support running directly if called from command line
if (require.main === module) {
    seedDatabase().then(() => process.exit(0)).catch(() => process.exit(1));
}
