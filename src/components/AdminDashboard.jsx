import { useState } from 'react';
import Dienstplan from './Dienstplan.jsx';
import MitarbeiterVerwaltung from './MitarbeiterVerwaltung.jsx';
import Schichttausch from './Schichttausch.jsx';
import Stundenübersicht from './Stundenübersicht.jsx';
import ReadinessPanel from './ReadinessPanel.jsx';
import Abwesenheiten from './Abwesenheiten.jsx';
import OffeneSchichten from './OffeneSchichten.jsx';
import DemoTestCenter from './DemoTestCenter.jsx';
import AdminInsights from './AdminInsights.jsx';
import { getLegalProfile } from '../lib/gesetzePruefung.js';

const tabs = [
  ['insights', 'insights.title'],
  ['setup', 'admin.companySetup'],
  ['schedule', 'admin.schedule'],
  ['employees', 'admin.employees'],
  ['swaps', 'admin.swaps'],
  ['hours', 'admin.hours'],
  ['sick', 'admin.sick'],
  ['absence', 'absence.adminTitle'],
  ['openShifts', 'openShifts.adminTitle'],
  ['notifications', 'admin.notifications'],
  ['readiness', 'readiness.title'],
  ['demoCenter', 'demoCenter.title'],
];

export default function AdminDashboard({ data, actions, user, t }) {
  const [activeTab, setActiveTab] = useState('insights');

  return (
    <main className="dashboard">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">{t('admin.title')}</p>
          <h1>{data.company.name}</h1>
          <p>
            {t(`country.${data.company.country}`)} · {t(`industry.${data.company.industry}`)}
          </p>
        </div>
        <LegalProfileSummary company={data.company} t={t} />
      </section>

      <nav className="tabbar" aria-label={t('admin.title')}>
        {tabs.map(([id, label]) => (
          <button key={id} className={activeTab === id ? 'active' : ''} onClick={() => setActiveTab(id)}>
            {t(label)}
          </button>
        ))}
      </nav>

      {activeTab === 'insights' && <AdminInsights data={data} t={t} />}
      {activeTab === 'setup' && <CompanySetup company={data.company} actions={actions} t={t} />}
      {activeTab === 'schedule' && <Dienstplan data={data} actions={actions} user={user} t={t} />}
      {activeTab === 'employees' && <MitarbeiterVerwaltung data={data} actions={actions} t={t} />}
      {activeTab === 'swaps' && <Schichttausch data={data} actions={actions} mode="admin" t={t} />}
      {activeTab === 'hours' && <Stundenübersicht data={data} actions={actions} t={t} />}
      {activeTab === 'sick' && <SickReports data={data} t={t} />}
      {activeTab === 'absence' && <Abwesenheiten data={data} actions={actions} mode="admin" t={t} />}
      {activeTab === 'openShifts' && <OffeneSchichten data={data} actions={actions} mode="admin" t={t} />}
      {activeTab === 'notifications' && <Notifications data={data} t={t} />}
      {activeTab === 'readiness' && <ReadinessPanel data={data} t={t} />}
      {activeTab === 'demoCenter' && <DemoTestCenter data={data} t={t} />}
    </main>
  );
}

function LegalProfileSummary({ company, t }) {
  const profile = getLegalProfile(company.country, company.industry);
  return (
    <aside className="card metric-card">
      <span>{t('legal.title')}</span>
      <strong>{t(profile.lawKey)}</strong>
      <small>
        {profile.dailyMaxHours}h / {profile.weeklyMaxHours}h · {profile.restHours}h {t('common.rest')}
      </small>
    </aside>
  );
}

