import * as React from 'react';
import styles from '../AiTechBar.module.scss';

// =============================================================================
// ToolLogo — prawdziwe logotypy aplikacji (PNG z assets/icons), dobierane po id
// narzędzia. Fallback = monogram (badge), gdy brak ikony dla danego id.
// =============================================================================

export interface IToolLogoProps {
  id: string;
  badge?: string;
  className?: string;
}

/* eslint-disable @typescript-eslint/no-var-requires */
const ICON_URLS: { [id: string]: string } = {
  'copilot': require('../../assets/icons/copilot_logo_600.png'),
  'promptly': require('../../assets/icons/promptly_logo_600.png'),
  'zoom-ai': require('../../assets/icons/zoom_logo_600.png'),
  'canva-ai': require('../../assets/icons/canva_logo_600.png'),
  'miro-ai': require('../../assets/icons/miro_logo_600.png'),
  'github-copilot': require('../../assets/icons/githubcopilot_logo_600.png'),
  'cursor': require('../../assets/icons/cursor_logo_600.png'),
  'claude': require('../../assets/icons/claude_logo_600.png')
};
/* eslint-enable @typescript-eslint/no-var-requires */

// Każdy logotyp ma inne marginesy wewnątrz kwadratu 600×600, przez co przy
// jednolitym pudełku część wyglądała mniejsza. Skala normalizuje wizualne
// wypełnienie (zmierzony bounding-box alfa → cel ~92% kadru). Mnożnik działa
// tak samo w kolejce i w głównej sekcji.
const ICON_SCALE: { [id: string]: number } = {
  'copilot': 1.02,
  'promptly': 0.955,
  'zoom-ai': 1.0,
  'canva-ai': 1.165,
  'miro-ai': 1.0,
  'github-copilot': 0.985,
  'cursor': 0.97,
  'claude': 1.0
};

const ToolLogo: React.FC<IToolLogoProps> = ({ id, badge, className }) => {
  const url = ICON_URLS[id];
  const scale = ICON_SCALE[id];
  return (
    <span className={className} aria-hidden="true">
      {url
        ? <img src={url} alt="" draggable={false} style={scale ? { transform: `scale(${scale})` } : undefined} />
        : <span className={styles.toolLogoFallback}>{badge || '·'}</span>}
    </span>
  );
};

export default ToolLogo;
