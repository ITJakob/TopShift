import { useEffect, useMemo, useState } from 'react';
import Auth from './components/Auth.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import MitarbeiterDashboard from './components/MitarbeiterDashboard.jsx';
import OnboardingWizard from './components/OnboardingWizard.jsx';
import DemoAdminLogin from './components/DemoAdminLogin.jsx';
import InviteAccept from './components/InviteAccept.jsx';
import de from './locales/de.json';
import en from './locales/en.json';
import { supabase } from './lib/supabase.js';
import {
  acceptInvitationRemote,
  addAbsenceRequestRemote,
  addDelayReportRemote,
  addEmployeeRemote,
  addSickReportRemote,
  addSwapRequestRemote,
  addTemplateRemote,
  createNotificationRemote,
  deleteShiftRemote,
  loadRemoteWorkspace,
  publishScheduleRemote,
  saveAllowanceRemote,
  saveCompanyRemote,
  saveShiftRemote,
  shouldUseRemote,
  updateAbsenceRequestRemote,
  updateEmployeeRemote,
  updateSwapRequestRemote,
} from './lib/topshiftStore.js';

const translations = { de, en };

const defaultCompany = {
  name: 'TopShift Demo GmbH',
  logo: '',
  country: 'at',
  industry: 'general',
  region: 'at-wien',
  locations: ['Wien Zentrale'],
  plan: 'free',
  onboardingComplete: true,
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
  absenceRequests: [],
  delayReports: [],
  swapRequests: [],
  allowances: {},
  notifications: [],
  invitations: [],
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

function getInviteToken() {
  const inviteMatch = window.location.pathname.match(/^\/invite\/([^/]+)$/);
  if (inviteMatch) {
    return inviteMatch[1];
  }
  const params = new URLSearchParams(window.location.search);
  return params.get('invite');
}

export default function App() {
  const isDemoAdminPage = window.location.pathname === '/demo-admin' || window.location.hash === '#demo-admin';
  const inviteToken = getInviteToken();
  const [language, setLanguage] = useState(() => localStorage.getItem('topshift-language') || 'de');
  const [user, setUser] = useState(null);
  const [state, setState] = useState(loadState);
  const [syncStatus, setSyncStatus] = useState({ mode: 'local', message: 'sync.local' });

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      if (!supabase) {
        return;
      }
      const { data } = await supabase.auth.getSession();
      const sessionUser = data?.session?.user;
      if (!active || !sessionUser) {
        return;
      }
      setUser({
        id: sessionUser.id,
        email: sessionUser.email,
        name: sessionUser.user_metadata?.full_name || sessionUser.email,
        role: 'admin',
        isDemo: false,
      });
    }

    restoreSession();

    const { data: listener } = supabase?.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        return;
      }
      setUser({
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.full_name || session.user.email,
        role: 'admin',
        isDemo: false,
      });
    }) || { data: null };

    return () => {
      active = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem('topshift-language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('topshift-state', JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    let cancelled = false;

    async function loadRemoteData() {
      if (!shouldUseRemote(user)) {
        setSyncStatus({ mode: 'local', message: 'sync.local' });
        return;
      }

      setSyncStatus({ mode: 'loading', message: 'sync.loading' });
      try {
        const result = await loadRemoteWorkspace(user, defaultState, language);
        if (cancelled) {
          return;
        }
        setState(result.state);
        setUser((current) => ({ ...current, ...result.userPatch }));
        setSyncStatus({ mode: 'remote', message: 'sync.remote' });
      } catch (error) {
        if (!cancelled) {
          setSyncStatus({ mode: 'error', message: 'sync.error', detail: error.message });
        }
      }
    }

    loadRemoteData();

    return () => {
      cancelled = true;
    };
  }, [user?.id, language]);

  const t = useMemo(() => {
    const translate = (key, params = {}) => {
      const dictionary = translations[language] || translations.de;
      const fallback = translations.de[key] || key;
      return interpolate(dictionary[key] || fallback, params, translate);
    };
    return translate;
  }, [language]);

  function runRemote(operation) {
    if (!shouldUseRemote(user)) {
      return;
    }

    operation()
      .then(() => setSyncStatus({ mode: 'remote', message: 'sync.remote' }))
      .catch((error) => setSyncStatus({ mode: 'error', message: 'sync.error', detail: error.message }));
  }

  const actions = useMemo(
    () => ({
      setCompany: (company) =>
        setState((current) => {
          const next = { ...current, company };
          runRemote(() => saveCompanyRemote(company));
          return next;
        }),
      addEmployee: (employee) =>
        setState((current) => {
          const created = { ...employee, id: crypto.randomUUID(), inviteToken: crypto.randomUUID() };
          const invitation = {
            id: crypto.randomUUID(),
            employeeId: created.id,
            email: created.email,
            role: created.role,
            token: created.inviteToken,
            status: 'pending',
            expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date().toISOString(),
          };
          const next = {
            ...current,
            employees: [...current.employees, created],
            invitations: [invitation, ...current.invitations],
          };
          runRemote(() => addEmployeeRemote(current.company.id, created));
          return next;
        }),
      updateEmployee: (employeeId, patch) =>
        setState((current) => {
          const next = {
            ...current,
            employees: current.employees.map((employee) =>
              employee.id === employeeId ? { ...employee, ...patch } : employee,
            ),
          };
          runRemote(() => updateEmployeeRemote(current.company.id, employeeId, patch));
          return next;
        }),
      saveShift: (shift) =>
        setState((current) => {
          const exists = current.shifts.some((item) => item.id === shift.id);
          const normalized = { ...shift, id: shift.id || crypto.randomUUID() };
          const notification = {
            id: crypto.randomUUID(),
            type: 'shift',
            textKey: 'notifications.shiftChanged',
            createdAt: new Date().toISOString(),
          };
          const next = {
            ...current,
            shifts: exists
              ? current.shifts.map((item) => (item.id === shift.id ? normalized : item))
              : [...current.shifts, normalized],
            notifications: [notification, ...current.notifications],
          };
          runRemote(async () => {
            await saveShiftRemote(current.company, normalized, user.id);
            await createNotificationRemote(current.company.id, 'shift', notification.textKey);
          });
          return next;
        }),
      deleteShift: (shiftId) =>
        setState((current) => {
          const removed = current.shifts.find((shift) => shift.id === shiftId);
          const notification = {
            id: crypto.randomUUID(),
            type: 'shift',
            textKey: 'notifications.shiftChanged',
            createdAt: new Date().toISOString(),
          };
          const next = {
            ...current,
            shifts: current.shifts.filter((shift) => shift.id !== shiftId),
            swapRequests: current.swapRequests.filter(
              (request) => request.ownShiftId !== shiftId && request.targetShiftId !== shiftId,
            ),
            notifications: removed ? [notification, ...current.notifications] : current.notifications,
          };
          if (removed) {
            runRemote(async () => {
              await deleteShiftRemote(current.company.id, shiftId);
              await createNotificationRemote(current.company.id, 'shift', notification.textKey);
            });
          }
          return next;
        }),
      publishSchedule: () =>
        setState((current) => {
          const notification = {
            id: crypto.randomUUID(),
            type: 'published',
            textKey: 'notifications.newPlan',
            createdAt: new Date().toISOString(),
          };
          const next = {
            ...current,
            shifts: current.shifts.map((shift) =>
              shift.status === 'draft' ? { ...shift, status: 'published' } : shift,
            ),
            notifications: [notification, ...current.notifications],
          };
          runRemote(async () => {
            await publishScheduleRemote(current.company.id);
            await createNotificationRemote(current.company.id, 'published', notification.textKey);
          });
          return next;
        }),
      addTemplate: (template) =>
        setState((current) => {
          const created = { ...template, id: crypto.randomUUID() };
          const next = { ...current, templates: [...current.templates, created] };
          runRemote(() => addTemplateRemote(current.company.id, created));
          return next;
        }),
      addSickReport: (report) =>
        setState((current) => {
          const reportDate = report.date || new Date().toISOString().slice(0, 10);
          const created = {
            ...report,
            id: crypto.randomUUID(),
            date: reportDate,
            createdAt: new Date().toISOString(),
          };
          const notification = {
            id: crypto.randomUUID(),
            type: 'sick',
            textKey: 'notifications.sick',
            createdAt: new Date().toISOString(),
          };
          const next = {
            ...current,
            sickReports: [created, ...current.sickReports],
            shifts: current.shifts.map((shift) =>
              shift.employeeId === report.employeeId && shift.date >= reportDate && shift.status === 'published'
                ? { ...shift, employeeId: '', status: 'unassigned', notes: 'sick-report' }
                : shift,
            ),
            notifications: [notification, ...current.notifications],
          };
          runRemote(async () => {
            await addSickReportRemote(current.company.id, created);
            await createNotificationRemote(current.company.id, 'sick', notification.textKey);
          });
          return next;
        }),
      addAbsenceRequest: (request) =>
        setState((current) => {
          const created = {
            ...request,
            id: crypto.randomUUID(),
            status: 'pending',
            createdAt: new Date().toISOString(),
          };
          const notification = {
            id: crypto.randomUUID(),
            type: 'shift',
            textKey: 'notifications.absence',
            createdAt: new Date().toISOString(),
          };
          const next = {
            ...current,
            absenceRequests: [created, ...current.absenceRequests],
            notifications: [notification, ...current.notifications],
          };
          runRemote(async () => {
            await addAbsenceRequestRemote(current.company.id, created);
            await createNotificationRemote(current.company.id, 'shift', notification.textKey);
          });
          return next;
        }),
      updateAbsenceRequest: (requestId, patch) =>
        setState((current) => {
          const next = {
            ...current,
            absenceRequests: current.absenceRequests.map((request) =>
              request.id === requestId ? { ...request, ...patch } : request,
            ),
          };
          runRemote(() => updateAbsenceRequestRemote(current.company.id, requestId, patch));
          return next;
        }),
      addDelayReport: (report) =>
        setState((current) => {
          const created = {
            ...report,
            id: crypto.randomUUID(),
            date: report.date || new Date().toISOString().slice(0, 10),
            createdAt: new Date().toISOString(),
          };
          const notification = {
            id: crypto.randomUUID(),
            type: 'shift',
            textKey: 'notifications.delay',
            createdAt: new Date().toISOString(),
          };
          const next = {
            ...current,
            delayReports: [created, ...current.delayReports],
            notifications: [notification, ...current.notifications],
          };
          runRemote(async () => {
            await addDelayReportRemote(current.company.id, created);
            await createNotificationRemote(current.company.id, 'shift', notification.textKey);
          });
          return next;
        }),
      addSwapRequest: (request) =>
        setState((current) => {
          const created = {
            ...request,
            id: crypto.randomUUID(),
            status: 'pending',
            createdAt: new Date().toISOString(),
          };
          const notification = {
            id: crypto.randomUUID(),
            type: 'swap',
            textKey: 'notifications.swap',
            createdAt: new Date().toISOString(),
          };
          const next = {
            ...current,
            swapRequests: [created, ...current.swapRequests],
            notifications: [notification, ...current.notifications],
          };
          runRemote(async () => {
            await addSwapRequestRemote(current.company.id, created);
            await createNotificationRemote(current.company.id, 'swap', notification.textKey);
          });
          return next;
        }),
      updateSwapRequest: (requestId, patch) =>
        setState((current) => {
          const next = {
            ...current,
            swapRequests: current.swapRequests.map((request) =>
              request.id === requestId ? { ...request, ...patch } : request,
            ),
          };
          runRemote(() => updateSwapRequestRemote(current.company.id, requestId, patch));
          return next;
        }),
      setAllowance: (employeeId, value) =>
        setState((current) => {
          const next = {
            ...current,
            allowances: { ...current.allowances, [employeeId]: value },
          };
          runRemote(() => saveAllowanceRemote(current.company.id, employeeId, value));
          return next;
        }),
    }),
    [user],
  );

  async function acceptInviteSession(token) {
    await acceptInvitationRemote(token);
    const { data } = await supabase.auth.getSession();
    const sessionUser = data?.session?.user;
    const activeUser = user || (sessionUser
      ? {
          id: sessionUser.id,
          email: sessionUser.email,
          name: sessionUser.user_metadata?.full_name || sessionUser.email,
          role: 'employee',
          isDemo: false,
        }
      : null);

    if (activeUser) {
      const result = await loadRemoteWorkspace(activeUser, defaultState, language);
      setState(result.state);
      setUser({ ...activeUser, ...result.userPatch });
    }
  }

  async function logout() {
    if (shouldUseRemote(user)) {
      await supabase.auth.signOut();
    }
    setUser(null);
  }

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
            <button className="ghost-button" onClick={logout}>
              {t('nav.logout')}
            </button>
          )}
        </div>
      </header>

      {user && (
        <div className={`sync-banner ${syncStatus.mode}`}>
          {t(syncStatus.message)}{syncStatus.detail ? `: ${syncStatus.detail}` : ''}
        </div>
      )}

      {inviteToken ? (
        <InviteAccept
          token={inviteToken}
          user={user}
          localInvitations={state.invitations}
          t={t}
          onAuthenticated={setUser}
          onAccepted={acceptInviteSession}
        />
      ) : !user ? (
        isDemoAdminPage ? (
          <DemoAdminLogin t={t} onAuthenticated={setUser} />
        ) : (
          <Auth t={t} onAuthenticated={setUser} />
        )
      ) : user.role === 'admin' && !state.company.onboardingComplete ? (
        <OnboardingWizard data={state} actions={actions} t={t} />
      ) : user.role === 'admin' ? (
        <AdminDashboard data={state} actions={actions} user={user} t={t} />
      ) : (
        <MitarbeiterDashboard data={state} actions={actions} user={user} t={t} />
      )}
    </div>
  );
}
