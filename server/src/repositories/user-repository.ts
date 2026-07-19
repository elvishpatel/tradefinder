import supabase from '../config/supabase';
import { User } from '../types';


export class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, created_at')
      .eq('email', email)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;

    return {
      id: data.id,
      email: data.email,
      createdAt: data.created_at,
    };
  }

  async findByEmailWithPassword(email: string): Promise<{ id: string; email: string; passwordHash: string; createdAt: string } | null> {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, password_hash, created_at')
      .eq('email', email)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;

    return {
      id: data.id,
      email: data.email,
      passwordHash: data.password_hash,
      createdAt: data.created_at,
    };
  }

  async findById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, created_at')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;

    return {
      id: data.id,
      email: data.email,
      createdAt: data.created_at,
    };
  }

  async create(email: string, passwordHash: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert({ email, password_hash: passwordHash })
      .select('id, email, created_at')
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      email: data.email,
      createdAt: data.created_at,
    };
  }
}

export default new UserRepository();
