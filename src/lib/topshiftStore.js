import { supabase, supabaseConfigured } from './supabase.js';

export function shouldUseRemote(user) {
  return Boolean(supabaseConfigured && supabase && user && !user.isDemo);
}


export async function fetchInvitationByTokenRemote(token) {
  if (!supabaseConfigured || !supabase || !token) {
    return null;
  }

  const { data, error } = await supabase.rpc('get_invitation_by_token', { invite_token: token });
  if (error) {
    throw error;
  }
  const invitation = data?.[0];
  if (!invitation) {
    return null;
  }
  return {
    id: invitation.id,
    companyId: invitation.company_id,
    companyName: invitation.company_name,
    email: invitation.email,
    role: invitation.role,
    status: invitation.status,
    expiresAt: invitation.expires_at,
  };
}

export async function acceptInvitationRemote(token) {
  await throwOnError(supabase.rpc('accept_invitation', { invite_token: token }));
}

export async function loadRemoteWorkspace(user, fallbackState, language = 'de') {
  if (!shouldUseRemote(user)) {
    return { state: fallbackState, userPatch: {} };
  }

  await upsertProfile(user, language);

  const membership = await getFirstMembership(user.id);
  if (!membership) {
    await bootstrapWorkspace(user, fallbackState);
  }

  const activeMembership = membership || (await getFirstMembership(user.id));
  if (!activeMembership) {
    throw new Error('No workspace membership found.');
  }

  const state = await fetchWorkspaceState(activeMembership.company_id, fallbackState);
  const employee = state.employees.find((item) => item.email === user.email);

  return {
    state,
    userPatch: {
      role: activeMembership.role,
      employeeId: employee?.id,
    },
  };
}

export async function saveCompanyRemote(company) {
  if (!company?.id) {
    return;
  }

  await throwOnError(
    supabase
      .from('companies')
      .update({
        name: company.name,
        logo_url: company.logo || null,
        country: company.country,
        industry: company.industry,
        region: company.region || defaultRegion(company.country),
        plan: company.plan,
        onboarding_completed: Boolean(company.onboardingComplete),
      })
      .eq('id', company.id),
  );

  await syncLocations(company);
}

export async function addEmployeeRemote(companyId, employee) {
  const { data, error } = await supabase.from('employees').upsert(
    {
      id: isUuid(employee.id) ? employee.id : undefined,
      company_id: companyId,
      name: employee.name,
      email: employee.email.toLowerCase(),
      role: employee.role,
      contract: employee.contract,
      weekly_target: employee.weeklyTarget,
      is_minor: employee.isMinor,
      preferences: employee.preferences || '',
      preferred_times: employee.preferredTimes || '',
      avoid_days: employee.avoidDays || '',
      max_night_shifts: employee.maxNightShifts || 0,
      other_notes: employee.otherNotes || '',
      invited_at: new Date().toISOString(),
    },
    { onConflict: 'company_id,email' },
  ).select('id,email,role').single();

  if (error) {
    throw error;
  }

  await throwOnError(
    supabase.from('employee_invitations').upsert(
      {
        company_id: companyId,
        employee_id: data.id,
        email: data.email,
        role: data.role,
        token: employee.inviteToken,
        status: 'pending',
      },
      { onConflict: 'company_id,email,status' },
    ),
  );
}

export async function updateEmployeeRemote(companyId, employeeId, patch) {
  const payload = mapEmployeePatch(patch);
  if (Object.keys(payload).length === 0) {
    return;
  }

  await throwOnError(
    supabase.from('employees').update(payload).eq('company_id', companyId).eq('id', employeeId),
  );
}

export async function saveShiftRemote(company, shift, actorId) {
  const locationId = await ensureLocation(company.id, shift.location);
  await throwOnError(
    supabase.from('shifts').upsert({
      id: isUuid(shift.id) ? shift.id : undefined,
      company_id: company.id,
      employee_id: isUuid(shift.employeeId) ? shift.employeeId : null,
      location_id: locationId,
      shift_date: shift.date,
      start_time: shift.start,
      end_time: shift.end,
      break_minutes: shift.breakMinutes || 0,
      type: shift.type,
      status: shift.status,
      notes: shift.notes || '',
      override_log: shift.overrideLog || null,
      actual: shift.actual !== false,
      created_by: actorId,
    }),
  );
}

