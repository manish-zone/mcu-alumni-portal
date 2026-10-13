import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getProfileSkills } from '../utils/skills';
import {
  Compass,
  Tv,
  FileText,
  Sparkles,
  Megaphone,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { ScrollReveal, Tilt3DCard } from './ScrollReveal';

export const MentorshipSection = ({ profiles = [], onRequestMentorship }) => {
  const { lang, t } = useLanguage();

  const activeMentors = profiles.filter((p) => p.openToMentor || p.open_to_mentor);
  const mentorPool = activeMentors.length > 0 ? activeMentors : profiles;
  const mentors = mentorPool.length >= 10 ? mentorPool.slice(6, 10) : mentorPool.slice(0, 4);

  const getInitials = (name = '') => {
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'MC';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const pillars = [
    {
      icon: <Sparkles className="w-5 h-5 text-[#003366]" />,
      title: lang === 'hi' ? 'फुल-स्टैक व सॉफ्टवेयर इंजीनियरिंग' : 'Full-Stack & Software Engineering',
      desc: lang === 'hi' ? 'रिएक्ट, नोड.जेएस, सिस्टम डिज़ाइन, माइक्रोसर्विसेज़ एवं हाई-स्केल वेब आर्किटेक्चर' : 'React, Node.js, system design, microservices, and scalable web architectures.',
    },
    {
      icon: <Tv className="w-5 h-5 text-[#680a13]" />,
      title: lang === 'hi' ? 'एआई, डेटा साइंस व मशीन लर्निंग' : 'AI, Data Science & Machine Learning',
      desc: lang === 'hi' ? 'पाइथन, जनरेटिव एआई (LLMs), डीप लर्निंग एवं डेटा एनालिटिक्स पाइपलाइन' : 'Python, Generative AI & LLMs, deep learning models, and production MLOps.',
    },
    {
      icon: <FileText className="w-5 h-5 text-[#fc4a00]" />,
      title: lang === 'hi' ? 'क्लाउड, डेवऑप्स व साइबर सुरक्षा' : 'Cloud, DevOps & Cybersecurity',
      desc: lang === 'hi' ? 'एडब्ल्यूएस, डॉकर, कुबेरनेट्स, सीआई/सीडी ऑटोमेशन एवं नेटवर्क सुरक्षा' : 'AWS/Azure cloud architecture, Docker, Kubernetes, CI/CD, and InfoSec.',
    },
    {
      icon: <Megaphone className="w-5 h-5 text-amber-600" />,
      title: lang === 'hi' ? 'डीएसए, कोडिंग व टेक प्लेसमेंट' : 'DSA, Coding & Tech Placements',
      desc: lang === 'hi' ? 'डेटा स्ट्रक्चर, एल्गोरिदम, मॉक इंटरव्यू एवं टॉप आईटी/प्रोडक्ट कंपनियों में करियर' : 'Data structures & algorithms, mock coding interviews, and Tier-1 product tech roles.',
    },
  ];

  return (
    <section id="mentorship" className="py-20 relative z-10 bg-gradient-to-b from-white/95 via-[#f8fbff]/95 to-white/95 border-t border-sky-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <ScrollReveal variant="fade-up">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-b from-white via-sky-50 to-sky-100/90 text-[#0c4a6e] border border-sky-300/90 text-xs font-extrabold mb-3.5 shadow-[0_8px_20px_-4px_rgba(2,132,199,0.18),inset_0_1.5px_1px_rgba(255,255,255,1)]">
              <Compass className="w-3.5 h-3.5 text-sky-600" />
              <span>{lang === 'hi' ? 'मार्गदर्शन पहल' : 'One-on-One Mentorship Initiative'}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#003366] tracking-tight font-editorial">
              {t.sections.mentorshipTitle}
            </h2>
            <p className="mt-1.5 text-sm sm:text-base text-slate-600 font-normal max-w-2xl mx-auto leading-relaxed">
              {t.sections.mentorshipSubtitle}
            </p>
          </div>
        </ScrollReveal>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
          {pillars.map((pillar, idx) => (
            <ScrollReveal key={idx} variant="tilt-in" delay={idx * 80}>
              <Tilt3DCard intensity={8} className="h-full">
                <div className="mcu-card-editorial mcu-interactive-card h-full p-5 rounded-2xl relative overflow-hidden">
                  <div className="pointer-events-none absolute inset-x-4 top-0 h-[35%] bg-gradient-to-b from-white/90 to-transparent rounded-b-full" />
                  <div className="relative z-10 w-11 h-11 rounded-xl bg-gradient-to-b from-white via-sky-50 to-sky-100/85 flex items-center justify-center mb-3.5 border border-sky-200/95 shadow-[0_6px_14px_-3px_rgba(2,132,199,0.16),inset_0_1.5px_1px_rgba(255,255,255,1)]">
                    {pillar.icon}
                  </div>
                  <h3 className="relative z-10 text-sm font-bold text-[#003366] mb-1.5 font-editorial tracking-tight">
                    {pillar.title}
                  </h3>
                  <p className="relative z-10 text-xs text-slate-600 leading-relaxed font-normal">
                    {pillar.desc}
                  </p>
                </div>
              </Tilt3DCard>
            </ScrollReveal>
          ))}
        </div>

        {/* Featured Mentors Section */}
        <div>
          <ScrollReveal variant="fade-up">
            <div className="flex items-center justify-between mb-6 pb-2.5 border-b border-sky-200/80">
              <h3 className="text-lg font-bold text-[#003366] font-editorial flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-gradient-to-b from-white to-sky-100 border border-sky-200 shadow-2xs">
                  <UserCheck className="w-4 h-4 text-sky-600" />
                </span>
                <span>
                  {lang === 'hi'
                    ? 'सक्रिय पूर्व छात्र मेंटर्स (Alumni Mentorship Hub)'
                    : 'Alumni Mentorship Hub — Featured Mentors'}
                </span>
              </h3>
              <a
                href="#directory"
                className="text-xs text-sky-700 hover:text-[#fc4a00] font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>{lang === 'hi' ? 'सभी मेंटर्स देखें' : 'View all mentors'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {mentors.map((mentor, idx) => {
              const displayName =
                lang === 'hi' && (mentor.hindiName || mentor.hindi_name)
                  ? mentor.hindiName || mentor.hindi_name
                  : mentor.name || mentor.full_name || 'MCU Alumnus';
              const roleText = mentor.currentRole || mentor.current_role || 'Software Engineer';
              const companyText = mentor.company || 'MCU Alumnus';
              const avatarSrc = mentor.avatar || mentor.avatar_url || '';
              const focusTopics =
                Array.isArray(mentor.mentorshipTopics) && mentor.mentorshipTopics.length > 0
                  ? mentor.mentorshipTopics
                  : getProfileSkills(mentor);

              return (
                <ScrollReveal key={mentor.id || idx} variant="tilt-in" delay={idx * 85}>
                  <Tilt3DCard intensity={8} className="h-full">
                    <div className="mcu-interactive-card h-full bg-white rounded-2xl p-5 border border-sky-200/85 shadow-sm flex flex-col justify-between group">
                      <div>
                        <div className="flex items-start gap-3.5 mb-3.5">
                          <div className="relative shrink-0 p-1 rounded-2xl bg-gradient-to-b from-white via-sky-50 to-sky-100/80 border border-sky-200/90 shadow-[0_6px_14px_-4px_rgba(2,132,199,0.2),inset_0_1.5px_1px_rgba(255,255,255,1)]">
                            {avatarSrc ? (
                              <img
                                src={avatarSrc}
                                alt={displayName}
                                loading="lazy"
                                decoding="async"
                                className="w-13 h-13 rounded-xl object-cover border border-sky-100 group-hover:scale-102 transition-all"
                              />
                            ) : (
                              <div className="w-13 h-13 rounded-xl bg-gradient-to-br from-sky-500 via-blue-600 to-[#003366] text-white font-bold text-sm flex items-center justify-center border border-white/80">
                                {getInitials(displayName)}
                              </div>
                            )}
                            <span
                              className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-xs"
                              title="Available for 1:1 Session"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                Active
                              </span>
                              {(mentor.batch || mentor.batch_year) && (
                                <span className="text-[10px] font-semibold text-slate-500">
                                  • Batch {mentor.batch || mentor.batch_year}
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-bold text-[#003366] truncate font-editorial group-hover:text-sky-600 transition-colors">
                              {displayName}
                            </h4>
                            <p className="text-xs text-sky-700 truncate font-bold">{roleText}</p>
                            <p className="text-[11px] text-[#680a13] truncate font-bold">
                              {companyText}
                            </p>
                          </div>
                        </div>

                        <div className="mb-4 pt-2.5 border-t border-sky-100">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5 tracking-wider">
                            {lang === 'hi' ? 'विशेषज्ञता विषय:' : 'Focus Expertise:'}
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {focusTopics.slice(0, 2).map((topic, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-0.5 rounded-lg text-[10px] bg-gradient-to-b from-white to-sky-50/80 text-[#0c4a6e] font-semibold truncate max-w-full border border-sky-200/85 shadow-2xs"
                              >
                                {topic}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          onRequestMentorship({
                            ...mentor,
                            name: displayName,
                            currentRole: roleText,
                            mentorshipTopics: focusTopics,
                          })
                        }
                        className="w-full py-2.5 rounded-xl btn-mcu-saffron text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Compass className="w-3.5 h-3.5" />
                        <span>{t.actions.requestMentorship}</span>
                      </button>
                    </div>
                  </Tilt3DCard>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
