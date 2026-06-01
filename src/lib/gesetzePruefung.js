export const COUNTRIES = {
  AT: 'at',
  DE: 'de',
  CH: 'ch',
};

export const INDUSTRIES = {
  GENERAL: 'general',
  HOSPITALITY: 'hospitality',
  RETAIL: 'retail',
  HEALTHCARE: 'healthcare',
  PRODUCTION: 'production',
};

const HOUR = 60 * 60 * 1000;

export const legalProfiles = {
  at: {
    general: {
      lawKey: 'laws.at.azg',
      dailyMaxHours: 10,
      weeklyMaxHours: 50,
      normalWeeklyHours: 40,
      restHours: 11,
      breakRules: [{ afterHours: 6, minutes: 30 }],
      minorNightWindow: { start: '22:00', end: '06:00' },
      minorDailyMaxHours: 8,
      notes: [],
    },
    hospitality: {
      lawKey: 'laws.at.azg',
      dailyMaxHours: 10,
      weeklyMaxHours: 50,
      normalWeeklyHours: 40,
      restHours: 8,
      breakRules: [{ afterHours: 6, minutes: 30 }],
      minorNightWindow: { start: '22:00', end: '06:00' },
      minorDailyMaxHours: 8,
      notes: ['legal.holidayPremium'],
    },
    retail: {
      lawKey: 'laws.at.azg',
      dailyMaxHours: 10,
      weeklyMaxHours: 50,
      normalWeeklyHours: 38.5,
      restHours: 11,
      breakRules: [{ afterHours: 6, minutes: 30 }],
      minorNightWindow: { start: '22:00', end: '06:00' },
      minorDailyMaxHours: 8,
      sundayRequiresPermit: true,
      notes: ['legal.sundayPermit'],
    },
    healthcare: {
      lawKey: 'laws.at.kaazg',
      dailyMaxHours: 13,
      weeklyMaxHours: 60,
      normalWeeklyHours: 48,
      restHours: 11,
      breakRules: [{ afterHours: 6, minutes: 30 }],
      minorNightWindow: { start: '22:00', end: '06:00' },
      minorDailyMaxHours: 8,
      notes: ['legal.onCallSeparate'],
    },
    production: {
      lawKey: 'laws.at.azg',
      dailyMaxHours: 10,
      weeklyMaxHours: 50,
      normalWeeklyHours: 40,
      restHours: 11,
      breakRules: [{ afterHours: 6, minutes: 30 }],
      minorNightWindow: { start: '22:00', end: '06:00' },
      minorDailyMaxHours: 8,
      notes: [],
    },
  },
  de: {
    general: {
      lawKey: 'laws.de.arbzg',
      dailyMaxHours: 10,
      weeklyMaxHours: 60,
      normalWeeklyHours: 48,
      restHours: 11,
      breakRules: [
        { afterHours: 6, minutes: 30 },
        { afterHours: 9, minutes: 45 },
      ],
      minorNightWindow: { start: '20:00', end: '06:00' },
      minorDailyMaxHours: 8,
      notes: [],
    },
    hospitality: {
      lawKey: 'laws.de.arbzg',
      dailyMaxHours: 10,
      weeklyMaxHours: 60,
      normalWeeklyHours: 48,
      restHours: 10,
      breakRules: [
        { afterHours: 6, minutes: 30 },
        { afterHours: 9, minutes: 45 },
      ],
      minorNightWindow: { start: '20:00', end: '06:00' },
      minorDailyMaxHours: 8,
      notes: ['legal.holidayPremium'],
    },
    retail: {
      lawKey: 'laws.de.arbzg',
      dailyMaxHours: 10,
      weeklyMaxHours: 60,
      normalWeeklyHours: 48,
      restHours: 11,
      breakRules: [
        { afterHours: 6, minutes: 30 },
        { afterHours: 9, minutes: 45 },
      ],
      minorNightWindow: { start: '20:00', end: '06:00' },
      minorDailyMaxHours: 8,
      sundayRequiresPermit: true,
      notes: ['legal.retailClosing', 'legal.sundayPermit'],
    },
    healthcare: {
      lawKey: 'laws.de.arbzg',
      dailyMaxHours: 10,
      weeklyMaxHours: 60,
      normalWeeklyHours: 48,
      restHours: 10,
      breakRules: [
        { afterHours: 6, minutes: 30 },
        { afterHours: 9, minutes: 45 },
      ],
      minorNightWindow: { start: '20:00', end: '06:00' },
      minorDailyMaxHours: 8,
      notes: ['legal.onCallSeparate'],
    },
    production: {
      lawKey: 'laws.de.arbzg',
      dailyMaxHours: 10,
      weeklyMaxHours: 60,
      normalWeeklyHours: 48,
      restHours: 11,
      breakRules: [
        { afterHours: 6, minutes: 30 },
        { afterHours: 9, minutes: 45 },
      ],
      minorNightWindow: { start: '20:00', end: '06:00' },
      minorDailyMaxHours: 8,
      notes: [],
    },
  },
  ch: {
    general: {
      lawKey: 'laws.ch.arg',
      dailyMaxHours: 14,
      weeklyMaxHours: 50,
      normalWeeklyHours: 50,
      restHours: 11,
      breakRules: [
        { afterHours: 5.5, minutes: 15 },
        { afterHours: 7, minutes: 30 },
        { afterHours: 9, minutes: 60 },
      ],
      minorNightWindow: { start: '23:00', end: '06:00' },
      minorDailyMaxHours: 8,
      swissPermitRules: true,
      notes: ['legal.swissWeeklyRest'],
    },
    hospitality: {
      lawKey: 'laws.ch.arg',
      dailyMaxHours: 14,
      weeklyMaxHours: 54,
      normalWeeklyHours: 50,
      restHours: 11,
      breakRules: [
        { afterHours: 5.5, minutes: 15 },
        { afterHours: 7, minutes: 30 },
        { afterHours: 9, minutes: 60 },
      ],
      minorNightWindow: { start: '23:00', end: '06:00' },
      minorDailyMaxHours: 8,
      swissPermitRules: true,
      notes: ['legal.holidayPremium', 'legal.swissWeeklyRest'],
    },
    retail: {
      lawKey: 'laws.ch.arg',
      dailyMaxHours: 14,
      weeklyMaxHours: 45,
      normalWeeklyHours: 45,
      restHours: 11,
      breakRules: [
        { afterHours: 5.5, minutes: 15 },
        { afterHours: 7, minutes: 30 },
        { afterHours: 9, minutes: 60 },
      ],
      minorNightWindow: { start: '23:00', end: '06:00' },
      minorDailyMaxHours: 8,
      swissPermitRules: true,
      notes: ['legal.retailClosing', 'legal.swissWeeklyRest'],
    },
    healthcare: {
      lawKey: 'laws.ch.arg',
      dailyMaxHours: 14,
      weeklyMaxHours: 50,
      normalWeeklyHours: 50,
      restHours: 11,
      breakRules: [
        { afterHours: 5.5, minutes: 15 },
        { afterHours: 7, minutes: 30 },
        { afterHours: 9, minutes: 60 },
      ],
      minorNightWindow: { start: '23:00', end: '06:00' },
      minorDailyMaxHours: 8,
      swissPermitRules: true,
      notes: ['legal.onCallSeparate', 'legal.swissWeeklyRest'],
    },
    production: {
      lawKey: 'laws.ch.arg',
      dailyMaxHours: 14,
      weeklyMaxHours: 50,
      normalWeeklyHours: 50,
      restHours: 11,
      breakRules: [
        { afterHours: 5.5, minutes: 15 },
        { afterHours: 7, minutes: 30 },
        { afterHours: 9, minutes: 60 },
      ],
      minorNightWindow: { start: '23:00', end: '06:00' },
      minorDailyMaxHours: 8,
      swissPermitRules: true,
      notes: ['legal.swissWeeklyRest'],
    },
  },
};

