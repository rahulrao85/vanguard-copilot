import React, { useId, useRef, useState } from 'react';
import { apiClient } from '../api/client';
import LoadingSpinner from './LoadingSpinner';

type ResultShape =
  | { kind: 'calculate'; data: unknown }
  | { kind: 'entry'; data: unknown }
  | { kind: 'insights'; data: unknown }
  | null;

const S = {
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  } as React.CSSProperties,
  heading: {
    fontSize: '1.15rem',
    fontWeight: 600,
    color: 'var(--color-text-primary)',
  } as React.CSSProperties,
  subheading: {
    fontSize: '0.8rem',
    color: 'var(--color-text-secondary)',
    marginTop: '0.15rem',
  } as React.CSSProperties,
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    padding: '1.5rem',
    background: 'var(--color-bg-card)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  } as React.CSSProperties,
  label: {
    fontSize: '0.8rem',
    fontWeight: 500,
    color: 'var(--color-text-secondary)',
  } as React.CSSProperties,
  textarea: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    background: 'var(--color-bg-secondary)',
    color: 'var(--color-text-primary)',
    fontSize: '0.8rem',
    fontFamily: 'var(--font-mono)',
    outline: 'none',
    resize: 'vertical',
    minHeight: '10rem',
  } as React.CSSProperties,
  fileRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flexWrap: 'wrap',
  } as React.CSSProperties,
  fileInput: {
    display: 'none',
  } as React.CSSProperties,
  fileBtn: {
    padding: '0.55rem 1rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    background: 'var(--color-bg-secondary)',
    color: 'var(--color-text-primary)',
    fontSize: '0.85rem',
    cursor: 'pointer',
  } as React.CSSProperties,
  fileName: {
    fontSize: '0.8rem',
    color: 'var(--color-text-secondary)',
    fontFamily: 'var(--font-mono)',
  } as React.CSSProperties,
  btnPrimary: {
    padding: '0.6rem 1.25rem',
    borderRadius: 'var(--radius-md)',
    border: 'none',
    background: 'var(--color-accent-primary)',
    color: '#fff',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    alignSelf: 'flex-start',
    transition: 'opacity 0.2s ease',
  } as React.CSSProperties,
  btnSecondary: {
    padding: '0.55rem 1rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    background: 'transparent',
    color: 'var(--color-text-secondary)',
    fontSize: '0.8rem',
    fontWeight: 500,
    cursor: 'pointer',
  } as React.CSSProperties,
  feedback: {
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.85rem',
  } as React.CSSProperties,
  feedbackSuccess: {
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.85rem',
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: 'var(--color-accent-success)',
  } as React.CSSProperties,
  feedbackError: {
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.85rem',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: 'var(--color-accent-danger)',
  } as React.CSSProperties,
  resultCard: {
    padding: '1.5rem',
    background: 'var(--color-bg-card)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  } as React.CSSProperties,
  resultHeader: {
    fontSize: '0.8rem',
    color: 'var(--color-accent-primary)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    fontWeight: 600,
    marginBottom: '0.75rem',
  } as React.CSSProperties,
  resultPre: {
    background: 'var(--color-bg-secondary)',
    padding: '1rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    fontSize: '0.78rem',
    fontFamily: 'var(--font-mono)',
    color: 'var(--color-text-primary)',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    maxHeight: '24rem',
    overflow: 'auto',
    lineHeight: 1.6,
  } as React.CSSProperties,
  divider: {
    border: 'none',
    borderTop: '1px solid var(--color-border)',
    margin: '0.25rem 0',
  } as React.CSSProperties,
};

function detectPayloadShape(
  payload: unknown,
): { kind: 'calculate' } | { kind: 'entry' } | { kind: 'insights' } | null {
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as Record<string, unknown>;

  if (p.activity_type && p.description && p.severity) {
    return { kind: 'entry' };
  }

  if (p.context_type && p.input_text && p.target_language) {
    return { kind: 'insights' };
  }

  if (p.gates && Array.isArray(p.gates) && p.stadium_id) {
    return { kind: 'calculate' };
  }

  return null;
}

