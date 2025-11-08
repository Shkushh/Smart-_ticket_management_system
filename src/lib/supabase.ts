import { supabase } from "@/integrations/supabase/client";

export type UserRole = 'customer' | 'agent';

export const getUserRole = async (userId: string): Promise<UserRole | null> => {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();
  
  if (error || !data) return null;
  return data.role as UserRole;
};

export const setUserRole = async (userId: string, role: UserRole) => {
  const { error } = await supabase
    .from('user_roles')
    .insert({ user_id: userId, role });
  
  return { error };
};

export const createProfile = async (userId: string, email: string, fullName?: string) => {
  const { error } = await supabase
    .from('profiles')
    .insert({ id: userId, email, full_name: fullName });
  
  return { error };
};