export async function deleteShiftRemote(companyId, shiftId) {
  await throwOnError(supabase.from('shifts').delete().eq('company_id', companyId).eq('id', shiftId));
}

export async function publishScheduleRemote(companyId) {
  await throwOnError(
    supabase.from('shifts').update({ status: 'published' }).eq('company_id', companyId).eq('status', 'draft'),
  );
}

export async function addTemplateRemote(companyId, template) {
  await throwOnError(
    supabase.from('shift_templates').insert({
      company_id: companyId,
      name: template.name,
      start_time: template.start,
      end_time: template.end,
      break_minutes: template.breakMinutes || 0,
      type: template.type,
    }),
  );
}

export async function addSickReportRemote(companyId, report) {
  const reportDate = report.date || new Date().toISOString().slice(0, 10);
  await throwOnError(
    supabase.from('sick_reports').insert({
      company_id: companyId,
      employee_id: report.employeeId,
      report_date: reportDate,
      duration: report.duration || '',
    }),
  );
  await throwOnError(
    supabase
      .from('shifts')
      .update({ employee_id: null, status: 'unassigned', notes: 'sick-report' })
      .eq('company_id', companyId)
      .eq('employee_id', report.employeeId)
      .gte('shift_date', reportDate)
      .eq('status', 'published'),
  );
}


export async function addAbsenceRequestRemote(companyId, request) {
  await throwOnError(
    supabase.from('absence_requests').insert({
      company_id: companyId,
      employee_id: request.employeeId,
      type: request.type,
      start_date: request.startDate,
      end_date: request.endDate,
      reason: request.reason || '',
      status: 'pending',
    }),
  );
}

export async function updateAbsenceRequestRemote(companyId, requestId, patch) {
  const payload = {};
  if (patch.status) {
    payload.status = patch.status;
    payload.decided_at = new Date().toISOString();
  }
  if (patch.adminReason) {
    payload.admin_reason = patch.adminReason;
  }

  await throwOnError(
    supabase.from('absence_requests').update(payload).eq('company_id', companyId).eq('id', requestId),
  );
}

export async function addDelayReportRemote(companyId, report) {
  await throwOnError(
    supabase.from('delay_reports').insert({
      company_id: companyId,
      employee_id: report.employeeId,
      shift_id: report.shiftId || null,
      delay_minutes: report.delayMinutes,
      message: report.message || '',
      report_date: report.date || new Date().toISOString().slice(0, 10),
    }),
  );
}

export async function addSwapRequestRemote(companyId, request) {
  await throwOnError(
    supabase.from('swap_requests').insert({
      company_id: companyId,
      requester_id: request.requesterId,
      own_shift_id: request.ownShiftId,
      target_shift_id: request.targetShiftId || null,
      target_employee_id: request.targetEmployeeId || null,
      peer_status: request.peerStatus || 'pending',
      status: 'pending',
      message: request.message || '',
    }),
  );
}

export async function updateSwapRequestRemote(companyId, requestId, patch) {
  const payload = {};
  if (patch.status) {
    payload.status = patch.status;
  }
  if (patch.peerStatus) {
    payload.peer_status = patch.peerStatus;
  }
  if (patch.reason) {
    payload.reason = patch.reason;
  }

  await throwOnError(
    supabase.from('swap_requests').update(payload).eq('company_id', companyId).eq('id', requestId),
  );
}

export async function saveAllowanceRemote(companyId, employeeId, value, month = currentMonth()) {
  await throwOnError(
    supabase.from('hour_adjustments').upsert(
      {
        company_id: companyId,
        employee_id: employeeId,
        month,
        allowances: value,
      },
      { onConflict: 'employee_id,month' },
    ),
  );
}

export async function createNotificationRemote(companyId, type, textKey, payload = {}) {
  await throwOnError(
    supabase.from('notifications').insert({
      company_id: companyId,
      type,
      text_key: textKey,
      payload,
    }),
  );
}

