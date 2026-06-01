import { useEffect, useMemo, useState } from 'react';
import { supabase, supabaseConfigured } from '../lib/supabase.js';
import { fetchInvitationByTokenRemote } from '../lib/topshiftStore.js';

export default function InviteAccept({ token, user, localInvitations, t, onAuthenticated, onAccepted }) {
  const [invitation, setInvitation] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const localInvitation = useMemo(
    () => localInvitations?.find((item) => item.token === token),
    [localInvitations, token],
  );

  useEffect(() => {
    let active = true;

    async function loadInvitation() {
      setLoading(true);
      try {
        const remote = await fetchInvitationByTokenRemote(token);
        if (!active) {
          return;
        }
        const loaded = remote || localInvitation;
        setInvitation(loaded || null);
        setEmail(loaded?.email || '');
      } catch (error) {
        if (active) {
          setMessage(error.message);
          setInvitation(localInvitation || null);
          setEmail(localInvitation?.email || '');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadInvitation();

    return () => {
      active = false;
    };
  }, [localInvitation, token]);

  async function signUpAndAccept() {
    setMessage('');
    if (!supabaseConfigured || !supabase) {
      setMessage(t('invite.localOnly'));
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name || email },
        emailRedirectTo: `${window.location.origin}/invite/${token}`,
      },
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    if (!data.session) {
      setMessage(t('invite.confirmEmail'));
      return;
    }

    onAuthenticated({
      id: data.user.id,
      email,
      name: name || email,
      role: invitation.role,
      isDemo: false,
    });
    await onAccepted(token);
    setMessage(t('invite.accepted'));
  }

  async function acceptExistingSession() {
    setMessage('');
    try {
      await onAccepted(token);
      setMessage(t('invite.accepted'));
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <main className="auth-layout">
      <section className="hero-card">
        <p className="eyebrow">{t('invite.eyebrow')}</p>
        <h1>{t('invite.title')}</h1>
        <p>{t('invite.subtitle')}</p>
      </section>

      <section className="card auth-card">
        <h2>{t('invite.cardTitle')}</h2>
        {loading && <div className="info-banner">{t('sync.loading')}</div>}
        {!loading && !invitation && <div className="error-banner">{t('invite.invalid')}</div>}
        {message && <div className="info-banner">{message}</div>}
        {invitation && (
          <>
            <div className="info-banner">
              <strong>{invitation.companyName || t('app.name')}</strong>
              <br />
              {invitation.email} · {t(`common.${invitation.role}`)}
            </div>
            {user ? (
              <button onClick={acceptExistingSession}>{t('invite.acceptExisting')}</button>
            ) : (
              <>
                <label>
                  {t('common.name')}
                  <input value={name} onChange={(event) => setName(event.target.value)} />
                </label>
                <label>
                  {t('auth.email')}
                  <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" />
                </label>
                <label>
                  {t('auth.password')}
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type="password"
                    minLength="6"
                  />
                </label>
                <button onClick={signUpAndAccept}>{t('invite.createAccount')}</button>
              </>
            )}
          </>
        )}
      </section>
    </main>
  );
}
