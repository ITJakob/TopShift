import { useMemo, useState } from 'react';
import { getShiftHours, validateShift } from '../lib/gesetzePruefung.js';

export default function Schichttausch({ data, actions, mode = 'employee', employeeId, t }) {
  const [ownShiftId, setOwnShiftId] = useState('');
  const [target, setTarget] = useState(null);
  const [message, setMessage] = useState('');

  const ownShifts = useMemo(
    () =>
      data.shifts
        .filter((shift) => shift.employeeId === employeeId && shift.status === 'published')
        .sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`)),
    [data.shifts, employeeId],
  );
  const ownShift = data.shifts.find((shift) => shift.id === ownShiftId) || ownShifts[0];
  const options = useMemo(
    () => (ownShift ? buildSwapOptions({ data, ownShift, employeeId }) : []),
    [data, employeeId, ownShift],
  );
  const outgoing = data.swapRequests.filter((request) => request.requesterId === employeeId);
  const incoming = data.swapRequests.filter((request) => isIncomingRequest({ request, data, employeeId }));

  function requestSwap() {
    if (!ownShift || !target) {
      return;
    }
    actions.addSwapRequest({
      requesterId: employeeId,
      ownShiftId: ownShift.id,
      targetShiftId: target.shiftId || '',
      targetEmployeeId: target.employeeId,
      peerStatus: 'pending',
      message,
    });
    setTarget(null);
    setMessage('');
  }

  function peerResolve(request, peerStatus) {
    actions.updateSwapRequest(request.id, { peerStatus });
  }

  function resolveRequest(request, status, reason = '') {
    if (status === 'approved') {
      const own = data.shifts.find((shift) => shift.id === request.ownShiftId);
      const targetShift = data.shifts.find((shift) => shift.id === request.targetShiftId);
      if (own && targetShift) {
        actions.saveShift({ ...own, employeeId: targetShift.employeeId });
        actions.saveShift({ ...targetShift, employeeId: own.employeeId });
      } else if (own && request.targetEmployeeId) {
        actions.saveShift({ ...own, employeeId: request.targetEmployeeId });
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

  return (
    <section className="swap-board">
      <div className="card">
        <h2>{t('swaps.myCalendar')}</h2>
        <p className="muted">{t('swaps.pickOwnShift')}</p>
        <div className="mini-calendar-list">
          {ownShifts.length === 0 && <div className="empty-state">{t('employee.noUpcomingShifts')}</div>}
          {ownShifts.map((shift) => (
            <button
              className={ownShift?.id === shift.id ? 'calendar-pick selected' : 'calendar-pick'}
              key={shift.id}
              onClick={() => {
                setOwnShiftId(shift.id);
                setTarget(null);
              }}
            >
              <strong>{formatShift(shift)}</strong>
              <span>{t('swaps.offer')}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card form-card">
        <h2>{t('swaps.availablePeople')}</h2>
        <p className="muted">{t('swaps.availablePeopleHint')}</p>
        <div className="list">
          {options.length === 0 && <div className="empty-state">{t('swaps.noOptions')}</div>}
          {options.map((option) => (
            <button
              className={target?.id === option.id ? 'swap-option selected' : 'swap-option'}
              key={option.id}
              onClick={() => setTarget(option)}
            >
              <div>
                <strong>{option.employee.name}</strong>
                <span>{option.kind === 'free' ? t('swaps.freeOnDay') : formatShift(option.shift)}</span>
              </div>
              <span className="status approved">{t('legal.valid')}</span>
            </button>
          ))}
        </div>
        <label>
          {t('common.message')}
          <textarea value={message} onChange={(event) => setMessage(event.target.value)} />
        </label>
        <button disabled={!target} onClick={requestSwap}>
          {t('swaps.request')}
        </button>
      </div>

      <div className="card">
        <h2>{t('swaps.incoming')}</h2>
        <div className="list">
          {incoming.length === 0 && <div className="empty-state">{t('swaps.noIncoming')}</div>}
          {incoming.map((request) => (
            <IncomingSwapRequest key={request.id} request={request} data={data} onResolve={peerResolve} t={t} />
          ))}
        </div>
      </div>

      <div className="card">
        <h2>{t('common.status')}</h2>
        <div className="list">
          {outgoing.length === 0 && <div className="empty-state">{t('swaps.noOutgoing')}</div>}
          {outgoing.map((request) => (
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
  const targetEmployee = data.employees.find((employee) => employee.id === (request.targetEmployeeId || targetShift?.employeeId));
  const stillLegal = ownShift && targetEmployee && isLegalTarget({ data, ownShift, targetEmployee, targetShift });

  return (
    <article className="list-item swap-item">
      <div>
        <strong>
          {requester?.name} {'->'} {targetEmployee?.name}
        </strong>
        <span>
          {formatShift(ownShift)} {targetShift ? `/ ${formatShift(targetShift)}` : `· ${t('swaps.freeOnDay')}`}
        </span>
        {request.message && <p className="muted">{request.message}</p>}
        <span>
          {t('swaps.peerStatus')}: {t(`common.${request.peerStatus || 'pending'}`)}
        </span>
        <span className={stillLegal ? 'success-text' : 'danger-text'}>
          {stillLegal ? t('legal.valid') : t('schedule.blocked')}
        </span>
      </div>
      <div className="button-row">
        <button disabled={!stillLegal || request.status !== 'pending' || request.peerStatus !== 'approved'} onClick={() => onResolve(request, 'approved')}>
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

function IncomingSwapRequest({ request, data, onResolve, t }) {
  const requester = data.employees.find((employee) => employee.id === request.requesterId);
  const ownShift = data.shifts.find((shift) => shift.id === request.ownShiftId);
  return (
    <article className="list-item swap-item">
      <div>
        <strong>{requester?.name}</strong>
        <span>{formatShift(ownShift)}</span>
        {request.message && <p className="muted">{request.message}</p>}
      </div>
      <div className="button-row">
        <button disabled={request.peerStatus !== 'pending'} onClick={() => onResolve(request, 'approved')}>
          {t('swaps.peerApprove')}
        </button>
        <button className="secondary-button" disabled={request.peerStatus !== 'pending'} onClick={() => onResolve(request, 'rejected')}>
          {t('swaps.peerReject')}
        </button>
      </div>
      <span className={`status ${request.peerStatus || 'pending'}`}>{t(`common.${request.peerStatus || 'pending'}`)}</span>
    </article>
  );
}

function SwapSummary({ request, data, t }) {
  const ownShift = data.shifts.find((shift) => shift.id === request.ownShiftId);
  const targetShift = data.shifts.find((shift) => shift.id === request.targetShiftId);
  const targetEmployee = data.employees.find((employee) => employee.id === (request.targetEmployeeId || targetShift?.employeeId));
  return (
    <article className="list-item">
      <div>
        <strong>{formatShift(ownShift)}</strong>
        <span>{targetEmployee?.name} · {targetShift ? formatShift(targetShift) : t('swaps.freeOnDay')}</span>
        <span>{t('swaps.peerStatus')}: {t(`common.${request.peerStatus || 'pending'}`)}</span>
      </div>
      <span className={`status ${request.status}`}>{t(`common.${request.status}`)}</span>
    </article>
  );
}

function buildSwapOptions({ data, ownShift, employeeId }) {
  const sameDay = data.shifts.filter((shift) => shift.date === ownShift.date);
  const busyEmployeeIds = new Set(sameDay.map((shift) => shift.employeeId).filter(Boolean));
  const freeOptions = data.employees
    .filter((employee) => employee.id !== employeeId && !busyEmployeeIds.has(employee.id))
    .filter((employee) => isLegalTarget({ data, ownShift, targetEmployee: employee }))
    .map((employee) => ({
      id: `free-${employee.id}`,
      kind: 'free',
      employee,
      employeeId: employee.id,
    }));

  const shiftOptions = data.shifts
    .filter((shift) => shift.id !== ownShift.id && shift.employeeId !== employeeId && shift.status === 'published')
    .filter((shift) => {
      const employee = data.employees.find((item) => item.id === shift.employeeId);
      return employee && isLegalTarget({ data, ownShift, targetEmployee: employee, targetShift: shift });
    })
    .map((shift) => {
      const employee = data.employees.find((item) => item.id === shift.employeeId);
      return {
        id: `shift-${shift.id}`,
        kind: 'shift',
        shift,
        shiftId: shift.id,
        employee,
        employeeId: employee.id,
      };
    });

  return [...freeOptions, ...shiftOptions];
}

function isLegalTarget({ data, ownShift, targetEmployee, targetShift }) {
  if (!ownShift || !targetEmployee) {
    return false;
  }

  const targetResult = validateShift({
    shift: { ...ownShift, employeeId: targetEmployee.id },
    existingShifts: data.shifts.filter((shift) => shift.id !== ownShift.id && shift.id !== targetShift?.id),
    employee: targetEmployee,
    company: data.company,
  });

  return targetResult.isValid;
}

function isIncomingRequest({ request, data, employeeId }) {
  if (request.status !== 'pending') {
    return false;
  }
  if (request.targetEmployeeId === employeeId) {
    return true;
  }
  const targetShift = data.shifts.find((shift) => shift.id === request.targetShiftId);
  return targetShift?.employeeId === employeeId;
}

function formatShift(shift) {
  if (!shift) {
    return '-';
  }
  return `${shift.date} ${shift.start}-${shift.end} (${getShiftHours(shift)}h)`;
}