async function upsertProfile(user, language) {
  await throwOnError(
    supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      full_name: user.name || user.email,
      preferred_language: language,
    }),
  );
}

async function getFirstMembership(profileId) {
  const { data, error } = await supabase
    .from('company_members')
    .select('company_id, role')
    .eq('profile_id', profileId)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return data;
}

async function bootstrapWorkspace(user, fallbackState) {
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .insert({
      name: fallbackState.company.name,
      logo_url: fallbackState.company.logo || null,
      country: fallbackState.company.country,
      industry: fallbackState.company.industry,
      region: fallbackState.company.region || defaultRegion(fallbackState.company.country),
      plan: fallbackState.company.plan,
      onboarding_completed: false,
      created_by: user.id,
    })
    .select()
    .single();

  if (companyError) {
    throw companyError;
  }

  await throwOnError(
    supabase.from('company_members').insert({
      company_id: company.id,
      profile_id: user.id,
      role: 'admin',
    }),
  );

  const locations = fallbackState.company.locations.map((name) => ({ company_id: company.id, name }));
  if (locations.length) {
    await throwOnError(supabase.from('locations').insert(locations));
  }

  const employees = fallbackState.employees.map((employee) => ({
    company_id: company.id,
    name: employee.name,
    email: employee.email.toLowerCase(),
    role: employee.role,
    contract: employee.contract,
    weekly_target: employee.weeklyTarget,
    is_minor: employee.isMinor,
    preferences: employee.preferences,
    preferred_times: employee.preferredTimes,
    avoid_days: employee.avoidDays,
    max_night_shifts: employee.maxNightShifts,
    other_notes: employee.otherNotes,
  }));
  if (employees.length) {
    await throwOnError(supabase.from('employees').insert(employees));
  }

  const templates = fallbackState.templates.map((template) => ({
    company_id: company.id,
    name: template.name,
    start_time: template.start,
    end_time: template.end,
    break_minutes: template.breakMinutes,
    type: template.type,
  }));
  if (templates.length) {
    await throwOnError(supabase.from('shift_templates').insert(templates));
  }
}

async function fetchWorkspaceState(companyId, fallbackState) {
  const [
    company,
    locations,
    employees,
    templates,
    shifts,
    sickReports,
    absenceRequests,
    delayReports,
    swapRequests,
    adjustments,
    notifications,
    invitations,
  ] = await Promise.all([
    selectSingle('companies', companyId),
    selectAll('locations', companyId),
    selectAll('employees', companyId),
    selectAll('shift_templates', companyId),
    selectAll('shifts', companyId),
    selectAll('sick_reports', companyId),
    selectAll('absence_requests', companyId),
    selectAll('delay_reports', companyId),
    selectAll('swap_requests', companyId),
    selectAll('hour_adjustments', companyId),
    selectAll('notifications', companyId),
    selectAll('employee_invitations', companyId),
  ]);

  const locationById = Object.fromEntries(locations.map((location) => [location.id, location.name]));
  const allowances = Object.fromEntries(adjustments.map((row) => [row.employee_id, row.allowances]));

  return {
    company: {
      id: company.id,
      name: company.name,
      logo: company.logo_url || '',
      country: company.country,
      industry: company.industry,
      region: company.region || defaultRegion(company.country),
      locations: locations.length ? locations.map((location) => location.name) : fallbackState.company.locations,
      plan: company.plan,
      onboardingComplete: company.onboarding_completed,
    },
    employees: employees.map(mapEmployee),
    shifts: shifts.map((shift) => mapShift(shift, locationById)),
    sickReports: sickReports.map((report) => ({
      id: report.id,
      employeeId: report.employee_id,
      date: report.report_date,
      duration: report.duration,
      createdAt: report.created_at,
    })),
    absenceRequests: absenceRequests.map((request) => ({
      id: request.id,
      employeeId: request.employee_id,
      type: request.type,
      startDate: request.start_date,
      endDate: request.end_date,
      reason: request.reason,
      status: request.status,
      adminReason: request.admin_reason,
      decidedAt: request.decided_at,
      createdAt: request.created_at,
    })),
    delayReports: delayReports.map((report) => ({
      id: report.id,
      employeeId: report.employee_id,
      shiftId: report.shift_id,
      delayMinutes: report.delay_minutes,
      message: report.message,
      date: report.report_date,
      createdAt: report.created_at,
    })),
    swapRequests: swapRequests.map((request) => ({
      id: request.id,
      requesterId: request.requester_id,
      ownShiftId: request.own_shift_id,
      targetShiftId: request.target_shift_id || '',
      targetEmployeeId: request.target_employee_id || '',
      peerStatus: request.peer_status || 'pending',
      status: request.status,
      message: request.message,
      reason: request.reason,
      createdAt: request.created_at,
    })),
    allowances,
    notifications: notifications.map((notification) => ({
      id: notification.id,
      type: notification.type,
      textKey: notification.text_key,
      createdAt: notification.created_at,
    })),
    invitations: invitations.map((invitation) => ({
      id: invitation.id,
      employeeId: invitation.employee_id,
      email: invitation.email,
      role: invitation.role,
      token: invitation.token,
      status: invitation.status,
      expiresAt: invitation.expires_at,
      createdAt: invitation.created_at,
    })),
    templates: templates.map((template) => ({
      id: template.id,
      name: template.name,
      start: trimTime(template.start_time),
      end: trimTime(template.end_time),
      breakMinutes: template.break_minutes,
      type: template.type,
    })),
  };
}

