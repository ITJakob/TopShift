import { describe, expect, it } from 'vitest';
import { calculateMonthlyHours, createHoursCsv } from '../stundenBerechnung.js';

describe('monthly hour calculation', () => {
  it('summarizes planned, actual, night, Sunday, holiday, and sick hours per employee', () => {
    const rows = calculateMonthlyHours({
      country: 'at',
      month: '2026-01',
      employees: [
        {
          id: 'emp-1',
          name: 'Anna Berger',
          weeklyTarget: 40,
        },
      ],
      shifts: [
        {
          id: 'shift-1',
          employeeId: 'emp-1',
          date: '2026-01-01',
          start: '08:00',
          end: '16:30',
          breakMinutes: 30,
          status: 'published',
        },
        {
          id: 'shift-2',
          employeeId: 'emp-1',
          date: '2026-01-04',
          start: '22:00',
          end: '06:00',
          breakMinutes: 0,
          status: 'published',
        },
      ],
      sickReports: [{ employeeId: 'emp-1', date: '2026-01-10' }],
      allowances: { 'emp-1': 'Nachtzuschlag' },
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      employeeName: 'Anna Berger',
      planned: 16,
      actual: 16,
      night: 8,
      sunday: 2,
      holiday: 8,
      sickDays: 1,
      allowances: 'Nachtzuschlag',
    });
  });

  it('creates escaped CSV output for payroll export', () => {
    const csv = createHoursCsv(
      [
        {
          employeeName: 'Anna "A" Berger',
          planned: 8,
          actual: 8,
          overtime: 0,
          night: 0,
          sunday: 0,
          holiday: 0,
          sickDays: 0,
          vacationDays: 0,
          allowances: 'Sonntag',
        },
      ],
      {
        employee: 'Employee',
        planned: 'Planned',
        actual: 'Actual',
        overtime: 'Overtime',
        night: 'Night',
        sunday: 'Sunday',
        holiday: 'Holiday',
        sickDays: 'Sick',
        vacationDays: 'Vacation',
        allowances: 'Allowances',
      },
    );

    expect(csv).toContain('"Anna ""A"" Berger"');
    expect(csv.split('\n')).toHaveLength(2);
  });
});
