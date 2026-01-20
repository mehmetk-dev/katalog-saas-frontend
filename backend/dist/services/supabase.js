"use strict";
const __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
const path_1 = __importDefault(require("path"));
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
// Load .env from backend folder first, then try parent folder
dotenv_1.default.config();
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../../.env.local') });
// Support both SUPABASE_URL and NEXT_PUBLIC_SUPABASE_URL
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
if (!supabaseUrl) {
    console.error('❌ SUPABASE_URL is missing! Backend cannot connect to database.');
}
else {
}
if (!supabaseKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY is missing! Admin operations will fail.');
}
else {
}
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
