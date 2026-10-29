import { useRef, useState } from "react";
import { FileUp, Loader2, Send, X } from "lucide-react";
import { askCoursePdfRequest } from "../services/api";
import { MathMarkdown } from "./MathMarkdown";

type Msg = { role: "user" | "assistant"; text: string };
const MAX_BYTES = 10 * 1024 * 1024;

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] || "");
    r.onerror = () => reject(new Error("Lecture du PDF impossible."));
    r.readAsDataURL(file);
  });
}

/** Posez des questions sur un PDF de cours importé ; les réponses s'appuient sur son contenu. */
export function CoursePdfView({ subjectName }: { subjectName: string }) {
  const [pdf, setPdf] = useState<{ name: string; base64: string } | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = async (file?: File) => {
    setError("");
    if (!file) return;
    if (file.type !== "application/pdf") return setError("Seuls les fichiers PDF sont acceptés.");
    if (file.size > MAX_BYTES) return setError("PDF trop volumineux (10 Mo maximum).");
    try {
      setPdf({ name: file.name, base64: await toBase64(file) });
      setMessages([]);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const ask = async () => {
    const q = question.trim();
    if (!pdf || !q || busy) return;
    setError("");
    setBusy(true);
    const history = messages;
    setMessages([...history, { role: "user", text: q }]);
    setQuestion("");
    try {
      const { answer } = await askCoursePdfRequest({
        pdfBase64: pdf.base64,
        fileName: pdf.name,
        question: q,
        history,
        subjectName,
      });
      setMessages((m) => [...m, { role: "assistant", text: answer }]);
    } catch (e) {
      setMessages(history);
      setQuestion(q);
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-semibold text-foreground">
          Questions sur mes cours PDF
        </h2>
        <p className="text-sm text-muted-foreground">
          Importez votre cours, puis posez vos questions : Fema IA répond en s&apos;appuyant sur son
          contenu.
        </p>
      </div>

      {!pdf ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full rounded-xl border-2 border-dashed border-border bg-card p-8 flex flex-col items-center gap-2 text-sm text-muted-foreground hover:border-primary"
        >
          <FileUp className="w-6 h-6 text-primary" />
          Importer un PDF de cours (10 Mo max.)
        </button>
      ) : (
        <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm">
          <span className="truncate font-medium text-foreground">{pdf.name}</span>
          <button
            type="button"
            aria-label="Retirer le PDF"
            onClick={() => {
              setPdf(null);
              setMessages([]);
            }}
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {messages.length > 0 && (
        <div className="space-y-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`rounded-xl px-4 py-3 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground ml-auto max-w-[85%]" : "bg-card border border-border"}`}
            >
              {m.role === "user" ? m.text : <MathMarkdown content={m.text} />}
            </div>
          ))}
        </div>
      )}

      {busy && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Fema IA lit votre cours…
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {pdf && (
        <div className="flex gap-2">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                ask();
              }
            }}
            placeholder="Ex. : Explique-moi le théorème de la page 4 avec un exemple."
            rows={2}
            className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={ask}
            disabled={busy || !question.trim()}
            className="rounded-xl bg-primary px-4 text-primary-foreground disabled:opacity-50"
            aria-label="Envoyer la question"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
