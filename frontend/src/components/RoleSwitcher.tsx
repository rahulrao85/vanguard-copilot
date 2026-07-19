import { useTranslation } from 'react-i18next';
import { useRoleStore, type Persona } from '../store/useRoleStore';

const ROLES: { key: Persona; icon: string; labelKey: string }[] = [
  { key: 'fan', icon: '\uD83C\uDFDF\uFE0F', labelKey: 'role.fan' },
  { key: 'organizer', icon: '\uD83D\uDCCA', labelKey: 'role.organizer' },
  { key: 'volunteer', icon: '\uD83D\uDC65', labelKey: 'role.volunteer' },
  { key: 'staff', icon: '\uD83C\uDF93', labelKey: 'role.staff' },
];

export default function RoleSwitcher() {
  const { t } = useTranslation();
  const { persona, setPersona } = useRoleStore();

  return (
    <div className="role-switcher" role="group" aria-label={t('role.switch')}>
      {ROLES.map((r) => (
        <button
          key={r.key}
          className={`role-btn${persona === r.key ? ' active' : ''}`}
          onClick={() => setPersona(r.key)}
          aria-pressed={persona === r.key}
          type="button"
        >
          <span aria-hidden="true" className="role-icon">{r.icon}</span>
          <span className="role-label">{t(r.labelKey)}</span>
        </button>
      ))}
    </div>
  );
}
