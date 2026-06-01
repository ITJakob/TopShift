import { useMemo, useState } from 'react';
import { getShiftHours, validateShift } from '../lib/gesetzePruefung.js';

export default function Schichttausch({ data, actions, mode = 'employee', employeeId, t }) {
  const [ownShiftId, setOwnShiftId] = useState('');
  const [targetShiftId, setTargetShiftId] = useState('');
  const [message, setMessage] = useState('');

  const legalOptions = useMemo(() => {
    if (mode !== 'employee' || !ownShiftId) {
      return [];
    }
    const ownShift = data.shifts.find((shift) => shift.id === ownShiftId);
    return data.shifts.filter((candidate) => isLegalSwap({ data, ownShift, candidate, employeeId }));
  }, [data, employeeId, mode, ownShiftId]);

  function requestSwap() {
    if (!ownShiftId || !targetShiftId) {
      return;
    }
    actions.addSwapRequest({
      requesterId: employeeId,
      ownShiftId,
      targetShiftId,
      message,
    });
    setOwnShiftId('');
    setTargetShiftId('');
    setMessage('');
  }

  function resolveRequest(request, status, reason = '') {
    if (status === 'approved') {
      const ownShift = data.shifts.find((shift) => shift.id === request.ownShiftId);
      const targetShift = data.shifts.find((shift) => shift.id === request.targetShiftId);
      if (ownShift && targetShift) {
        actions.saveShift({ ...ownShift, employeeId: targetShift.employeeId });
        actions.saveShift({ ...targetShift, employeeId: ownShift.employeeId });
      }
    }
    actions.updateSwapRequest(request.id, { status, reason });
  }

  if (mode === 'admin') {
    return (
      <section className="card">
        <h2>{t('swaps.title')}</h2>
        <div className="list">
          {data.swapRequests.length === 0 && <div className="empty-state">{t('swaps.noOptions')}</div>}
          {data.swapRequests.map((request) => (
            <AdminSwapRequest key={request.id} request={request} data={data} onResolve={resolveRequest} t={t} />
          ))}
        </div>
      </section>
    );
  }

  const ownShifts = data.shifts.filter((shift) => shift.employeeId === employeeId && shift.status === 'published');

  return (
    <section className="grid two-columns">
      <div className="card form-card">
        <h2>{t('swaps.myTitle')}</h2>
        <p className="muted">{t('swaps.onlyLegal')}</p>
        <label>
          {t('swaps.offer')}
          <select value={ownShiftId} onChange={(event) => setOwnShiftId(event.target.value)}>
            <option value="">{t('common.shift')}</option>
            {ownShifts.map((shift) => (
              <option key={shift.id} value={shift.id}>
                {shift.date} {shift.start}-{shift.end}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t('swaps.legalOptions')}
          <select value={targetShiftId} onChange={(event) => setTargetShiftId(event.target.value)}>
            <option value="">{t('swaps.noOptions')}</option>
            {legalOptions.map((shift) => {
              const employee = data.employees.find((item) => item.id === shift.employeeId);
              return (
                <option key={shift.id} value={shift.id}>
                  {shift.date} {shift.start}-{shift.end} · {employee?.name}
                </option>
              );
            })}
          </select>
        </label>
        <label>
          {t('common.message')}
          <textarea value={message} onChange={(event) => setMessage(event.target.value)} />
        </label>
        <button disabled={!targetShiftId} onClick={requestSwap}>
          {t('swaps.request')}
        </button>
      </div>

      <div className="card">
        <h2>{t('common.status')}</h2>
        <div className="list">
          {data.swapRequests
            .filter((request) => request.requesterId === employeeId)
            .map((request) => (
              <SwapSummary key={request.id} request={request} data={data} t={t} />
            ))}
        </div>
      </div>
    </section>
  );
}

function AdminSwapRequest({ request, data, onResolve, t }) {
  const requester = data.employees.find((employee) => employee.id === request.requesterId);
  const ownShift = data.shifts.find((shift) => shift.id === request.ownShiftId);
  const targetShift = data.shifts.find((shift) => shift.id === request.targetShiftId);
  const targetEmployee = data.employees.find((employee) => employee.id === targetShift?.employeeId);
  const stillLegal = ownShift && targetShift && isLegalSwap({ data, ownShift, candidate: targetShift, employeeId: requester?.id });

  return (
    <article className="list-item swap-item">
      <div>
        <strong>
          {requester?.name} ↔ {targetEmployee?.name}
        </strong>
        <span>
          {formatShift(ownShift)} / {formatShift(targetShift)}
        </span>
        {request.message && <p className="muted">{request.message}</p>}
        <span className={stillLegal ? 'success-text' : 'danger-text'}>
          {stillLegal ? t('legal.valid') : t('schedule.blocked')}
        </span>
      </div>
      <div className="button-row">
        <button disabled={!stillLegal || request.status !== 'pending'} onClick={() => onResolve(request, 'approved')}>
          {t('swaps.approve')}
        </button>
        <button className="secondary-button" disabled={request.status !== 'pending'} onClick={() => onResolve(request, 'rejected')}>
          {t('swaps.reject')}
        </button>
      </div>
      <span className={`status ${request.status}`}>{t(`common.${request.status}`)}</span>
    </article>
  );
}

function SwapSummary({ request, data, t }) {
  const ownShift = data.shifts.find((shift) => shift.id === request.ownShiftId);
  const targetShift = data.shifts.find((shift) => shift.id === request.targetShiftId);
  return (
    <article className="list-item">
      <div>
        <strong>{formatShift(ownShift)}</strong>
        <span>{formatShift(targetShift)}</span>
      </div>
      <span className={`status ${request.status}`}>{t(`common.${request.status}`)}</span>
    </article>
  );
}

function isLegalSwap({ data, ownShift, candidate, employeeId }) {
  if (!ownShift || !candidate || candidate.employeeId === employeeId || candidate.status !== 'published') {
    return false;
  }

  const requester = data.employees.find((employee) => employee.id === employeeId);
  const targetEmployee = data.employees.find((employee) => employee.id === candidate.employeeId);
  const requesterResult = validateShift({
    shift: { ...candidate, employeeId },
    existingShifts: data.shifts.filter((shift) => shift.id !== ownShift.id && shift.id !== candidate.id),
    employee: requester,
    company: data.company,
  });
  const targetResult = validateShift({
    shift: { ...ownShift, employeeId: candidate.employeeId },
    existingShifts: data.shifts.filter((shift) => shift.id !== ownShift.id && shift.id !== candidate.id),
    employee: targetEmployee,
    company: data.company,
  });

  return requesterResult.isValid && targetResult.isValid;
}

function formatShift(shift) {
  if (!shift) {
    return '-';
  }
  return `${shift.date} ${shift.start}-${shift.end} (${getShiftHours(shift)}h)`;
}