function CompanySetup({ company, actions, t }) {
  const [draft, setDraft] = useState(company);
  const [locationInput, setLocationInput] = useState('');

  function addLocation() {
    if (!locationInput.trim()) {
      return;
    }
    setDraft((current) => ({
      ...current,
      locations: [...current.locations, locationInput.trim()],
    }));
    setLocationInput('');
  }

  return (
    <section className="grid two-columns">
      <div className="card form-card">
        <h2>{t('admin.companySetup')}</h2>
        <label>
          {t('setup.companyName')}
          <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
        </label>
        <label>
          {t('setup.logo')}
          <input value={draft.logo} onChange={(event) => setDraft({ ...draft, logo: event.target.value })} />
        </label>
        <label>
          {t('common.country')}
          <select value={draft.country} onChange={(event) => setDraft({ ...draft, country: event.target.value, region: defaultRegion(event.target.value) })}>
            <option value="at">{t('country.at')}</option>
            <option value="de">{t('country.de')}</option>
            <option value="ch">{t('country.ch')}</option>
          </select>
        </label>
        <label>
          {t('common.region')}
          <select value={draft.region || defaultRegion(draft.country)} onChange={(event) => setDraft({ ...draft, region: event.target.value })}>
            {regions[draft.country].map((region) => (
              <option key={region} value={region}>{t(`region.${region}`)}</option>
            ))}
          </select>
        </label>
        <label>
          {t('common.industry')}
          <select value={draft.industry} onChange={(event) => setDraft({ ...draft, industry: event.target.value })}>
            <option value="general">{t('industry.general')}</option>
            <option value="hospitality">{t('industry.hospitality')}</option>
            <option value="retail">{t('industry.retail')}</option>
            <option value="healthcare">{t('industry.healthcare')}</option>
            <option value="production">{t('industry.production')}</option>
          </select>
        </label>
        <label>
          {t('setup.plan')}
          <select value={draft.plan} onChange={(event) => setDraft({ ...draft, plan: event.target.value })}>
            <option value="free">{t('plan.free')}</option>
            <option value="small">{t('plan.small')}</option>
            <option value="business">{t('plan.business')}</option>
            <option value="enterprise">{t('plan.enterprise')}</option>
          </select>
        </label>
        <button onClick={() => actions.setCompany(draft)}>{t('common.save')}</button>
      </div>

      <div className="card">
        <h2>{t('setup.locations')}</h2>
        <div className="chips">
          {draft.locations.map((location) => (
            <span className="chip" key={location}>
              {location}
            </span>
          ))}
        </div>
        <div className="inline-form">
          <input
            value={locationInput}
            onChange={(event) => setLocationInput(event.target.value)}
            placeholder={t('common.location')}
          />
          <button className="secondary-button" onClick={addLocation}>
            {t('setup.addLocation')}
          </button>
        </div>
        <div className="info-banner">{t('setup.stripeReady')}</div>
      </div>
    </section>
  );
}

function SickReports({ data, t }) {
  return (
    <section className="card">
      <h2>{t('sick.title')}</h2>
      <p className="muted">{t('sick.whoWhen')}</p>
      <div className="list">
        {data.sickReports.length === 0 && <div className="empty-state">{t('sick.notifyAdmin')}</div>}
        {data.sickReports.map((report) => {
          const employee = data.employees.find((item) => item.id === report.employeeId);
          return (
            <article className="list-item" key={report.id}>
              <div>
                <strong>{employee?.name || t('common.employee')}</strong>
                <span>
                  {report.date} · {report.duration || '-'}
                </span>
              </div>
              <span className="status pending">{t('sick.reported')}</span>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Notifications({ data, t }) {
  return (
    <section className="grid two-columns">
      <div className="card">
        <h2>{t('notifications.title')}</h2>
        <div className="feature-grid">
          <span>{t('notifications.email')}</span>
          <span>{t('notifications.push')}</span>
          <span>{t('notifications.newPlan')}</span>
          <span>{t('notifications.shiftChanged')}</span>
          <span>{t('notifications.swap')}</span>
          <span>{t('notifications.sick')}</span>
          <span>{t('notifications.legal')}</span>
        </div>
        <p className="muted">{t('notifications.language')}</p>
      </div>
      <div className="card">
        <h2>{t('common.lastSaved')}</h2>
        <div className="list">
          {data.notifications.length === 0 && <div className="empty-state">{t('notifications.empty')}</div>}
          {data.notifications.map((notification) => (
            <article className="list-item" key={notification.id}>
              <div>
                <strong>{t(notification.textKey)}</strong>
                <span>{new Date(notification.createdAt).toLocaleString()}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}


const regions = {
  at: ['at-wien', 'at-noe', 'at-ooe', 'at-stmk', 'at-tirol'],
  de: ['de-by', 'de-be', 'de-hh', 'de-nw', 'de-sn'],
  ch: ['ch-zh', 'ch-be', 'ch-bs', 'ch-ge', 'ch-ti'],
};

function defaultRegion(country) {
  return { at: 'at-wien', de: 'de-by', ch: 'ch-zh' }[country] || 'at-wien';
}
