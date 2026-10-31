import { useState, type FormEvent } from "react";
import { api } from "../api";

type FeedbackKind = "report" | "recommendation";

export function WordFeedbackModal() {
  const [reportWord, setReportWord] = useState("");
  const [recommendedWord, setRecommendedWord] = useState("");
  const [submitting, setSubmitting] = useState<FeedbackKind | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const submit = async (event: FormEvent, kind: FeedbackKind) => {
    event.preventDefault();
    const word = kind === "report" ? reportWord : recommendedWord;
    setSubmitting(kind);
    setError("");
    setSuccess("");
    try {
      const result = await api<{ message: string }>("/api/word-feedback", {
        method: "POST",
        body: JSON.stringify({ word, kind })
      });
      setSuccess(result.message);
      if (kind === "report") setReportWord("");
      else setRecommendedWord("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not submit word feedback.");
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="word-feedback">
      <p className="muted small">Feedback is sent to the admins. Reports do not remove words, and recommendations do not add them automatically.</p>
      <form onSubmit={event => void submit(event, "report")}>
        <label>
          Report a word
          <input value={reportWord} onChange={event => setReportWord(event.target.value)} maxLength={60} required />
        </label>
        <button type="submit" disabled={submitting !== null}>{submitting === "report" ? "Sending…" : "Report word"}</button>
      </form>
      <form onSubmit={event => void submit(event, "recommendation")}>
        <label>
          Recommend a word
          <input value={recommendedWord} onChange={event => setRecommendedWord(event.target.value)} maxLength={60} required />
        </label>
        <button type="submit" disabled={submitting !== null}>{submitting === "recommendation" ? "Sending…" : "Recommend word"}</button>
      </form>
      {error && <p className="error" role="alert">{error}</p>}
      {success && <p className="muted small" role="status">{success}</p>}
    </div>
  );
}
