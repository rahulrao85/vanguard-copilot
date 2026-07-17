import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const { mockApiClient } = vi.hoisted(() => ({
  mockApiClient: {
    calculate: vi.fn(),
    createEntry: vi.fn(),
    generateInsights: vi.fn(),
  },
}));

vi.mock('../src/api/client', () => ({
  apiClient: mockApiClient,
}));

vi.mock('../src/components/LoadingSpinner', () => ({
  default: ({ label }: { label: string }) => <div data-testid="spinner">{label}</div>,
}));

import JuryUploadPanel from '../src/components/JuryUploadPanel';

describe('JuryUploadPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "Jury Upload" heading', () => {
    render(<JuryUploadPanel />);
    expect(screen.getByRole('heading', { name: 'Jury Upload' })).toBeInTheDocument();
  });

  it('has file input for .json files', () => {
    render(<JuryUploadPanel />);
    const fileInput = screen.getByLabelText('Select a JSON file to upload');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('type', 'file');
    expect(fileInput).toHaveAttribute('accept', '.json,application/json');
  });

  it('has textarea for JSON paste', () => {
    render(<JuryUploadPanel />);
    const textarea = screen.getByLabelText('Or Paste JSON Payload');
    expect(textarea).toBeInTheDocument();
    expect(textarea.tagName).toBe('TEXTAREA');
  });

  it('has a parse/submit button', () => {
    render(<JuryUploadPanel />);
    expect(screen.getByRole('button', { name: /Parse & Submit/i })).toBeInTheDocument();
  });

  it('shows error for invalid JSON input', () => {
    render(<JuryUploadPanel />);
    const textarea = screen.getByLabelText('Or Paste JSON Payload');
    fireEvent.change(textarea, { target: { value: 'not valid json' } });
    fireEvent.click(screen.getByRole('button', { name: /Parse & Submit/i }));
    expect(screen.getByText('Invalid JSON. Please check your syntax.')).toBeInTheDocument();
  });

  it('shows error for unrecognized payload shape', () => {
    render(<JuryUploadPanel />);
    const textarea = screen.getByLabelText('Or Paste JSON Payload');
    fireEvent.change(textarea, { target: { value: '{"foo":"bar"}' } });
    fireEvent.click(screen.getByRole('button', { name: /Parse & Submit/i }));
    expect(screen.getByText(/Unrecognized payload format/i)).toBeInTheDocument();
  });

  it('submits calculate payload successfully', async () => {
    mockApiClient.calculate.mockResolvedValueOnce({ stadium_id: 's1', overall_density_percent: 50 });
    render(<JuryUploadPanel />);
    const textarea = screen.getByLabelText('Or Paste JSON Payload');
    fireEvent.change(textarea, { target: { value: JSON.stringify({ stadium_id: 's1', gates: [{ gate_id: 'g1', sensor_count: 100, capacity: 2000 }] }) } });
    fireEvent.click(screen.getByRole('button', { name: /Parse & Submit/i }));
    expect(await screen.findByText(/calculate endpoint/i)).toBeInTheDocument();
  });

  it('submits entry payload successfully', async () => {
    mockApiClient.createEntry.mockResolvedValueOnce({ entry_id: 'e1', status: 'logged' });
    render(<JuryUploadPanel />);
    const textarea = screen.getByLabelText('Or Paste JSON Payload');
    fireEvent.change(textarea, { target: { value: JSON.stringify({ activity_type: 'crowd_report', description: 'desc', severity: 'info' }) } });
    fireEvent.click(screen.getByRole('button', { name: /Parse & Submit/i }));
    expect(await screen.findByText(/entry endpoint/i)).toBeInTheDocument();
  });

  it('submits insights payload successfully', async () => {
    mockApiClient.generateInsights.mockResolvedValueOnce({ stadium_id: 's1', megaphone_script: 'test' });
    render(<JuryUploadPanel />);
    const textarea = screen.getByLabelText('Or Paste JSON Payload');
    fireEvent.change(textarea, { target: { value: JSON.stringify({ context_type: 'crowd_routing', input_text: 'hello', target_language: 'en' }) } });
    fireEvent.click(screen.getByRole('button', { name: /Parse & Submit/i }));
    expect(await screen.findByText(/insights endpoint/i)).toBeInTheDocument();
  });

  it('has Choose File button for file upload', () => {
    render(<JuryUploadPanel />);
    expect(screen.getByRole('button', { name: /Choose File/i })).toBeInTheDocument();
  });

  it('disables parse button when textarea is empty', () => {
    render(<JuryUploadPanel />);
    const btn = screen.getByRole('button', { name: /Parse & Submit/i });
    expect(btn).toBeDisabled();
  });

  it('form elements have labels', () => {
    render(<JuryUploadPanel />);
    expect(screen.getByText('Upload JSON File')).toBeInTheDocument();
    expect(screen.getByText('Or Paste JSON Payload').closest('label')).toBeInTheDocument();
  });
});
