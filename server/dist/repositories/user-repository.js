"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const supabase_1 = __importDefault(require("../config/supabase"));
class UserRepository {
    async findByEmail(email) {
        const { data, error } = await supabase_1.default
            .from('users')
            .select('id, email, created_at')
            .eq('email', email)
            .maybeSingle();
        if (error)
            throw new Error(error.message);
        if (!data)
            return null;
        return {
            id: data.id,
            email: data.email,
            createdAt: data.created_at,
        };
    }
    async findByEmailWithPassword(email) {
        const { data, error } = await supabase_1.default
            .from('users')
            .select('id, email, password_hash, created_at')
            .eq('email', email)
            .maybeSingle();
        if (error)
            throw new Error(error.message);
        if (!data)
            return null;
        return {
            id: data.id,
            email: data.email,
            passwordHash: data.password_hash,
            createdAt: data.created_at,
        };
    }
    async findById(id) {
        const { data, error } = await supabase_1.default
            .from('users')
            .select('id, email, created_at')
            .eq('id', id)
            .maybeSingle();
        if (error)
            throw new Error(error.message);
        if (!data)
            return null;
        return {
            id: data.id,
            email: data.email,
            createdAt: data.created_at,
        };
    }
    async create(email, passwordHash) {
        const { data, error } = await supabase_1.default
            .from('users')
            .insert({ email, password_hash: passwordHash })
            .select('id, email, created_at')
            .single();
        if (error)
            throw new Error(error.message);
        return {
            id: data.id,
            email: data.email,
            createdAt: data.created_at,
        };
    }
}
exports.UserRepository = UserRepository;
exports.default = new UserRepository();
