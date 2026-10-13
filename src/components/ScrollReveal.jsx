import React, { useEffect, useRef, useCallback } from 'react';
import { ArrowUp } from 'lucide-react';

// Track active scroll timestamp globally so Tilt3DCard never triggers getBoundingClientRect() or 3D repaints mid-scroll
let globalLastScrollTime = 0;
let isCoarsePointerDevice = false;

if (typeof window !== 'undefined') {
  isCoarsePointerDevice =
    window.matchMedia('(pointer: coarse)').matches ||
    window.matchMedia('(hover: none)').matches;
}

/* ─────────────────────────────────────────────────────────────
   SHARED INTERSECTION OBSERVER POOL (Zero React Re-Renders!)
   Instead of 45+ separate IntersectionObservers and 45+ React state
   re-renders during scroll, a single shared observer toggles CSS
   classes directly on the DOM node and releases GPU layers once settled.
   ───────────────────────────────────────────────────────────── */
const observerCallbacks = new WeakMap();
let sharedRevealObserver = null;

function getSharedRevealObserver() {
  if (sharedRevealObserver || typeof IntersectionObserver === 'undefined') {
    return sharedRevealObserver;
  }
  sharedRevealObserver = new IntersectionObserver(
    (entries) => {
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const cb = observerCallbacks.get(entry.target);
        if (cb) cb(entry);
      }
    },
    { threshold: 0.05, rootMargin: '40px 0px -16px 0px' }
  );
  return sharedRevealObserver;
}

/* ─────────────────────────────────────────────────────────────
   1. EYE-FRIENDLY 3D SCROLL REVEAL WRAPPER (Zero React State)
   ───────────────────────────────────────────────────────────── */
export function ScrollReveal({
  children,
  variant = 'fade-up',
  delay = 0,
  once = true,
  className = '',
  as: Tag = 'div',
}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      el.classList.add('is-visible', 'is-settled');
      return;
    }

    const obs = getSharedRevealObserver();
    if (!obs) {
      el.classList.add('is-visible', 'is-settled');
      return;
    }

    let settleTimer = null;
    const cappedDelay = delay ? Math.min(delay, 220) : 0;

    observerCallbacks.set(el, (entry) => {
      if (entry.isIntersecting) {
        el.classList.add('is-visible');
        if (once) {
          obs.unobserve(el);
          observerCallbacks.delete(el);
          settleTimer = setTimeout(() => {
            if (el) el.classList.add('is-settled');
          }, 680 + cappedDelay);
        }
      } else if (!once && entry.boundingClientRect.top > window.innerHeight) {
        if (settleTimer) clearTimeout(settleTimer);
        el.classList.remove('is-visible', 'is-settled');
      }
    });

    obs.observe(el);
    return () => {
      if (settleTimer) clearTimeout(settleTimer);
      obs.unobserve(el);
      observerCallbacks.delete(el);
    };
  }, [once, delay]);

  const variantClass = `mcu-reveal mcu-reveal-${variant}`;
  const delayStyle = delay ? { transitionDelay: `${Math.min(delay, 220)}ms` } : undefined;

  return (
    <Tag
      ref={ref}
      className={`${variantClass} ${className}`.trim()}
      style={delayStyle}
    >
      {children}
    </Tag>
  );
}

/* ─────────────────────────────────────────────────────────────
   2. REFINED 3D TILT CARD (Zero-Jitter, Desktop-Only)
   - Completely bypassed on touch/mobile devices (zero overhead)
   - Skips tilt/glare calculations while page is actively scrolling
   ───────────────────────────────────────────────────────────── */
