import { getShiftHours, getShiftRange, isHoliday } from './gesetzePruefung.js';

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function overlapsNight(shift) {
  const { start, end } = getShiftRange(shift);
  const cursor = new Date(start);
  let hours = 0;

  while (cursor < end) {
    const hour = cursor.getHours();
    if (hour >= 22 || hour < 6) {
      hours += 1;
    }
    cursor.setHours(cursor.getHours() + 1);
  }

  return Math.min(hours, getShiftHours(shift));
}

function countHoursByDayPredicate(shift, predicate) {
  const { start, end } = getShiftRange(shift);
  const cursor = new Date(start);
  let hours = 0;

  while (cursor < end) {
    if (predicate(cursor)) {
      hours += 1;
    }
    cursor.setHours(cursor.getHours() + 1);
  }

  return Math.min(hours, getShiftHours(shift));
}

export function calculateMonthlyHours({
  employees = [],
  shifts = [],
  sickReports = [],
  vacationDays = [],
  absenceRequests = [],
  timeEntries = [],
  allowances = {},
  country = 'at',
  region = '',
  month = monthKey(new Date()),
}) {
  return employees.map((employee) => {
    const employeeShifts = shifts.filter((shift) => {
      if (shift.employeeId !== employee.id) {
        return false;
      }
      const { start } = getShiftRange(shift);
      return monthKey(start) === month && shift.status !== 'unassigned';
    });

    const planned = employeeShifts.reduce((sum, shift) => sum + getShiftHours(shift), 0);
    const actual = employeeShifts
      .filter((shift) => shift.actual !== false)
      .reduce((sum, shift) => sum + getActualShiftHours(shift, timeEntries), 0);
    const night = employeeShifts.reduce((sum, shift) => sum + overlapsNight(shift), 0);
    const sunday = employeeShifts.reduce(
      (sum, shift) => sum + countHoursByDayPredicate(shift, (date) => date.getDay() === 0),
      0,
    );
    const holiday = employeeShifts.reduce(
      (sum, shift) => sum + countHoursByDayPredicate(shift, (date) => isHoliday(country, date, region)),
      0,
    );
    const sickDays = sickReports.filter(
      (report) => report.employeeId === employee.id && report.date.startsWith(month),
    ).length;
    const approvedVacationDays = absenceRequests
      .filter(
        (request) =>
          request.employeeId === employee.id
          && request.status === 'approved'
          && request.type === 'vacation'
          && request.startDate.slice(0, 7) <= month
          && request.endDate.slice(0, 7) >= month,
      )
      .reduce((sum, request) => sum + countMonthDaysInRange(request.startDate, request.endDate, month), 0);
    const employeeVacationDays = vacationDays.filter(
      (entry) => entry.employeeId === employee.id && entry.date.startsWith(month),
    ).length + approvedVacationDays;
    const target = Number(employee.weeklyTarget || 0) * 4.33;

    return {
      employeeId: employee.id,
      employeeName: employee.name,
      planned: round(planned),
      actual: round(actual),
      overtime: round(actual - target),
      night: round(night),
      sunday: round(sunday),
      holiday: round(holiday),
      sickDays,
      vacationDays: employeeVacationDays,
      allowances: allowances[employee.id] || '',
    };
  });
}

export function createHoursCsv(rows, labels) {
  const headers = [
    labels.employee,
    labels.planned,
    labels.actual,
    labels.overtime,
    labels.night,
    labels.sunday,
    labels.holiday,
    labels.sickDays,
    labels.vacationDays,
    labels.allowances,
  ];
  const lines = rows.map((row) => [
    row.employeeName,
    row.planned,
    row.actual,
    row.overtime,
    row.night,
    row.sunday,
    row.holiday,
    row.sickDays,
    row.vacationDays,
    row.allowances,
  ]);

  return [headers, ...lines]
    .map((line) => line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
    .join('\n');
}

export function downloadTextFile(filename, content, mime = 'text/plain') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function getActualShiftHours(shift, timeEntries) {
  const entries = timeEntries
    .filter((entry) => entry.shiftId === shift.id)
    .sort((left, right) => new Date(left.occurredAt) - new Date(right.occurredAt));
  const start = entries.find((entry) => entry.type === 'start');
  const end = [...entries].reverse().find((entry) => entry.type === 'end');
  if (!start || !end) {
    return getShiftHours(shift);
  }

  const pauseStarts = entries.filter((entry) => entry.type === 'pause_start');
  const pauseEnds = entries.filter((entry) => entry.type === 'pause_end');
  const pauseMs = pauseStarts.reduce((sum, pauseStart, index) => {
    const pauseEnd = pauseEnds[index];
    if (!pauseEnd) {
      return sum;
    }
    return sum + Math.max(0, new Date(pauseEnd.occurredAt) - new Date(pauseStart.occurredAt));
  }, 0);

  return Math.max(0, (new Date(end.occurredAt) - new Date(start.occurredAt) - pauseMs) / (60 * 60 * 1000));
}

function countMonthDaysInRange(startDate, endDate, month) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  let count = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    if (`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}` === month) {
      count += 1;
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

function round(value) {
  return Math.round(value * 100) / 100;
}
