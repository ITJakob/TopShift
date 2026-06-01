import { getShiftHours, validateShift } from './gesetzePruefung.js';

export function calculateAdminInsights(data) {
  const publishedShifts = data.shifts.filter((shift) => shift.status === 'published');
  const openShifts = data.shifts.filter((shift) => !shift.employeeId || shift.status === 'unassigned');
  const draftShifts = data.shifts.filter((shift) => shift.status === 'draft');
  const pendingAbsences = data.absenceRequests.filter((request) => request.status === 'pending');
  const pendingSwaps = data.swapRequests.filter((request) => request.status === 'pending');
  const pendingOpenShiftApplications = data.openShiftApplications.filter((application) => application.status === 'pending');
  const pendingInvitations = data.invitations.filter((invitation) => invitation.status === 'pending');
  const legalIssues = collectLegalIssues(data);
  const workload = calculateWorkload(data);

  return {
    publishedShifts: publishedShifts.length,
    openShifts: openShifts.length,
    draftShifts: draftShifts.length,
    pendingAbsences: pendingAbsences.length,
    pendingSwaps: pendingSwaps.length,
    pendingOpenShiftApplications: pendingOpenShiftApplications.length,
    pendingInvitations: pendingInvitations.length,
    legalIssues,
    workload,
    totalPlannedHours: round(publishedShifts.reduce((sum, shift) => sum + getShiftHours(shift), 0)),
  };
}

export function calculateEmployeeInsights(data, employeeId) {
  const shifts = data.shifts.filter((shift) => shift.employeeId === employeeId && shift.status === 'published');
  const upcoming = shifts
    .filter((shift) => new Date(`${shift.date}T${shift.end}`) >= new Date())
    .sort((left, right) => `${left.date}${left.start}`.localeCompare(`${right.date}${right.start}`));
  const pendingAbsences = data.absenceRequests.filter(
    (request) => request.employeeId === employeeId && request.status === 'pending',
  ).length;
  const incomingSwaps = data.swapRequests.filter(
    (request) => request.targetEmployeeId === employeeId && request.peerStatus === 'pending',
  ).length;
  const openApplications = data.openShiftApplications.filter(
    (application) => application.employeeId === employeeId && application.status === 'pending',
  ).length;
  const timeEntriesToday = data.timeEntries.filter(
    (entry) => entry.employeeId === employeeId && entry.occurredAt?.startsWith(new Date().toISOString().slice(0, 10)),
  ).length;

  return {
    nextShift: upcoming[0],
    upcomingCount: upcoming.length,
    plannedHours: round(shifts.reduce((sum, shift) => sum + getShiftHours(shift), 0)),
    pendingAbsences,
    incomingSwaps,
    openApplications,
    timeEntriesToday,
  };
}

function collectLegalIssues(data) {
  return data.shifts
    .filter((shift) => shift.employeeId && shift.status !== 'unassigned')
    .flatMap((shift) => {
      const employee = data.employees.find((item) => item.id === shift.employeeId);
      if (!employee) {
        return [];
      }
      const result = validateShift({
        shift,
        existingShifts: data.shifts,
        employee,
        company: data.company,
      });

      return result.issues.map((issue) => ({
        shiftId: shift.id,
        employeeName: employee.name,
        date: shift.date,
        issue,
      }));
    });
}

function calculateWorkload(data) {
  return data.employees
    .map((employee) => {
      const shifts = data.shifts.filter((shift) => shift.employeeId === employee.id && shift.status === 'published');
      const plannedHours = shifts.reduce((sum, shift) => sum + getShiftHours(shift), 0);
      const targetHours = Number(employee.weeklyTarget || 0);
      return {
        employeeId: employee.id,
        employeeName: employee.name,
        plannedHours: round(plannedHours),
        targetHours,
        utilization: targetHours ? round((plannedHours / targetHours) * 100) : 0,
      };
    })
    .sort((left, right) => right.utilization - left.utilization);
}

function round(value) {
  return Math.round(value * 100) / 100;
}
