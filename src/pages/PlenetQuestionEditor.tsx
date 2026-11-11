import { useEffect, useState, type FormEvent } from "react";
import { api } from "../api";

type Language = "nl" | "en";

interface CountryOption {
  id: string;
  name: string;
  nameEn: string;
}

interface PlenetQuestion {
  question: string;
  answer: string;
  explanation: string;
}

const CATEGORIES = {
  nl: ["Taal & Schrift", "Muziek & Dans", "Eten & Drinken", "Cultuur & Tradities", "Natuur & Dieren", "Geografie & Weetjes"],
  en: ["Language & Writing", "Music & Dance", "Food & Drink", "Culture & Traditions", "Nature & Wildlife", "Geography & Facts"]
} as const;

export function PlenetQuestionEditor({ onDirtyChange }: { onDirtyChange: (dirty: boolean) => void }) {
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [countryId, setCountryId] = useState("");
  const [language, setLanguage] = useState<Language | "">("");
  const [questions, setQuestions] = useState<PlenetQuestion[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    let active = true;
    void api<{ countries: CountryOption[] }>("/api/admin/plenet-questions")
      .then(result => { if (active) setCountries(result.countries); })
      .catch(reason => {
        if (active) setError(reason instanceof Error ? reason.message : "Could not load Plenet countries.");
      })
      .finally(() => { if (active) setLoadingCountries(false); });
    return () => { active = false; };
  }, []);

  const loadQuestions = async (id: string, selectedLanguage: Language) => {
    setLoadingQuestions(true);
    setError("");
    setSavedMessage("");
    try {
      const result = await api<{ questions: PlenetQuestion[] }>(
        `/api/admin/plenet-questions?countryId=${encodeURIComponent(id)}&language=${selectedLanguage}`
      );
      setQuestions(result.questions);
      setDirty(false);
      onDirtyChange(false);
    } catch (reason) {
      setQuestions([]);
      setError(reason instanceof Error ? reason.message : "Could not load Plenet questions.");
    } finally {
      setLoadingQuestions(false);
    }
  };

  const confirmDiscard = () => !dirty || window.confirm("Discard your unsaved question edits?");

  const selectCountry = (nextCountryId: string) => {
    if (!confirmDiscard()) return;
    setCountryId(nextCountryId);
    setLanguage("");
    setQuestions([]);
    setDirty(false);
    onDirtyChange(false);
    setError("");
    setSavedMessage("");
  };

  const selectLanguage = (nextLanguage: Language | "") => {
    if (!confirmDiscard()) return;
    setLanguage(nextLanguage);
    setQuestions([]);
    setDirty(false);
    onDirtyChange(false);
    setError("");
    setSavedMessage("");
    if (countryId && nextLanguage) void loadQuestions(countryId, nextLanguage);
  };

  const editQuestion = (index: number, field: "question" | "explanation", value: string) => {
    setQuestions(current => current.map((item, itemIndex) =>
      itemIndex === index ? { ...item, [field]: value } : item
    ));
    setDirty(true);
    onDirtyChange(true);
    setSavedMessage("");
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!countryId || !language || questions.length !== 6) return;
    setSaving(true);
    setError("");
    setSavedMessage("");
    try {
      await api("/api/admin/plenet-questions", {
        method: "PUT",
        body: JSON.stringify({
          countryId,
          language,
          questions: questions.map(({ question, explanation }) => ({ question, explanation }))
        })
      });
      setDirty(false);
      onDirtyChange(false);
      setSavedMessage("Question edits saved. They will be used in games started after this change.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save Plenet question edits.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="plenet-question-editor">
      <h2>Edit Plenet questions</h2>
      <p className="muted small">Choose a country, then a language. Answers are read-only; edits apply to games started after saving.</p>
      <div className="plenet-question-selectors">
        <label>
          Country
          <select value={countryId} disabled={loadingCountries || loadingQuestions} onChange={event => selectCountry(event.target.value)}>
            <option value="">{loadingCountries ? "Loading countries…" : "Select a country"}</option>
            {countries.map(country => (
              <option key={country.id} value={country.id}>{country.name} / {country.nameEn}</option>
            ))}
          </select>
        </label>
        <label>
          Language
          <select value={language} disabled={!countryId || loadingQuestions} onChange={event => selectLanguage(event.target.value as Language | "")}>
            <option value="">Select a language</option>
            <option value="nl">Nederlands</option>
            <option value="en">English</option>
          </select>
        </label>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      {savedMessage && <p className="success" role="status">{savedMessage}</p>}
      {loadingQuestions && <p className="muted">Loading questions…</p>}
      {countryId && language && !loadingQuestions && questions.length === 6 && (
        <form onSubmit={event => void save(event)}>
          <div className="plenet-question-list">
            {questions.map((item, index) => (
              <fieldset className="plenet-question-item" key={`${countryId}-${language}-${index}`}>
                <legend>{index + 1}. {CATEGORIES[language][index]}</legend>
                <label>
                  Question
                  <textarea value={item.question} maxLength={400} rows={3} required
                    onChange={event => editQuestion(index, "question", event.target.value)} />
                </label>
                <p className="muted small"><strong>Answer (read-only):</strong> {item.answer}</p>
                <label>
                  Explanation
                  <textarea value={item.explanation} maxLength={1000} rows={3} required
                    onChange={event => editQuestion(index, "explanation", event.target.value)} />
                </label>
              </fieldset>
            ))}
          </div>
          <button className="primary" type="submit" disabled={!dirty || saving}>
            {saving ? "Saving…" : "Save questions"}
          </button>
        </form>
      )}
    </div>
  );
}
