import { useState } from 'react';

const absenceTypes = ['vacation', 'timeOff', 'care', 'training', 'unpaid', 'other'];

export default function Abwesenheiten({ data, actions, employeeId, mode = 'employee', t }) {
  if (mode === 'admin') {
    return <AdminAbsences data={data} actions={actions} t={t} />;
  }

  return <EmployeeAbsences data={data} actions={actions} employeeId={employeeId} t={t} />;
}

function EmployeeAbsences({ data, actions, employeeId, t }) {
  const [form, setForm] = useState({
    type: 'vacation',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    reason: '',
  });
  const requests = data.absenceRequests.filter((request) => request.employeeId === employeeId);

  function submit() {
    actions.addAbsenceRequest({ ...form, employeeId });
    setForm((current) => ({ ...current, reason: '' }));
  }

  return (
    <section className="grid two-columns">
      <div className="card form-card">
        <h2>{t('absence.requestTitle')}</h2>
        <label>
          {t('absence.type')}
          <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
            {absenceTypes.map((type) => (
              <option key={type} value={type}>
                {t(`absence.type.${type}`)}
              </option>
            ))}
          </select>
        </label>
        <div className="form-grid">
          <label>
            {t('absence.startDate')}
            <input
              value={form.startDate}
              onChange={(event) => setForm({ ...form, startDate: event.target.value })}
              type="date"
            />
          </label>
          <label>
            {t('absence.endDate')}
            <input
              value={form.endDate}
              onChange={(event) => setForm({ ...form, endDate: event.target.value })}
              type="date"
            />
          </label>
        </div>
        <label>
          {t('common.reason')}
          <textarea value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} />
        </label>
        <button onClick={submit}>{t('absence.submit')}</button>
      </div>

      <div className="card">
        <h2>{t('absence.myRequests')}</h2>
        <RequestList requests={requests} data={data} t={t} />
      </div>
    </section>
  );
}

function AdminAbsences({ data, actions, t }) {
  return (
    <section className="grid two-columns">
      <div className="card">
        <h2>{t('absence.adminTitle')}</h2>
        <RequestList
          requests={data.absenceRequests}
          data={data}
          t={t}
          onApprove={(request) => actions.updateAbsenceRequest(request.id, { status: 'approved' })}
          onReject={(request) => actions.updateAbsenceRequest(request.id, { status: 'rejected' })}
        />
      </div>
      <div className="card">
        <h2>{t('delay.adminTitle')}</h2>
        <div className="list">
          {data.delayReports.length === 0 && <div className="empty-state">{t('delay.empty')}</div>}
          {data.delayReports.map((report) => {
            const employee = data.employees.find((item) => item.id === report.employeeId);
            return (
              <article className="list-item" key={report.id}>
                <div>
                  <strong>{employee?.name || t('common.employee')}</strong>
                  <span>
                    {report.date} · {report.delayMinutes} {t('delay.minutes')}
                  </span>
                  {report.message && <p className="muted">{report.message}</p>}
                </div>
                <span className="status pending">{t('delay.reported')}</span>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function RequestList({ requests, data, t, onApprove, onReject }) {
  return (
    <div className="list">
      {requests.length === 0 && <div className="empty-state">{t('absence.empty')}</div>}
      {requests.map((request) => {
        const employee = data.employees.find((item) => item.id === request.employeeId);
        return (
          <article className="list-item" key={request.id}>
            <div>
              <strong>
                {employee?.name || t('common.employee')} · {t(`absence.type.${request.type}`)}
              </strong>
              <span>
                {request.startDate} - {request.endDate}
              </span>
              {request.reason && <p className="muted">{request.reason}</p>}
              {request.adminReason && <small className="muted">{request.adminReason}</small>}
            </div>
            <div className="button-row stacked-mobile">
              <span className={`status ${request.status}`}>{t(`common.${request.status}`)}</span>
              {onApprove && request.status === 'pending' && (
                <>
                  <button className="tiny-button" onClick={() => onApprove(request)}>
                    {t('common.approved')}
                  </button>
                  <button className="danger-button tiny-button" onClick={() => onReject(request)}>
                    {t('common.rejected')}
                  </button>
                </>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
