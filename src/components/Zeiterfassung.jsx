export default function Zeiterfassung({ data, actions, employeeId, t }) {
  const shifts = data.shifts
    .filter((shift) => shift.employeeId === employeeId && shift.status === 'published')
    .sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`));
  const nextShift = shifts.find((shift) => new Date(`${shift.date}T${shift.end}`) >= new Date()) || shifts[0];
  const entries = data.timeEntries.filter((entry) => entry.employeeId === employeeId);

  function record(type) {
    actions.addTimeEntry({
      employeeId,
      shiftId: nextShift?.id || '',
      type,
    });
  }

  return (
    <section className="grid two-columns">
      <div className="card form-card">
        <h2>{t('time.title')}</h2>
        <p className="muted">{t('time.hint')}</p>
        <div className="info-banner">
          <strong>{t('common.next')}:</strong> {nextShift ? `${nextShift.date} ${nextShift.start}-${nextShift.end}` : '-'}
        </div>
        <div className="time-actions">
          <button onClick={() => record('start')}>{t('time.start')}</button>
          <button className="secondary-button" onClick={() => record('pause_start')}>
            {t('time.pauseStart')}
          </button>
          <button className="secondary-button" onClick={() => record('pause_end')}>
            {t('time.pauseEnd')}
          </button>
          <button className="danger-button" onClick={() => record('end')}>
            {t('time.end')}
          </button>
        </div>
      </div>
      <div className="card">
        <h2>{t('time.entries')}</h2>
        <div className="list">
          {entries.length === 0 && <div className="empty-state">{t('time.empty')}</div>}
          {entries.map((entry) => (
            <article className="list-item" key={entry.id}>
              <div>
                <strong>{t(`time.${entry.type}`)}</strong>
                <span>{new Date(entry.occurredAt).toLocaleString()}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
