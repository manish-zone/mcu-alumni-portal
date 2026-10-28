import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { universityInfo } from '../data/mockData';
import { useCountUp } from '../utils/useCountUp';
import {
  ArrowRight,
  Users,
  Building2,
  Award,
  Globe2,
  Feather,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import heroBg from '../assets/hero.png';
import { ScrollReveal, Tilt3DCard } from './ScrollReveal';

/* ─────────────────────────────────────────────────────────────
   3D COMPUTER & CIRCUIT HOLOGRAPHIC HERO BACKGROUND
   - Driven by Damped Inertial Physics (Lerp) on Direct DOM Refs
   - Zero React state re-renders on scroll = 60/120fps silkiness!
   ───────────────────────────────────────────────────────────── */
const HERO_SYMBOLS = [
  { symbol: '{ }', top: '20%', left: '4%',  size: '1.1rem',  bg: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(224,242,254,0.88) 100%)', border: 'rgba(56,189,248,0.55)',  color: '#fc4a00', floatClass: 'mcu-tech-float-a', mul: 0.22, rot: 10 },
  { symbol: '</>', top: '22%', left: '89%', size: '1.05rem', bg: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(224,242,254,0.88) 100%)', border: 'rgba(56,189,248,0.55)',  color: '#003366', floatClass: 'mcu-tech-float-b', mul: 0.35, rot: -12 },
  { symbol: '01',  top: '43%', left: '5%',  size: '0.95rem', bg: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(224,242,254,0.88) 100%)', border: 'rgba(56,189,248,0.55)',  color: '#680a13', floatClass: 'mcu-tech-float-c', mul: 0.18, rot: 8 },
  { symbol: 'AI',  top: '46%', left: '91%', size: '0.95rem', bg: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(224,242,254,0.88) 100%)', border: 'rgba(56,189,248,0.55)',  color: '#d97706', floatClass: 'mcu-tech-float-d', mul: 0.42, rot: -10 },
  { symbol: 'CPU', top: '68%', left: '3%',  size: '0.85rem', bg: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(224,242,254,0.88) 100%)', border: 'rgba(56,189,248,0.55)',  color: '#003366', floatClass: 'mcu-tech-float-a', mul: 0.28, rot: 12 },
  { symbol: '( )', top: '71%', left: '91%', size: '1.0rem',  bg: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(224,242,254,0.88) 100%)', border: 'rgba(56,189,248,0.55)',  color: '#8d0303', floatClass: 'mcu-tech-float-b', mul: 0.32, rot: -9 },
];

function TechBackground3D() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden pointer-events-none select-none"
      style={{ zIndex: 1, perspective: '1000px' }}
    >
      {/* 3D Perspective Architectural Grid on Pearl-Aqua Surface (Hardware-Locked 3D Plane) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(to right, rgba(2, 132, 199, 0.065) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 51, 102, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '56px 56px',
          transformOrigin: '50% 0%',
          transform: 'perspective(850px) rotateX(20deg) scale(1.12)',
        }}
      />
      {/* Soft Vignette Overlay for Depth without expensive CSS maskImage penalty */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 82% 72% at 50% 35%, transparent 35%, #f4faff 100%)',
        }}
      />

      {/* Animated SVG Circuit Traces (Subtle Luxury Aqua, Gold & Navy) */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1400 900"
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.22,
        }}
      >
        <g
          stroke="#0284c7"
          strokeWidth="1.4"
          fill="none"
          strokeDasharray="320"
          style={{ animation: 'mcu-circuit-draw 3.2s ease-out forwards' }}
        >
          <polyline points="60,240 180,240 210,270 210,390 330,390" />
          <circle cx="180" cy="240" r="3.5" fill="#fc4a00" />
          <circle cx="330" cy="390" r="3.5" fill="#0284c7" />
        </g>
        <g
          stroke="#003366"
          strokeWidth="1.4"
          fill="none"
          strokeDasharray="320"
          style={{ animation: 'mcu-circuit-draw 3.6s 0.3s ease-out forwards' }}
        >
          <polyline points="1340,220 1210,220 1180,250 1180,360 1050,360" />
          <circle cx="1210" cy="220" r="3.5" fill="#003366" />
          <circle cx="1050" cy="360" r="3.5" fill="#fc4a00" />
        </g>
      </svg>

      {/* 3D Extruded Floating Tech Cubes (100% GPU Composited CSS Keyframe Floating) */}
      {HERO_SYMBOLS.map((s, i) => (
        <div
          key={i}
          className="hidden sm:flex items-center justify-center font-mono absolute rounded-2xl px-3 py-1.5"
          style={{
            top: s.top,
            left: s.left,
            fontSize: s.size,
            color: s.color,
            background: s.bg,
            border: `1.5px solid ${s.border}`,
            boxShadow:
              '0 14px 28px -6px rgba(2, 132, 199, 0.2), inset 0 2px 2px rgba(255,255,255,1), inset 0 -2px 4px rgba(14,165,233,0.2)',
            fontWeight: 800,
            transform: `perspective(600px) rotateY(${s.rot}deg)`,
          }}
        >
          <span className={s.floatClass}>{s.symbol}</span>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   3D ANIMATED STAT COUNTER CARD (3D Sculpted Water-Glass & Pearl)
   ───────────────────────────────────────────────────────────── */
function StatCounterCard({ stat, icon, lang }) {
  const { elementRef, displayValue } = useCountUp(stat.value, 1600);

  return (
    <Tilt3DCard intensity={4.5} className="h-full">
      <div
        ref={elementRef}
        className="mcu-interactive-card h-full relative rounded-2xl p-5 sm:p-6 text-center group overflow-hidden bg-gradient-to-b from-white via-white/95 to-sky-50/80 border border-sky-200/90 shadow-[0_16px_38px_-10px_rgba(2,132,199,0.16),0_4px_12px_-2px_rgba(0,34,68,0.06),inset_0_2px_3px_rgba(255,255,255,1),inset_0_-3px_6px_rgba(14,165,233,0.14)] hover:shadow-[0_22px_48px_-10px_rgba(2,132,199,0.25),inset_0_2px_3px_rgba(255,255,255,1)] border-t-3 border-t-[#003366] hover:border-t-[#fc4a00] transition-[box-shadow,border-color,transform] duration-300"
      >
        {/* Top 3D Water-Glass Gloss Sheen */}
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/80 to-transparent pointer-events-none" />
        <div className="absolute -top-6 -right-6 w-24 h-24 bg-[radial-gradient(circle,rgba(56,189,248,0.15)_0%,transparent_70%)] rounded-full pointer-events-none group-hover:bg-[#fc4a00]/15 transition-colors duration-500" />

        {/* 3D Sculpted Water-Glass Icon Pedestal */}
        <div className="relative z-10 w-13 h-13 mx-auto mb-3.5 rounded-2xl bg-gradient-to-b from-white via-sky-50/90 to-sky-100/80 border border-sky-300/85 flex items-center justify-center group-hover:scale-110 group-hover:-translate-y-0.5 group-hover:border-amber-400/70 transition-all duration-300 shadow-[0_8px_18px_-4px_rgba(2,132,199,0.22),inset_0_2px_2px_rgba(255,255,255,1),inset_0_-2px_4px_rgba(14,165,233,0.18)]">
          {icon}
        </div>

        <div className="relative z-10 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#002244] font-display tracking-tight mb-1 group-hover:text-[#fc4a00] transition-colors drop-shadow-[0_1px_0_rgba(255,255,255,1)]">
          {displayValue}
        </div>

        <div className="relative z-10 text-xs text-slate-600 font-bold uppercase tracking-wider">
          {lang === 'hi' ? stat.hindiLabel : stat.label}
        </div>

        <div className="absolute bottom-0 inset-x-8 h-[2px] bg-gradient-to-r from-transparent via-sky-400/40 to-transparent group-hover:via-[#fc4a00]/70 transition-all duration-500" />
      </div>
    </Tilt3DCard>
  );
}

/* ─────────────────────────────────────────────────────────────
   HERO SECTION (Executive Pearl-White & Royal Heritage Theme)
   ───────────────────────────────────────────────────────────── */
export const HeroSection = ({ onOpenAuth, onSearchQueryChange, searchQuery, onOpenCommandPalette, broadcastNotice = null }) => {
  const { lang, t, portalContent } = useLanguage();
  const [pulseIndex, setPulseIndex] = useState(0);

  const customBroadcastText = broadcastNotice?.enabled
    ? lang === 'hi'
      ? broadcastNotice.textHi || broadcastNotice.textEn
      : broadcastNotice.textEn || broadcastNotice.textHi
    : '';

  const customAchievementText = broadcastNotice?.achievementEnabled
    ? lang === 'hi'
      ? broadcastNotice.achievementTextHi || broadcastNotice.achievementTextEn
      : broadcastNotice.achievementTextEn || broadcastNotice.achievementTextHi
    : '';

  const liveNetworkTicker =
    lang === 'hi'
      ? (portalContent?.heroNetworkTickerHi || `🟢 लाइव नेटवर्क: ${portalContent?.alumniCount || '38,000+'} सत्यापित पूर्व छात्र विश्वभर के मीडिया एवं IT संस्थानों में`)
      : (portalContent?.heroNetworkTickerEn || `🟢 Live Network: ${portalContent?.alumniCount || '38,000+'} Verified Alumni across Global Media & Tech Enterprises`);

  const basePulses =
    lang === 'hi'
      ? [
          liveNetworkTicker,
          '⚡ मेंटरशिप हब: 140+ सीनियर इंजीनियर्स एवं संपादक 1-on-1 मार्गदर्शन हेतु उपलब्ध',
          '✨ अभ्युदय 2026: वार्षिक राष्ट्रीय मीडिया एवं तकनीकी महाकुंभ पंजीकरण प्रारंभ',
        ]
      : [
          liveNetworkTicker,
          '⚡ Mentorship Hub: 140+ Senior Engineers & Editors active for 1-on-1 Guidance',
          '✨ Abhyuday 2026: National Media & Tech Conclave Delegate RSVP Now Open',
        ];

  const livePulses = [
    ...(customBroadcastText ? [`📢 ${customBroadcastText}`] : []),
    ...(customAchievementText ? [`🏆 ${customAchievementText}`] : []),
    ...basePulses,
  ];

  useEffect(() => {
    const id = setInterval(() => {
      setPulseIndex((prev) => (prev + 1) % livePulses.length);
    }, 4200);
    return () => clearInterval(id);
  }, [livePulses.length]);

  const statIcons = [
    <Users key="users" className="w-5 h-5 text-[#fc4a00]" />,
    <Building2 key="building" className="w-5 h-5 text-[#680a13]" />,
    <Award key="award" className="w-5 h-5 text-amber-600" />,
    <Globe2 key="globe" className="w-5 h-5 text-[#003366]" />,
  ];

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="home"
      className="relative pt-20 sm:pt-24 lg:pt-40 pb-5 sm:pb-6 overflow-hidden bg-gradient-to-b from-[#f4faff] via-[#ffffff] to-[#eef5fb] text-slate-900 border-b border-sky-200/80"
    >
      {/* Subtle Architectural Campus Watermark Texture */}
      {heroBg && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage: `url(${heroBg})`,
          }}
        />
      )}

      {/* 3D Floating Tech & Circuit Background (100% GPU Compositor) */}
      <TechBackground3D />

      {/* 3D Daylight Ambient Caustic Orbs (High-Performance Zero-Blur Gradients) */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[460px] bg-[radial-gradient(ellipse_75%_55%_at_50%_0%,rgba(186,230,253,0.55),rgba(254,243,199,0.28)_45%,transparent_80%)] pointer-events-none"
        style={{ zIndex: 2 }}
      />
      <div
        className="absolute top-1/4 left-8 w-96 h-96 bg-[radial-gradient(circle,rgba(56,189,248,0.10)_0%,transparent_70%)] pointer-events-none"
        style={{ zIndex: 2 }}
      />
      <div
        className="absolute top-1/3 right-8 w-88 h-88 bg-[radial-gradient(circle,rgba(252,74,0,0.06)_0%,transparent_70%)] pointer-events-none"
        style={{ zIndex: 2 }}
      />

      {/* Transparent Dual Opposite-Direction Live Marquees (Right below Menu) */}
      {((broadcastNotice?.enabled && customBroadcastText) ||
        (broadcastNotice?.achievementEnabled && customAchievementText)) && (
        <div className="relative z-10 w-full overflow-hidden bg-transparent -mt-1.5 sm:-mt-2 lg:-mt-5 pt-0.5 sm:pt-1 pb-2 sm:pb-2.5 mb-2 sm:mb-3.5 space-y-1.5 select-none">
          {/* 1. Official Notice Marquee (Right -> Left) */}
          {broadcastNotice?.enabled && customBroadcastText && (
            <div className="w-full overflow-hidden py-0.5">
              <div className="mcu-marquee-slow">
                {[0, 1].map((groupIdx) => (
                  <div key={groupIdx} className="flex items-center gap-16 pr-16 shrink-0">
                    {[0, 1].map((itemIdx) => (
                  <div key={itemIdx} className="inline-flex items-center gap-2.5 text-xs sm:text-sm">
                    <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-[#ff6a00] to-[#fc4a00] text-white text-[10px] font-black uppercase tracking-wider shadow-2xs inline-flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      <span>{broadcastNotice.badge || (lang === 'hi' ? 'आधिकारिक सूचना' : 'OFFICIAL NOTICE')}</span>
                    </span>
                    <span className="font-extrabold text-[#003366] tracking-wide drop-shadow-[0_1px_0_rgba(255,255,255,0.95)]">
                      {customBroadcastText}
                    </span>
                    <span className="text-[#fc4a00] font-black">•</span>
                  </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Achievement Notice Marquee (Left -> Right — Opposite Direction) */}
          {broadcastNotice?.achievementEnabled && customAchievementText && (
            <div className="w-full overflow-hidden py-0.5">
              <div className="mcu-marquee-slow-reverse">
                {[0, 1].map((groupIdx) => (
                  <div key={groupIdx} className="flex items-center gap-16 pr-16 shrink-0">
                    {[0, 1].map((itemIdx) => (
                  <div key={itemIdx} className="inline-flex items-center gap-2.5 text-xs sm:text-sm">
                    <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-[#003366] via-[#0369a1] to-[#0284c7] text-white text-[10px] font-black uppercase tracking-wider shadow-2xs inline-flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse" />
                      <span>
                        🏆{' '}
                        {broadcastNotice.achievementBadge ||
                          (lang === 'hi' ? 'गौरवपूर्ण उपलब्धि' : 'ALUMNI ACHIEVEMENT')}
                      </span>
                    </span>
                    <span className="font-extrabold text-[#0f172a] tracking-wide drop-shadow-[0_1px_0_rgba(255,255,255,0.95)]">
                      {customAchievementText}
                    </span>
                    <span className="text-[#0284c7] font-black">★</span>
                  </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Official MCU Crest & Heritage Badge — Autonomous 3D Royal Medallion */}
        <div className="flex flex-col items-center justify-center mb-4 text-center">
          <div
            className="relative mb-5 group flex items-center justify-center"
            style={{ perspective: '900px', transformStyle: 'preserve-3d' }}
          >
            {/* Breathing Water-Glass & Saffron-Gold Royal Aura */}
            <div className="mcu-logo-aura absolute -inset-4 rounded-full bg-gradient-to-tr from-sky-300/35 via-amber-300/25 to-[#fc4a00]/20 blur-xl pointer-events-none" />

            {/* Outer Clockwise 3D Sacred Orbital Ring + Glowing Saffron Node */}
            <div className="mcu-logo-orbit-ring absolute -inset-3 sm:-inset-3.5 rounded-full border border-dashed border-[#0284c7]/35 pointer-events-none">
              <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-gradient-to-r from-[#fc4a00] to-amber-400 shadow-[0_0_8px_rgba(252,74,0,0.7)]" />
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#0284c7] shadow-[0_0_6px_rgba(2,132,199,0.6)]" />
            </div>

            {/* Inner Counter-Rotating 3D Tilted Orbital Ring */}
            <div className="mcu-logo-orbit-ring-reverse absolute -inset-1.5 rounded-full border border-[#fc4a00]/35 pointer-events-none">
              <span className="absolute top-1/2 -right-1 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#fc4a00] shadow-[0_0_6px_#fc4a00]" />
            </div>

            {/* Pure Frameless 3D Floating MCU Crest */}
            <div
              className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <img
                src="/mcu-logo.png"
                alt="Makhanlal Chaturvedi National University Official Crest"
                className="mcu-logo-3d-alive w-full h-full object-contain relative z-10"
              />
            </div>

            {/* Floating 3D ESTD 1990 Pill */}
            <span className="mcu-logo-badge-3d absolute -bottom-1.5 -right-2 z-30 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-b from-[#ff6a00] via-[#fc4a00] to-[#680a13] text-white border border-amber-200/90 shadow-[0_6px_14px_rgba(104,10,19,0.32),inset_0_1px_1px_rgba(255,255,255,0.6)]">
              ESTD 1990
            </span>
          </div>

          {/* 3D Royal Heritage Seal Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-gradient-to-b from-[#003d7a] via-[#002855] to-[#680a13] border border-sky-300/50 text-xs text-amber-100 shadow-[0_10px_24px_-6px_rgba(0,34,68,0.32),inset_0_1.5px_2px_rgba(255,255,255,0.45)]">
            <Feather className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="font-semibold tracking-wide">{t.hero.badge}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#fc4a00] animate-pulse" />
            <span className="text-amber-100/95 hidden sm:inline">
              {lang === 'hi' ? 'राष्ट्रकवि पं. माखनलाल चतुर्वेदी की पावन स्मृति' : 'Pt. Makhanlal Chaturvedi Legacy'}
            </span>
          </div>

          {/* Live Institutional Momentum Ticker on 3D Water-Glass Capsule */}
          <div className="mt-2 inline-flex items-center gap-2 px-4 py-1 rounded-full bg-gradient-to-b from-white via-sky-50/90 to-sky-100/80 border border-sky-300/85 text-[11px] text-[#002855] shadow-[0_6px_16px_-4px_rgba(2,132,199,0.18),inset_0_2px_2px_rgba(255,255,255,1),inset_0_-2px_4px_rgba(14,165,233,0.15)]">
            <span
              key={pulseIndex}
              className="transition-all duration-500 animate-fadeIn font-bold tracking-wide"
            >
              {livePulses[pulseIndex]}
            </span>
          </div>
        </div>

        {/* Cinematic Editorial Headline on Pearl-White & Water-Glass Canvas */}
        <div className="text-center max-w-4xl mx-auto">
          <div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] mb-2.5">
              <span className="block text-[#003366]/80 font-bold text-lg sm:text-2xl md:text-3xl mb-0.5 font-sans tracking-normal drop-shadow-[0_1px_0_rgba(255,255,255,1)]">
                {t.hero.titlePrefix}
              </span>
              <span className="font-editorial text-transparent bg-clip-text bg-gradient-to-r from-[#002244] via-[#8d0303] to-[#fc4a00] drop-shadow-[0_4px_14px_rgba(0,34,68,0.08)]">
                {t.hero.titleHighlight}
              </span>
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-slate-600 max-w-2xl mx-auto mb-5 leading-snug font-medium">
              {t.hero.description}
            </p>
          </div>

          {/* 3D Sculpted Action CTAs Hierarchy */}
          <div>
            <div className="flex flex-wrap items-center justify-center gap-3.5 mb-6">
              <button
                onClick={() => scrollTo('directory')}
                className="px-6 py-3 rounded-xl bg-gradient-to-b from-[#ff6a00] via-[#fc4a00] to-[#b91c1c] text-white border border-amber-300/70 text-xs sm:text-sm shadow-[0_10px_24px_-4px_rgba(252,74,0,0.42),inset_0_2px_2px_rgba(255,255,255,0.6),inset_0_-2px_4px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 hover:brightness-105 flex items-center gap-2 cursor-pointer font-bold tracking-wide active:scale-97 transition-all duration-200"
              >
                <span>{t.hero.ctaPrimary}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onOpenAuth('register')}
                className="px-6 py-3 rounded-xl bg-gradient-to-b from-white via-sky-50/90 to-sky-100/80 hover:from-[#003366] hover:via-[#002855] hover:to-[#001d3d] text-[#003366] hover:text-white border border-sky-300/90 hover:border-[#003366] text-xs sm:text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 flex items-center gap-2 shadow-[0_10px_24px_-4px_rgba(2,132,199,0.2),inset_0_2px_2px_rgba(255,255,255,1),inset_0_-2px_4px_rgba(14,165,233,0.18)] cursor-pointer active:scale-97 group"
              >
                <ShieldCheck className="w-4 h-4 text-[#fc4a00] group-hover:text-amber-300 transition-colors" />
                <span>{t.hero.ctaSecondary}</span>
              </button>

              <button
                onClick={() => scrollTo('mentorship')}
                className="px-6 py-3 rounded-xl bg-gradient-to-b from-[#8d0303] via-[#680a13] to-[#4a0404] text-white border border-amber-300/50 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-[0_10px_24px_-4px_rgba(104,10,19,0.35),inset_0_2px_2px_rgba(255,255,255,0.45),inset_0_-2px_4px_rgba(0,0,0,0.25)] hover:-translate-y-0.5 hover:brightness-110 cursor-pointer active:scale-97 transition-all duration-200"
              >
                <Compass className="w-4 h-4 text-amber-300" />
                <span>{t.hero.ctaMentor}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Real-Time Animated University Stats (3D Water-Glass Tilt Grid) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 max-w-5xl mx-auto">
          {universityInfo.stats.map((stat, index) => (
            <StatCounterCard key={stat.id} stat={stat} icon={statIcons[index]} lang={lang} />
          ))}
        </div>
      </div>
    </section>
  );
};
