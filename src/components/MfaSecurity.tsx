import { useEffect, useState } from "react";
import { Loader2, ShieldCheck, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const input =
  "w-full min-h-[44px] rounded-xl border border-border bg-background px-3 text-center text-lg tracking-[0.4em] text-foreground";
const NOTE =
  "Cette protection ne vérifie pas votre numéro de téléphone : elle demande un code à 6 chiffres généré par une application (Google Authenticator, Microsoft Authenticator…).";

/** Écran demandé à la connexion quand le compte a activé la double authentification. */
export function MfaChallenge({ onDone }: { onDone: () => void }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const { data } = await supabase.auth.mfa.listFactors();
    const factor = data?.totp.find((f) => f.status === "verified");
    if (!factor) {
      setBusy(false);
      return onDone();
    }
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: factor.id,
      code: code.trim(),
    });
    setBusy(false);
    if (error) return setMsg("Code incorrect ou expiré. Réessayez.");
    onDone();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <form
        onSubmit={verify}
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-7 space-y-4 shadow-sm"
      >
        <ShieldCheck className="w-8 h-8 mx-auto text-primary" />
        <h1 className="text-center font-display text-xl font-semibold text-foreground">
          Code de sécurité
        </h1>
        <p className="text-sm text-muted-foreground text-center">
          Ouvrez votre application d&apos;authentification et entrez le code{" "}
          <span translate="no" className="notranslate">
            Fema
          </span>
          .
        </p>
        <input
          className={input}
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          autoFocus
        />
        {msg && <p className="text-xs text-destructive text-center">{msg}</p>}
        <button
          type="submit"
          disabled={busy || code.length !== 6}
          className="w-full min-h-[48px] rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center disabled:opacity-60"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Valider"}
        </button>
        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          className="w-full text-xs text-muted-foreground"
        >
          Se déconnecter
        </button>
      </form>
    </div>
  );
}

/** Bouton + fenêtre pour activer / désactiver la double authentification. */
export function MfaSettingsButton() {
  const [open, setOpen] = useState(false);
  const [enabledId, setEnabledId] = useState<string | null>(null);
  const [enroll, setEnroll] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const refresh = async () => {
    const { data } = await supabase.auth.mfa.listFactors();
    setEnabledId(data?.totp.find((f) => f.status === "verified")?.id ?? null);
  };
  useEffect(() => {
    if (open) refresh();
  }, [open]);

  const start = async () => {
    setBusy(true);
    setMsg("");
    // Nettoie d'anciennes tentatives non finalisées.
    const { data: list } = await supabase.auth.mfa.listFactors();
    for (const f of list?.all ?? [])
      if (f.status !== "verified") await supabase.auth.mfa.unenroll({ factorId: f.id });
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: `Fema ${Date.now()}`,
    });
    setBusy(false);
    if (error || !data) return setMsg("Activation impossible. Réessayez.");
    setEnroll({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  };

  const confirm = async () => {
    if (!enroll) return;
    setBusy(true);
    setMsg("");
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: enroll.id, code });
    setBusy(false);
    if (error) return setMsg("Code incorrect. Réessayez.");
    setEnroll(null);
    setCode("");
    await refresh();
    setMsg("Double authentification activée.");
  };

  const disable = async () => {
    if (!enabledId) return;
    setBusy(true);
    const { error } = await supabase.auth.mfa.unenroll({ factorId: enabledId });
    setBusy(false);
    if (error) return setMsg("Désactivation impossible. Reconnectez-vous puis réessayez.");
    await refresh();
    setMsg("Double authentification désactivée.");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <ShieldCheck className="w-3.5 h-3.5" /> Sécurité
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 space-y-4 text-left">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-foreground">
                Double authentification
              </h2>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setEnroll(null);
                  setMsg("");
                }}
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">{NOTE}</p>
            {enroll ? (
              <div className="space-y-3">
                <p className="text-sm text-foreground">
                  1. Scannez ce QR code avec votre application.
                </p>
                <img
                  src={enroll.qr}
                  alt="QR code"
                  className="mx-auto w-44 h-44 bg-background rounded-lg"
                />
                <p className="text-[11px] text-muted-foreground break-all text-center">
                  Ou saisissez la clé : {enroll.secret}
                </p>
                <p className="text-sm text-foreground">2. Entrez le code affiché.</p>
                <input
                  className={input}
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                />
                <button
                  type="button"
                  disabled={busy || code.length !== 6}
                  onClick={confirm}
                  className="w-full min-h-[44px] rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60"
                >
                  Activer
                </button>
              </div>
            ) : enabledId ? (
              <button
                type="button"
                disabled={busy}
                onClick={disable}
                className="w-full min-h-[44px] rounded-xl border border-border text-sm font-semibold text-destructive"
              >
                Désactiver
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={start}
                className="w-full min-h-[44px] rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60"
              >
                {busy ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  "Activer la double authentification"
                )}
              </button>
            )}
            {msg && <p className="text-xs text-center text-muted-foreground">{msg}</p>}
          </div>
        </div>
      )}
    </>
  );
}
