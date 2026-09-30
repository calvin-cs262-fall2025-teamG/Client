import { supabase } from "../app/utils/supabase";

export type SignUpInput = {
  email: string;
  password: string;
  displayName: string;
};

export type SignInInput = {
  email: string;
  password: string;
};

export type SignUpResult = Awaited<ReturnType<typeof supabase.auth.signUp>>;
export type SignInResult = Awaited<
  ReturnType<typeof supabase.auth.signInWithPassword>
>;
export type SignOutResult = Awaited<ReturnType<typeof supabase.auth.signOut>>;

export async function signUp(_input: SignUpInput): Promise<SignUpResult> {
  return supabase.auth.signUp({
    email: _input.email,
    password: _input.password,
    options: {
      data: { display_name: _input.displayName },
      emailRedirectTo: "heynbr://auth/callback",
    },
  });
};

export async function signIn(_input: SignInInput): Promise<SignInResult> {
  return supabase.auth.signInWithPassword({
      email: _input.email,
      password: _input.password,
    });
};

export async function signOut(): Promise<SignOutResult> {
  return supabase.auth.signOut();
};