export function getLegalProfile(country = COUNTRIES.AT, industry = INDUSTRIES.GENERAL) {
  return legalProfiles[country]?.[industry] || legalProfiles.at.general;
}

export function parseShiftDateTime(date, time) {
  return new Date(`${date}T${time}:00`);
}

export function getShiftRange(shift) {
  const start = parseShiftDateTime(shift.date, shift.start);
  let end = parseShiftDateTime(shift.date, shift.end);
  if (end <= start) {
    end = new Date(end.getTime() + 24 * HOUR);
  }
  return { start, end };
}

export function getShiftHours(shift) {
  const { start, end } = getShiftRange(shift);
  const breakHours = Number(shift.breakMinutes || 0) / 60;
  return Math.max(0, (end - start) / HOUR - breakHours);
}

export function getWeekStart(date) {
  const result = new Date(date);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function isSameLocalDate(left, right) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

export function isSameWeek(left, right) {
  return getWeekStart(left).getTime() === getWeekStart(right).getTime();
}

function requiredBreakMinutes(hours, breakRules) {
  return breakRules.reduce((required, rule) => {
    if (hours > rule.afterHours) {
      return Math.max(required, rule.minutes);
    }
    return required;
  }, 0);
}

function timeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function rangeOverlapsWindow(shift, window) {
  const { start, end } = getShiftRange(shift);
  const cursor = new Date(start);

  while (cursor < end) {
    const day = cursor.toISOString().slice(0, 10);
    const windowStart = parseShiftDateTime(day, window.start);
    let windowEnd = parseShiftDateTime(day, window.end);

    if (timeToMinutes(window.end) <= timeToMinutes(window.start)) {
      windowEnd = new Date(windowEnd.getTime() + 24 * HOUR);
    }

    if (start < windowEnd && end > windowStart) {
      return true;
    }

    cursor.setDate(cursor.getDate() + 1);
    cursor.setHours(0, 0, 0, 0);
  }

  return false;
}

function hasSundayWork(shift) {
  const { start, end } = getShiftRange(shift);
  const cursor = new Date(start);
  while (cursor < end) {
    if (cursor.getDay() === 0) {
      return true;
    }
    cursor.setHours(cursor.getHours() + 1);
  }
  return false;
}

function getEasterDate(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function isHoliday(country, date, region = "") {
  const checked = new Date(date);
  const monthDay = `${String(checked.getMonth() + 1).padStart(2, '0')}-${String(
    checked.getDate(),
  ).padStart(2, '0')}`;
  const fixed = {
    at: ['01-01', '01-06', '05-01', '08-15', '10-26', '11-01', '12-08', '12-25', '12-26'],
    de: ['01-01', '05-01', '10-03', '12-25', '12-26'],
    ch: ['01-01', '08-01', '12-25'],
  };
  const regional = {
    'at-wien': ['11-15'],
    'at-stmk': ['03-19'],
    'de-by': ['01-06', '08-15', '11-01'],
    'de-be': ['03-08'],
    'de-sn': ['10-31', '11-20'],
    'ch-zh': ['05-01'],
    'ch-ge': ['12-31'],
    'ch-ti': ['01-06', '03-19', '06-29'],
  };
  if (fixed[country]?.includes(monthDay) || regional[region]?.includes(monthDay)) {
    return true;
  }

  const easter = getEasterDate(checked.getFullYear());
  const movableOffsets = country === 'ch' ? [-2, 1, 39] : [-2, 1, 39, 50, 60];
  return movableOffsets.some((offset) => isSameLocalDate(addDays(easter, offset), checked));
}

function issue(key, params = {}, severity = 'error') {
  return { key, params, severity };
}

export function validateShift({ shift, existingShifts = [], employee, company }) {
  const profile = getLegalProfile(company?.country, company?.industry);
  const employeeName = employee?.name || 'Mitarbeiter';
  const lawKey = profile.lawKey;
  const issues = [];
  const warnings = profile.notes.map((key) => issue(key, {}, 'warning'));
  const candidateHours = getShiftHours(shift);
  const candidateRange = getShiftRange(shift);

  const employeeShifts = existingShifts
    .filter((item) => item.id !== shift.id && item.employeeId === shift.employeeId)
    .map((item) => ({ ...item, range: getShiftRange(item) }))
    .sort((a, b) => a.range.start - b.range.start);

  const sameDayHours = employeeShifts
    .filter((item) => isSameLocalDate(item.range.start, candidateRange.start))
    .reduce((sum, item) => sum + getShiftHours(item), candidateHours);

  if (sameDayHours > profile.dailyMaxHours) {
    issues.push(
      issue('legal.dailyMax', {
        employee: employeeName,
        hours: sameDayHours.toFixed(1),
        limit: profile.dailyMaxHours,
        law: lawKey,
      }),
    );
  }

  const weeklyHours = employeeShifts
    .filter((item) => isSameWeek(item.range.start, candidateRange.start))
    .reduce((sum, item) => sum + getShiftHours(item), candidateHours);

  if (weeklyHours > profile.weeklyMaxHours) {
    issues.push(
      issue('legal.weeklyMax', {
        employee: employeeName,
        hours: weeklyHours.toFixed(1),
        limit: profile.weeklyMaxHours,
        law: lawKey,
      }),
    );
  }

  const before = [...employeeShifts]
    .reverse()
    .find((item) => item.range.end <= candidateRange.start);
  const after = employeeShifts.find((item) => item.range.start >= candidateRange.end);

  if (before) {
    const restHours = (candidateRange.start - before.range.end) / HOUR;
    if (restHours < profile.restHours) {
      issues.push(
        issue('legal.rest', {
          hours: restHours.toFixed(1),
          limit: profile.restHours,
          law: lawKey,
        }),
      );
    }
  }

  if (after) {
    const restHours = (after.range.start - candidateRange.end) / HOUR;
    if (restHours < profile.restHours) {
      issues.push(
        issue('legal.rest', {
          hours: restHours.toFixed(1),
          limit: profile.restHours,
          law: lawKey,
        }),
      );
    }
  }

  const requiredBreak = requiredBreakMinutes(candidateHours + Number(shift.breakMinutes || 0) / 60, profile.breakRules);
  if (requiredBreak > Number(shift.breakMinutes || 0)) {
    issues.push(
      issue('legal.breakMissing', {
        hours: (candidateHours + Number(shift.breakMinutes || 0) / 60).toFixed(1),
        breakMinutes: requiredBreak,
        law: lawKey,
      }),
    );
  }

  if (employee?.isMinor && candidateHours > profile.minorDailyMaxHours) {
    issues.push(
      issue('legal.minorDaily', {
        limit: profile.minorDailyMaxHours,
      }),
    );
  }

  if (employee?.isMinor && rangeOverlapsWindow(shift, profile.minorNightWindow)) {
    issues.push(
      issue('legal.minorNight', {
        window: `${profile.minorNightWindow.start}-${profile.minorNightWindow.end}`,
      }),
    );
  }

  if (profile.swissPermitRules && rangeOverlapsWindow(shift, { start: '23:00', end: '06:00' })) {
    issues.push(issue('legal.chNightPermit', { law: lawKey }));
  }

  if (profile.swissPermitRules && hasSundayWork(shift)) {
    issues.push(issue('legal.chSundayPermit', { law: lawKey }));
  }

  if (profile.sundayRequiresPermit && hasSundayWork(shift)) {
    issues.push(issue('legal.sundayPermit', { law: lawKey }));
  }

  if (isHoliday(company?.country, candidateRange.start, company?.region) || hasSundayWork(shift)) {
    warnings.push(issue('legal.holidayPremium', {}, 'warning'));
  }

  return {
    isValid: issues.length === 0,
    issues,
    warnings,
    profile,
    suggestedBreakMinutes: requiredBreak,
    hours: candidateHours,
  };
}

export function canSaveShift(validation, overrideReason = '') {
  return validation.isValid || overrideReason.trim().length > 0;
}

export function buildOverrideLog(userName, reason) {
  return {
    userName,
    reason,
    timestamp: new Date().toISOString(),
  };
}
