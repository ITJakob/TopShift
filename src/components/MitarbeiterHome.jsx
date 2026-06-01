import { calculateEmployeeInsights } from '../lib/insights.js';

export default function MitarbeiterHome({ data, employee, setActiveTab, t }) {
  const insights = calculateEmployeeInsights(data, employee.id);

  const quickActions = [
    { key: 'time.title', tab: 'time', value: insights.timeEntriesToday },
    { key: 'swaps.incoming', tab: 'swaps', value: insights.incomingSwaps },
    { key: 'absence.title', tab: 'absence', value: insights.pendingAbsences },
    { key: 'openShifts.title', tab: 'openShifts', value: insights.openApplications },
  ];

  return (
    <section className="grid insights-layout">
      <div className="card hero-summary">
        <p className="eyebrow">{t('employee.home')}</p>
        <h2>{t('employee.welcome', { name: employee.name })}</h2>
        {insights.nextShift ? (
          <div className="info-banner">
            <strong>{t('common.next')}:</strong> {insights.nextShift.date} {insights.nextShift.start}-
            {insights.nextShift.end}
          </div>
        ) : (
          <div className="empty-state">{t('employee.noUpcomingShifts')}</div>
        )}
        <div className="metric-grid">
          <Metric label={t('employee.upcomingShifts')} value={insights.upcomingCount} />
          <Metric label={t('hours.planned')} value={`${insights.plannedHours}h`} />
          <Metric label={t('time.entries')} value={insights.timeEntriesToday} />
        </div>
      </div>

      <div className="card">
        <h2>{t('employee.quickActions')}</h2>
        <div className="list">
          {quickActions.map((action) => (
            <button className="action-row" key={action.tab} onClick={() => setActiveTab(action.tab)}>
              <div>
                <strong>{t(action.key)}</strong>
                <span>{t('employee.openSection')}</span>
              </div>
              <span className="status pending">{action.value}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }) {
  return (
    <div className="metric-tile">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
