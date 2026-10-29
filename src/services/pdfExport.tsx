import { renderToStaticMarkup } from "react-dom/server";
import { MathMarkdown } from "../components/MathMarkdown";
import { ExamCorrectionRecord, SubscriptionTier } from "../types/academic";

/** Téléchargement PDF réservé aux forfaits Pro et Master. */
export function canDownloadPdf(tier: SubscriptionTier): boolean {
  return tier === SubscriptionTier.PRO || tier === SubscriptionTier.MASTER;
}

const escapeHtml = (v: string) =>
  v.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/**
 * Ouvre la correction dans une fenêtre d'impression : l'élève choisit
 * « Enregistrer au format PDF ». Les formules LaTeX restent rendues.
 */
export function downloadCorrectionPdf(record: ExamCorrectionRecord) {
  const w = window.open("", "_blank");
  if (!w) return;
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((n) => n.outerHTML)
    .join("\n");
  const body = renderToStaticMarkup(
    <>
      <MathMarkdown content={record.correctionMarkdown} />
      {record.proMethodNotes ? (
        <MathMarkdown content={`### Notes de méthode\n\n${record.proMethodNotes}`} />
      ) : null}
    </>,
  );
  const date = new Date(record.createdAt).toLocaleDateString("fr-FR");
  w.document
    .write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${escapeHtml(record.title)}</title>${styles}
<style>@page{size:A4;margin:14mm}body{background:#fff;padding:0 4mm;font-size:13px}h1{font-size:20px;margin:0 0 4px}.meta{color:#555;font-size:12px;margin-bottom:16px}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}pre,.katex-display{break-inside:avoid}</style>
</head><body><h1>${escapeHtml(record.title)}</h1><div class="meta">${escapeHtml(record.subjectName)} · ${date} · <span translate="no" class="notranslate">Fema</span></div>${body}</body></html>`);
  w.document.close();
  w.onload = () => setTimeout(() => w.print(), 300);
}
