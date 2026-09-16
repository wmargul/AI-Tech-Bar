import * as React from 'react';
import { ServiceScope } from '@microsoft/sp-core-library';
import { SPComponentLoader } from '@microsoft/sp-loader';
import styles from './AiTechBar.module.scss';

// Identyfikator wbudowanego komponentu SharePoint „LivePersonaCard”
// (ten sam mechanizm, którego używa web part People): hover -> mała karta,
// kliknięcie -> pełna karta profilu zaciągana z Microsoft 365 / Graph.
const LIVE_PERSONA_CARD_ID = '914330ee-2df2-4f6e-a858-30c23a812408';

export interface IPersonaCreditProps {
  serviceScope?: ServiceScope;
  upn?: string;
  className?: string;
  children: React.ReactNode;
}

// jedno ładowanie komponentu na całą stronę (współdzielone między miejscami)
let cardPromise: Promise<{ LivePersonaCard?: React.ComponentType<unknown> }> | undefined;
const loadCard = (): Promise<{ LivePersonaCard?: React.ComponentType<unknown> }> => {
  if (!cardPromise) {
    cardPromise = SPComponentLoader.loadComponentById<{ LivePersonaCard?: React.ComponentType<unknown> }>(
      LIVE_PERSONA_CARD_ID
    );
  }
  return cardPromise;
};

/**
 * Owija dowolną treść (np. podpis credits) w interaktywną kartę osoby SharePoint.
 *
 * Host (div z refem) jest renderowany ZAWSZE — komponent karty potrzebuje
 * `hostElement` jako kotwicy pozycjonowania, więc ref musi istnieć zanim
 * komponent się załaduje. Gdy komponentu nie da się załadować (workbench,
 * brak serviceScope/upn), renderowany jest sam tekst.
 */
const PersonaCredit: React.FC<IPersonaCreditProps> = ({ serviceScope, upn, className, children }) => {
  const [Card, setCard] = React.useState<React.ComponentType<Record<string, unknown>> | undefined>(undefined);
  const hostRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    let mounted = true;
    if (serviceScope && upn) {
      loadCard()
        .then((mod) => {
          if (mounted && mod && mod.LivePersonaCard) {
            setCard(() => mod.LivePersonaCard as React.ComponentType<Record<string, unknown>>);
          }
        })
        .catch(() => { /* fallback: czysty tekst */ });
    }
    return () => { mounted = false; };
  }, [serviceScope, upn]);

  const trigger = <span className={className}>{children}</span>;

  // Zostawiamy tylko hover (mała karta). Klik (rozwinięcie pełnej karty)
  // blokujemy w fazie przechwytywania, zanim dotrze do handlera komponentu.
  const blockClick = React.useCallback((e: React.MouseEvent): void => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <div ref={hostRef} className={styles.personaHost} onClickCapture={blockClick}>
      {Card && serviceScope && upn
        ? React.createElement(
            Card,
            {
              clientScenario: 'LivePersonaCard',
              disableHover: false,
              hostElement: hostRef.current,
              serviceScope: serviceScope,
              upn: upn,
              legacyUpn: upn
            },
            trigger
          )
        : trigger}
    </div>
  );
};

export default PersonaCredit;
