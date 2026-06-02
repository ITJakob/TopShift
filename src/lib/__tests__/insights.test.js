import { describe, expect, it } from 'vitest';
import { calculateAdminInsights, calculateEmployeeInsights } from '../insights.js';

const baseData = {
  company: { country: 'at', industry: 'general', region: 'at-wien' },
  employees: [
    { id: 'emp-1', name: 'Anna', weeklyTarget: 40, isMinor: false },
    { id: 'emp-2', name: 'Lukas', weeklyTarget: 20, isMinor: false },
  ],
  shifts: [
    {
      id: 'shift-1',
      employeeId: 'emp-1',
      date: '2026-06-03',
      start: '08:00',
      end: '16:30',
      breakMinutes: 30,
      status: 'published',
      type: 'early',
    },
    {
      id: 'shift-2',
      employeeId: '',
      date: '2026-06-04',
      start: '10:00',
      end: '18:30',
      breakMinutes: 30,
      status: 'unassigned',
      type: 'mid',
    },
    {
      id: 'shift-3',
      employeeId: 'emp-2',
      date: '2026-06-05',
      start: '12:00',
      end: '20:00',
      breakMinutes: 30,
      status: 'draft',
      type: 'late',
    },
  ],
  absenceRequests: [{ id: 'abs-1', employeeId: 'emp-1', status: 'pending' }],
  swapRequests: [{ id: 'swap-1', requesterId: 'emp-1', status: 'pending' }],
  openShiftApplications: [{ id: 'open-1', employeeId: 'emp-2', status: 'pending' }],
  invitations: [{ id: 'inv-1', status: 'pending' }],
  timeEntries: [],
};

describe('operational insights', () => {
  it('calculates admin operational counters', () => {
    const insights = calculateAdminInsights(baseData);

    expect(insights.publishedShifts).toBe(1);
    expect(insights.openShifts).toBe(1);
    expect(insights.draftShifts).toBe(1);
    expect(insights.pendingAbsences).toBe(1);
    expect(insights.pendingSwaps).toBe(1);
    expect(insights.pendingOpenShiftApplications).toBe(1);
    expect(insights.pendingInvitations).toBe(1);
    expect(insights.totalPlannedHours).toBe(8);
  });

  it('calculates employee quick overview', () => {
    const insights = calculateEmployeeInsights(baseData, 'emp-1');

    expect(insights.upcomingCount).toBe(1);
    expect(insights.plannedHours).toBe(8);
    expect(insights.pendingAbsences).toBe(1);
    expect(insights.openApplications).toBe(0);
  });
});
