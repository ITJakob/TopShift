import { useMemo, useState } from 'react';
import {
  buildOverrideLog,
  canSaveShift,
  getShiftHours,
  isHoliday,
  validateShift,
} from '../lib/gesetzePruefung.js';

const shiftTypeKeys = {
  early: 'schedule.shiftTypeEarly',
  mid: 'schedule.shiftTypeMid',
  late: 'schedule.shiftTypeLate',
  night: 'schedule.shiftTypeNight',
  onCall: 'schedule.shiftTypeOnCall',
};

const emptyShift = {
  employeeId: '',
  date: new Date().toISOString().slice(0, 10),
  start: '08:00',
  end: '16:30',
  breakMinutes: 30,
  type: 'early',
  location: '',
  status: 'draft',
  notes: '',
};

export default function Dienstplan({ data, actions, user, t }) {
  const [view, setView] = useState('week');
  const [baseDate, setBaseDate] = useState(new Date());
  const [editingShiftId, setEditingShiftId] = useState('');
  const [form, setForm] = useState({ ...emptyShift, location: data.company.locations[0] || '' });
  const [overrideReason, setOverrideReason] = useState('');
  const [message, setMessage] = useState('');

  const selectedEmployee = data.employees.find((employee) => employee.id === form.employeeId);
  const validation = useMemo(
    () =>
      form.employeeId
        ? validateShift({
            shift: form,
            existingShifts: data.shifts,
            employee: selectedEmployee,
            company: data.company,
          })
        : null,
    [data.company, data.shifts, form, selectedEmployee],
  );

  const days = useMemo(() => buildDays(view, baseDate), [view, baseDate]);

  function updateForm(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    setMessage('');
  }

  function saveShift() {
    if (!selectedEmployee || !validation) {
      return;
    }

    if (!canSaveShift(validation, overrideReason)) {
      setMessage(t('schedule.blocked'));
      return;
    }

    const hasOverride = !validation.isValid;
    actions.saveShift({
      ...form,
      overrideLog: hasOverride ? buildOverrideLog(user.name, overrideReason) : form.overrideLog,
      notes: selectedEmployee.preferences && form.type === 'night' ? t('schedule.preferenceIgnored') : form.notes,
    });
    setMessage(hasOverride ? t('legal.shiftSavedWithOverride') : t('schedule.saved'));
    setOverrideReason('');
    resetForm();
  }

  function resetForm() {
    setEditingShiftId('');
    setOverrideReason('');
    setForm({ ...emptyShift, location: data.company.locations[0] || '' });
  }

  function editShift(shift) {
    setEditingShiftId(shift.id);
    setOverrideReason('');
    setMessage('');
    setForm({ ...shift, location: shift.location || data.company.locations[0] || '' });
  }

  function deleteShift(shift) {
    actions.deleteShift(shift.id);
    if (editingShiftId === shift.id) {
      resetForm();
    }
    setMessage(t('schedule.deleted'));
  }

  function moveCalendar(direction) {
    setBaseDate((current) => {
      const next = new Date(current);
      next.setDate(next.getDate() + direction * (view === 'week' ? 7 : 31));
      return next;
    });
  }

  function goToday() {
    setBaseDate(new Date());
  }

  function publish() {
    actions.publishSchedule();
    setMessage(t('schedule.published'));
  }

  function saveTemplate() {
    actions.addTemplate({
      name: `${t(shiftTypeKeys[form.type])} ${form.start}-${form.end}`,
      start: form.start,
      end: form.end,
      breakMinutes: Number(form.breakMinutes),
      type: form.type,
    });
    setMessage(t('schedule.saveTemplate'));
  }

  function onDrop(date, event) {
    const shiftId = event.dataTransfer.getData('text/plain');
    const shift = data.shifts.find((item) => item.id === shiftId);
    const employee = data.employees.find((item) => item.id === shift?.employeeId);
    if (!shift || !employee) {
      return;
    }
    const candidate = { ...shift, date };
    const result = validateShift({
      shift: candidate,
      existingShifts: data.shifts,
      employee,
      company: data.company,
    });
    if (!result.isValid) {
      setMessage(result.issues.map((item) => formatIssue(item, t)).join(' '));
      return;
    }
    actions.saveShift(candidate);
  }

  return (
    <section className="schedule-layout">
      <div className="card form-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t('legal.title')}</p>
            <h2>{editingShiftId ? t('schedule.editShift') : t('schedule.createShift')}</h2>
          </div>
          <span className="status draft">{editingShiftId ? t('common.edit') : t('common.draft')}</span>
        </div>

        {message && <div className={message.includes(t('schedule.blocked')) ? 'error-banner' : 'info-banner'}>{message}</div>}

        <label>
          {t('common.employee')}
          <select value={form.employeeId} onChange={(event) => updateForm('employeeId', event.target.value)}>
            <option value="">{t('common.unassigned')}</option>
            {data.employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>
        </label>

        {selectedEmployee?.preferences && (
          <div className="warning-banner">
            <strong>{t('schedule.preferenceVisible')}:</strong> {selectedEmployee.preferences}
          </div>
        )}

        <div className="form-grid">
          <label>
            {t('common.date')}
            <input value={form.date} onChange={(event) => updateForm('date', event.target.value)} type="date" />
          </label>
          <label>
            {t('common.type')}
            <select value={form.type} onChange={(event) => updateForm('type', event.target.value)}>
              {Object.entries(shiftTypeKeys).map(([key, label]) => (
                <option key={key} value={key}>
                  {t(label)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t('common.start')}
            <input value={form.start} onChange={(event) => updateForm('start', event.target.value)} type="time" />
          </label>
          <label>
            {t('common.end')}
            <input value={form.end} onChange={(event) => updateForm('end', event.target.value)} type="time" />
          </label>
          <label>
            {t('common.break')}
            <input
              value={form.breakMinutes}
              onChange={(event) => updateForm('breakMinutes', Number(event.target.value))}
              type="number"
              min="0"
              step="5"
            />
          </label>
          <label>
            {t('common.location')}
            <select value={form.location} onChange={(event) => updateForm('location', event.target.value)}>
              {data.company.locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </label>
        </div>

        {validation && (
          <ValidationPanel validation={validation} t={t} overrideReason={overrideReason} onOverride={setOverrideReason} />
        )}

        <div className="button-row">
          <button onClick={saveShift}>{editingShiftId ? t('schedule.updateShift') : t('common.save')}</button>
          <button className="secondary-button" onClick={saveTemplate}>
            {t('schedule.saveTemplate')}
          </button>
          {editingShiftId && (
            <button className="secondary-button" onClick={resetForm}>
              {t('common.cancel')}
            </button>
          )}
        </div>

        <div className="template-list">
          <span>{t('schedule.shiftTemplate')}</span>
          {data.templates.map((template) => (
            <button
              className="chip button-chip"
              key={template.id}
              onClick={() => setForm((current) => ({ ...current, ...template }))}
            >
              {template.name}
            </button>
          ))}
        </div>
      </div>

      <div className="card schedule-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t('schedule.dragHint')}</p>
            <h2>{view === 'week' ? t('schedule.weekView') : t('schedule.monthView')} · {formatPeriod(days)}</h2>
          </div>
          <div className="button-row">
            <button className="secondary-button small-button" onClick={() => moveCalendar(-1)}>
              {t('common.previous')}
            </button>
            <button className="secondary-button small-button" onClick={goToday}>
              {t('common.today')}
            </button>
            <button className="secondary-button small-button" onClick={() => moveCalendar(1)}>
              {t('common.nextPeriod')}
            </button>
            <button className={view === 'week' ? 'active small-button' : 'secondary-button small-button'} onClick={() => setView('week')}>
              {t('common.week')}
            </button>
            <button className={view === 'month' ? 'active small-button' : 'secondary-button small-button'} onClick={() => setView('month')}>
              {t('common.month')}
            </button>
            <button className="accent-button small-button" onClick={publish}>
              {t('common.publish')}
            </button>
          </div>
        </div>

        <div className={view === 'week' ? 'calendar-grid week' : 'calendar-grid month'}>
          {days.map((day) => (
            <div
              className={day.isWeekend || isHoliday(data.company.country, day.date) ? 'calendar-day special-day' : 'calendar-day'}
              key={day.iso}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => onDrop(day.iso, event)}
            >
              <div className="day-header">
                <strong>{day.label}</strong>
                {(day.isWeekend || isHoliday(data.company.country, day.date)) && <span>{t('legal.holidayPremium')}</span>}
              </div>
              {data.shifts
                .filter((shift) => shift.date === day.iso)
                .map((shift) => (
                  <ShiftCard key={shift.id} shift={shift} data={data} t={t} onEdit={editShift} onDelete={deleteShift} />
                ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ValidationPanel({ validation, t, overrideReason, onOverride }) {
  return (
    <div className="validation-panel">
      {validation.isValid ? (
        <div className="success-banner">{t('legal.valid')}</div>
      ) : (
        <div className="error-banner">
          {validation.issues.map((item, index) => (
            <p key={`${item.key}-${index}`}>{formatIssue(item, t)}</p>
          ))}
        </div>
      )}
      {validation.warnings.map((item, index) => (
        <div className="warning-banner" key={`${item.key}-${index}`}>
          {formatIssue(item, t)}
        </div>
      ))}
      {!validation.isValid && (
        <label>
          {t('common.override')}
          <textarea value={overrideReason} onChange={(event) => onOverride(event.target.value)} placeholder={t('common.reason')} />
        </label>
      )}
    </div>
  );
}

function ShiftCard({ shift, data, t, onEdit, onDelete }) {
  const employee = data.employees.find((item) => item.id === shift.employeeId);
  return (
    <article className="shift-card" draggable onDragStart={(event) => event.dataTransfer.setData('text/plain', shift.id)}>
      <div>
        <strong>{employee?.name || t('common.unassigned')}</strong>
        <span>
          {shift.start}-{shift.end} · {getShiftHours(shift)}h
        </span>
      </div>
      <span className={`status ${shift.status}`}>{t(`common.${shift.status}`)}</span>
      <small>{t(shiftTypeKeys[shift.type])}</small>
      {shift.overrideLog && <small className="danger-text">{t('legal.overrideLogged')}</small>}
      <div className="shift-actions">
        <button className="secondary-button tiny-button" onClick={() => onEdit(shift)}>
          {t('common.edit')}
        </button>
        <button className="danger-button tiny-button" onClick={() => onDelete(shift)}>
          {t('common.delete')}
        </button>
      </div>
    </article>
  );
}

function buildDays(view, baseDate) {
  const today = new Date(baseDate);
  const start = new Date(today);
  if (view === 'week') {
    const diff = today.getDay() === 0 ? -6 : 1 - today.getDay();
    start.setDate(today.getDate() + diff);
  } else {
    start.setDate(1);
  }
  start.setHours(0, 0, 0, 0);
  const length = view === 'week' ? 7 : new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();

  return Array.from({ length }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      date,
      iso: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: '2-digit' }),
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
    };
  });
}

function formatPeriod(days) {
  if (!days.length) {
    return '';
  }
  const first = days[0].date.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' });
  const last = days[days.length - 1].date.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' });
  return `${first}-${last}`;
}

function formatIssue(issue, t) {
  return t(issue.key, issue.params);
}