export default function JuryUploadPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaId = useId();

  const [jsonText, setJsonText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ResultShape>(null);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setJsonText(reader.result as string);
      setFeedback(null);
      setResult(null);
    };
    reader.onerror = () => {
      setFeedback({ type: 'error', message: 'Failed to read file.' });
    };
    reader.readAsText(file);
  }

  function triggerFileSelect() {
    fileInputRef.current?.click();
  }

  async function handleParse() {
    setFeedback(null);
    setResult(null);

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText.trim());
    } catch {
      setFeedback({ type: 'error', message: 'Invalid JSON. Please check your syntax.' });
      return;
    }

    const shape = detectPayloadShape(parsed);
    if (!shape) {
      setFeedback({
        type: 'error',
        message:
          'Unrecognized payload format. Expected shapes: calculate (stadium_id + gates[]), entry (activity_type + description + severity), or insights (context_type + input_text + target_language).',
      });
      return;
    }

    setIsLoading(true);
    try {
      let data: unknown;
      if (shape.kind === 'calculate') {
        data = await apiClient.calculate(parsed as Parameters<typeof apiClient.calculate>[0]);
      } else if (shape.kind === 'entry') {
        data = await apiClient.createEntry(parsed as Parameters<typeof apiClient.createEntry>[0]);
      } else {
        data = await apiClient.generateInsights(
          parsed as Parameters<typeof apiClient.generateInsights>[0],
        );
      }
      setResult({ kind: shape.kind, data });
      setFeedback({
        type: 'success',
        message: `Payload recognized as "${shape.kind}" and processed successfully.`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Request failed';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section style={S.section} aria-label="Jury upload panel">
      <div>
        <h2 style={S.heading}>⚽ Jury Upload</h2>
        <p style={S.subheading}>
          Upload or paste a custom JSON payload for mock data testing
        </p>
      </div>

      <div style={S.form}>
        <div>
          <span style={S.label}>Upload JSON File</span>
          <div style={{ ...S.fileRow, marginTop: '0.35rem' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              style={S.fileInput}
              onChange={handleFileChange}
              aria-label="Select a JSON file to upload"
            />
            <button
              type="button"
              style={S.fileBtn}
              onClick={triggerFileSelect}
            >
              Choose File
            </button>
            {fileName && <span style={S.fileName}>{fileName}</span>}
          </div>
        </div>

        <hr style={S.divider} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <label htmlFor={textareaId} style={S.label}>
            Or Paste JSON Payload
          </label>
          <textarea
            id={textareaId}
            style={S.textarea}
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              setFeedback(null);
              setResult(null);
            }}
            placeholder={`Example calculate payload:
{
  "stadium_id": "metlife",
  "gates": [
    { "gate_id": "gate-a", "sensor_count": 1200, "capacity": 5000 }
  ]
}`}
            aria-label="JSON payload input"
          />
        </div>

        <button
          type="button"
          style={S.btnPrimary}
          onClick={handleParse}
          disabled={isLoading || !jsonText.trim()}
          aria-busy={isLoading}
        >
          {isLoading ? 'Processing...' : 'Parse & Submit'}
        </button>
      </div>

      {isLoading && <LoadingSpinner label="Processing payload..." />}

      {feedback && (
        <div
          style={
            feedback.type === 'success' ? S.feedbackSuccess : S.feedbackError
          }
          role={feedback.type === 'error' ? 'alert' : 'status'}
          aria-live="polite"
        >
          {feedback.message}
        </div>
      )}

      {result && (
        <div style={S.resultCard} aria-live="polite" aria-label="Upload result">
          <span style={S.resultHeader}>
            Result &mdash; {result.kind} endpoint
          </span>
          <pre style={S.resultPre}>
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </div>
      )}
    </section>
  );
}
