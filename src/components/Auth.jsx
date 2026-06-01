import { useState } from 'react';
import { supabase, supabaseConfigured } from '../lib/supabase.js';

export default function Auth({ t, onAuthenticated }) {
  const [email, setEmail] = useState('admin@topshift.local');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function authenticate(mode) {
    setError('');
    if (!supabaseConfigured) {
      setError(t('auth.supabaseMissing'));
      return;
    }

    setLoading(true);
    const request =
      mode === 'signup'
        ? supabase.auth.signUp({ email, password })
        : supabase.auth.signInWithPassword({ email, password });
    const { data, error: authError } = await request;
    setLoading(false);

    if (authError) {
      setError(t('auth.error'));
      return;
    }

    if (mode === 'signup' && !data.session) {
      setError(t('auth.checkEmail'));
      return;
    }

    onAuthenticated({
      id: data.user?.id || email,
      email,
      name: email,
      role: 'admin',
      isDemo: false,
    });
  }

  return (
    <main className="auth-layout">
      <section className="hero-card">
        <p className="eyebrow">{t('app.tagline')}</p>
        <h1>{t('app.name')}</h1>
        <p>{t('app.subtitle')}</p>
        <div className="feature-grid compact">
          <span>{t('legal.title')}</span>
          <span>{t('admin.schedule')}</span>
          <span>{t('swaps.title')}</span>
          <span>{t('hours.title')}</span>
        </div>
      </section>

      <section className="card auth-card">
        <h2>{t('auth.title')}</h2>
        {!supabaseConfigured && <div className="warning-banner">{t('auth.supabaseMissing')}</div>}
        {error && <div className="error-banner">{error}</div>}

        <label>
          {t('auth.email')}
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" />
        </label>
        <label>
          {t('auth.password')}
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" minLength="6" />
        </label>

        <div className="button-row">
          <button disabled={loading} onClick={() => authenticate('signin')}>
            {t('auth.signIn')}
          </button>
          <button className="secondary-button" disabled={loading} onClick={() => authenticate('signup')}>
            {t('auth.signUp')}
          </button>
        </div>

        <p className="auth-footnote">{t('auth.demoHiddenHint')}</p>
      </section>
    </main>
  );
}
