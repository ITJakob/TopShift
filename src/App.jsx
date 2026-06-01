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
  addAvailabilityRemote,
  addDelayReportRemote,
  addTimeEntryRemote,
  applyOpenShiftRemote,
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
  updateOpenShiftApplicationRemote,
  updateEmployeeRemote,
  updateSwapRequestRemote,
} from './lib/topshiftStore.js';

const translations = { de, en };

const defaultCompany = {
  name: 'TopShift Demo GmbH',
  logo: '',
  country: 'at',
  industry: 'hospitality',
  region: 'at-wien',
  locations: ['Wien Zentrale', 'Salzburg Hotel', 'Graz Pop-up'],
  plan: 'business',
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
  {
    id: 'emp-4',
    name: 'Samir Novak',
    email: 'samir.novak@example.com',
    role: 'employee',
    contract: 'fullTime',
    weeklyTarget: 38.5,
    isMinor: false,
    preferences: 'Bevorzugt Spätschichten, keine Dienstage.',
    preferredTimes: 'Spät oder Nacht',
    avoidDays: 'Dienstag wegen Ausbildung',
    maxNightShifts: 4,
    otherNotes: 'Kann offene Schichten am Wochenende übernehmen.',
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
    date: todayOffset(1),
    start: '14:00',
    end: '22:00',
    breakMinutes: 30,
    type: 'late',
    location: 'Wien Zentrale',
    status: 'published',
    notes: '',
  },
  {
    id: 'shift-3',
    employeeId: 'emp-4',
    date: todayOffset(2),
    start: '22:00',
    end: '06:00',
    breakMinutes: 45,
    type: 'night',
    location: 'Salzburg Hotel',
    status: 'published',
    notes: 'Demo-Nachtschicht mit Zuschlagsprüfung.',
  },
  {
    id: 'shift-4',
    employeeId: '',
    date: todayOffset(3),
    start: '10:00',
    end: '18:30',
    breakMinutes: 30,
    type: 'mid',
    location: 'Graz Pop-up',
    status: 'unassigned',
    notes: 'Offene Schicht zum Bewerben.',
  },
  {
    id: 'shift-5',
    employeeId: 'emp-1',
    date: todayOffset(5),
    start: '09:00',
    end: '17:30',
    breakMinutes: 30,
    type: 'early',
    location: 'Wien Zentrale',
    status: 'draft',
    notes: 'Entwurf, für Mitarbeiter noch nicht sichtbar.',
  },
  {
    id: 'shift-6',
    employeeId: 'emp-3',
    date: todayOffset(4),
    start: '13:00',
    end: '18:00',
    breakMinutes: 15,
    type: 'mid',
    location: 'Wien Zentrale',
    status: 'published',
    notes: 'Jugendlicher Mitarbeiter.',
  },
];


