import { vi, describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RoleSwitcher from '../src/components/RoleSwitcher';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

const mockSetPersona = vi.fn();

vi.mock('../src/store/useRoleStore', () => ({
  useRoleStore: vi.fn(() => ({ persona: 'volunteer', setPersona: mockSetPersona })),
}));

describe('RoleSwitcher', () => {
  it('renders all 4 persona buttons', () => {
    render(<RoleSwitcher />);
    expect(screen.getByRole('button', { name: /role\.fan/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /role\.organizer/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /role\.volunteer/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /role\.staff/i })).toBeInTheDocument();
  });

  it('highlights the active persona with active class', () => {
    render(<RoleSwitcher />);
    const active = screen.getByRole('button', { name: /role\.volunteer/i });
    expect(active.className).toContain('active');
  });

  it('calls setPersona when a different role is clicked', () => {
    render(<RoleSwitcher />);
    fireEvent.click(screen.getByRole('button', { name: /role\.fan/i }));
    expect(mockSetPersona).toHaveBeenCalledWith('fan');
  });
});
