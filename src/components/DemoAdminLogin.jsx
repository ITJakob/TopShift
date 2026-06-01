import { useState } from 'react';

const demoPersonas = [
  {
    id: 'admin',
    labelKey: 'common.admin',
    descriptionKey: 'demo.persona.admin',
    user: {
      id: 'demo-admin',
      email: 'admin@topshift.local',
      name: 'Demo Admin',
      role: 'admin',
      isDemo: true,
    },
  },
  {
    id: 'anna',
    label: 'Anna Berger',
    descriptionKey: 'demo.persona.anna',
    user: {
      id: 'emp-1',
      email: 'anna.berger@example.com',
      name: 'Anna Berger',
      role: 'employee',
      employeeId: 'emp-1',
      isDemo: true,
    },
  },
  {
    id: 'lukas',
    label: 'Lukas Steiner',
    descriptionKey: 'demo.persona.lukas',
    user: {
      id: 'emp-2',
      email: 'lukas.steiner@example.com',
      name: 'Lukas Steiner',
      role: 'employee',
      employeeId: 'emp-2',
      isDemo: true,
    },
  },
  {
    id: 'samir',
    label: 'Samir Novak',
    descriptionKey: 'demo.persona.samir',
    user: {
      id: 'emp-4',
      email: 'samir.novak@example.com',
      name: 'Samir Novak',
      role: 'employee',
      employeeId: 'emp-4',
      isDemo: true,
    },
  },
];

export default function DemoAdminLogin({ t, onAuthenticated }) {
  const [personaId, setPersonaId] = useState('admin');
  const persona = demoPersonas.find((item) => item.id === personaId) || demoPersonas[0];
  const personaName = persona.labelKey ? t(persona.labelKey) : persona.label;

  function startDemo() {
    onAuthenticated(persona.user);
  }

  return (
    <main className="auth-layout demo-login-layout">
      <section className="hero-card demo-hero">
        <p className="eyebrow">{t('demo.hiddenEyebrow')}</p>
        <h1>{t('demo.title')}</h1>
        <p>{t('demo.subtitle')}</p>
        <div className="feature-grid compact">
          <span>{t('demo.test.schedule')}</span>
          <span>{t('demo.test.swaps')}</span>
          <span>{t('demo.test.absence')}</span>
          <span>{t('demo.test.time')}</span>
        </div>
      </section>

      <section className="card auth-card demo-card">
        <h2>{t('demo.loginTitle')}</h2>
        <div className="demo-persona-list">
          {demoPersonas.map((item) => (
            <button
              className={personaId === item.id ? 'persona-card selected' : 'persona-card'}
              key={item.id}
              onClick={() => setPersonaId(item.id)}
            >
              <strong>{item.labelKey ? t(item.labelKey) : item.label}</strong>
              <span>{t(item.descriptionKey)}</span>
            </button>
          ))}
        </div>
        <div className="info-banner">{t('demo.localOnly')}</div>
        <button className="accent-button" onClick={startDemo}>
          {t('demo.startAs', { name: personaName })}
        </button>
        <a className="subtle-link" href="/">
          {t('demo.backToLogin')}
        </a>
      </section>
    </main>
  );
}
