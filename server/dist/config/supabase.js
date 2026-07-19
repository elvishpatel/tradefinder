"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const index_1 = __importDefault(require("./index"));
const logger_1 = __importDefault(require("../utils/logger"));
let supabaseClient;
const isSupabaseConfigured = index_1.default.SUPABASE_URL &&
    index_1.default.SUPABASE_URL.startsWith('http') &&
    index_1.default.SUPABASE_KEY;
if (isSupabaseConfigured) {
    try {
        supabaseClient = (0, supabase_js_1.createClient)(index_1.default.SUPABASE_URL, index_1.default.SUPABASE_KEY);
        logger_1.default.info('Supabase client successfully initialized.');
    }
    catch (err) {
        logger_1.default.error(`Failed to initialize Supabase client: ${err.message}`);
        setupMockClient();
    }
}
else {
    logger_1.default.warn('[WARNING]: Supabase URL or Key is not configured. Falling back to Mock Database Client.');
    setupMockClient();
}
function setupMockClient() {
    // A mock client proxy to prevent server crashes on database queries
    const mockDbQuery = () => ({
        select: () => mockDbQuery(),
        eq: () => mockDbQuery(),
        order: () => mockDbQuery(),
        limit: () => mockDbQuery(),
        insert: () => mockDbQuery(),
        upsert: () => mockDbQuery(),
        delete: () => mockDbQuery(),
        maybeSingle: async () => ({ data: null, error: null }),
        single: async () => ({ data: null, error: null }),
        then: (resolve) => resolve({ data: [], error: null }),
    });
    supabaseClient = {
        from: () => mockDbQuery(),
        auth: {
            signUp: async () => ({ data: null, error: new Error('Database disconnected') }),
            signInWithPassword: async () => ({ data: null, error: new Error('Database disconnected') }),
        }
    };
}
exports.supabase = supabaseClient;
exports.default = exports.supabase;
