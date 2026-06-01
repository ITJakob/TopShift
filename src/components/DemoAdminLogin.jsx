import { useState } from 'react';

export default function DemoAdminLogin({ t, onAuthenticated }) {
  const [role, setRole] = useState('admin');

  function startDemo() {
    if (role === 'admin') {
      onAuthenticated({
        id: 'demo-admin',
        email: 'admin@topshift.local',
        name: 'Demo Admin',
        role: 'admin',
        isDemo: true,
      });
      return;
    }

    onAuthenticated({
      id: 'emp-1',
      email: 'anna.berger@example.com',
      name: 'Anna Berger',
      role: 'employee',
      employeeId: 'emp-1',
      isDemo: true,
    });
  }

  return (
    <main className="auth-layout demo-login-layout">
      <section className="hero-card demo-hero">
        <p className="eyebrow">{t('demo.hiddenEyebrow')}</p>
        <h1>{t('demo.title')}</h1>
        <p>{t('demo.subtitle')}</p>
        <div className="feature-grid compact">
          <span>{t('schedule.title')}</span>
          <span>{t('legal.title')}</span>
          <span>{t('readiness.title')}</span>
          <span>{t('hours.title')}</span>
        </div>
      </section>

      <section className="card auth-card demo-card">
        <h2>{t('demo.loginTitle')}</h2>
        <div className="segmented-control">
          <button className={role === 'admin' ? 'active' : ''} onClick={() => setRole('admin')}>
            {t('common.admin')}
          </button>
          <button className={role === 'employee' ? 'active' : ''} onClick={() => setRole('employee')}>
            {t('common.employee')}
          </button>
        </div>
        <div className="info-banner">{t('demo.localOnly')}</div>
        <button className="accent-button" onClick={startDemo}>
          {role === 'admin' ? t('auth.demoAdmin') : t('auth.demoEmployee')}
        </button>
        <a className="subtle-link" href="/">
          {t('demo.backToLogin')}
        </a>
      </section>
    </main>
  );
}
