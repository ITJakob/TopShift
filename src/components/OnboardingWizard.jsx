import { useState } from 'react';

const steps = ['company', 'rules', 'locations', 'plan'];

export default function OnboardingWizard({ data, actions, t }) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState({
    ...data.company,
    region: data.company.region || defaultRegion(data.company.country),
    locations: data.company.locations?.length ? data.company.locations : [''],
  });

  function update(key, value) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function updateLocation(index, value) {
    setDraft((current) => ({
      ...current,
      locations: current.locations.map((location, itemIndex) => (itemIndex === index ? value : location)),
    }));
  }

  function finish() {
    actions.setCompany({
      ...draft,
      locations: draft.locations.map((location) => location.trim()).filter(Boolean),
      onboardingComplete: true,
    });
  }

  return (
    <main className="dashboard">
      <section className="hero-card onboarding-hero">
        <p className="eyebrow">{t('onboarding.eyebrow')}</p>
        <h1>{t('onboarding.title')}</h1>
        <p>{t('onboarding.subtitle')}</p>
      </section>

      <section className="card form-card narrow">
        <div className="stepper">
          {steps.map((item, index) => (
            <span className={index <= step ? 'active' : ''} key={item}>
              {index + 1}
            </span>
          ))}
        </div>

        {step === 0 && (
          <>
            <h2>{t('onboarding.company')}</h2>
            <label>
              {t('setup.companyName')}
              <input value={draft.name} onChange={(event) => update('name', event.target.value)} />
            </label>
            <label>
              {t('setup.logo')}
              <input value={draft.logo} onChange={(event) => update('logo', event.target.value)} />
            </label>
          </>
        )}

        {step === 1 && (
          <>
            <h2>{t('onboarding.rules')}</h2>
            <label>
              {t('common.country')}
              <select
                value={draft.country}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    country: event.target.value,
                    region: defaultRegion(event.target.value),
                  }))
                }
              >
                <option value="at">{t('country.at')}</option>
                <option value="de">{t('country.de')}</option>
                <option value="ch">{t('country.ch')}</option>
              </select>
            </label>
            <label>
              {t('common.region')}
              <select value={draft.region} onChange={(event) => update('region', event.target.value)}>
                {regions[draft.country].map((region) => (
                  <option key={region} value={region}>
                    {t(`region.${region}`)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t('common.industry')}
              <select value={draft.industry} onChange={(event) => update('industry', event.target.value)}>
                <option value="general">{t('industry.general')}</option>
                <option value="hospitality">{t('industry.hospitality')}</option>
                <option value="retail">{t('industry.retail')}</option>
                <option value="healthcare">{t('industry.healthcare')}</option>
                <option value="production">{t('industry.production')}</option>
              </select>
            </label>
          </>
        )}

        {step === 2 && (
          <>
            <h2>{t('setup.locations')}</h2>
            {draft.locations.map((location, index) => (
              <input
                key={index}
                value={location}
                onChange={(event) => updateLocation(index, event.target.value)}
                placeholder={t('common.location')}
              />
            ))}
            <button
              className="secondary-button"
              onClick={() => setDraft((current) => ({ ...current, locations: [...current.locations, ''] }))}
            >
              {t('setup.addLocation')}
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <h2>{t('setup.plan')}</h2>
            <div className="plan-grid">
              {['free', 'small', 'business', 'enterprise'].map((plan) => (
                <button
                  className={draft.plan === plan ? 'plan-card selected' : 'plan-card'}
                  key={plan}
                  onClick={() => update('plan', plan)}
                >
                  <strong>{t(`plan.${plan}`)}</strong>
                  <span>{t(`plan.${plan}.limit`)}</span>
                </button>
              ))}
            </div>
            <div className="info-banner">{t('setup.stripeReady')}</div>
          </>
        )}

        <div className="button-row">
          {step > 0 && (
            <button className="secondary-button" onClick={() => setStep((current) => current - 1)}>
              {t('common.previous')}
            </button>
          )}
          {step < steps.length - 1 ? (
            <button onClick={() => setStep((current) => current + 1)}>{t('common.nextPeriod')}</button>
          ) : (
            <button onClick={finish}>{t('onboarding.finish')}</button>
          )}
        </div>
      </section>
    </main>
  );
}

const regions = {
  at: ['at-wien', 'at-noe', 'at-ooe', 'at-stmk', 'at-tirol'],
  de: ['de-by', 'de-be', 'de-hh', 'de-nw', 'de-sn'],
  ch: ['ch-zh', 'ch-be', 'ch-bs', 'ch-ge', 'ch-ti'],
};

function defaultRegion(country) {
  return {
    at: 'at-wien',
    de: 'de-by',
    ch: 'ch-zh',
  }[country] || 'at-wien';
}
