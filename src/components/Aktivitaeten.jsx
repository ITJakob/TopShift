export default function Aktivitaeten({ data, t }) {
  const events = buildEvents(data, t);

  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{t('activity.eyebrow')}</p>
          <h2>{t('activity.title')}</h2>
        </div>
        <span className="chip">{events.length}</span>
      </div>
      <div className="timeline">
        {events.length === 0 && <div className="empty-state">{t('activity.empty')}</div>}
        {events.map((event) => (
          <article className="timeline-item" key={event.id}>
            <span className={`timeline-dot ${event.tone}`} />
            <div>
              <strong>{event.title}</strong>
              <p>{event.description}</p>
              <small>{new Date(event.createdAt).toLocaleString()}</small>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function buildEvents(data, t) {
  const employeeName = (id) => data.employees.find((employee) => employee.id === id)?.name || t('common.employee');
  const shiftLabel = (id) => {
    const shift = data.shifts.find((item) => item.id === id);
    return shift ? `${shift.date} ${shift.start}-${shift.end}` : t('common.shift');
  };

  return [
    ...data.notifications.map((item) => ({
      id: `notification-${item.id}`,
      title: t(item.textKey),
      description: t('notifications.title'),
      createdAt: item.createdAt,
      tone: 'info',
    })),
    ...data.sickReports.map((item) => ({
      id: `sick-${item.id}`,
      title: t('sick.reported'),
      description: `${employeeName(item.employeeId)} · ${item.duration || item.date}`,
      createdAt: item.createdAt,
      tone: 'danger',
    })),
    ...data.swapRequests.map((item) => ({
      id: `swap-${item.id}`,
      title: t('swaps.title'),
      description: `${employeeName(item.requesterId)} · ${shiftLabel(item.ownShiftId)} · ${t(`common.${item.status}`)}`,
      createdAt: item.createdAt,
      tone: item.status === 'approved' ? 'success' : 'warning',
    })),
    ...data.absenceRequests.map((item) => ({
      id: `absence-${item.id}`,
      title: t('absence.title'),
      description: `${employeeName(item.employeeId)} · ${item.startDate}-${item.endDate} · ${t(`common.${item.status}`)}`,
      createdAt: item.createdAt,
      tone: item.status === 'approved' ? 'success' : 'warning',
    })),
    ...data.openShiftApplications.map((item) => ({
      id: `open-${item.id}`,
      title: t('openShifts.title'),
      description: `${employeeName(item.employeeId)} · ${shiftLabel(item.shiftId)} · ${t(`common.${item.status}`)}`,
      createdAt: item.createdAt,
      tone: 'info',
    })),
    ...data.timeEntries.map((item) => ({
      id: `time-${item.id}`,
      title: t('time.title'),
      description: `${employeeName(item.employeeId)} · ${t(`time.${item.type}`)}`,
      createdAt: item.createdAt || item.occurredAt,
      tone: 'success',
    })),
  ].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
}
