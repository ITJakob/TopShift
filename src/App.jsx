import { useEffect, useMemo, useState } from 'react';
import Auth from './components/Auth.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import MitarbeiterDashboard from './components/MitarbeiterDashboard.jsx';
import de from './locales/de.json';
import en from './locales/en.json';

const translations = { de, en };

const defaultCompany = {
  name: 'TopShift Demo GmbH',
  logo: '',
  country: 'at',
  industry: 'general',
  locations: ['Wien Zentrale'],
  plan: 'free',
};

const defaultEmployees = [
  {
    id: 'emp-1',
    name: 'Anna Berger',
    email: 'anna.berger@example.com',
    role: 'employee',
    contract: 'fullTime',
    weeklyTarget: 40,
    isMinor: false,
    preferences: 'Keine Nachtschicht am Sonntag. Max. 3 Nachtschichten pro Monat.',
    preferredTimes: 'Früh oder Mittel',
    avoidDays: 'Sonntag wegen Betreuungspflichten',
    maxNightShifts: 3,
    otherNotes: 'Kann kurzfristig einspringen.',
  },
  {
    id: 'emp-2',
    name: 'Lukas Steiner',
    email: 'lukas.steiner@example.com',
    role: 'employee',
    contract: 'partTime',
    weeklyTarget: 24,
    isMinor: false,
    preferences: 'Montag früh vermeiden.',
    preferredTimes: 'Spät',
    avoidDays: 'Montag früh',
    maxNightShifts: 2,
    otherNotes: '',
  },
  {
    id: 'emp-3',
    name: 'Mia Huber',
    email: 'mia.huber@example.com',
    role: 'employee',
    contract: 'mini',
    weeklyTarget: 10,
    isMinor: true,
    preferences: 'Keine Nachtarbeit.',
    preferredTimes: 'Nachmittags',
    avoidDays: 'Freitag Abend',
    maxNightShifts: 0,
    otherNotes: 'Jugendlich, strengere Regeln aktiv.',
  },
];

const defaultShifts = [
  {
    id: 'shift-1',
    employeeId: 'emp-1',
    date: todayOffset(1),
    start: '08:00',
    end: '16:30',
    breakMinutes: 30,
    type: 'early',
    location: 'Wien Zentrale',
    status: 'published',
    notes: '',
  },
  {
    id: 'shift-2',
    employeeId: 'emp-2',
    date: todayOffset(2),
    start: '14:00',
    end: '22:00',
    breakMinutes: 30,
    type: 'late',
    location: 'Wien Zentrale',
    status: 'draft',
    notes: '',
  },
];

const defaultState = {
  company: defaultCompany,
  employees: defaultEmployees,
  shifts: defaultShifts,
  sickReports: [],
  swapRequests: [],
  allowances: {},
  notifications: [],
  templates: [
    { id: 'tpl-early', name: 'Früh 08-16:30', start: '08:00', end: '16:30', breakMinutes: 30, type: 'early' },
    { id: 'tpl-night', name: 'Nacht 22-06', start: '22:00', end: '06:00', breakMinutes: 45, type: 'night' },
  ],
};

