import * as React from 'react';
import styles from '../AiTechBar.module.scss';
import { POLICY_RULES, IResolvedSettings } from '../data/config';
import { useL10n } from '../i18n';

export interface IPolicySectionProps {
  settings: IResolvedSettings;
}

const openLink = (url: string): void => {
  if (!url || url === '#') return;
  window.open(url, '_blank', 'noopener,noreferrer');
};

const PolicySection: React.FC<IPolicySectionProps> = ({ settings }) => {
  const { t } = useL10n();
  return (
    <section id="sec-policy" className={styles.section}>
      <div className={styles.sectionInner}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionKicker}>{t.policy.kicker}</div>
          <h2 className={styles.sectionTitle}>
            {t.policy.title.pre}<span className={styles.gradientText}>{t.policy.title.grad}</span>{t.policy.title.post}
          </h2>
          <p className={styles.sectionLead}>
            {t.policy.lead}
          </p>
        </div>

        <div className={`${styles.policyCard} ${styles.policyCardWide}`}>
          <h3 className={styles.policyTitle}>{t.policy.policyTitle}</h3>
          <ul className={`${styles.policyList} ${styles.policyListWide}`}>
            {POLICY_RULES.map((rule, i) => {
              const copy = t.policyRules[i];
              return (
                <li key={i} className={styles.policyItem} style={{ animationDelay: `${i * 90}ms` }}>
                  <span className={styles.policyIcon}>{rule.icon}</span>
                  <span className={styles.policyBody}>
                    {copy && <span className={styles.policyRuleTitle}>{copy.title}</span>}
                    <span className={styles.policyText}>{copy ? copy.text : rule.text}</span>
                  </span>
                </li>
              );
            })}
          </ul>

          <p className={styles.policyNote}>{t.policy.policyNote}</p>

          <button
            type="button"
            className={styles.policyLink}
            onClick={() => openLink(settings.links.policyFull)}
          >
            {t.policy.policyLink}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

export default PolicySection;