export function Tilt3DCard({ children, className = '', intensity = 3.5 }) {
  const cardRef = useRef(null);
  const rafRef = useRef(null);

  const handleMouseMove = useCallback(
    (e) => {
      if (isCoarsePointerDevice) return;
      if (performance.now() - globalLastScrollTime < 180) return;

      const el = cardRef.current;
      if (!el) return;
      const clientX = e.clientX;
      const clientY = e.clientY;

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        if (performance.now() - globalLastScrollTime < 180) return;
        const rect = el.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const safeIntensity = Math.min(intensity, 4);
        const rotateX = ((y - centerY) / centerY) * -safeIntensity;
        const rotateY = ((x - centerX) / centerX) * safeIntensity;

        el.style.transition = 'transform 0.14s cubic-bezier(0.22, 1, 0.36, 1)';
        el.style.transform = `perspective(1100px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translate3d(0, -2px, 0)`;
      });
    },
    [intensity]
  );

  const handleMouseLeave = useCallback(() => {
    if (isCoarsePointerDevice) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const el = cardRef.current;
    if (el) {
      el.style.transition = 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)';
      el.style.transform = 'none';
    }
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (isCoarsePointerDevice) {
    return <div className={`relative ${className}`}>{children}</div>;
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative ${className}`}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   3. GLOBAL LIGHT-COLORED AMBIENT BACKGROUND
   - Zero scroll listeners and zero per-frame DOM mutations
   - Strict CSS containment for 120fps mobile & desktop scrolling
   ───────────────────────────────────────────────────────────── */
export function Ambient3DBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden select-none"
      style={{ zIndex: 0, contain: 'strict' }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 10% 18%, rgba(252, 74, 0, 0.04) 0%, transparent 45%),
            radial-gradient(circle at 90% 32%, rgba(0, 51, 102, 0.05) 0%, transparent 48%),
            radial-gradient(circle at 15% 78%, rgba(104, 10, 19, 0.035) 0%, transparent 45%),
            radial-gradient(circle at 85% 84%, rgba(245, 158, 11, 0.04) 0%, transparent 45%)
          `,
        }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   4. SILKY SCROLL PROGRESS HUD (Zero React State Re-Renders!)
      - All updates happen directly on DOM refs inside a single RAF tick
      - Layout measurements happen ONLY on resize / ResizeObserver, NEVER inside scroll!
   ───────────────────────────────────────────────────────────── */
const SECTIONS = [
  { id: 'home',       label: 'Home',       hi: 'होम' },
  { id: 'directory',  label: 'Directory',  hi: 'डायरेक्टरी' },
  { id: 'mentorship', label: 'Mentorship', hi: 'मेंटरशिप' },
  { id: 'jobs',       label: 'Jobs',       hi: 'करियर' },
  { id: 'events',     label: 'Events',     hi: 'कार्यक्रम' },
  { id: 'gallery',    label: 'Gallery',    hi: 'गैलरी' },
  { id: 'giving',     label: 'Give Back',  hi: 'सहयोग' },
];

const RING_RADIUS = 22;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export function ScrollProgressHUD() {
  const topBarRef = useRef(null);
  const ringCircleRef = useRef(null);
  const pctTextRef = useRef(null);
  const backTopBtnRef = useRef(null);
  const navLabelRefs = useRef([]);
  const navDotRefs = useRef([]);

  useEffect(() => {
    let rafId = null;
    let lastShown = false;
    let lastSecIdx = 0;
    let lastPctInt = -1;
    let cachedMaxScroll = 1;
    let cachedOffsets = [];

    const applyActiveSectionDOM = (activeIdx) => {
      for (let i = 0; i < SECTIONS.length; i++) {
        const labelEl = navLabelRefs.current[i];
        const dotEl = navDotRefs.current[i];
        const isActive = i === activeIdx;
        if (labelEl) {
          if (isActive) {
            labelEl.className =
              'px-2.5 py-0.5 rounded-md text-[10px] font-semibold tracking-wide transition-all duration-300 opacity-100 translate-x-0 bg-[#003366]/95 text-amber-200 shadow-sm border border-amber-300/25';
          } else {
            labelEl.className =
              'px-2.5 py-0.5 rounded-md text-[10px] font-semibold tracking-wide transition-all duration-300 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 bg-slate-900/80 text-white';
          }
        }
        if (dotEl) {
          dotEl.style.width = isActive ? '24px' : '8px';
          dotEl.style.background = isActive
            ? 'linear-gradient(90deg, #fc4a00, #fbbf24, #680a13)'
            : 'rgba(0, 51, 102, 0.28)';
          dotEl.style.border = isActive
            ? '1px solid rgba(251, 191, 36, 0.6)'
            : '1px solid rgba(255, 255, 255, 0.5)';
        }
      }
    };

    const measureLayout = () => {
      cachedMaxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      cachedOffsets = SECTIONS.map((sec) => {
        const el = document.getElementById(sec.id);
        return el ? el.offsetTop : 0;
      });
    };

    const updateHUD = () => {
      rafId = null;
      const scrollTop = window.scrollY || 0;
      const pct = Math.min(1, Math.max(0, scrollTop / cachedMaxScroll));

      if (topBarRef.current) {
        topBarRef.current.style.transform = `scaleX(${pct.toFixed(4)})`;
      }

      const pctInt = Math.round(pct * 100);
      if (pctInt !== lastPctInt) {
        lastPctInt = pctInt;
        if (ringCircleRef.current) {
          const offset = RING_CIRCUMFERENCE * (1 - pct);
          ringCircleRef.current.style.strokeDashoffset = `${offset.toFixed(2)}`;
        }
        if (pctTextRef.current) {
          pctTextRef.current.textContent = `${pctInt}%`;
        }
      }

      const shouldShow = scrollTop > 140;
      if (shouldShow !== lastShown) {
        lastShown = shouldShow;
        if (backTopBtnRef.current) {
          if (shouldShow) {
            backTopBtnRef.current.classList.remove('opacity-0', 'translate-y-5', 'scale-90', 'pointer-events-none');
            backTopBtnRef.current.classList.add('opacity-100', 'translate-y-0', 'scale-100');
          } else {
            backTopBtnRef.current.classList.remove('opacity-100', 'translate-y-0', 'scale-100');
            backTopBtnRef.current.classList.add('opacity-0', 'translate-y-5', 'scale-90', 'pointer-events-none');
          }
        }
      }

      // Only update desktop section spy rail if viewport is desktop (>= 1024px)
      if (window.innerWidth >= 1024 && cachedOffsets.length > 0) {
        let currentIdx = 0;
        const triggerY = scrollTop + 220;
        for (let i = 0; i < cachedOffsets.length; i++) {
          if (cachedOffsets[i] <= triggerY) {
            currentIdx = i;
          }
        }
        if (currentIdx !== lastSecIdx) {
          lastSecIdx = currentIdx;
          applyActiveSectionDOM(currentIdx);
        }
      }
    };

    const onScroll = () => {
      globalLastScrollTime = performance.now();
      if (!rafId) rafId = requestAnimationFrame(updateHUD);
    };

    let resizeTimer = null;
    const onResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        measureLayout();
        if (!rafId) rafId = requestAnimationFrame(updateHUD);
      }, 150);
    };

    measureLayout();
    applyActiveSectionDOM(0);
    updateHUD();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (resizeTimer) clearTimeout(resizeTimer);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      {/* ── 1. LIVE TOP SAFFRON-GOLD-MAROON GRADIENT PROGRESS BAR (scaleX) ── */}
      <div
        aria-hidden="true"
        className="fixed top-0 left-0 right-0 z-[10000] pointer-events-none h-[3.5px] bg-slate-900/10"
      >
        <div
          ref={topBarRef}
          style={{
            width: '100%',
            height: '100%',
            transformOrigin: '0% 50%',
            transform: 'scaleX(0)',
            background: 'linear-gradient(90deg, #fc4a00 0%, #fbbf24 50%, #680a13 100%)',
            willChange: 'transform',
          }}
        />
      </div>

      {/* ── 2. DESKTOP RIGHT-SIDE SECTION SPY NAVIGATION RAIL ── */}
      <nav
        aria-label="Section navigation"
        className="fixed right-4 top-1/2 -translate-y-1/2 z-[9990] hidden lg:flex flex-col items-end gap-2.5"
      >
        {SECTIONS.map((sec, idx) => (
          <button
            key={sec.id}
            onClick={() => scrollToSection(sec.id)}
            title={sec.label}
            aria-label={`Jump to ${sec.label}`}
            className="group flex items-center gap-2 cursor-pointer focus:outline-none"
          >
            <span
              ref={(el) => {
                navLabelRefs.current[idx] = el;
              }}
              className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold tracking-wide transition-all duration-300 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 bg-slate-900/80 text-white"
            >
              {sec.label}
            </span>
            <span
              ref={(el) => {
                navDotRefs.current[idx] = el;
              }}
              className="transition-all duration-300 rounded-full"
              style={{
                width: idx === 0 ? '24px' : '8px',
                height: '8px',
                background:
                  idx === 0
                    ? 'linear-gradient(90deg, #fc4a00, #fbbf24, #680a13)'
                    : 'rgba(0, 51, 102, 0.28)',
                border:
                  idx === 0
                    ? '1px solid rgba(251, 191, 36, 0.6)'
                    : '1px solid rgba(255, 255, 255, 0.5)',
              }}
            />
          </button>
        ))}
      </nav>

      {/* ── 3. CIRCULAR SCROLL-RING "BACK TO TOP" FLOATING BUTTON ── */}
      <button
        ref={backTopBtnRef}
        onClick={scrollToTop}
        aria-label="Scroll back to top"
        title="Back to Top"
        className="fixed bottom-6 right-5 z-[9999] rounded-full flex items-center justify-center cursor-pointer group transition-[transform,opacity] duration-300 opacity-0 translate-y-5 scale-90 pointer-events-none"
        style={{
          width: '54px',
          height: '54px',
          background: 'linear-gradient(135deg, #003366 0%, #001f42 60%, #680a13 100%)',
          boxShadow:
            '0 12px 28px -6px rgba(0, 34, 68, 0.45), 0 4px 12px rgba(104, 10, 19, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
        }}
      >
        <svg
          width="54"
          height="54"
          viewBox="0 0 56 56"
          className="absolute inset-0 -rotate-90 pointer-events-none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="mcuScrollRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fc4a00" />
              <stop offset="50%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#680a13" />
            </linearGradient>
          </defs>
          <circle
            cx="28"
            cy="28"
            r={RING_RADIUS}
            fill="none"
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth="3"
          />
          <circle
            ref={ringCircleRef}
            cx="28"
            cy="28"
            r={RING_RADIUS}
            fill="none"
            stroke="url(#mcuScrollRingGrad)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={RING_CIRCUMFERENCE}
          />
        </svg>

        <div className="relative z-10 flex flex-col items-center justify-center text-white leading-none">
          <ArrowUp className="w-4 h-4 text-amber-300 group-hover:-translate-y-0.5 transition-transform duration-200" />
          <span
            ref={pctTextRef}
            className="text-[9px] font-mono font-bold text-amber-100/95 mt-0.5"
          >
            0%
          </span>
        </div>
      </button>
    </>
  );
}
