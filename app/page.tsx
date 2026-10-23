'use client';

import { useEffect, useRef, useState } from 'react';
import {
  motion,
  useScroll,
  useTransform,
} from 'framer-motion';
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Download,
  FileCheck2,
  LockKeyhole,
  Menu,
  Play,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';

import AppScreen from './components/AppScreen';
import Brand from './components/Brand';
import CommandPalette from './components/CommandPalette';
import ExperienceTimeline from './components/ExperienceTimeline';
import FeatureGrid from './components/FeatureGrid';
import HoloCore from './components/HoloCore';
import JourneyLab from './components/JourneyLab';
import ScrollProgress from './components/ScrollProgress';
import Tilt from './components/Tilt';
import { Reveal, SectionTop } from './components/Reveal';
import CinematicCore from './cinematic-core';
import BackdropStage from './scene/BackdropStage';
import HeroStage from './scene/HeroStage';
import { useMotionPreference } from './components/useMotionPreference';

/* -------------------------------------------------------------------------- */
/* Release configuration — unchanged from the original site.                  */
/* -------------------------------------------------------------------------- */

const apk = process.env.NEXT_PUBLIC_APK_URL || '';
const play = process.env.NEXT_PUBLIC_PLAY_STORE_URL || '';
const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL || '';
const valid = (url: string) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const faqs = [
  [
    'Is ORYQEN free?',
    'Pricing and availability will be announced when the public release is ready.',
  ],
  [
    'Can ORYQEN guarantee a job offer is safe?',
    'No. ORYQEN is designed to help you review information and identify questions; it cannot guarantee an employer, offer, or contract is legitimate.',
  ],
  [
    'Where can I download the app?',
    'Once an official APK or Play Store listing is available, the download buttons on this website can link directly to it.',
  ],
  [
    'Does ORYQEN replace professional advice?',
    'No. The app provides informational support and should not replace qualified legal, financial, or employment advice.',
  ],
] as const;

const NAV_ITEMS = [
  ['#about', 'The idea'],
  ['#core', '3D Experience'],
  ['#features', 'Features'],
  ['#lab', 'Live demo'],
  ['#experience', 'Experience'],
  ['#faq', 'FAQ'],
] as const;

/* -------------------------------------------------------------------------- */
/* Shared bits                                                                */
/* -------------------------------------------------------------------------- */

function MagneticButton({ href, children }: { href: string; children: React.ReactNode }) {
  const [xy, setXY] = useState({ x: 0, y: 0 });
  const reduced = useMotionPreference();

  return (
    <a
      className="magnetic-link"
      href={href}
      onPointerMove={(event) => {
        if (reduced || event.pointerType === 'touch') return;
        const rect = event.currentTarget.getBoundingClientRect();
        setXY({
          x: (event.clientX - rect.left - rect.width / 2) * 0.14,
          y: (event.clientY - rect.top - rect.height / 2) * 0.14,
        });
      }}
      onPointerLeave={() => setXY({ x: 0, y: 0 })}
      style={{ transform: `translate(${xy.x}px,${xy.y}px)` }}
    >
      <span>{children}</span>
      <ArrowUpRight size={18} />
    </a>
  );
}

