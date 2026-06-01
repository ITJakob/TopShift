import { useMemo, useState } from 'react';
import { getShiftHours, validateShift } from '../lib/gesetzePruefung.js';

export default function OffeneSchichten({ data, actions, employeeId, mode = 'employee', t }) {
  if (mode === 'admin') {
    return <AdminOpenShifts data={data} actions={actions} t={t} />;
  }
  return <EmployeeOpenShifts data={data} actions={actions} employeeId={employeeId} t={t} />;
}

function EmployeeOpenShifts({ data, actions, employeeId, t }) {
  const [message, setMessage] = useState('');
  const employee = data.employees.find((item) => item.id === employeeId);
  const openShifts = useMemo(
    () =>
      data.shifts
        .filter((shift) => (!shift.employeeId || shift.status === 'unassigned') && shift.status !== 'draft')
        .map((shift) => ({
          shift,
          validation: validateShift({ shift: { ...shift, employeeId }, existingShifts: data.shifts, employee, company: data.company }),
        }))
        .filter((item) => item.validation.isValid),
    [data, employee, employeeId],
  );

  function apply(shift) {
    actions.applyOpenShift({ shiftId: shift.id, employeeId, message });
    setMessage('');
  }

  return (
    <section className="grid two-columns">
      <div className="card form-card">
        <h2>{t('openShifts.title')}</h2>
        <p className="muted">{t('openShifts.hint')}</p>
        <label>
          {t('common.message')}
          <textarea value={message} onChange={(event) => setMessage(event.target.value)} />
        </label>
      </div>
      <div className="card">
        <h2>{t('openShifts.available')}</h2>
        <div className="list">
          {openShifts.length === 0 && <div className="empty-state">{t('openShifts.empty')}</div>}
          {openShifts.map(({ shift }) => {
            const alreadyApplied = data.openShiftApplications.some(
              (application) => application.shiftId === shift.id && application.employeeId === employeeId,
            );
            return (
              <article className="list-item" key={shift.id}>
                <div>
                  <strong>{formatShift(shift)}</strong>
                  <span>{shift.location}</span>
                </div>
                <button disabled={alreadyApplied} onClick={() => apply(shift)}>
                  {alreadyApplied ? t('openShifts.applied') : t('openShifts.apply')}
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function AdminOpenShifts({ data, actions, t }) {
  const applications = data.openShiftApplications;
  return (
    <section className="card">
      <h2>{t('openShifts.adminTitle')}</h2>
      <div className="list">
        {applications.length === 0 && <div className="empty-state">{t('openShifts.noApplications')}</div>}
        {applications.map((application) => {
          const shift = data.shifts.find((item) => item.id === application.shiftId);
          const employee = data.employees.find((item) => item.id === application.employeeId);
          return (
            <article className="list-item" key={application.id}>
              <div>
                <strong>{employee?.name}</strong>
                <span>{formatShift(shift)}</span>
                {application.message && <p className="muted">{application.message}</p>}
              </div>
              <div className="button-row">
                <span className={`status ${application.status}`}>{t(`common.${application.status}`)}</span>
                {application.status === 'pending' && (
                  <>
                    <button onClick={() => actions.updateOpenShiftApplication(application.id, { status: 'approved' })}>
                      {t('common.approved')}
                    </button>
                    <button
                      className="secondary-button"
                      onClick={() => actions.updateOpenShiftApplication(application.id, { status: 'rejected' })}
                    >
                      {t('common.rejected')}
                    </button>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function formatShift(shift) {
  if (!shift) {
    return '-';
  }
  return `${shift.date} ${shift.start}-${shift.end} (${getShiftHours(shift)}h)`;
}
