import { useEffect, useRef, useState } from 'react';
import './SectionRail.scss';

const SECTIONS = [
  { id: 'work', label: 'Helm' },
  { id: 'marl', label: 'MARL' },
  { id: 'sim', label: 'Lap Time Sim' },
  { id: 'profile', label: 'Profile' },
  { id: 'contact', label: 'Contact' },
] as const;

export default function SectionRail() {
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState<string>('work');
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const hero = document.getElementById('top');
    const sections = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => el !== null
    );

    let heroObs: IntersectionObserver | undefined;
    if (hero) {
      heroObs = new IntersectionObserver(
        (entries) => entries.forEach((e) => setVisible(!e.isIntersecting)),
        { threshold: 0.12 }
      );
      heroObs.observe(hero);
    }

    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: '-45% 0px -45% 0px' }
    );
    sections.forEach((el) => spy.observe(el));

    return () => {
      heroObs?.disconnect();
      spy.disconnect();
    };
  }, []);

  const activeLabel = SECTIONS.find((s) => s.id === active)?.label ?? '';

  return (
    <>
      <nav
        className={`section-rail${visible ? ' is-visible' : ''}`}
        aria-label="Jump to section"
      >
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className={`rail-item${active === s.id ? ' is-active' : ''}`}
          >
            <span className="rl-label">{s.label}</span>
            <span className="rl-tick" aria-hidden="true" />
          </a>
        ))}
      </nav>

      <nav
        className={`section-rail-m${visible ? ' is-visible' : ''}`}
        aria-label="Jump to section"
      >
        <span className="rm-ticks">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              aria-label={s.label}
              className={`rm-item${active === s.id ? ' is-active' : ''}`}
            />
          ))}
        </span>
        <span className="rm-label">{activeLabel}</span>
      </nav>
    </>
  );
}
