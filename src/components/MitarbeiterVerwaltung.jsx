import { useState } from 'react';

const emptyEmployee = {
  name: '',
  email: '',
  role: 'employee',
  contract: 'fullTime',
  weeklyTarget: 40,
  isMinor: false,
  preferences: '',
  preferredTimes: '',
  avoidDays: '',
  maxNightShifts: 0,
  otherNotes: '',
};

export default function MitarbeiterVerwaltung({ data, actions, t }) {
  const [form, setForm] = useState(emptyEmployee);
  const [search, setSearch] = useState('');
  const [contractFilter, setContractFilter] = useState('all');
  const isFreeLimitReached = data.company.plan === 'free' && data.employees.length >= 5;
  const filteredEmployees = data.employees.filter((employee) => {
    const matchesSearch = `${employee.name} ${employee.email}`.toLowerCase().includes(search.toLowerCase());
    const matchesContract = contractFilter === 'all' || employee.contract === contractFilter;
    return matchesSearch && matchesContract;
  });

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function addEmployee() {
    if (!form.name.trim() || !form.email.trim() || isFreeLimitReached) {
      return;
    }
    actions.addEmployee(form);
    setForm(emptyEmployee);
  }

  function inviteUrl(invitation) {
    return `${window.location.origin}/invite/${invitation.token}`;
  }

  async function copyInvite(invitation) {
    await navigator.clipboard?.writeText(inviteUrl(invitation));
  }

  return (
    <section className="grid two-columns">
      <div className="card form-card">
        <h2>{t('employees.invite')}</h2>
        {isFreeLimitReached && <div className="warning-banner">{t('monetization.limit')}</div>}
        <label>
          {t('common.name')}
          <input value={form.name} onChange={(event) => update('name', event.target.value)} />
        </label>
        <label>
          {t('common.email')}
          <input value={form.email} onChange={(event) => update('email', event.target.value)} type="email" />
        </label>
        <label>
          {t('common.role')}
          <select value={form.role} onChange={(event) => update('role', event.target.value)}>
            <option value="employee">{t('common.employee')}</option>
            <option value="admin">{t('common.admin')}</option>
          </select>
        </label>
        <label>
          {t('employees.contract')}
          <select value={form.contract} onChange={(event) => update('contract', event.target.value)}>
            <option value="fullTime">{t('employees.fullTime')}</option>
            <option value="partTime">{t('employees.partTime')}</option>
            <option value="mini">{t('employees.mini')}</option>
          </select>
        </label>
        <label>
          {t('employees.weeklyTarget')}
          <input
            value={form.weeklyTarget}
            onChange={(event) => update('weeklyTarget', Number(event.target.value))}
            type="number"
            min="0"
          />
        </label>
        <label className="checkbox-label">
          <input
            checked={form.isMinor}
            onChange={(event) => update('isMinor', event.target.checked)}
            type="checkbox"
          />
          {t('employees.isMinor')}
        </label>
        <label>
          {t('employees.preferences')}
          <textarea
            value={form.preferences}
            onChange={(event) => update('preferences', event.target.value)}
            placeholder={t('employees.preferencePlaceholder')}
          />
        </label>
        <button disabled={isFreeLimitReached} onClick={addEmployee}>
          {t('common.add')}
        </button>
      </div>

      <div className="card">
        <div className="section-heading">
          <h2>{t('employees.title')}</h2>
          <span className="chip">{t(`plan.${data.company.plan}`)}</span>
        </div>
        <div className="inline-form employee-filters">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('employees.search')} />
          <select value={contractFilter} onChange={(event) => setContractFilter(event.target.value)}>
            <option value="all">{t('employees.allContracts')}</option>
            <option value="fullTime">{t('employees.fullTime')}</option>
            <option value="partTime">{t('employees.partTime')}</option>
            <option value="mini">{t('employees.mini')}</option>
          </select>
        </div>
        <div className="employee-list">
          {data.invitations?.length > 0 && (
            <div className="info-banner">
              <strong>{t('employees.invitations')}:</strong>{' '}
              {data.invitations.filter((invite) => invite.status === 'pending').length} {t('common.pending')}
            </div>
          )}
          {filteredEmployees.map((employee) => (
            <article className="employee-card" key={employee.id}>
              <div>
                <strong>{employee.name}</strong>
                <span>{employee.email}</span>
              </div>
              <div className="employee-meta">
                <span>{t(`employees.${employee.contract}`)}</span>
                <span>{employee.weeklyTarget}h</span>
                {employee.isMinor && <span className="status pending">{t('employees.isMinor')}</span>}
              </div>
              {employee.preferences && <p className="muted">{employee.preferences}</p>}
              {(() => {
                const invitation = data.invitations?.find((invite) => invite.email === employee.email);
                return (
                  <small className="muted invite-line">
                    {t('employees.inviteStatus')}: {invitation?.status || 'local'}
                    {invitation?.token && invitation.status === 'pending' && (
                      <span className="invite-actions">
                        <button className="secondary-button tiny-button" onClick={() => copyInvite(invitation)}>
                          {t('employees.copyInvite')}
                        </button>
                        <a className="subtle-link" href={inviteUrl(invitation)} target="_blank" rel="noreferrer">
                          {t('employees.openInvite')}
                        </a>
                      </span>
                    )}
                  </small>
                );
              })()}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
