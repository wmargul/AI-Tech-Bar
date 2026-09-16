import * as React from 'react';
import styles from '../AiTechBar.module.scss';

// =============================================================================
// PromptyAvatar — przyjazny robot-przewodnik „PROMi".
// W pełni wektorowy (SVG), animowany przez klasy SCSS:
//  - idle: delikatne unoszenie, mruganie oczu, pulsujący rdzeń i antena,
//  - talking: oczy i „usta" pulsują w rytm mówienia, skan na wizjerze,
//  - bye: macha ręką na pożegnanie.
// =============================================================================

export type AvatarMood = 'idle' | 'talking' | 'bye';

export interface IPromptyAvatarProps {
  mood: AvatarMood;
  /** Powitalne pomachanie (kilka wahnięć, ręka wraca do pozycji wyjściowej). */
  greeting?: boolean;
  className?: string;
}

const PromptyAvatar: React.FC<IPromptyAvatarProps> = ({ mood, greeting, className }) => {
  const moodClass =
    mood === 'talking' ? styles.peRobotTalking : mood === 'bye' ? styles.peRobotBye : '';
  const helloClass = greeting ? styles.peRobotHello : '';

  return (
    <div className={`${styles.peRobot} ${moodClass} ${helloClass} ${className || ''}`} aria-hidden="true">
      <svg viewBox="-50 -34 370 352" width="100%" height="100%" fill="none" role="img" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="peBody" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#b794ff" />
            <stop offset="1" stopColor="#5fe0f2" />
          </linearGradient>
          <linearGradient id="peVisor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0a1130" />
            <stop offset="1" stopColor="#101a44" />
          </linearGradient>
          <linearGradient id="peGlow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#8b5cf6" />
            <stop offset="1" stopColor="#22d3ee" />
          </linearGradient>
          <radialGradient id="peCore" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#d6fbff" />
            <stop offset="0.5" stopColor="#22d3ee" />
            <stop offset="1" stopColor="#8b5cf6" />
          </radialGradient>
          <filter id="peSoft" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* cień pod postacią */}
        <ellipse className={styles.peRobotShadow} cx="130" cy="300" rx="70" ry="12" fill="#000" opacity="0.35" />

        {/* grupa unosząca się (idle float) */}
        <g className={styles.peRobotFloat}>
          {/* antena */}
          <line x1="130" y1="34" x2="130" y2="62" stroke="url(#peGlow)" strokeWidth="4" strokeLinecap="round" />
          <circle className={styles.peRobotAntenna} cx="130" cy="26" r="9" fill="url(#peGlow)" />
          <circle className={styles.peRobotAntennaGlow} cx="130" cy="26" r="16" fill="#22d3ee" opacity="0.4" filter="url(#peSoft)" />

          {/* ramię macha (bye) */}
          <g className={styles.peRobotArm}>
            <rect x="196" y="150" width="26" height="62" rx="13" fill="url(#peBody)" />
            <circle cx="209" cy="214" r="16" fill="url(#peBody)" />
          </g>
          {/* ramię lewe */}
          <rect x="38" y="156" width="26" height="60" rx="13" fill="url(#peBody)" />
          <circle cx="51" cy="216" r="15" fill="url(#peBody)" />

          {/* korpus */}
          <rect x="64" y="150" width="132" height="120" rx="34" fill="url(#peBody)" />
          <rect x="64" y="150" width="132" height="120" rx="34" fill="#0a1130" opacity="0.06" />
          {/* rdzeń energetyczny */}
          <circle className={styles.peRobotCoreGlow} cx="130" cy="210" r="34" fill="#22d3ee" opacity="0.35" filter="url(#peSoft)" />
          <circle className={styles.peRobotCore} cx="130" cy="210" r="20" fill="url(#peCore)" />

          {/* głowa */}
          <rect x="60" y="58" width="140" height="104" rx="40" fill="url(#peBody)" />
          {/* wizjer */}
          <rect x="74" y="74" width="112" height="74" rx="32" fill="url(#peVisor)" stroke="url(#peGlow)" strokeWidth="2.5" />

          {/* oczy */}
          <g className={styles.peRobotEyes}>
            <circle cx="108" cy="108" r="11" fill="#aef4ff" />
            <circle cx="152" cy="108" r="11" fill="#aef4ff" />
          </g>
          {/* usta / wskaźnik mówienia */}
          <rect className={styles.peRobotMouth} x="118" y="130" width="24" height="6" rx="3" fill="#5fe0f2" />
        </g>
      </svg>
    </div>
  );
};

export default PromptyAvatar;
