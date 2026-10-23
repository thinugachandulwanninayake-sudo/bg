'use client';

import { useEffect, useState } from 'react';
import { ArrowUpRight, Pause, Play, RotateCcw } from 'lucide-react';
import RobotStage from './robot/RobotStage';

const modes = [
  {
    name: 'CLARITY',
    caption: 'SEE THE WHOLE PICTURE',
    detail: 'UNDERSTAND THE OFFER',
  },
  {
    name: 'TRUST',
    caption: 'KNOW WHAT MATTERS',
    detail: 'CONFIDENCE THROUGH CONTEXT',
  },
  {
    name: 'CONTROL',
    caption: 'MOVE WITH CONFIDENCE',
    detail: 'YOUR FUTURE, YOUR CALL',
  },
] as const;

/**
 * The 3D Experience section. The Guardian model, CLARITY / TRUST / CONTROL presets,
 * pause, reset, drag-to-orbit and cursor head-tracking are the original behaviours;
 * the surrounding HUD, scan line and mode read-outs are new cinematic framing.
 */
export default function CinematicCore() {
  const [mode, setMode] = useState(0);
  const [paused, setPaused] = useState(false);
  const [motionReduced, setMotionReduced] = useState(false);
  const [resetToken, setResetToken] = useState(0);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setMotionReduced(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  const active = !paused && !motionReduced;

  return (
    <div className="cinema-shell guardian-shell">
      <div className="cinema-bar">
        <span>
          <i /> ORYQEN / INTELLIGENCE GUARDIAN
        </span>
        <span>ADAPTIVE EXPERIENCE · 006</span>
      </div>
      <div
        className={`cinema-stage guardian-stage guardian-mode-${mode} ${
          active ? 'guardian-active' : 'guardian-paused'
        }`}
        data-mode={modes[mode].name}
      >
        <div className="guardian-atmosphere" aria-hidden="true" />
        <div className="guardian-grid" aria-hidden="true" />
        <div className="guardian-scan" aria-hidden="true" />

        <RobotStage
          mode={mode}
          paused={paused}
          reducedMotion={motionReduced}
          resetToken={resetToken}
        />

        <div className="guardian-orbit guardian-orbit-one" aria-hidden="true" />
        <div className="guardian-orbit guardian-orbit-two" aria-hidden="true" />

        <div className="guardian-eyebrow">03 / THE ORYQEN EXPERIENCE</div>

        <div className="guardian-copy">
          <div className="guardian-mini">INTRODUCING THE INTELLIGENCE GUARDIAN</div>
          <h3>
            CLARITY
            <br />
            <em>IN EVERY</em>
            <br />
            DIMENSION.
          </h3>
          <p>
            A human-centered vision of smarter opportunities. Explore the ideas behind ORYQEN
            through a new perspective.
          </p>
          <a href="#lab" className="guardian-cta">
            EXPLORE THE LIVE DEMO <ArrowUpRight size={17} />
          </a>
        </div>

        <div className="guardian-chip guardian-chip-a">
          <span className="guardian-chip-dot">✧</span>
          <div>
            <b>OFFER INTELLIGENCE</b>
            <small>Turn complexity into clarity</small>
          </div>
        </div>
        <div className="guardian-chip guardian-chip-b">
          <span className="guardian-chip-dot">◇</span>
          <div>
            <b>WORK PASSPORT</b>
            <small>Own your professional story</small>
          </div>
        </div>
        <div className="guardian-chip guardian-chip-c">
          <span className="guardian-chip-dot">✳</span>
          <div>
            <b>{modes[mode].name} MODE</b>
            <small>{modes[mode].detail}</small>
          </div>
        </div>

        <div className="guardian-side">HUMAN FIRST / FUTURE READY</div>

        <div className="guardian-bottom">
          <span>ORYQEN / INTELLIGENCE VISUALIZATION</span>
          <span>
            <b className="guardian-hint-cursor">MOVE CURSOR · </b>DRAG TO ROTATE ↗
          </span>
        </div>

        <div className="guardian-hud" aria-hidden="true">
          <span>MODE 0{mode + 1} / 03</span>
          <span className="guardian-hud-meter">
            {modes.map((item, index) => (
              <i key={item.name} className={index <= mode ? 'on' : ''} />
            ))}
          </span>
          <span>{modes[mode].name}</span>
        </div>
      </div>

      <div className="cinema-controls">
        <div className="cinema-modes">
          {modes.map((item, index) => (
            <button
              key={item.name}
              type="button"
              className={mode === index ? 'active' : ''}
              aria-pressed={mode === index}
              onClick={() => setMode(index)}
            >
              <span>0{index + 1}</span> {item.name}
            </button>
          ))}
        </div>
        <div className="v5-actions">
          <button
            className="cinema-pause"
            onClick={() => setResetToken((token) => token + 1)}
            aria-label="Reset guardian viewpoint"
          >
            <RotateCcw size={15} /> RESET
          </button>
          <button
            className="cinema-pause"
            onClick={() => setPaused((value) => !value)}
            aria-label={paused ? 'Resume motion' : 'Pause motion'}
            aria-pressed={paused}
          >
            {paused ? <Play size={16} /> : <Pause size={16} />} {paused ? 'PLAY' : 'PAUSE'}
          </button>
        </div>
      </div>

      <div className="cinema-caption">
        <span>{modes[mode].caption} / CONCEPT VISUAL</span>
        <a href="#lab">
          TRY THE INTERACTIVE DEMO <ArrowUpRight size={16} />
        </a>
      </div>
    </div>
  );
}
