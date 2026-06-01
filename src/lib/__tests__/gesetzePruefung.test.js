import { describe, expect, it } from 'vitest';
import { getLegalProfile, isHoliday, validateShift } from '../gesetzePruefung.js';

const anna = { id: 'emp-1', name: 'Anna Berger', isMinor: false };
const minor = { id: 'emp-2', name: 'Mia Huber', isMinor: true };

describe('DACH legal validation', () => {
  it('loads branch-specific Austrian retail rules', () => {
    const profile = getLegalProfile('at', 'retail');

    expect(profile.normalWeeklyHours).toBe(38.5);
    expect(profile.restHours).toBe(11);
    expect(profile.sundayRequiresPermit).toBe(true);
  });

  it('blocks Austrian retail Sunday work without special approval', () => {
    const result = validateShift({
      company: { country: 'at', industry: 'retail' },
      employee: anna,
      existingShifts: [],
      shift: {
        id: 'shift-1',
        employeeId: 'emp-1',
        date: '2026-06-07',
        start: '09:00',
        end: '17:00',
        breakMinutes: 30,
        type: 'early',
      },
    });

    expect(result.isValid).toBe(false);
    expect(result.issues.map((issue) => issue.key)).toContain('legal.sundayPermit');
  });

  it('blocks German minor night work', () => {
    const result = validateShift({
      company: { country: 'de', industry: 'general' },
      employee: minor,
      existingShifts: [],
      shift: {
        id: 'shift-1',
        employeeId: 'emp-2',
        date: '2026-06-02',
        start: '20:30',
        end: '23:00',
        breakMinutes: 0,
        type: 'late',
      },
    });

    expect(result.isValid).toBe(false);
    expect(result.issues.map((issue) => issue.key)).toContain('legal.minorNight');
  });

  it('blocks insufficient rest between shifts', () => {
    const result = validateShift({
      company: { country: 'de', industry: 'general' },
      employee: anna,
      existingShifts: [
        {
          id: 'shift-before',
          employeeId: 'emp-1',
          date: '2026-06-02',
          start: '14:00',
          end: '22:00',
          breakMinutes: 30,
          type: 'late',
        },
      ],
      shift: {
        id: 'shift-next',
        employeeId: 'emp-1',
        date: '2026-06-03',
        start: '06:00',
        end: '14:00',
        breakMinutes: 30,
        type: 'early',
      },
    });

    expect(result.isValid).toBe(false);
    expect(result.issues.map((issue) => issue.key)).toContain('legal.rest');
  });

  it('flags Swiss night work permit and mandatory break violations', () => {
    const result = validateShift({
      company: { country: 'ch', industry: 'general' },
      employee: anna,
      existingShifts: [],
      shift: {
        id: 'shift-night',
        employeeId: 'emp-1',
        date: '2026-06-02',
        start: '22:00',
        end: '06:00',
        breakMinutes: 0,
        type: 'night',
      },
    });

    expect(result.isValid).toBe(false);
    expect(result.issues.map((issue) => issue.key)).toEqual(
      expect.arrayContaining(['legal.chNightPermit', 'legal.breakMissing']),
    );
    expect(result.suggestedBreakMinutes).toBe(30);
  });

  it('recognizes fixed Austrian public holidays', () => {
    expect(isHoliday('at', new Date('2026-01-01T12:00:00'))).toBe(true);
    expect(isHoliday('at', new Date('2026-01-02T12:00:00'))).toBe(false);
  });
});
