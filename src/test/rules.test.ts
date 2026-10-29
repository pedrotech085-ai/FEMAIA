import { beforeEach, describe, expect, it } from "vitest";
import { checkRateLimit, resetRateLimit } from "@/server/rate-limit";
import { evaluateSharpness } from "@/services/sharpness";
import { canDownloadPdf } from "@/services/pdfExport";
import { FREE_MONTHLY_LIMIT } from "@/constants/curriculum";
import { SubscriptionTier } from "@/types/academic";

describe("limite de demandes IA", () => {
  beforeEach(() => resetRateLimit());
  it("autorise 20 demandes puis bloque la 21e en 10 minutes", () => {
    for (let i = 0; i < 20; i++) expect(checkRateLimit("u1", 1000).allowed).toBe(true);
    expect(checkRateLimit("u1", 1000).allowed).toBe(false);
    expect(checkRateLimit("u2", 1000).allowed).toBe(true);
  });
  it("réautorise après 10 minutes", () => {
    for (let i = 0; i < 20; i++) checkRateLimit("u1", 0);
    expect(checkRateLimit("u1", 10 * 60 * 1000 + 1).allowed).toBe(true);
  });
});

describe("photo floue", () => {
  it("refuse une photo floue ou sombre", () => {
    expect(evaluateSharpness(5, 150).rejected).toBe(true);
    expect(evaluateSharpness(500, 20).rejected).toBe(true);
    expect(evaluateSharpness(500, 150).rejected).toBe(false);
  });
});

describe("forfaits", () => {
  it("quota gratuit de 2 épreuves par mois", () => {
    expect(FREE_MONTHLY_LIMIT).toBe(2);
  });
  it("PDF réservé aux modes Pro et Master", () => {
    expect(canDownloadPdf(SubscriptionTier.FREE)).toBe(false);
    expect(canDownloadPdf(SubscriptionTier.BASIC)).toBe(false);
    expect(canDownloadPdf(SubscriptionTier.PRO)).toBe(true);
    expect(canDownloadPdf(SubscriptionTier.MASTER)).toBe(true);
  });
});

import { countThisMonth } from "@/lib/quota";
describe("quota gratuit fiches et quiz", () => {
  it("compte seulement les éléments du mois courant", () => {
    const recs = [
      { createdAt: "2026-10-02T10:00:00Z" },
      { createdAt: "2026-10-20T10:00:00Z" },
      { createdAt: "2026-09-30T10:00:00Z" },
    ];
    expect(countThisMonth(recs, "2026-10")).toBe(2);
  });
});

import { PLAN_MONTHLY_LIMITS } from "@/lib/quota";
import { PRICING_PLANS } from "@/constants/curriculum";
describe("limites mensuelles par abonnement", () => {
  it("Gratuit 2, Basique 30, Pro 100, Master 300", () => {
    expect(PLAN_MONTHLY_LIMITS).toEqual({ FREE: 2, BASIC: 30, PRO: 100, MASTER: 300 });
  });
  it("les tarifs affichés correspondent aux limites", () => {
    for (const p of PRICING_PLANS) expect(p.monthlyLimit).toBe(PLAN_MONTHLY_LIMITS[p.tier]);
  });
});