async function selectSingle(table, id) {
  const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
  if (error) {
    throw error;
  }
  return data;
}

async function selectAll(table, companyId) {
  const { data, error } = await supabase.from(table).select('*').eq('company_id', companyId);
  if (error) {
    throw error;
  }
  return data || [];
}

async function syncLocations(company) {
  const rows = company.locations.map((name) => ({ company_id: company.id, name }));
  if (!rows.length) {
    return;
  }
  await throwOnError(supabase.from('locations').upsert(rows, { onConflict: 'company_id,name' }));
}

async function ensureLocation(companyId, name) {
  if (!name) {
    return null;
  }
  const { data, error } = await supabase
    .from('locations')
    .upsert({ company_id: companyId, name }, { onConflict: 'company_id,name' })
    .select('id')
    .single();

  if (error) {
    throw error;
  }
  return data.id;
}

function mapEmployee(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    contract: row.contract,
    weeklyTarget: Number(row.weekly_target),
    isMinor: row.is_minor,
    preferences: row.preferences,
    preferredTimes: row.preferred_times,
    avoidDays: row.avoid_days,
    maxNightShifts: row.max_night_shifts,
    otherNotes: row.other_notes,
  };
}

function mapShift(row, locationById) {
  return {
    id: row.id,
    employeeId: row.employee_id || '',
    date: row.shift_date,
    start: trimTime(row.start_time),
    end: trimTime(row.end_time),
    breakMinutes: row.break_minutes,
    type: row.type,
    location: locationById[row.location_id] || '',
    status: row.status,
    notes: row.notes,
    overrideLog: row.override_log || undefined,
    actual: row.actual,
  };
}

function mapEmployeePatch(patch) {
  const mapped = {};
  const entries = {
    name: 'name',
    email: 'email',
    role: 'role',
    contract: 'contract',
    weeklyTarget: 'weekly_target',
    isMinor: 'is_minor',
    preferences: 'preferences',
    preferredTimes: 'preferred_times',
    avoidDays: 'avoid_days',
    maxNightShifts: 'max_night_shifts',
    otherNotes: 'other_notes',
  };

  Object.entries(entries).forEach(([source, target]) => {
    if (source in patch) {
      mapped[target] = patch[source];
    }
  });

  return mapped;
}

function trimTime(value) {
  return String(value).slice(0, 5);
}

async function throwOnError(query) {
  const { error } = await query;
  if (error) {
    throw error;
  }
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function defaultRegion(country) {
  return {
    at: 'at-wien',
    de: 'de-by',
    ch: 'ch-zh',
  }[country] || 'at-wien';
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value || '',
  );
}
