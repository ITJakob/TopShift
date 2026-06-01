import { useMemo, useState } from 'react';
import Schichttausch from './Schichttausch.jsx';
import Stundenübersicht from './Stundenübersicht.jsx';
import Abwesenheiten from './Abwesenheiten.jsx';
import Verfuegbarkeit from './Verfuegbarkeit.jsx';
import OffeneSchichten from './OffeneSchichten.jsx';
import Zeiterfassung from './Zeiterfassung.jsx';
import MitarbeiterHome from './MitarbeiterHome.jsx';
import { getShiftHours } from '../lib/gesetzePruefung.js';

export default function MitarbeiterDashboard({ data, actions, user, t }) {
  const employeeId = user.employeeId || user.id;
  const employee = data.employees.find((item) => item.id === employeeId) || data.employees[0];
  const [activeTab, setActiveTab] = useState('home');
  const [preferences, setPreferences] = useState({
    preferredTimes: employee.preferredTimes || '',
    avoidDays: employee.avoidDays || '',
    maxNightShifts: employee.maxNightShifts || 0,
    otherNotes: employee.otherNotes || '',
    preferences: employee.preferences || '',
  });
  const [sickDuration, setSickDuration] = useState('');
  const [delay, setDelay] = useState({ delayMinutes: 15, message: '', shiftId: '' });

  const myShifts = data.shifts
    .filter((shift) => shift.employeeId === employee.id && shift.status === 'published')
    .sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`));

  const nextShift = myShifts.find((shift) => new Date(`${shift.date}T${shift.end}`) >= new Date());

  function savePreferences() {
    actions.updateEmployee(employee.id, preferences);
  }

  function reportSick() {
    actions.addSickReport({
      employeeId: employee.id,
      duration: sickDuration,
    });
    setSickDuration('');
  }

  function reportDelay() {
    actions.addDelayReport({
      employeeId: employee.id,
      shiftId: delay.shiftId || nextShift?.id || '',
      delayMinutes: Number(delay.delayMinutes),
      message: delay.message,
    });
    setDelay({ delayMinutes: 15, message: '', shiftId: '' });
  }

  return (
    <main className="dashboard">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">{t('employee.title')}</p>
          <h1>{employee.name}</h1>
          <p>{t('employee.preferencesHint')}</p>
        </div>
        <NextShift shift={nextShift} t={t} />
      </section>

      <nav className="tabbar">
        <button className={activeTab === 'home' ? 'active' : ''} onClick={() => setActiveTab('home')}>
          {t('employee.home')}
        </button>
        <button className={activeTab === 'schedule' ? 'active' : ''} onClick={() => setActiveTab('schedule')}>
          {t('employee.mySchedule')}
        </button>
        <button className={activeTab === 'preferences' ? 'active' : ''} onClick={() => setActiveTab('preferences')}>
          {t('employee.preferences')}
        </button>
        <button className={activeTab === 'availability' ? 'active' : ''} onClick={() => setActiveTab('availability')}>
          {t('availability.title')}
        </button>
        <button className={activeTab === 'absence' ? 'active' : ''} onClick={() => setActiveTab('absence')}>
          {t('absence.title')}
        </button>
        <button className={activeTab === 'openShifts' ? 'active' : ''} onClick={() => setActiveTab('openShifts')}>
          {t('openShifts.title')}
        </button>
        <button className={activeTab === 'time' ? 'active' : ''} onClick={() => setActiveTab('time')}>
          {t('time.title')}
        </button>
        <button className={activeTab === 'sick' ? 'active' : ''} onClick={() => setActiveTab('sick')}>
          {t('employee.sickToday')}
        </button>
        <button className={activeTab === 'delay' ? 'active' : ''} onClick={() => setActiveTab('delay')}>
          {t('delay.title')}
        </button>
        <button className={activeTab === 'swaps' ? 'active' : ''} onClick={() => setActiveTab('swaps')}>
          {t('swaps.myTitle')}
        </button>
        <button className={activeTab === 'hours' ? 'active' : ''} onClick={() => setActiveTab('hours')}>
          {t('employee.myHours')}
        </button>
      </nav>

      {activeTab === 'home' && <MitarbeiterHome data={data} employee={employee} setActiveTab={setActiveTab} t={t} />}
      {activeTab === 'schedule' && <MySchedule shifts={myShifts} t={t} />}
      {activeTab === 'preferences' && (
        <PreferencesForm preferences={preferences} setPreferences={setPreferences} onSave={savePreferences} t={t} />
      )}
      {activeTab === 'availability' && (
        <Verfuegbarkeit data={data} actions={actions} employeeId={employee.id} t={t} />
      )}
      {activeTab === 'absence' && (
        <Abwesenheiten data={data} actions={actions} employeeId={employee.id} mode="employee" t={t} />
      )}
      {activeTab === 'sick' && (
        <SickForm duration={sickDuration} setDuration={setSickDuration} onReport={reportSick} t={t} />
      )}
      {activeTab === 'delay' && (
        <DelayForm delay={delay} setDelay={setDelay} shifts={myShifts} onReport={reportDelay} t={t} />
      )}
      {activeTab === 'openShifts' && (
        <OffeneSchichten data={data} actions={actions} mode="employee" employeeId={employee.id} t={t} />
      )}
      {activeTab === 'time' && <Zeiterfassung data={data} actions={actions} employeeId={employee.id} t={t} />}
      {activeTab === 'swaps' && (
        <Schichttausch data={data} actions={actions} mode="employee" employeeId={employee.id} t={t} />
      )}
      {activeTab === 'hours' && <Stundenübersicht data={data} actions={actions} employeeId={employee.id} t={t} />}
    </main>
  );
}

function NextShift({ shift, t }) {
  return (
    <aside className="card metric-card">
      <span>{t('common.next')}</span>
      {shift ? (
        <>
          <strong>
            {shift.date} · {shift.start}-{shift.end}
          </strong>
          <small>{getShiftHours(shift)}h</small>
        </>
      ) : (
        <strong>-</strong>
      )}
    </aside>
  );
}

function MySchedule({ shifts, t }) {
  const upcoming = useMemo(() => shifts.filter((shift) => new Date(`${shift.date}T${shift.end}`) >= new Date()), [shifts]);
  const past = useMemo(() => shifts.filter((shift) => new Date(`${shift.date}T${shift.end}`) < new Date()), [shifts]);

  return (
    <section className="grid two-columns">
      <div className="card">
        <h2>{t('employee.mySchedule')}</h2>
        <div className="list">
          {upcoming.length === 0 && <div className="empty-state">{t('employee.noUpcomingShifts')}</div>}
          {upcoming.map((shift) => (
            <ShiftLine key={shift.id} shift={shift} />
          ))}
        </div>
      </div>
      <div className="card">
        <h2>{t('employee.pastShifts')}</h2>
        <div className="list">
          {past.length === 0 && <div className="empty-state">{t('employee.noPastShifts')}</div>}
          {past.map((shift) => (
            <ShiftLine key={shift.id} shift={shift} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ShiftLine({ shift }) {
  return (
    <article className="list-item">
      <div>
        <strong>
          {shift.date} · {shift.start}-{shift.end}
        </strong>
        <span>{getShiftHours(shift)}h</span>
      </div>
    </article>
  );
}

function PreferencesForm({ preferences, setPreferences, onSave, t }) {
  function update(key, value) {
    setPreferences((current) => ({ ...current, [key]: value }));
  }

  return (
    <section className="card form-card narrow">
      <h2>{t('employee.preferences')}</h2>
      <div className="info-banner">{t('employee.preferencesHint')}</div>
      <label>
        {t('employee.preferredTimes')}
        <input value={preferences.preferredTimes} onChange={(event) => update('preferredTimes', event.target.value)} />
      </label>
      <label>
        {t('employee.avoidDays')}
        <textarea value={preferences.avoidDays} onChange={(event) => update('avoidDays', event.target.value)} />
      </label>
      <label>
        {t('employee.maxNightShifts')}
        <input
          value={preferences.maxNightShifts}
          onChange={(event) => update('maxNightShifts', Number(event.target.value))}
          type="number"
          min="0"
        />
      </label>
      <label>
        {t('employee.otherNotes')}
        <textarea value={preferences.otherNotes} onChange={(event) => update('otherNotes', event.target.value)} />
      </label>
      <button onClick={onSave}>{t('common.save')}</button>
    </section>
  );
}


function DelayForm({ delay, setDelay, shifts, onReport, t }) {
  return (
    <section className="card form-card narrow">
      <h2>{t('delay.title')}</h2>
      <p className="muted">{t('delay.hint')}</p>
      <label>
        {t('common.shift')}
        <select value={delay.shiftId} onChange={(event) => setDelay({ ...delay, shiftId: event.target.value })}>
          <option value="">{t('common.next')}</option>
          {shifts.map((shift) => (
            <option key={shift.id} value={shift.id}>
              {shift.date} {shift.start}-{shift.end}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t('delay.minutes')}
        <input
          value={delay.delayMinutes}
          onChange={(event) => setDelay({ ...delay, delayMinutes: Number(event.target.value) })}
          type="number"
          min="1"
        />
      </label>
      <label>
        {t('common.message')}
        <textarea value={delay.message} onChange={(event) => setDelay({ ...delay, message: event.target.value })} />
      </label>
      <button className="warning-button" onClick={onReport}>{t('delay.report')}</button>
    </section>
  );
}

function SickForm({ duration, setDuration, onReport, t }) {
  return (
    <section className="card form-card narrow">
      <h2>{t('employee.sickToday')}</h2>
      <p className="muted">{t('employee.noUpload')}</p>
      <label>
        {t('employee.expectedDuration')}
        <input value={duration} onChange={(event) => setDuration(event.target.value)} placeholder={t('employee.durationPlaceholder')} />
      </label>
      <button className="danger-button" onClick={onReport}>
        {t('employee.sickToday')}
      </button>
    </section>
  );
}
