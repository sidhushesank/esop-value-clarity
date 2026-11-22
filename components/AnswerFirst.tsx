import type { ReactNode } from "react";

/**
 * Answer-first block. Put it directly under the H1 of every guide and tool page.
 *
 * What it does for AEO/GEO:
 * - The first thing on the page is a 40–60 word direct answer to the query the
 *   page targets. Google can lift it as a snippet; AI engines can quote it whole.
 * - Key numbers sit in a <dl>, so they are concrete figures, not vague prose
 *   (the Princeton GEO study found adding statistics and cited sources raised
 *   visibility in generative answers).
 * - Every figure links its source and shows who reviewed it and when.
 *
 * Plain semantic HTML, server-rendered, no JS needed. Google's AI guide asks for
 * semantic HTML and content that is crawlable without JavaScript.
 */
export interface AnswerFirstProps {
  /** The exact question the page answers, e.g. "What is the exercise price of an ESOP?" */
  question: string;
  /** 40–60 words. Lead with the answer, not with context. */
  answer: ReactNode;
  keyFacts?: { label: string; value: string }[];
  sources?: { title: string; url: string }[];
  /** e.g. "Sheshank Sidheshwar, founder, ESOP Value Clarity" */
  writtenBy: string;
  /** Leave empty until a CA actually reviews the page. Never fake it. */
  reviewedBy?: string;
  lastUpdated: string; // ISO date
}

export function AnswerFirst({
  question,
  answer,
  keyFacts,
  sources,
  writtenBy,
  reviewedBy,
  lastUpdated,
}: AnswerFirstProps) {
  const updated = new Date(lastUpdated + "T00:00:00+05:30").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <section aria-labelledby="quick-answer" className="answer-first">
      <h2 id="quick-answer">{question}</h2>
      <p className="answer-first__answer">{answer}</p>

      {keyFacts && keyFacts.length > 0 && (
        <dl className="answer-first__facts">
          {keyFacts.map((f) => (
            <div key={f.label}>
              <dt>{f.label}</dt>
              <dd>{f.value}</dd>
            </div>
          ))}
        </dl>
      )}

      <p className="answer-first__meta">
        Written by {writtenBy}
        {reviewedBy ? <> · Reviewed by {reviewedBy}</> : null} · Updated{" "}
        <time dateTime={lastUpdated}>{updated}</time>
      </p>

      {sources && sources.length > 0 && (
        <p className="answer-first__sources">
          Sources:{" "}
          {sources.map((s, i) => (
            <span key={s.url}>
              <a href={s.url} rel="noopener" target="_blank">
                {s.title}
              </a>
              {i < sources.length - 1 ? "; " : ""}
            </span>
          ))}
        </p>
      )}
    </section>
  );
}
