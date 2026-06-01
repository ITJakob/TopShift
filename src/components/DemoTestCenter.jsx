export default function DemoTestCenter({ data, t }) {
  const cards = [
    { key: 'schedule', value: data.shifts.length, label: t('demoCenter.shifts') },
    { key: 'swaps', value: data.swapRequests.length, label: t('demoCenter.swaps') },
    { key: 'absence', value: data.absenceRequests.length, label: t('demoCenter.absences') },
    { key: 'open', value: data.openShiftApplications.length, label: t('demoCenter.openShiftApplications') },
    { key: 'availability', value: data.availabilityEntries.length, label: t('demoCenter.availability') },
    { key: 'time', value: data.timeEntries.length, label: t('demoCenter.timeEntries') },
  ];

  return (
    <section className="grid two-columns">
      <div className="card">
        <h2>{t('demoCenter.title')}</h2>
        <p className="muted">{t('demoCenter.subtitle')}</p>
        <div className="metric-grid">
          {cards.map((card) => (
            <div className="metric-tile" key={card.key}>
              <strong>{card.value}</strong>
              <span>{card.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <h2>{t('demoCenter.tryThis')}</h2>
        <div className="list">
          {['adminSchedule', 'employeeSwap', 'openShift', 'timeTracking', 'invite'].map((item) => (
            <article className="list-item" key={item}>
              <div>
                <strong>{t(`demoCenter.${item}.title`)}</strong>
                <span>{t(`demoCenter.${item}.text`)}</span>
              </div>
              <span className="status pending">{t('common.pending')}</span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