function todayOffset(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function loadState() {
  try {
    const stored = localStorage.getItem('topshift-state');
    return stored ? { ...defaultState, ...JSON.parse(stored) } : defaultState;
  } catch {
    return defaultState;
  }
}

function interpolate(template, params, translate) {
  return template.replace(/\{\{(.*?)\}\}/g, (_, key) => {
    const value = params?.[key.trim()];
    if (typeof value === 'string' && value.startsWith('laws.')) {
      return translate(value);
    }
    return value ?? '';
  });
}

export default function App() {
  const [language, setLanguage] = useState(() => localStorage.getItem('topshift-language') || 'de');
  const [user, setUser] = useState(null);
  const [state, setState] = useState(loadState);

  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem('topshift-language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('topshift-state', JSON.stringify(state));
  }, [state]);

  const t = useMemo(() => {
    const translate = (key, params = {}) => {
      const dictionary = translations[language] || translations.de;
      const fallback = translations.de[key] || key;
      return interpolate(dictionary[key] || fallback, params, translate);
    };
    return translate;
  }, [language]);

  const actions = useMemo(
    () => ({
      setCompany: (company) => setState((current) => ({ ...current, company })),
      addEmployee: (employee) =>
        setState((current) => ({
          ...current,
          employees: [...current.employees, { ...employee, id: crypto.randomUUID() }],
        })),
      updateEmployee: (employeeId, patch) =>
        setState((current) => ({
          ...current,
          employees: current.employees.map((employee) =>
            employee.id === employeeId ? { ...employee, ...patch } : employee,
          ),
        })),
      saveShift: (shift) =>
        setState((current) => {
          const exists = current.shifts.some((item) => item.id === shift.id);
          const normalized = { ...shift, id: shift.id || crypto.randomUUID() };
          return {
            ...current,
            shifts: exists
              ? current.shifts.map((item) => (item.id === shift.id ? normalized : item))
              : [...current.shifts, normalized],
            notifications: [
              {
                id: crypto.randomUUID(),
                type: 'shift',
                textKey: 'notifications.shiftChanged',
                createdAt: new Date().toISOString(),
              },
              ...current.notifications,
            ],
          };
        }),
      publishSchedule: () =>
        setState((current) => ({
          ...current,
          shifts: current.shifts.map((shift) =>
            shift.status === 'draft' ? { ...shift, status: 'published' } : shift,
          ),
          notifications: [
            {
              id: crypto.randomUUID(),
              type: 'published',
              textKey: 'notifications.newPlan',
              createdAt: new Date().toISOString(),
            },
            ...current.notifications,
          ],
        })),
      addTemplate: (template) =>
        setState((current) => ({
          ...current,
          templates: [...current.templates, { ...template, id: crypto.randomUUID() }],
        })),
      addSickReport: (report) =>
        setState((current) => {
          const reportDate = report.date || new Date().toISOString().slice(0, 10);
          return {
            ...current,
            sickReports: [
              {
                ...report,
                id: crypto.randomUUID(),
                date: reportDate,
                createdAt: new Date().toISOString(),
              },
              ...current.sickReports,
            ],
            shifts: current.shifts.map((shift) =>
              shift.employeeId === report.employeeId && shift.date >= reportDate && shift.status === 'published'
                ? { ...shift, employeeId: '', status: 'unassigned', notes: 'sick-report' }
                : shift,
            ),
            notifications: [
              {
                id: crypto.randomUUID(),
                type: 'sick',
                textKey: 'notifications.sick',
                createdAt: new Date().toISOString(),
              },
              ...current.notifications,
            ],
          };
        }),
      addSwapRequest: (request) =>
        setState((current) => ({
          ...current,
          swapRequests: [
            {
              ...request,
              id: crypto.randomUUID(),
              status: 'pending',
              createdAt: new Date().toISOString(),
            },
            ...current.swapRequests,
          ],
          notifications: [
            {
              id: crypto.randomUUID(),
              type: 'swap',
              textKey: 'notifications.swap',
              createdAt: new Date().toISOString(),
            },
            ...current.notifications,
          ],
        })),
      updateSwapRequest: (requestId, patch) =>
        setState((current) => ({
          ...current,
          swapRequests: current.swapRequests.map((request) =>
            request.id === requestId ? { ...request, ...patch } : request,
          ),
        })),
      setAllowance: (employeeId, value) =>
        setState((current) => ({
          ...current,
          allowances: { ...current.allowances, [employeeId]: value },
        })),
    }),
    [],
  );

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">TS</div>
          <div>
            <strong>{t('app.name')}</strong>
            <span>{t('app.tagline')}</span>
          </div>
        </div>
        <div className="topbar-actions">
          <div className="language-switch" aria-label={t('common.language')}>
            <button className={language === 'de' ? 'active' : ''} onClick={() => setLanguage('de')}>
              {t('common.de')}
            </button>
            <button className={language === 'en' ? 'active' : ''} onClick={() => setLanguage('en')}>
              {t('common.en')}
            </button>
          </div>
          {user && (
            <button className="ghost-button" onClick={() => setUser(null)}>
              {t('nav.logout')}
            </button>
          )}
        </div>
      </header>

      {!user ? (
        <Auth t={t} onAuthenticated={setUser} />
      ) : user.role === 'admin' ? (
        <AdminDashboard data={state} actions={actions} user={user} t={t} />
      ) : (
        <MitarbeiterDashboard data={state} actions={actions} user={user} t={t} />
      )}
    </div>
  );
}
