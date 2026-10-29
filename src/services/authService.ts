import { supabase } from "@/integrations/supabase/client";
import type { AuthError, Session, User } from "@supabase/supabase-js";

export interface AuthResult {
  user: User | null;
  session: Session | null;
  error: string | null;
  needsEmailConfirmation?: boolean;
}

/**
 * Traduit les messages d'erreurs Supabase en français compréhensible par l'utilisateur.
 */
export function formatAuthError(error: AuthError | Error | null | unknown): string {
  if (!error) return "";
  const msg = (error as { message?: string })?.message?.toLowerCase() || "";

  if (msg.includes("invalid login credentials") || msg.includes("invalid_credentials")) {
    return "Adresse e-mail ou mot de passe incorrect.";
  }
  if (msg.includes("email not confirmed")) {
    return "Votre adresse e-mail n'a pas encore été confirmée. Veuillez vérifier votre boîte de réception.";
  }
  if (msg.includes("user already registered") || msg.includes("already exists")) {
    return "Un compte existe déjà avec cette adresse e-mail. Veuillez vous connecter.";
  }
  if (msg.includes("password should be at least")) {
    return "Le mot de passe doit comporter au moins 6 caractères.";
  }
  if (msg.includes("rate limit") || msg.includes("too many requests")) {
    return "Trop de tentatives récentes. Veuillez patienter un instant avant de réessayer.";
  }
  if (msg.includes("network") || msg.includes("fetch")) {
    return "Impossible de joindre le serveur d'authentification. Vérifiez votre connexion Internet.";
  }
  if (msg.includes("signup requires a valid password")) {
    return "Veuillez saisir un mot de passe valide.";
  }
  if (msg.includes("invalid email")) {
    return "Veuillez saisir une adresse e-mail valide.";
  }

  return (error as { message?: string })?.message || "Une erreur est survenue lors de l'authentification.";
}

/**
 * Inscription par e-mail et mot de passe dans Supabase Auth.
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  fullName: string,
): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
        },
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      },
    });

    if (error) {
      return {
        user: null,
        session: null,
        error: formatAuthError(error),
      };
    }

    // Si Supabase requiert la confirmation d'e-mail, la session sera nulle
    const needsEmailConfirmation = Boolean(data.user && !data.session);

    return {
      user: data.user,
      session: data.session,
      error: null,
      needsEmailConfirmation,
    };
  } catch (err) {
    return {
      user: null,
      session: null,
      error: formatAuthError(err),
    };
  }
}

/**
 * Connexion par e-mail et mot de passe dans Supabase Auth.
 */
export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      return {
        user: null,
        session: null,
        error: formatAuthError(error),
      };
    }

    return {
      user: data.user,
      session: data.session,
      error: null,
    };
  } catch (err) {
    return {
      user: null,
      session: null,
      error: formatAuthError(err),
    };
  }
}

/**
 * Connexion via fournisseur OAuth (Google / Apple) dans Supabase Auth.
 */
export async function signInWithOAuth(provider: "google" | "apple"): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        queryParams: provider === "google" ? { prompt: "select_account" } : undefined,
      },
    });

    if (error) {
      return { error: formatAuthError(error) };
    }
    return { error: null };
  } catch (err) {
    return { error: formatAuthError(err) };
  }
}

/**
 * Envoi d'un e-mail de réinitialisation de mot de passe.
 */
export async function resetPasswordForEmail(email: string): Promise<{ ok: boolean; error: string | null }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined,
    });

    if (error) {
      return { ok: false, error: formatAuthError(error) };
    }
    return { ok: true, error: null };
  } catch (err) {
    return { ok: false, error: formatAuthError(err) };
  }
}

/**
 * Déconnexion de Supabase Auth et expiration de la session active.
 */
export async function signOutUser(): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { error: formatAuthError(error) };
    }
    return { error: null };
  } catch (err) {
    return { error: formatAuthError(err) };
  }
}

/**
 * Récupération et validation active de la session Supabase courante.
 */
export async function getValidSession(): Promise<Session | null> {
  try {
    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr || !sessionData.session) return null;

    // Vérifie activement auprès de Supabase que le jeton n'est pas révoqué
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return null;
    }

    return sessionData.session;
  } catch {
    return null;
  }
}