const defaultState = {
  company: defaultCompany,
  employees: defaultEmployees,
  shifts: defaultShifts,
  sickReports: [
    { id: 'sick-1', employeeId: 'emp-2', date: todayOffset(-1), duration: '2 Tage', createdAt: new Date().toISOString() },
  ],
  absenceRequests: [
    { id: 'abs-1', employeeId: 'emp-1', type: 'vacation', startDate: todayOffset(8), endDate: todayOffset(10), reason: 'Familienurlaub', status: 'pending', createdAt: new Date().toISOString() },
    { id: 'abs-2', employeeId: 'emp-4', type: 'training', startDate: todayOffset(-3), endDate: todayOffset(-3), reason: 'Barista-Schulung', status: 'approved', createdAt: new Date().toISOString() },
  ],
  delayReports: [
    { id: 'delay-1', employeeId: 'emp-1', shiftId: 'shift-1', delayMinutes: 20, message: 'U-Bahn-Störung', date: todayOffset(1), createdAt: new Date().toISOString() },
  ],
  availabilityEntries: [
    { id: 'av-1', employeeId: 'emp-1', date: todayOffset(2), kind: 'unavailable', start: '', end: '', note: 'Arzttermin', createdAt: new Date().toISOString() },
    { id: 'av-2', employeeId: 'emp-4', date: todayOffset(3), kind: 'preferred', start: '10:00', end: '20:00', note: 'Kann offene Schicht übernehmen', createdAt: new Date().toISOString() },
    { id: 'av-3', employeeId: 'emp-2', date: todayOffset(3), kind: 'available', start: '08:00', end: '16:00', note: '', createdAt: new Date().toISOString() },
  ],
  openShiftApplications: [
    { id: 'open-app-1', shiftId: 'shift-4', employeeId: 'emp-4', status: 'pending', message: 'Ich kann die Pop-up-Schicht übernehmen.', createdAt: new Date().toISOString() },
  ],
  timeEntries: [
    { id: 'time-1', employeeId: 'emp-1', shiftId: 'shift-1', type: 'start', occurredAt: `${todayOffset(1)}T08:03:00`, createdAt: new Date().toISOString() },
    { id: 'time-2', employeeId: 'emp-1', shiftId: 'shift-1', type: 'pause_start', occurredAt: `${todayOffset(1)}T12:00:00`, createdAt: new Date().toISOString() },
    { id: 'time-3', employeeId: 'emp-1', shiftId: 'shift-1', type: 'pause_end', occurredAt: `${todayOffset(1)}T12:31:00`, createdAt: new Date().toISOString() },
    { id: 'time-4', employeeId: 'emp-1', shiftId: 'shift-1', type: 'end', occurredAt: `${todayOffset(1)}T16:37:00`, createdAt: new Date().toISOString() },
  ],
  swapRequests: [
    { id: 'swap-1', requesterId: 'emp-1', ownShiftId: 'shift-1', targetEmployeeId: 'emp-4', targetShiftId: '', peerStatus: 'pending', status: 'pending', message: 'Kannst du meinen Frühdienst übernehmen?', createdAt: new Date().toISOString() },
    { id: 'swap-2', requesterId: 'emp-2', ownShiftId: 'shift-2', targetEmployeeId: 'emp-1', targetShiftId: 'shift-1', peerStatus: 'approved', status: 'pending', message: 'Tausch Spät gegen Früh?', createdAt: new Date().toISOString() },
  ],
  allowances: { 'emp-1': 'Sonntagszuschlag prüfen', 'emp-4': 'Nachtzuschlag' },
  notifications: [
    { id: 'note-1', type: 'swap', textKey: 'notifications.swap', createdAt: new Date().toISOString() },
    { id: 'note-2', type: 'sick', textKey: 'notifications.sick', createdAt: new Date().toISOString() },
    { id: 'note-3', type: 'shift', textKey: 'notifications.openShift', createdAt: new Date().toISOString() },
  ],
  invitations: [
    { id: 'inv-1', employeeId: 'emp-3', email: 'mia.huber@example.com', role: 'employee', token: 'demo-invite-mia', status: 'pending', expiresAt: todayOffset(14), createdAt: new Date().toISOString() },
  ],
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
      addAvailability: (entry) =>
        setState((current) => {
          const created = {
            ...entry,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
          };
          const next = {
            ...current,
            availabilityEntries: [created, ...current.availabilityEntries],
          };
          runRemote(() => addAvailabilityRemote(current.company.id, created));
          return next;
        }),
      applyOpenShift: (application) =>
        setState((current) => {
          const created = {
            ...application,
            id: crypto.randomUUID(),
            status: 'pending',
            createdAt: new Date().toISOString(),
          };
          const notification = {
            id: crypto.randomUUID(),
            type: 'shift',
            textKey: 'notifications.openShift',
            createdAt: new Date().toISOString(),
          };
          const next = {
            ...current,
            openShiftApplications: [created, ...current.openShiftApplications],
            notifications: [notification, ...current.notifications],
          };
          runRemote(async () => {
            await applyOpenShiftRemote(current.company.id, created);
            await createNotificationRemote(current.company.id, 'shift', notification.textKey);
          });
          return next;
        }),
      updateOpenShiftApplication: (applicationId, patch) =>
        setState((current) => {
          const application = current.openShiftApplications.find((item) => item.id === applicationId);
          let shifts = current.shifts;
          if (application && patch.status === 'approved') {
            shifts = current.shifts.map((shift) =>
              shift.id === application.shiftId ? { ...shift, employeeId: application.employeeId, status: 'published' } : shift,
            );
          }
          const next = {
            ...current,
            shifts,
            openShiftApplications: current.openShiftApplications.map((item) =>
              item.id === applicationId ? { ...item, ...patch } : item,
            ),
          };
          runRemote(async () => {
            await updateOpenShiftApplicationRemote(current.company.id, applicationId, patch);
            if (application && patch.status === 'approved') {
              const shift = current.shifts.find((item) => item.id === application.shiftId);
              if (shift) {
                await saveShiftRemote(current.company, { ...shift, employeeId: application.employeeId, status: 'published' }, user.id);
              }
            }
          });
          return next;
        }),
      addTimeEntry: (entry) =>
        setState((current) => {
          const created = {
            ...entry,
            id: crypto.randomUUID(),
            occurredAt: entry.occurredAt || new Date().toISOString(),
            createdAt: new Date().toISOString(),
          };
          const next = {
            ...current,
            timeEntries: [created, ...current.timeEntries],
          };
          runRemote(() => addTimeEntryRemote(current.company.id, created));
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
          <DemoAdminLogin
            t={t}
            onAuthenticated={(demoUser) => {
              localStorage.removeItem('topshift-state');
              setState(defaultState);
              setUser(demoUser);
            }}
          />
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