/** The hero phone: pointer-driven 3D tilt plus an optional float. */
function HeroPhone() {
  const reduced = useMotionPreference();
  const stage = useRef<HTMLDivElement>(null);

  return (
    <div
      className="hero-phone"
      ref={stage}
      onPointerMove={(event) => {
        if (reduced || event.pointerType === 'touch') return;
        const node = stage.current;
        if (!node) return;
        const rect = node.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width;
        const py = (event.clientY - rect.top) / rect.height;
        node.style.setProperty('--phone-ry', `${-13 + px * 16}deg`);
        node.style.setProperty('--phone-rx', `${5 + (0.5 - py) * 10}deg`);
      }}
      onPointerLeave={() => {
        const node = stage.current;
        if (!node) return;
        node.style.setProperty('--phone-ry', '-13deg');
        node.style.setProperty('--phone-rx', '5deg');
      }}
    >
      <motion.div
        className="hero-phone-float"
        animate={reduced ? undefined : { y: [0, -16, 0], rotateZ: [-1.5, 0.5, -1.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="main-phone">
          <AppScreen />
        </div>
        <span className="phone-reflection" aria-hidden="true" />
      </motion.div>

      <div className="float-card float-one">
        <div className="float-icon">
          <ShieldCheck size={19} />
        </div>
        <div>
          <b>More confidence</b>
          <small>Understand before you decide</small>
        </div>
        <span className="float-check">✓</span>
      </div>
      <div className="float-card float-two">
        <div className="float-icon purple">
          <FileCheck2 size={19} />
        </div>
        <div>
          <b>Clearer agreements</b>
          <small>Know what to ask</small>
        </div>
      </div>
      <div className="float-pill">
        <span className="live-dot" /> BUILT FOR REAL PEOPLE <ArrowUpRight size={14} />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function Home() {
  const [menu, setMenu] = useState(false);
  const [faq, setFaq] = useState<number | null>(0);
  const [toast, setToast] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('');
  const reduced = useMotionPreference();
  const heroRef = useRef<HTMLElement>(null);

  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroTitleY = useTransform(heroProgress, [0, 1], [0, reduced ? 0 : 90]);
  const heroFade = useTransform(heroProgress, [0, 0.85], [1, reduced ? 1 : 0.15]);

  const showToast = (message: string) => setToast(message);
  const unavailable = (kind: string) =>
    showToast(`${kind} isn't available yet. Add its official URL in .env.local to enable downloads.`);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  /* Sticky navigation state + current section highlight. */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const sections = NAV_ITEMS.map(([href]) => document.querySelector<HTMLElement>(href)).filter(
      (node): node is HTMLElement => Boolean(node),
    );
    if (typeof IntersectionObserver === 'undefined' || sections.length === 0) {
      return () => window.removeEventListener('scroll', onScroll);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(`#${visible.target.id}`);
      },
      { rootMargin: '-42% 0px -52% 0px', threshold: [0.01, 0.2, 0.5] },
    );
    sections.forEach((section) => observer.observe(section));

    return () => {
      window.removeEventListener('scroll', onScroll);
      observer.disconnect();
    };
  }, []);

  const closeMenu = () => setMenu(false);

  return (
    <main id="top">
      <BackdropStage />
      <ScrollProgress />
      <CommandPalette />

      <div className="site-shell">
        <header className={`nav ${scrolled ? 'nav--scrolled' : ''}`}>
          <Brand />
          <nav
            className={menu ? 'nav-links open' : 'nav-links'}
            aria-label="Main navigation"
          >
            {NAV_ITEMS.map(([href, label]) => (
              <a
                key={href}
                href={href}
                className={active === href ? 'active' : ''}
                onClick={closeMenu}
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="nav-actions">
            <span className="nav-status">
              <i /> A NEW WAY FORWARD
            </span>
            <a href="#download" className="nav-cta">
              GET THE APP <ArrowUpRight size={15} />
            </a>
          </div>
          <button
            className="mobile-menu"
            aria-label={menu ? 'Close menu' : 'Open menu'}
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </header>

        <section className="hero" aria-labelledby="hero-title" ref={heroRef}>
          <div className="hero-grid" aria-hidden="true" />
          <div className="cinematic-noise" aria-hidden="true" />
          <div className="hero-aura" aria-hidden="true" />
          <HeroStage />

          <div className="hero-content">
            <div className="hero-kicker">
              <span className="kicker-line" /> THE FUTURE OF FAIR WORK
              <span className="kicker-num">/ 001</span>
            </div>

            <motion.div className="hero-head" style={{ y: heroTitleY, opacity: heroFade }}>
              <h1 id="hero-title" className="hero-title">
                OPPORTUNITY
                <br />
                <span>REIMAGINED</span>
                <span className="hero-dot">.</span>
              </h1>
            </motion.div>

            <div className="hero-stage">
              <div className="hero-copy">
                <span className="eyebrow">WELCOME TO ORYQEN</span>
                <p>
                  Better opportunities start with <strong>better information.</strong> Explore a
                  smarter way to navigate work.
                </p>
                <MagneticButton href="#core">EXPLORE THE EXPERIENCE</MagneticButton>
              </div>

              <div className="hero-art">
                <HeroPhone />
              </div>

              <div className="hero-right">
                <span className="hero-right-index">01 — 04</span>
                <p>
                  Technology with a human purpose.
                  <br />
                  Clarity at every step.
                </p>
                <a href="#download" className="round-arrow" aria-label="Go to download section">
                  <ArrowRight />
                </a>
              </div>
            </div>

            <div className="hero-bottom">
              <span className="hero-side-label">
                SCROLL TO DISCOVER <span>↓</span>
              </span>
              <span className="hero-bottom-line" aria-hidden="true" />
              <span className="hero-bottom-mark" aria-hidden="true">
                ◈
              </span>
            </div>
          </div>
        </section>

        <div className="ticker" aria-label="ORYQEN product values">
          <div className="ticker-inner">
            {Array.from({ length: 2 }).map((_, index) => (
              <div className="ticker-set" key={index} aria-hidden={index === 1}>
                <span>CLARITY FIRST</span>
                <b>✳</b>
                <span>PEOPLE FIRST</span>
                <b>✳</b>
                <span>FAIRER FUTURES</span>
                <b>✳</b>
                <span>BUILT FOR WHAT&apos;S NEXT</span>
                <b>✳</b>
              </div>
            ))}
          </div>
        </div>

        <section className="intro section-pad" id="about">
          <Reveal>
            <SectionTop tag="01 / THE IDEA" right="MORE THAN AN APP ↗" />
            <div className="intro-layout">
              <h2 className="display-heading">
                WORK SHOULD
                <br />
                FEEL <em>CLEARER.</em>
              </h2>
              <div className="intro-aside">
                <div className="asterisk" aria-hidden="true">
                  ✳
                </div>
                <p>
                  Important decisions shouldn&apos;t begin with uncertainty. ORYQEN helps bring
                  structure, understanding, and perspective to the moments that shape your working
                  life.
                </p>
                <a href="#features" className="pill-link">
                  DISCOVER WHAT&apos;S INSIDE <ArrowUpRight size={17} />
                </a>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <Tilt className="statement-tilt" max={4}>
              <div className="statement-card">
                <div className="statement-orb" aria-hidden="true" />
                <div className="statement-ring" aria-hidden="true" />
                <div className="statement-top">
                  <span>◈ ORYQEN / OUR PURPOSE</span>
                  <span>HUMAN-CENTERED TECHNOLOGY</span>
                </div>
                <div className="statement-copy">
                  THE RIGHT
                  <br />
                  INFORMATION.
                  <br />
                  <span>THE POWER TO CHOOSE.</span>
                </div>
                <div className="statement-bottom">
                  <span>Less confusion. More confidence.</span>
                  <div className="statement-arrow">
                    <ArrowUpRight size={27} />
                  </div>
                </div>
              </div>
            </Tilt>
          </Reveal>
        </section>

        <section className="core-section section-pad" id="core">
          <Reveal>
            <SectionTop tag="02 / THE INTELLIGENCE" right="MOVE YOUR CURSOR TO INTERACT ↗" />
            <div className="core-heading">
              <h2 className="display-heading">
                A NEW KIND OF
                <br />
                <em>INTELLIGENCE.</em>
              </h2>
              <p>Not just a beautiful interface. An interactive vision for human-centered decisions.</p>
            </div>
          </Reveal>
          <Reveal>
            <CinematicCore />
          </Reveal>
          <Reveal>
            <HoloCore />
          </Reveal>
        </section>

        <section className="features section-pad" id="features">
          <Reveal>
            <SectionTop tag="02 / THE PLATFORM" right="DESIGNED AROUND YOU" />
            <div className="features-head">
              <h2 className="display-heading">
                SMART TOOLS.
                <br />
                <em>REAL CLARITY.</em>
              </h2>
              <p>Four thoughtful ways to bring more understanding to your next opportunity.</p>
            </div>
          </Reveal>
          <FeatureGrid />
        </section>

        <section className="lab-section section-pad" id="lab">
          <Reveal>
            <SectionTop tag="03 / INTERACTIVE LAB" right="TRY THE EXPERIENCE ↗" />
            <div className="lab-heading">
              <h2 className="display-heading">
                DON’T JUST LOOK.
                <br />
                <em>EXPLORE.</em>
              </h2>
              <p>
                A hands-on preview of the thinking behind ORYQEN. Choose a path and navigate the
                journey.
              </p>
            </div>
          </Reveal>
          <Reveal>
            <JourneyLab />
          </Reveal>
        </section>

        <section className="experience section-pad" id="experience">
          <Reveal>
            <SectionTop tag="03 / THE EXPERIENCE" right="INTUITIVE BY DESIGN" />
            <h2 className="display-heading">
              YOUR NEXT MOVE.
              <br />
              <em>MADE SIMPLE.</em>
            </h2>
          </Reveal>
          <ExperienceTimeline />
        </section>

        <section className="manifesto">
          <div className="manifesto-grain" aria-hidden="true" />
          <div className="manifesto-aura" aria-hidden="true" />
          <Reveal>
            <div className="manifesto-top">
              <span>THE ORYQEN PHILOSOPHY</span>
              <span>04 / WHAT DRIVES US</span>
            </div>
            <p className="manifesto-statement">
              THE FUTURE OF WORK
              <br />
              SHOULD BE <em>MORE HUMAN.</em>
            </p>
            <div className="manifesto-bottom">
              <span>◈</span>
              <p>
                We believe people deserve tools that make important decisions easier to
                understand—not harder.
              </p>
            </div>
          </Reveal>
        </section>

        <section className="download section-pad" id="download">
          <Reveal>
            <SectionTop tag="05 / GET STARTED" right="YOUR NEXT CHAPTER" />
            <div className="download-panel">
              <div className="download-glow" aria-hidden="true" />
              <div className="download-copy">
                <div className="download-eyebrow">
                  <span className="live-dot" /> THE FUTURE IS TAKING SHAPE
                </div>
                <h2>
                  READY FOR
                  <br />
                  <em>WHAT&apos;S NEXT?</em>
                </h2>
                <p>
                  Take ORYQEN with you. Official Android download options will appear here when the
                  app is released.
                </p>
                <div className="download-buttons">
                  {valid(apk) ? (
                    <a className="download-btn primary" href={apk} target="_blank" rel="noopener noreferrer">
                      <Download size={19} /> DOWNLOAD APK <ArrowUpRight size={17} />
                    </a>
                  ) : (
                    <button className="download-btn primary" onClick={() => unavailable('The APK')}>
                      <Download size={19} /> APK COMING SOON <ArrowUpRight size={17} />
                    </button>
                  )}
                  {valid(play) ? (
                    <a className="download-btn secondary" href={play} target="_blank" rel="noopener noreferrer">
                      <Play size={17} /> GOOGLE PLAY <ArrowUpRight size={17} />
                    </a>
                  ) : (
                    <button className="download-btn secondary" onClick={() => unavailable('Google Play')}>
                      <Play size={17} /> PLAY STORE SOON <ArrowUpRight size={17} />
                    </button>
                  )}
                </div>
                <div className="download-note">
                  <LockKeyhole size={13} /> Use only official ORYQEN release links.
                </div>
              </div>
              <div className="download-visual">
                <div className="download-circle" aria-hidden="true" />
                <div className="download-phone-tilt">
                  <AppScreen small />
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        <section className="faq section-pad" id="faq">
          <Reveal>
            <SectionTop tag="06 / GOOD TO KNOW" right="QUESTIONS & ANSWERS" />
            <div className="faq-grid">
              <div>
                <h2 className="display-heading">
                  A FEW
                  <br />
                  <em>GOOD QUESTIONS.</em>
                </h2>
                <p>Everything you need to know as we build toward launch.</p>
              </div>
              <div className="faq-items">
                {faqs.map(([question, answer], index) => (
                  <div className={`faq-item ${faq === index ? 'open' : ''}`} key={question}>
                    <button
                      aria-expanded={faq === index}
                      aria-controls={`faq-answer-${index}`}
                      onClick={() => setFaq(faq === index ? null : index)}
                    >
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      {question}
                      <ChevronDown className={faq === index ? 'chevron rotated' : 'chevron'} size={20} />
                    </button>
                    <div
                      className="faq-answer-wrap"
                      id={`faq-answer-${index}`}
                      role="region"
                      aria-hidden={faq !== index}
                    >
                      <div className="faq-answer">{answer}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </section>

        <footer className="footer">
          <div className="footer-top">
            <Brand />
            <span>CLARITY FOR EVERY OPPORTUNITY.</span>
            <a href="#top">BACK TO TOP ↑</a>
          </div>
          <div className="footer-giant">
            ORYQEN<span>.</span>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} ORYQEN. ALL RIGHTS RESERVED.</span>
            <span>MADE FOR A FAIRER FUTURE ✳</span>
            {email ? <a href={`mailto:${email}`}>CONTACT ↗</a> : <span>CONTACT DETAILS COMING SOON</span>}
          </div>
        </footer>
      </div>

      {toast && (
        <div className="toast" role="status">
          <Sparkles size={17} />
          {toast}
          <button aria-label="Dismiss notification" onClick={() => setToast('')}>
            <X size={16} />
          </button>
        </div>
      )}
    </main>
  );
}
