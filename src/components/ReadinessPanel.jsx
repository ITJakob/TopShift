export default function ReadinessPanel({ data, t }) {
  const checks = [
    {
      key: 'company',
      ok: Boolean(data.company.name && data.company.country && data.company.industry),
    },
    {
      key: 'locations',
      ok: data.company.locations.length > 0,
    },
    {
      key: 'employees',
      ok: data.employees.length > 0,
    },
    {
      key: 'legal',
      ok: Boolean(data.company.region),
    },
    {
      key: 'notifications',
      ok: data.notifications.length > 0,
      optional: true,
    },
  ];

  return (
    <section className="card">
      <h2>{t('readiness.title')}</h2>
      <p className="muted">{t('readiness.subtitle')}</p>
      <div className="list">
        {checks.map((check) => (
          <article className="list-item" key={check.key}>
            <div>
              <strong>{t(`readiness.${check.key}`)}</strong>
              {check.optional && <span>{t('readiness.optional')}</span>}
            </div>
            <span className={check.ok ? 'status approved' : 'status pending'}>
              {check.ok ? t('common.ok') : t('common.pending')}
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}
