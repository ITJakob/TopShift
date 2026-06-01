import { calculateAdminInsights } from '../lib/insights.js';

export default function AdminInsights({ data, t }) {
  const insights = calculateAdminInsights(data);
  const priorities = [
    { key: 'openShifts.title', value: insights.openShifts, tone: 'warning' },
    { key: 'absence.adminTitle', value: insights.pendingAbsences, tone: 'pending' },
    { key: 'swaps.title', value: insights.pendingSwaps, tone: 'pending' },
    { key: 'openShifts.adminTitle', value: insights.pendingOpenShiftApplications, tone: 'pending' },
    { key: 'employees.invitations', value: insights.pendingInvitations, tone: 'pending' },
  ];

  return (
    <section className="grid insights-layout">
      <div className="card">
        <p className="eyebrow">{t('insights.eyebrow')}</p>
        <h2>{t('insights.title')}</h2>
        <div className="metric-grid">
          <Metric label={t('insights.publishedShifts')} value={insights.publishedShifts} />
          <Metric label={t('insights.plannedHours')} value={`${insights.totalPlannedHours}h`} />
          <Metric label={t('insights.draftShifts')} value={insights.draftShifts} />
          <Metric label={t('insights.legalIssues')} value={insights.legalIssues.length} danger={insights.legalIssues.length > 0} />
        </div>
      </div>

      <div className="card">
        <h2>{t('insights.priorities')}</h2>
        <div className="list">
          {priorities.map((item) => (
            <article className="list-item" key={item.key}>
              <div>
                <strong>{t(item.key)}</strong>
                <span>{t('insights.pendingWork')}</span>
              </div>
              <span className={`status ${item.tone}`}>{item.value}</span>
            </article>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>{t('insights.compliance')}</h2>
        <div className="list">
          {insights.legalIssues.length === 0 && <div className="success-banner">{t('legal.valid')}</div>}
          {insights.legalIssues.slice(0, 6).map((item) => (
            <article className="list-item" key={`${item.shiftId}-${item.issue.key}`}>
              <div>
                <strong>
                  {item.employeeName} · {item.date}
                </strong>
                <span>{t(item.issue.key, item.issue.params)}</span>
              </div>
              <span className="status rejected">{t('common.warning')}</span>
            </article>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>{t('insights.workload')}</h2>
        <div className="workload-list">
          {insights.workload.map((item) => (
            <div className="workload-row" key={item.employeeId}>
              <div>
                <strong>{item.employeeName}</strong>
                <span>
                  {item.plannedHours}h / {item.targetHours}h
                </span>
              </div>
              <div className="progress-track" aria-label={`${item.utilization}%`}>
                <span style={{ width: `${Math.min(100, item.utilization)}%` }} />
              </div>
              <strong>{item.utilization}%</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value, danger = false }) {
  return (
    <div className={danger ? 'metric-tile danger-metric' : 'metric-tile'}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
