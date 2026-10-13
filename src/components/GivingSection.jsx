import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { givingInitiatives } from '../data/mockData';
import { Heart, Users, Sparkles, TrendingUp } from 'lucide-react';
import { ScrollReveal, Tilt3DCard } from './ScrollReveal';

function GivingCard({ item, lang, t, onSelectInitiative, index = 0 }) {
  const [animatedWidth, setAnimatedWidth] = useState(0);
  const cardRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setTimeout(() => {
            setAnimatedWidth(item.percentage);
          }, 150);
        }
      },
      { threshold: 0.25 }
    );

    const el = cardRef.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
    };
  }, [item.percentage]);

  return (
    <ScrollReveal variant="tilt-in" delay={index * 95}>
      <Tilt3DCard intensity={8} className="h-full">
        <div
          ref={cardRef}
          className="mcu-interactive-card h-full bg-white rounded-3xl p-6 sm:p-7 border border-sky-200/90 border-t-4 border-t-sky-600 shadow-sm hover:border-t-[#fc4a00] flex flex-col justify-between group relative overflow-hidden"
        >
          <div className="pointer-events-none absolute inset-x-6 top-0 h-[28%] bg-gradient-to-b from-white/95 to-transparent rounded-b-full" />
          <div className="relative z-10">
            <div className="flex items-center justify-between gap-2 mb-3.5">
              <span className="px-3 py-1 rounded-full bg-gradient-to-b from-white to-sky-100/80 text-sky-800 text-xs font-extrabold border border-sky-300/85 shadow-2xs flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-sky-600" />
                <span>{item.percentage}% Funded</span>
              </span>
              <span className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-sky-500" />
                <span>{item.donorsCount} Donors</span>
              </span>
            </div>

            <h3 className="text-lg font-bold text-[#003366] group-hover:text-sky-600 transition-colors mb-2 font-editorial">
              {lang === 'hi' ? item.hindiTitle : item.title}
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed mb-5 font-normal">
              {item.description}
            </p>

            {/* 3D Recessed Water-Glass Progress Bar */}
            <div className="space-y-1.5 mb-5">
              <div className="w-full bg-gradient-to-b from-sky-100/90 to-slate-200/80 rounded-full h-2.5 overflow-hidden p-0.5 border border-sky-200/90 shadow-[inset_0_2px_3px_rgba(2,132,199,0.16)]">
                <div
                  className="bg-gradient-to-r from-sky-500 via-blue-600 to-[#fc4a00] h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(14,165,233,0.45)]"
                  style={{ width: `${animatedWidth}%` }}
                />
              </div>
              <div className="flex justify-between text-xs font-bold pt-0.5">
                <span className="text-[#003366] font-display">Raised: {item.raisedAmount}</span>
                <span className="text-slate-500 font-display">Goal: {item.targetAmount}</span>
              </div>
            </div>

            {/* 3D Water-Glass Impact Note */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-b from-white via-[#f8fbff] to-sky-50/75 border border-sky-200/90 shadow-[inset_0_1.5px_1px_rgba(255,255,255,1)] text-[11px] text-slate-700 font-medium flex items-start gap-2.5 mb-5">
              <Sparkles className="w-3.5 h-3.5 text-[#fc4a00] shrink-0 mt-0.5" />
              <span className="leading-relaxed">{item.impact}</span>
            </div>
          </div>

          <button
            onClick={() => onSelectInitiative(item)}
            className="relative z-10 w-full py-3 rounded-xl btn-mcu-saffron text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Heart className="w-4 h-4 fill-white" />
            <span>{t.actions.donateNow}</span>
          </button>
        </div>
      </Tilt3DCard>
    </ScrollReveal>
  );
}

export const GivingSection = ({ onDonate, onSelectInitiative }) => {
  const { lang, t } = useLanguage();
  const handleSelect = onSelectInitiative || onDonate;

  return (
    <section id="giving" className="py-20 relative z-10 bg-gradient-to-b from-white/95 via-[#f8fbff]/95 to-white/95 border-t border-sky-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <ScrollReveal variant="fade-up">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-b from-white via-sky-50 to-sky-100/90 text-[#0c4a6e] border border-sky-300/90 text-xs font-extrabold mb-3.5 shadow-[0_8px_20px_-4px_rgba(2,132,199,0.18),inset_0_1.5px_1px_rgba(255,255,255,1)]">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>{lang === 'hi' ? 'सहयोग एवं संबल' : 'Alma Mater Giving & Endowments'}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#003366] tracking-tight font-editorial">
              {t.sections.givingTitle}
            </h2>
            <p className="mt-1.5 text-sm sm:text-base text-slate-600 font-normal max-w-2xl mx-auto leading-relaxed">
              {t.sections.givingSubtitle}
            </p>
          </div>
        </ScrollReveal>

        {/* Initiatives Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {givingInitiatives.map((item, idx) => (
            <GivingCard
              key={item.id}
              index={idx}
              item={item}
              lang={lang}
              t={t}
              onSelectInitiative={handleSelect}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
