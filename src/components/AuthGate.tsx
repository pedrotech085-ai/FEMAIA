import femaLogo from "@/assets/fema-ia-logo.png.asset.json";
import { useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { BookOpen, CheckCircle2, Loader2, LogOut, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  getValidSession,
  resetPasswordForEmail,
  signInWithEmail,
  signInWithOAuth,
  signOutUser,
  signUpWithEmail,
} from "@/services/authService";
import { MfaChallenge, MfaSettingsButton } from "./MfaSecurity";

const OWNER_KEY = "fema_educ_owner_uid";

/** Efface les données locales si un autre compte se connecte sur le même appareil. */
function bindLocalDataToUser(userId: string) {
  const previous = localStorage.getItem(OWNER_KEY);
  if (previous && previous !== userId) {
    Object.keys(localStorage)
      .filter((k) => k.startsWith("fema_educ_") && k !== OWNER_KEY)
      .forEach((k) => localStorage.removeItem(k));
  }
  localStorage.setItem(OWNER_KEY, userId);
}

export async function signOut() {
  await signOutUser();
}

export function SignOutButton() {
  return (
    <span className="inline-flex items-center gap-4">
      <MfaSettingsButton />
      <button
        type="button"
        onClick={signOut}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <LogOut className="w-3.5 h-3.5" /> Déconnexion
      </button>
    </span>
  );
}

type AuthMode = "login" | "signup" | "forgot";

function PasswordAuth() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMsg("Veuillez saisir une adresse e-mail valide.");
      return;
    }

    if (mode === "forgot") {
      setBusy(true);
      const res = await resetPasswordForEmail(cleanEmail);
      setBusy(false);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg(
          "Un lien de réinitialisation vous a été envoyé. Veuillez vérifier votre boîte de réception.",
        );
      }
      return;
    }

    if (pwd.length < 6) {
      setErrorMsg("Le mot de passe doit comporter au moins 6 caractères.");
      return;
    }

    if (mode === "signup" && !name.trim()) {
      setErrorMsg("Veuillez saisir votre prénom et nom.");
      return;
    }

    setBusy(true);
    if (mode === "signup") {
      const res = await signUpWithEmail(cleanEmail, pwd, name);
      setBusy(false);
      if (res.error) {
        setErrorMsg(res.error);
      } else if (res.needsEmailConfirmation) {
        setSuccessMsg(
          "Votre compte a été créé avec succès ! Un e-mail de confirmation vous a été envoyé. Veuillez vérifier votre boîte mail avant de vous connecter.",
        );
        setMode("login");
      }
    } else {
      const res = await signInWithEmail(cleanEmail, pwd);
      setBusy(false);
      if (res.error) {
        setErrorMsg(res.error);
      }
    }
  };

  const inputClass =
    "w-full min-h-[44px] rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow";

  return (
    <div className="space-y-3.5">
      {/* Sélecteur d'onglets Connexion / Inscription */}
      {mode !== "forgot" && (
        <div className="grid grid-cols-2 rounded-xl bg-muted p-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className={`rounded-lg py-1.5 transition-colors ${
              mode === "login"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Se connecter
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className={`rounded-lg py-1.5 transition-colors ${
              mode === "signup"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Créer un compte
          </button>
        </div>
      )}

      {successMsg && (
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-xs text-primary flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          {errorMsg}
        </div>
      )}

      <form onSubmit={submit} className="space-y-2.5">
        {mode === "signup" && (
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1">
              Nom complet
            </label>
            <input
              className={inputClass}
              placeholder="Prénom et Nom"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />
          </div>
        )}

        <div>
          <label className="block text-[11px] font-medium text-muted-foreground mb-1">
            Adresse e-mail
          </label>
          <input
            className={inputClass}
            type="email"
            placeholder="etudiant@exemple.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        {mode !== "forgot" && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-medium text-muted-foreground">
                Mot de passe
              </label>
              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot");
                    setErrorMsg("");
                    setSuccessMsg("");
                  }}
                  className="text-[11px] text-primary hover:underline"
                >
                  Mot de passe oublié ?
                </button>
              )}
            </div>
            <input
              className={inputClass}
              type="password"
              placeholder="••••••••"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
            />
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full min-h-[46px] rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60 transition-opacity mt-2"
        >
          {busy ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : mode === "signup" ? (
            "Créer mon compte"
          ) : mode === "forgot" ? (
            "Envoyer le lien de réinitialisation"
          ) : (
            "Se connecter"
          )}
        </button>

        {mode === "forgot" && (
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className="w-full text-xs text-muted-foreground hover:text-foreground text-center pt-1"
          >
            ← Retour à la connexion
          </button>
        )}
      </form>
    </div>
  );
}

const TERMS_VERSION = "2026-10";

const TERMS: string[] = [
  "Notre mission : Fema existe pour accompagner sincèrement les élèves et les étudiants afin qu'ils deviennent plus forts, plus autonomes et plus confiants dans leurs études.",
  "Honnêteté et transparence : nous refusons toute forme d'arnaque ou de fraude. Aucun frais caché, aucune promesse mensongère. Les prix et ce qu'ils incluent sont toujours affichés clairement avant tout paiement.",
  "Corrections indicatives : les corrections sont produites par une intelligence artificielle. Elles servent à apprendre et à comprendre ; elles ne remplacent pas un enseignant et peuvent parfois contenir des erreurs.",
  "Apprendre, pas tricher : l'application est un outil de révision et d'entraînement. Il est interdit de l'utiliser pour frauder pendant un examen, un devoir surveillé ou un concours.",
  "Votre compte : vous êtes responsable de votre mot de passe et de l'exactitude des informations que vous fournissez. Un compte est personnel et ne doit pas être partagé.",
  "Vos contenus : vous restez propriétaire des photos, PDF et textes que vous envoyez. Vous vous engagez à ne pas envoyer de contenus illégaux, offensants ou appartenant à d'autres sans autorisation.",
  "Vos données : votre profil et votre historique sont stockés de façon sécurisée. Ils ne sont jamais vendus ni cédés à des tiers à des fins publicitaires. Vous pouvez demander la suppression de votre compte à tout moment.",
  "Respect et bienveillance : Fema s'engage à traiter chaque utilisateur avec respect, quel que soit son niveau, et à proposer des explications claires et encourageantes.",
  "Mineurs : si vous avez moins de 18 ans, nous vous encourageons à utiliser l'application avec l'accord d'un parent ou tuteur, notamment pour tout abonnement payant.",
  "Abonnements : les formules payantes sont facultatives. L'accès gratuit reste disponible dans les limites indiquées. Toute réclamation est étudiée avec sérieux et de bonne foi.",
  "Sessions : l'application garde votre session sur cet appareil pour vous reconnecter automatiquement. Déconnectez-vous sur un appareil partagé.",
  "Usage abusif : toute tentative de fraude, de piratage, de revente d'accès ou d'atteinte aux autres utilisateurs peut entraîner la suspension du compte.",
  "Évolution : ces conditions peuvent évoluer pour mieux vous protéger. En cas de changement important, vous serez invité à les accepter à nouveau.",
];

function TermsGate({ userId, children }: { userId: string; children: ReactNode }) {
  const [state, setState] = useState<"loading" | "needed" | "ok">("loading");
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    supabase
      .from("consents")
      .select("terms_version")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          // Si la table consents n'existe pas encore ou erreur réseau, autoriser le passage
          setState("ok");
          return;
        }
        setState(data?.terms_version === TERMS_VERSION ? "ok" : "needed");
      })
      .catch(() => setState("ok"));
  }, [userId]);

  const accept = async () => {
    setBusy(true);
    setErr("");
    const { error } = await supabase.from("consents").upsert({
      user_id: userId,
      terms_version: TERMS_VERSION,
      accepted_at: new Date().toISOString(),
    });
    setBusy(false);
    if (error) {
      setState("ok");
      return;
    }
    setState("ok");
  };

  if (state === "ok") return <>{children}</>;
  if (state === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-7 space-y-5 shadow-sm">
        <h1 className="font-display text-xl font-semibold text-foreground text-center">
          Conditions d&apos;utilisation
        </h1>
        <div className="max-h-[50vh] overflow-y-auto rounded-lg border border-border bg-muted p-4 text-xs text-muted-foreground space-y-2.5">
          {TERMS.map((t, i) => (
            <p key={i}>
              {i + 1}. {t}
            </p>
          ))}
        </div>
        <label className="flex items-start gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 rounded border-border"
          />
          <span>J&apos;ai lu et j&apos;accepte ces conditions d&apos;utilisation.</span>
        </label>
        {err && <p className="text-xs text-destructive">{err}</p>}
        <button
          type="button"
          disabled={!checked || busy}
          onClick={accept}
          className="w-full min-h-[48px] rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center disabled:opacity-60"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Valider et continuer"}
        </button>
        <button
          type="button"
          onClick={signOut}
          className="w-full text-xs font-medium text-muted-foreground"
        >
          Refuser et se déconnecter
        </button>
      </div>
    </div>
  );
}

export function AuthGate({ children }: { children: (session: Session) => ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [busyOAuth, setBusyOAuth] = useState<"google" | "apple" | null>(null);
  const [oauthError, setOauthError] = useState("");
  const [needMfa, setNeedMfa] = useState(false);

  useEffect(() => {
    const checkMfa = async (s: Session | null) => {
      if (!s) return setNeedMfa(false);
      try {
        const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        setNeedMfa(data?.nextLevel === "aal2" && data.currentLevel !== "aal2");
      } catch {
        setNeedMfa(false);
      }
    };

    // Abonnement aux changements d'état d'authentification Supabase (session persistante)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (s?.user) {
        bindLocalDataToUser(s.user.id);
      }
      setSession(s);
      setTimeout(() => void checkMfa(s), 0);
    });

    // Chargement initial de la session Supabase stockée
    getValidSession()
      .then(async (validSession) => {
        if (validSession?.user) {
          bindLocalDataToUser(validSession.user.id);
          await checkMfa(validSession);
          setSession(validSession);
        } else {
          setSession(null);
        }
      })
      .finally(() => {
        setReady(true);
      });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleOAuth = async (provider: "google" | "apple") => {
    setOauthError("");
    setBusyOAuth(provider);
    const res = await signInWithOAuth(provider);
    if (res.error) {
      setOauthError(res.error);
      setBusyOAuth(null);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (session && needMfa) return <MfaChallenge onDone={() => setNeedMfa(false)} />;
  if (session) return <TermsGate userId={session.user.id}>{children(session)}</TermsGate>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-7 space-y-6 shadow-sm">
        <div className="space-y-3 text-center">
          <img
            src={femaLogo.url}
            alt="Fema IA"
            className="w-16 h-16 mx-auto rounded-xl object-cover"
          />
          <h1
            translate="no"
            className="notranslate font-display text-2xl font-semibold text-foreground"
          >
            Fema IA
          </h1>
          <p className="text-sm text-muted-foreground">
            Connectez-vous avec votre compte Supabase pour faire corriger vos épreuves et synchroniser votre espace.
          </p>
        </div>

        {/* Fournisseurs OAuth */}
        <div className="space-y-2.5">
          <button
            type="button"
            disabled={!!busyOAuth}
            onClick={() => handleOAuth("google")}
            className="w-full min-h-[46px] rounded-xl border border-border bg-background hover:bg-muted text-sm font-semibold text-foreground flex items-center justify-center gap-3 disabled:opacity-60 transition-colors"
          >
            {busyOAuth === "google" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden>
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.96 10.96 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
                />
              </svg>
            )}
            Continuer avec Google
          </button>
          <button
            type="button"
            disabled={!!busyOAuth}
            onClick={() => handleOAuth("apple")}
            className="w-full min-h-[46px] rounded-xl bg-foreground hover:opacity-90 text-sm font-semibold text-background flex items-center justify-center gap-3 disabled:opacity-60 transition-opacity"
          >
            {busyOAuth === "apple" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden>
                <path d="M16.37 12.6c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.47.83-.72 0-1.82-.81-2.99-.79-1.54.02-2.96.9-3.75 2.27-1.6 2.78-.41 6.89 1.15 9.14.76 1.1 1.67 2.34 2.86 2.3 1.15-.05 1.58-.74 2.97-.74 1.38 0 1.77.74 2.98.72 1.24-.02 2.02-1.12 2.77-2.23.87-1.28 1.23-2.52 1.25-2.58-.03-.01-2.39-.92-2.41-3.66zM14.1 5.86c.63-.77 1.06-1.83.94-2.89-.91.04-2.02.61-2.67 1.37-.58.67-1.1 1.76-.96 2.8 1.02.08 2.06-.52 2.69-1.28z" />
              </svg>
            )}
            Continuer avec Apple
          </button>
        </div>

        {oauthError && (
          <p className="text-xs text-destructive text-center">{oauthError}</p>
        )}

        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> ou avec votre e-mail <div className="h-px flex-1 bg-border" />
        </div>

        {/* Formulaire d'authentification par e-mail Supabase */}
        <PasswordAuth />

        <p className="text-[11px] text-center text-muted-foreground">
          Les conditions d&apos;utilisation vous seront présentées lors de votre première connexion.
        </p>
      </div>
    </div>
  );
}
