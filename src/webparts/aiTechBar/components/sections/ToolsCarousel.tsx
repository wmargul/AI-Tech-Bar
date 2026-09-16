import * as React from 'react';
import styles from '../AiTechBar.module.scss';
import { TOOLS, ITool, IResolvedSettings } from '../data/config';
import { useL10n } from '../i18n';
import ToolLogo from './ToolLogo';

export interface IToolsCarouselProps {
  settings: IResolvedSettings;
}

const openLink = (url: string): void => {
  if (!url || url === '#') return;
  window.open(url, '_blank', 'noopener,noreferrer');
};

const ToolCardContent: React.FC<{
  tool: ITool;
  isActive: boolean;
  settings: IResolvedSettings;
}> = ({ tool, isActive, settings }) => {
  const { t } = useL10n();
  const links = settings.toolLinks[tool.id] || { openUrl: tool.openUrl, requestUrl: tool.requestUrl };
  return (
    <div className={styles.toolCardBody}>
      {tool.isAllTools ? (
        <div className={styles.toolBadge} style={{ background: tool.accent }}>
          <svg className={styles.toolGear} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="3" stroke="#fff" strokeWidth="2" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      ) : (
        <ToolLogo id={tool.id} badge={tool.badge} className={styles.toolLogo} />
      )}
      <div className={styles.toolTagline}>{tool.tagline}</div>
      <h3 className={styles.toolName}>{tool.name}</h3>
      <p className={styles.toolDesc}>{tool.description}</p>

      <div className={styles.toolTags}>
        {tool.tags.map((tag) => (
          <span key={tag} className={styles.toolTag}>{tag}</span>
        ))}
      </div>

      <div className={styles.toolActions}>
        {tool.isAllTools ? (
          <button
            type="button"
            className={styles.toolBtnPrimary}
            tabIndex={isActive ? 0 : -1}
            onClick={() => openLink(settings.links.allTools)}
          >
            {tool.singleButtonLabel || t.tools.open}
          </button>
        ) : (
          <>
            <button
              type="button"
              className={styles.toolBtnPrimary}
              tabIndex={isActive ? 0 : -1}
              onClick={() => openLink(links.openUrl)}
            >
              {t.tools.open}
            </button>
            <button
              type="button"
              className={styles.toolBtnGhost}
              tabIndex={isActive ? 0 : -1}
              onClick={() => openLink(links.requestUrl)}
            >
              {t.tools.request}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const ToolsCarousel: React.FC<IToolsCarouselProps> = ({ settings }) => {
  const { t } = useL10n();
  const [active, setActive] = React.useState<number>(0);
  const [query, setQuery] = React.useState<string>('');
  const [activeTag, setActiveTag] = React.useState<string>('');

  // lista narzędzi z tekstami w aktualnym języku (dane strukturalne z config)
  const tools = React.useMemo<ITool[]>(() => {
    return TOOLS.map((tool) => {
      const tx = t.toolText[tool.id];
      if (!tx) return tool;
      return {
        ...tool,
        name: tx.name || tool.name,
        tagline: tx.tagline,
        description: tx.description,
        tags: tx.tags,
        singleButtonLabel: tx.singleButtonLabel || tool.singleButtonLabel
      };
    });
  }, [t]);

  // unikalne tagi z aktualnego języka (bez kafelka „wszystkie narzędzia”)
  const tagList = React.useMemo<string[]>(() => {
    const set: string[] = [];
    tools.forEach((tl) => {
      if (tl.isAllTools) return;
      tl.tags.forEach((tag) => { if (set.indexOf(tag) < 0) set.push(tag); });
    });
    return set;
  }, [tools]);

  // reset filtra tagu, jeśli po zmianie języka nie istnieje
  React.useEffect(() => {
    if (activeTag && tagList.indexOf(activeTag) < 0) setActiveTag('');
  }, [tagList, activeTag]);

  // filtrowanie po wyszukiwarce + tagu
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return tools.filter((tool) => {
      const matchesTag = !activeTag || tool.tags.indexOf(activeTag) > -1 || tool.isAllTools;
      const haystack = `${tool.name} ${tool.tagline} ${tool.description} ${tool.tags.join(' ')}`.toLowerCase();
      const matchesQuery = !q || haystack.indexOf(q) > -1;
      return matchesTag && matchesQuery;
    });
  }, [tools, query, activeTag]);

  const count = filtered.length;

  // reset aktywnego kafelka gdy zmieni się wynik filtrowania
  React.useEffect(() => {
    setActive(0);
  }, [query, activeTag]);

  const go = React.useCallback((dir: number) => {
    setActive((prev) => (count === 0 ? 0 : (prev + dir + count) % count));
  }, [count]);

  const onKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'ArrowRight') go(1);
  };

  const clearFilters = (): void => {
    setQuery('');
    setActiveTag('');
  };

  return (
    <section id="sec-tools" className={styles.section}>
      <div className={styles.sectionInner}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionKicker}>{t.tools.kicker}</div>
          <h2 className={styles.sectionTitle}>
            {t.tools.title.pre}<span className={styles.gradientText}>{t.tools.title.grad}</span>{t.tools.title.post}
          </h2>
          <p className={styles.sectionLead}>
            {t.tools.lead}
          </p>
        </div>

        <div className={styles.toolsToolbar}>
          <div className={styles.searchBox}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="M20 20l-3.2-3.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              className={styles.searchInput}
              placeholder={t.tools.searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label={t.tools.searchPlaceholder}
            />
            {query && (
              <button type="button" className={styles.searchClear} onClick={() => setQuery('')} aria-label="×">
                ×
              </button>
            )}
          </div>

          <div className={styles.tagFilter}>
            <button
              type="button"
              className={`${styles.tagChip} ${!activeTag ? styles.tagChipActive : ''}`}
              onClick={() => setActiveTag('')}
            >
              {t.tools.allTag}
            </button>
            {tagList.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`${styles.tagChip} ${activeTag === tag ? styles.tagChipActive : ''}`}
                onClick={() => setActiveTag(activeTag === tag ? '' : tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {count === 0 ? (
          <div className={styles.toolsEmpty}>
            <p>{t.tools.emptyText}</p>
            <button type="button" className={styles.toolBtnGhost} onClick={clearFilters}>
              {t.tools.clearFilters}
            </button>
          </div>
        ) : (
          <>
            <div
              className={styles.carousel}
              onKeyDown={onKeyDown}
              tabIndex={0}
              role="group"
              aria-roledescription="karuzela"
              aria-label="Narzędzia AI"
            >
              <button
                type="button"
                className={`${styles.carouselNav} ${styles.carouselPrev}`}
                onClick={() => go(-1)}
                aria-label="Poprzednie narzędzie"
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <div className={styles.carouselStage}>
                {filtered.map((tool, i) => {
                  let offset = i - active;
                  if (offset > count / 2) offset -= count;
                  if (offset < -count / 2) offset += count;
                  const abs = Math.abs(offset);
                  const isActive = offset === 0;
                  const visible = abs <= 2;

                  const style: React.CSSProperties = {
                    transform: `translateX(${offset * 56}%) scale(${isActive ? 1 : 0.8 - abs * 0.05}) rotateY(${offset * -8}deg)`,
                    opacity: visible ? (isActive ? 1 : 0.45 - abs * 0.1) : 0,
                    zIndex: 100 - abs,
                    pointerEvents: visible ? 'auto' : 'none',
                    filter: isActive ? 'none' : `blur(${abs * 1.5}px)`
                  };

                  return (
                    <div
                      key={tool.id}
                      className={`${styles.toolCard} ${isActive ? styles.toolCardActive : ''} ${tool.isAllTools ? styles.toolCardAll : ''}`}
                      style={style}
                      onClick={() => !isActive && visible && setActive(i)}
                      aria-hidden={!isActive}
                    >
                      <ToolCardContent tool={tool} isActive={isActive} settings={settings} />
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                className={`${styles.carouselNav} ${styles.carouselNext}`}
                onClick={() => go(1)}
                aria-label="Następne narzędzie"
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <div className={styles.carouselDots}>
              {filtered.map((tool, i) => (
                <button
                  key={tool.id}
                  type="button"
                  className={`${styles.dot} ${i === active ? styles.dotActive : ''}`}
                  onClick={() => setActive(i)}
                  aria-label={`Pokaż ${tool.name}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default ToolsCarousel;
