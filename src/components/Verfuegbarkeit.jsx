import { useState } from 'react';

export default function Verfuegbarkeit({ data, actions, employeeId, t }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    kind: 'unavailable',
    start: '',
    end: '',
    note: '',
  });
  const entries = data.availabilityEntries.filter((entry) => entry.employeeId === employeeId);

  function submit() {
    actions.addAvailability({ ...form, employeeId });
    setForm((current) => ({ ...current, note: '' }));
  }

  return (
    <section className="grid two-columns">
      <div className="card form-card">
        <h2>{t('availability.title')}</h2>
        <p className="muted">{t('availability.hint')}</p>
        <label>
          {t('common.date')}
          <input value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} type="date" />
        </label>
        <label>
          {t('availability.kind')}
          <select value={form.kind} onChange={(event) => setForm({ ...form, kind: event.target.value })}>
            <option value="available">{t('availability.available')}</option>
            <option value="preferred">{t('availability.preferred')}</option>
            <option value="unavailable">{t('availability.unavailable')}</option>
          </select>
        </label>
        <div className="form-grid">
          <label>
            {t('common.start')}
            <input value={form.start} onChange={(event) => setForm({ ...form, start: event.target.value })} type="time" />
          </label>
          <label>
            {t('common.end')}
            <input value={form.end} onChange={(event) => setForm({ ...form, end: event.target.value })} type="time" />
          </label>
        </div>
        <label>
          {t('common.note')}
          <textarea value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
        </label>
        <button onClick={submit}>{t('common.save')}</button>
      </div>

      <div className="card">
        <h2>{t('availability.myEntries')}</h2>
        <div className="list">
          {entries.length === 0 && <div className="empty-state">{t('availability.empty')}</div>}
          {entries.map((entry) => (
            <article className="list-item" key={entry.id}>
              <div>
                <strong>{entry.date}</strong>
                <span>
                  {t(`availability.${entry.kind}`)} {entry.start && `${entry.start}-${entry.end || ''}`}
                </span>
                {entry.note && <p className="muted">{entry.note}</p>}
              </div>
              <span className={`status ${entry.kind === 'unavailable' ? 'rejected' : 'approved'}`}>
                {t(`availability.${entry.kind}`)}
              </span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
