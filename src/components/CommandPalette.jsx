import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Users,
  Briefcase,
  Compass,
  Calendar,
  Sparkles,
  Globe,
  ArrowRight,
  UserPlus,
  Building2,
  MapPin,
  Command,
  CornerDownLeft,
  CheckCircle2,
  Layers,
  X,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { alumniProfiles } from '../data/mockData';

export function CommandPalette({
  isOpen,
  onClose,
  alumniList = [],
  jobs = [],
  onSelectAlumni,
  onApplyJob,
  onOpenAuth,
  onSearchDirectory,
}) {
  const { lang, toggleLanguage } = useLanguage();
  const [query, setQuery] = useState('');
  const [activeScope, setActiveScope] = useState('all'); // 'all' | 'alumni' | 'jobs' | 'actions'
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Merge live DB alumni with curated mock profiles for rich instant search
  const allAlumni = useMemo(() => {
    const map = new Map();
    [...alumniList, ...alumniProfiles].forEach((p) => {
      if (!p) return;
      const key = p.email || p.id || p.name;
      if (key && !map.has(key)) {
        map.set(key, p);
      }
    });
    return Array.from(map.values());
  }, [alumniList]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveScope('all');
      setSelectedIndex(0);
      const t = setTimeout(() => {
        inputRef.current?.focus();
      }, 40);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Build unified command + search results list
  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const results = [];

    // 1. Matching Alumni
    if (activeScope === 'all' || activeScope === 'alumni') {
      const matchedAlumni = allAlumni
        .filter((a) => {
          if (!q) return true;
          const name = (a.name || a.full_name || '').toLowerCase();
          const company = (a.company || '').toLowerCase();
          const role = (a.currentRole || a.current_role || '').toLowerCase();
          const dept = (a.department || '').toLowerCase();
          const loc = (a.location || '').toLowerCase();
          const batch = String(a.batch || a.batch_year || '');
          return (
            name.includes(q) ||
            company.includes(q) ||
            role.includes(q) ||
            dept.includes(q) ||
            loc.includes(q) ||
            batch.includes(q)
          );
        })
        .slice(0, activeScope === 'alumni' ? 12 : q ? 6 : 5);

      matchedAlumni.forEach((a) => {
        const name = a.name || a.full_name || 'MCU Alumnus';
        const role = a.currentRole || a.current_role || 'Media & Tech Professional';
        const company = a.company || 'MCU Network';
        const batch = a.batch || a.batch_year || '2018';
        const location = a.location || a.campus || 'Bhopal';
        results.push({
          id: `alumni-${a.id || name}`,
          type: 'alumni',
          category: lang === 'hi' ? 'सत्यापित पूर्व छात्र एवं मेंटर्स' : 'Verified Alumni & Mentors',
          title: name,
          roleText: role,
          companyText: company,
          locationText: location,
          subtitle: `${role} • ${company}`,
          badge: a.mentorshipAvailable ? (lang === 'hi' ? 'मेंटर उपलब्ध' : 'Mentor') : `Batch ${batch}`,
          badgeColor: a.mentorshipAvailable
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-[#003366]/[0.06] text-[#003366] border-[#003366]/15',
          ctaLabel: lang === 'hi' ? 'प्रोफाइल देखें' : 'View Profile',
          avatar: a.avatar || a.avatar_url,
          verified: true,
          icon: <Users className="w-4 h-4 text-[#003366]" />,
          action: () => {
            onClose();
            if (onSelectAlumni) onSelectAlumni(a);
          },
        });
      });
    }

    // 2. Matching Jobs
    if (activeScope === 'all' || activeScope === 'jobs') {
      const matchedJobs = jobs
        .filter((j) => {
          if (!q) return true;
          return (
            (j.title || '').toLowerCase().includes(q) ||
            (j.company || '').toLowerCase().includes(q) ||
            (j.location || '').toLowerCase().includes(q)
          );
        })
        .slice(0, activeScope === 'jobs' ? 6 : q ? 4 : 2);

      matchedJobs.forEach((j) => {
        results.push({
          id: `job-${j.id}`,
          type: 'job',
          category: lang === 'hi' ? 'कैरियर एवं रेफरल अवसर' : 'Career & Job Referrals',
          title: j.title,
          roleText: j.company || 'MCU Alumni Referral',
          companyText: j.location || 'Bhopal / Remote',
          subtitle: `${j.company} • ${j.location || 'Remote / Bhopal'}`,
          badge: j.salary || j.type || 'Referral',
          badgeColor: 'bg-amber-50 text-amber-800 border-amber-200/90',
          ctaLabel: lang === 'hi' ? 'आवेदन करें' : 'Apply',
          icon: <Briefcase className="w-4 h-4 text-[#fc4a00]" />,
          action: () => {
            onClose();
            if (onApplyJob) {
              onApplyJob(j);
            } else {
              document.getElementById('jobs')?.scrollIntoView({ behavior: 'smooth' });
            }
          },
        });
      });
    }

    // 3. Quick Navigation & Platform Commands
    if (activeScope === 'all' || activeScope === 'actions') {
      const quickCommands = [
        {
          id: 'nav-directory',
          type: 'action',
          category: lang === 'hi' ? 'त्वरित पोर्टल कमांड्स' : 'Quick Navigation & Actions',
          title: lang === 'hi' ? 'पूर्व छात्र निर्देशिका (Alumni Directory) खोलें' : 'Explore Alumni Directory',
          subtitle: lang === 'hi' ? 'बैच, कंपनी और शहर के अनुसार खोजें' : 'Filter 38,000+ alumni by batch, company, skill & city',
          badge: 'Directory',
          badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
          ctaLabel: lang === 'hi' ? 'खोलें' : 'Jump',
          icon: <Users className="w-4 h-4 text-[#003366]" />,
          keywords: 'directory alumni search batch',
          action: () => {
            onClose();
            if (q && onSearchDirectory) onSearchDirectory(query);
            document.getElementById('directory')?.scrollIntoView({ behavior: 'smooth' });
          },
        },
        {
          id: 'nav-mentorship',
          type: 'action',
          category: lang === 'hi' ? 'त्वरित पोर्टल कमांड्स' : 'Quick Navigation & Actions',
          title: lang === 'hi' ? 'मेंटरशिप हब (1-on-1 Mentorship)' : '1-on-1 Alumni Mentorship Hub',
          subtitle: lang === 'hi' ? 'सीनियर पत्रकारों और इंजीनियर्स से मार्गदर्शन लें' : 'Book career guidance sessions with senior alumni',
          badge: 'Mentorship',
          badgeColor: 'bg-purple-50 text-[#680a13] border-purple-200',
          ctaLabel: lang === 'hi' ? 'खोलें' : 'Jump',
          icon: <Compass className="w-4 h-4 text-[#680a13]" />,
          keywords: 'mentor mentorship guidance career',
          action: () => {
            onClose();
            document.getElementById('mentorship')?.scrollIntoView({ behavior: 'smooth' });
          },
        },
        {
          id: 'nav-events',
          type: 'action',
          category: lang === 'hi' ? 'त्वरित पोर्टल कमांड्स' : 'Quick Navigation & Actions',
          title: lang === 'hi' ? 'अभ्युदय 2026 एवं पूर्व छात्र सम्मेलन' : 'Abhyuday 2026 & Alumni Events',
          subtitle: lang === 'hi' ? 'वार्षिक मीडिया एवं टेक महाकुंभ में RSVP करें' : 'RSVP for upcoming conclaves & Silver Jubilee meets',
          badge: 'Abhyuday 2026',
          badgeColor: 'bg-orange-50 text-[#fc4a00] border-orange-200',
          ctaLabel: 'RSVP',
          icon: <Calendar className="w-4 h-4 text-[#fc4a00]" />,
          keywords: 'events abhyuday rsvp reunion',
          action: () => {
            onClose();
            document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' });
          },
        },
        {
          id: 'act-register',
          type: 'action',
          category: lang === 'hi' ? 'त्वरित पोर्टल कमांड्स' : 'Quick Navigation & Actions',
          title: lang === 'hi' ? 'नया पूर्व छात्र पंजीकरण (Alumni Registration)' : 'Register as Verified Alumnus',
          subtitle: lang === 'hi' ? 'आधिकारिक MCU पोर्टल से जुड़ें' : 'Join the official MCU Bhopal alumni network',
          badge: 'Portal Auth',
          badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          ctaLabel: lang === 'hi' ? 'जुड़ें' : 'Join',
          icon: <UserPlus className="w-4 h-4 text-emerald-600" />,
          keywords: 'register signup login join',
          action: () => {
            onClose();
            if (onOpenAuth) onOpenAuth('register');
          },
        },
        {
          id: 'act-lang',
          type: 'action',
          category: lang === 'hi' ? 'त्वरित पोर्टल कमांड्स' : 'Quick Navigation & Actions',
          title: lang === 'hi' ? 'भाषा बदलें: Switch to English' : 'Switch Language: हिंदी में देखें',
          subtitle: lang === 'hi' ? 'द्विभाषी इंटरफ़ेस (Bilingual Mode)' : 'Instant bilingual portal switch (HI / EN)',
          badge: lang === 'hi' ? 'EN' : 'हिंदी',
          badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
          ctaLabel: 'Switch',
          icon: <Globe className="w-4 h-4 text-amber-600" />,
          keywords: 'language hindi english translate',
          action: () => {
            toggleLanguage();
            onClose();
          },
        },
      ];

      quickCommands.forEach((cmd) => {
        if (
          !q ||
          cmd.title.toLowerCase().includes(q) ||
          cmd.subtitle.toLowerCase().includes(q) ||
          cmd.keywords.includes(q)
        ) {
          results.push(cmd);
        }
      });
    }

    return results;
  }, [query, activeScope, allAlumni, jobs, lang, onClose, onSelectAlumni, onApplyJob, onOpenAuth, onSearchDirectory, toggleLanguage]);

  // Reset selectedIndex when items or filter change
  useEffect(() => {
    setSelectedIndex(0);
  }, [items.length, query, activeScope]);

  // Keyboard navigation inside modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (items.length > 0 ? (prev + 1) % items.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (items.length > 0 ? (prev - 1 + items.length) % items.length : 0));
      } else if (e.key === 'Enter' && items[selectedIndex]) {
        e.preventDefault();
        items[selectedIndex].action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, items, selectedIndex, onClose]);

  // Keep active keyboard-selected item visible inside scrollable list
  useEffect(() => {
    if (!isOpen || !listRef.current) return;
    const activeEl = listRef.current.querySelector(`[data-cmd-idx="${selectedIndex}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex, isOpen]);

  if (!isOpen) return null;

  const scopes = [
    { id: 'all', label: lang === 'hi' ? 'सभी (All)' : 'All Results' },
    { id: 'alumni', label: lang === 'hi' ? 'पूर्व छात्र (Alumni)' : 'Alumni & Mentors' },
    { id: 'jobs', label: lang === 'hi' ? 'जॉब्स (Jobs)' : 'Jobs & Referrals' },
    { id: 'actions', label: lang === 'hi' ? 'शॉर्टकट्स (Shortcuts)' : 'Quick Actions' },
  ];

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-2.5 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="MCU Spotlight Command Palette"
    >
      {/* Executive Deep Navy Glass Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/65 backdrop-blur-md mcu-backdrop-enter"
      />

      {/* Enterprise 3D Water-Glass Command Center Modal */}
      <div
        className="mcu-animated-border-modal mcu-modal-spring-enter relative w-full max-w-3xl h-[86vh] sm:h-[85vh] max-h-[720px] min-h-[460px] flex flex-col rounded-[28px] bg-gradient-to-b from-white/96 via-[#f8fbff]/96 to-white/96 backdrop-blur-3xl border-[1.5px] border-sky-300/85 shadow-[0_32px_84px_-12px_rgba(2,132,199,0.28),0_16px_36px_-8px_rgba(15,23,42,0.12),inset_0_2px_3px_rgba(255,255,255,1),inset_0_-3px_6px_rgba(14,165,233,0.14)] overflow-hidden z-10"
      >
        {/* Professional Institutional Header — Matched with AuthModal */}
        <div className="relative bg-gradient-to-r from-[#001a35] via-[#002855] to-[#001e3d] px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between shrink-0 overflow-hidden">
          {/* Animated top saffron-gold-cyan ribbon */}
          <div className="absolute inset-x-0 top-0 h-[3px] mcu-accent-bar-animated" />
          {/* Ambient radial water-glass glow */}
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-sky-400/15 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-[#fc4a00]/15 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex items-center gap-3.5 min-w-0">
            {/* Official MCU Crest — Transparent background, larger size */}
            <div className="relative w-12 h-12 sm:w-14 sm:h-14 shrink-0 flex items-center justify-center">
              <div className="mcu-logo-aura absolute -inset-1 rounded-full bg-gradient-to-tr from-sky-400/25 via-amber-400/15 to-[#fc4a00]/25 blur-md pointer-events-none" />
              <img
                src="/mcu-logo.png"
                alt="MCU Bhopal Crest"
                className="mcu-logo-nav-alive relative z-10 w-full h-full object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.45)]"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>

            {/* University name + live badge + Spotlight title */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-[10px] sm:text-[11px] font-bold tracking-[0.08em] uppercase text-sky-200/90 leading-tight truncate">
                  {lang === 'hi' ? 'माखनलाल चतुर्वेदी राष्ट्रीय वि.वि., भोपाल' : 'Makhanlal Chaturvedi University · Bhopal'}
                </p>
                <span className="hidden min-[440px]:inline-flex items-center px-1.5 py-0.5 text-[8.5px] font-black uppercase tracking-wider bg-gradient-to-b from-[#ff6a00] to-[#fc4a00] text-white rounded-full border border-amber-300/60 shadow-2xs shrink-0">
                  ESTD 1990
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <h3 className="text-[15px] sm:text-[17px] font-bold text-white font-editorial leading-snug tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)] truncate">
                  {lang === 'hi' ? 'एमसीयू स्पॉटलाइट कमांड सेंटर' : 'MCU Spotlight Command Center'}
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-[10px] font-bold text-emerald-300 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)] animate-pulse" />
                  <span>{items.length} {lang === 'hi' ? 'परिणाम' : 'results'}</span>
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="relative z-10 w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/10 hover:bg-red-500/90 text-white/80 hover:text-white border border-white/20 hover:border-red-400 flex items-center justify-center transition-all duration-200 hover:rotate-90 cursor-pointer shrink-0"
            aria-label="Close Spotlight"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 sm:px-5 py-2.5 sm:py-3 border-b border-sky-200/80 bg-white/95 shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-r from-[#8d0303] to-[#fc4a00] ring-2 ring-amber-300 flex items-center justify-center text-white shadow-md shadow-red-950/20 shrink-0">
            <Search className="w-4 h-4 text-white" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              lang === 'hi'
                ? 'पूर्व छात्र, कंपनी (Google, NDTV), जॉब्स या सेक्शन खोजें...'
                : 'Search alumni, companies (Google, NDTV), jobs, or jump to section...'
            }
            className="w-full bg-transparent text-sm sm:text-[15px] text-slate-900 placeholder-slate-400 font-semibold focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-[11px] font-bold text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              {lang === 'hi' ? 'साफ़ करें' : 'Clear'}
            </button>
          )}
          <button
            onClick={onClose}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-b from-white to-sky-50 hover:to-sky-100 text-slate-600 hover:text-sky-900 border border-sky-200/90 shadow-2xs transition-colors cursor-pointer shrink-0"
            title="Close (Esc)"
          >
            <span className="text-[10px] font-mono font-bold">ESC</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Single-Line Scope Filter Tabs + Quick Trending Tags Bar */}
        <div className="px-4 sm:px-5 py-2 bg-gradient-to-b from-[#f0f9ff]/90 to-sky-50/70 border-b border-sky-200/80 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none shrink-0">
          {/* Category Scope Pills */}
          <div className="flex items-center gap-1.5 shrink-0">
            {scopes.map((s) => {
              const active = activeScope === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveScope(s.id)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 border ${
                    active
                      ? 'bg-gradient-to-b from-sky-500 via-blue-600 to-[#003366] text-white border-sky-300 shadow-[0_4px_12px_-2px_rgba(2,132,199,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)]'
                      : 'bg-white/85 text-slate-600 border-sky-200/80 hover:text-[#003366] hover:bg-white'
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Trending Quick Chips */}
          <div className="hidden md:flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mr-0.5">
              <Sparkles className="w-3 h-3 text-[#fc4a00]" />
              {lang === 'hi' ? 'ट्रेंडिंग:' : 'Popular:'}
            </span>
            {['Google', 'NDTV', 'Aaj Tak', 'Mentor'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setQuery(tag)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  query.toLowerCase() === tag.toLowerCase()
                    ? 'bg-sky-100 border-sky-400 text-sky-800'
                    : 'bg-white border-sky-200/85 text-slate-600 hover:border-sky-400 hover:text-[#003366]'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>

        {/* Spacious Scrollable Results List */}
        <div
          ref={listRef}
          className="flex-1 min-h-0 overflow-y-auto mcu-modal-scroll px-3 sm:px-4 py-2.5 space-y-1 bg-white"
        >
          {items.length === 0 ? (
            <div className="py-10 text-center">
              <div className="w-11 h-11 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-2.5 text-slate-400">
                <Layers className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-slate-700 mb-1">
                {lang === 'hi' ? `"${query}" के लिए कोई परिणाम नहीं मिला` : `No instant matches for "${query}"`}
              </p>
              <p className="text-xs text-slate-500 mb-3">
                {lang === 'hi'
                  ? 'पूर्ण पूर्व छात्र निर्देशिका में नाम, बैच या शहर से खोजें'
                  : 'Try searching across the complete 38,000+ alumni directory'}
              </p>
              <button
                onClick={() => {
                  onClose();
                  if (onSearchDirectory) onSearchDirectory(query);
                  document.getElementById('directory')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                <span>{lang === 'hi' ? 'निर्देशिका में पूर्ण खोज करें' : 'Search in Full Directory'}</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
              </button>
            </div>
          ) : (
            items.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const showCategoryHeader =
                idx === 0 || items[idx - 1].category !== item.category;

              return (
                <React.Fragment key={item.id}>
                  {showCategoryHeader && (
                    <div className="flex items-center gap-2 px-2 pt-2.5 pb-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#003366]/75">
                        {item.category}
                      </span>
                      <div className="h-px flex-1 bg-slate-100" />
                    </div>
                  )}
                  <button
                    type="button"
                    data-cmd-idx={idx}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    onClick={item.action}
                    className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between gap-3 transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-slate-900/[0.035] border-[#003366]/20 shadow-[inset_3px_0_0_0_#fc4a00]'
                        : 'bg-white hover:bg-slate-50/90 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {item.avatar ? (
                        <div className="relative shrink-0">
                          <img
                            src={item.avatar}
                            alt={item.title}
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover border border-slate-200 shadow-2xs"
                          />
                          {item.verified && (
                            <span
                              className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center"
                              title="Verified MCU Alumnus"
                            >
                              <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                            </span>
                          )}
                        </div>
                      ) : (
                        <div
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-[#003366] text-amber-300 border-[#003366]'
                              : 'bg-slate-100/90 text-slate-600 border-slate-200/80'
                          }`}
                        >
                          {React.cloneElement(item.icon, {
                            className: `w-4 h-4 ${isSelected ? 'text-amber-300' : item.icon.props.className || ''}`,
                          })}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="text-xs sm:text-[13.5px] font-bold text-slate-900 truncate flex items-center gap-1.5">
                          <span className="truncate">{item.title}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                          {item.type === 'alumni' ? (
                            <>
                              <span className="font-medium text-slate-600 truncate">{item.roleText}</span>
                              <span className="text-slate-300">•</span>
                              <span className="inline-flex items-center gap-1 text-slate-500 truncate">
                                <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                                {item.companyText}
                              </span>
                              {item.locationText && (
                                <>
                                  <span className="hidden md:inline text-slate-300">•</span>
                                  <span className="hidden md:inline-flex items-center gap-0.5 text-slate-400 truncate">
                                    <MapPin className="w-2.5 h-2.5 shrink-0" />
                                    {item.locationText}
                                  </span>
                                </>
                              )}
                            </>
                          ) : (
                            <span className="truncate">{item.subtitle}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.badge && (
                        <span
                          className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${item.badgeColor}`}
                        >
                          {item.badge}
                        </span>
                      )}
                      <span
                        className={`hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                          isSelected
                            ? 'bg-[#003366] text-white shadow-2xs opacity-100 translate-x-0'
                            : 'text-slate-400 opacity-0 -translate-x-1'
                        }`}
                      >
                        <span>{item.ctaLabel || 'Open'}</span>
                        <CornerDownLeft className="w-3 h-3 text-amber-300" />
                      </span>
                    </div>
                  </button>
                </React.Fragment>
              );
            })
          )}
        </div>

        {/* Executive Footer with Keyboard Controls */}
        <div className="px-4 sm:px-5 py-2.5 bg-slate-50 border-t border-slate-200/90 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
          <div className="flex items-center gap-3.5">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-300 text-[10px] font-mono font-bold text-slate-700 shadow-2xs">
                ↑↓
              </kbd>
              <span className="font-medium">{lang === 'hi' ? 'चुनें' : 'Navigate'}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-300 text-[10px] font-mono font-bold text-slate-700 shadow-2xs">
                ↵
              </kbd>
              <span className="font-medium">{lang === 'hi' ? 'खोलें' : 'Open'}</span>
            </span>
            <span className="hidden sm:flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-300 text-[10px] font-mono font-bold text-slate-700 shadow-2xs">
                ESC
              </kbd>
              <span className="font-medium">{lang === 'hi' ? 'बंद करें' : 'Close'}</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-bold text-[#003366]">
            <Command className="w-3.5 h-3.5 text-[#fc4a00]" />
            <span>MCU Spotlight Engine</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
