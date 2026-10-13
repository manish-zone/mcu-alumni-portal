import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../context/LanguageContext';
import {
  upcomingEvents as defaultUpcomingEvents,
  abhyudaySlides as defaultAbhyudaySlides,
  abhyudayGif,
  mcuEventsArchive as defaultEventsArchive
} from '../data/mockData';
import {
  Calendar,
  MapPin,
  Users,
  Ticket,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Image as ImageIcon,
  Film,
  Layers,
  ExternalLink,
  Eye,
  X,
  CheckCircle2,
  Trash2,
  PlusCircle,
  Upload,
  ShieldCheck
} from 'lucide-react';
import { ScrollReveal, Tilt3DCard } from './ScrollReveal';

export const EventsSection = ({
  onRsvpEvent,
  onRSVP,
  archiveEvents,
  upcomingEventsList,
  slidesList,
  isAdmin = false,
  onOpenAdminEvents,
  onDeleteArchiveEvent,
  onDeleteArchivePhoto,
  onDeleteUpcomingEvent,
  onDeleteEventSlide,
}) => {
  const { lang, t } = useLanguage();
  const handleRsvp = onRsvpEvent || onRSVP || (() => {});

  const activeArchive = useMemo(() => {
    const raw = Array.isArray(archiveEvents) ? archiveEvents : defaultEventsArchive;
    const seenGlobalSrc = new Set();
    return raw
      .filter((arch) => arch && arch.id !== 'arch-2026-1')
      .map((arch) => {
        const galleryArr = Array.isArray(arch.gallery) ? arch.gallery : [];
        const cleanGallery = galleryArr.filter((g) => {
          if (!g || !g.src || g.isGif) return false;
          if (String(g.src).startsWith('https://www.mcu.ac.in/') && !g.fallback) return false;
          if (seenGlobalSrc.has(g.src)) return false;
          seenGlobalSrc.add(g.src);
          return true;
        });
        return { ...arch, gallery: cleanGallery };
      })
      .filter((arch) => arch.gallery.length > 0 || arch.uploaded_by_admin);
  }, [archiveEvents]);

  const activeUpcoming = Array.isArray(upcomingEventsList) ? upcomingEventsList : defaultUpcomingEvents;

  const activeSlides = useMemo(() => {
    const raw = Array.isArray(slidesList) && slidesList.length > 0 ? slidesList : defaultAbhyudaySlides;
    const seen = new Set();
    return raw.filter((s) => {
      if (!s || !s.image || seen.has(s.image)) return false;
      seen.add(s.image);
      return true;
    });
  }, [slidesList]);

  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const showcaseRef = useRef(null);
  const isShowcaseVisibleRef = useRef(false);

  // Keep activeSlide in bounds when slides are deleted
  useEffect(() => {
    if (activeSlide >= activeSlides.length) {
      setActiveSlide(Math.max(0, activeSlides.length - 1));
    }
  }, [activeSlides.length, activeSlide]);

  // Track whether the slide showcase is in viewport without triggering React state re-renders
  useEffect(() => {
    const el = showcaseRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        isShowcaseVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Historical archive year filter
  const [selectedYear, setSelectedYear] = useState('all');

  // Lightbox modal state
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  // Expanded gallery state for individual archive events
  const [expandedEvents, setExpandedEvents] = useState({});

  // Pagination for Historical Events Archive
  const [archivePage, setArchivePage] = useState(1);
  const archiveItemsPerPage = 3; // 3 detailed archive events per page

  // Pagination for Upcoming Conclaves & Summits
  const [upcomingPage, setUpcomingPage] = useState(1);
  const upcomingItemsPerPage = 3; // 3 conclave cards per row/page

  // Auto-show newly uploaded Event Album on Page 1
  const prevTopArchiveIdRef = useRef(activeArchive[0]?.id);
  useEffect(() => {
    const currentTopId = activeArchive[0]?.id;
    if (currentTopId && prevTopArchiveIdRef.current && currentTopId !== prevTopArchiveIdRef.current) {
      setSelectedYear('all');
      setArchivePage(1);
    }
    prevTopArchiveIdRef.current = currentTopId;
  }, [activeArchive]);

  const featured = activeUpcoming.find((e) => e.featured) || activeUpcoming[0] || null;
  const remaining = featured ? activeUpcoming.filter((e) => e.id !== featured.id) : [];

  // Auto-advance slides every 4.5 seconds only when visible in viewport and not paused
  useEffect(() => {
    if (isPaused || activeSlides.length <= 1) return;
    const interval = setInterval(() => {
      if (!isShowcaseVisibleRef.current) return;
      setActiveSlide((prev) => (prev + 1) % activeSlides.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused, activeSlides.length]);

  const prevSlide = () => {
    if (activeSlides.length === 0) return;
    setActiveSlide((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
  };

  const nextSlide = () => {
    if (activeSlides.length === 0) return;
    setActiveSlide((prev) => (prev + 1) % activeSlides.length);
  };

  // Build Abhyuday Lightbox photo list (HD Slides)
  const abhyudaySlideItems = useMemo(
    () =>
      activeSlides.map((s) => ({
        slideId: s.id,
        src: s.image,
        fallback: s.fallbackUrl,
        title: lang === 'hi' ? s.title : s.titleEn || s.title,
        year: '2026',
        eventTitle: 'अभ्युदय 2026',
        caption: lang === 'hi' ? s.caption : s.captionEn || s.caption,
      })),
    [lang, activeSlides]
  );

  const handleLightboxPrev = () => {
    setLightboxPhoto((prev) => {
      if (!prev || !Array.isArray(prev.list) || prev.list.length === 0) return prev;
      const nextIdx = (prev.index - 1 + prev.list.length) % prev.list.length;
      return {
        ...prev.list[nextIdx],
        list: prev.list,
        index: nextIdx,
      };
    });
  };

  const handleLightboxNext = () => {
    setLightboxPhoto((prev) => {
      if (!prev || !Array.isArray(prev.list) || prev.list.length === 0) return prev;
      const nextIdx = (prev.index + 1) % prev.list.length;
      return {
        ...prev.list[nextIdx],
        list: prev.list,
        index: nextIdx,
      };
    });
  };

  // Keyboard navigation (Escape, ArrowLeft, ArrowRight) for Events Lightbox
  useEffect(() => {
    if (!lightboxPhoto) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setLightboxPhoto(null);
      } else if (e.key === 'ArrowLeft') {
        handleLightboxPrev();
      } else if (e.key === 'ArrowRight') {
        handleLightboxNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxPhoto]);

  const toggleExpand = (id) => {
    setExpandedEvents((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Filter historical events by year
  const filteredArchive = useMemo(() => {
    return selectedYear === 'all'
      ? activeArchive
      : activeArchive.filter((e) => String(e.year) === String(selectedYear));
  }, [selectedYear, activeArchive]);

  // Reset archive page to 1 whenever year filter changes
  useEffect(() => {
    setArchivePage(1);
  }, [selectedYear]);

  const totalArchivePages = Math.ceil(filteredArchive.length / archiveItemsPerPage) || 1;

  // Keep archivePage in bounds when items are deleted
  useEffect(() => {
    if (archivePage > totalArchivePages) {
      setArchivePage(Math.max(1, totalArchivePages));
    }
  }, [archivePage, totalArchivePages]);

  const paginatedArchive = useMemo(() => {
    const startIndex = (archivePage - 1) * archiveItemsPerPage;
    return filteredArchive.slice(startIndex, startIndex + archiveItemsPerPage);
  }, [filteredArchive, archivePage, archiveItemsPerPage]);

  const getArchivePageNumbers = () => {
    if (totalArchivePages <= 7) {
      return Array.from({ length: totalArchivePages }, (_, i) => i + 1);
    }
    if (archivePage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalArchivePages];
    }
    if (archivePage >= totalArchivePages - 3) {
      return [1, '...', totalArchivePages - 4, totalArchivePages - 3, totalArchivePages - 2, totalArchivePages - 1, totalArchivePages];
    }
    return [1, '...', archivePage - 1, archivePage, archivePage + 1, '...', totalArchivePages];
  };

  const handleArchivePageChange = (page) => {
    if (page === '...' || page === archivePage) return;
    setArchivePage(page);
    const frameEl = document.getElementById('archive-events-frame-container');
    if (frameEl) {
      frameEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  // Pagination logic for Upcoming Conclaves
  const totalUpcomingPages = Math.ceil(remaining.length / upcomingItemsPerPage) || 1;

  useEffect(() => {
    if (upcomingPage > totalUpcomingPages) {
      setUpcomingPage(Math.max(1, totalUpcomingPages));
    }
  }, [upcomingPage, totalUpcomingPages]);

  const paginatedUpcoming = useMemo(() => {
    const startIndex = (upcomingPage - 1) * upcomingItemsPerPage;
    return remaining.slice(startIndex, startIndex + upcomingItemsPerPage);
  }, [remaining, upcomingPage, upcomingItemsPerPage]);

  const getUpcomingPageNumbers = () => {
    if (totalUpcomingPages <= 7) {
      return Array.from({ length: totalUpcomingPages }, (_, i) => i + 1);
    }
    if (upcomingPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalUpcomingPages];
    }
    if (upcomingPage >= totalUpcomingPages - 3) {
      return [1, '...', totalUpcomingPages - 4, totalUpcomingPages - 3, totalUpcomingPages - 2, totalUpcomingPages - 1, totalUpcomingPages];
    }
    return [1, '...', upcomingPage - 1, upcomingPage, upcomingPage + 1, '...', totalUpcomingPages];
  };

  const handleUpcomingPageChange = (page) => {
    if (page === '...' || page === upcomingPage) return;
    setUpcomingPage(page);
    const frameEl = document.getElementById('upcoming-events-frame-container');
    if (frameEl) {
      frameEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const yearsList = useMemo(() => {
    const standardLabels = {
      '2026': '2026 (अभ्युदय & संवाद)',
      '2025': '2025 (शोध महाकुंभ)',
      '2024': '2024 (सांस्कृतिक स्पंदन)',
      '2021': '2021 (एल्युम्नाई सेल)',
    };
    const yearSet = new Set(['2026', '2025', '2024', '2021']);
    activeArchive.forEach((ev) => {
      if (ev?.year) yearSet.add(String(ev.year));
    });
    const sortedYears = Array.from(yearSet).sort((a, b) => parseInt(b, 10) - parseInt(a, 10));
    return [
      { id: 'all', label: lang === 'hi' ? 'सभी वर्ष (All Years)' : 'All Years' },
      ...sortedYears.map((yr) => ({
        id: yr,
        label: standardLabels[yr] || `${yr} (${lang === 'hi' ? 'समारोह' : 'Events'})`,
      })),
    ];
  }, [activeArchive, lang]);

  return (
    <section id="events" className="py-20 relative z-10 bg-gradient-to-b from-white/95 via-[#f8fbff]/95 to-white/95 border-t border-sky-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <ScrollReveal variant="fade-up">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-b from-white via-sky-50 to-sky-100/90 text-[#0c4a6e] border border-sky-300/90 text-xs font-extrabold mb-3.5 shadow-[0_8px_20px_-4px_rgba(2,132,199,0.18),inset_0_1.5px_1px_rgba(255,255,255,1)]">
              <Calendar className="w-3.5 h-3.5 text-sky-600" />
              <span>{lang === 'hi' ? 'समारोह एवं संगोष्ठी' : 'Conclaves & Gatherings'}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#003366] tracking-tight font-editorial">
              {t.sections.eventsTitle}
            </h2>
            <p className="mt-1 text-sm sm:text-base text-slate-600 font-medium">
              {t.sections.eventsSubtitle}
            </p>
            {isAdmin && onOpenAdminEvents && (
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => onOpenAdminEvents('')}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#fc4a00] to-[#8d0303] hover:from-[#e04000] hover:to-[#680a13] text-white text-xs sm:text-sm font-extrabold shadow-lg flex items-center gap-2 cursor-pointer transition-all hover:scale-102"
                >
                  <Upload className="w-4 h-4 text-amber-200" />
                  <span>
                    {lang === 'hi'
                      ? '⚡ एडमिन: नया इवेंट / फ़ोटो अपलोड व प्रबंधित करें'
                      : '⚡ Admin: Upload & Manage Events / Photos'}
                  </span>
                </button>
                <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{lang === 'hi' ? 'फुल एडमिन कंट्रोल सक्रिय (Direct Delete & Live Upload)' : 'Full Admin Control Active (Direct Delete & Live Upload)'}</span>
                </span>
              </div>
            )}
          </div>
        </ScrollReveal>


        {/* Featured Flagship Event Showcase */}
        {featured && (
          <div className="bg-gradient-to-r from-[#003366] via-[#002852] to-[#001d3d] text-white rounded-3xl p-5 sm:p-8 md:p-10 border border-amber-300/35 ring-1 ring-[#fc4a00]/25 shadow-[0_24px_50px_-12px_rgba(0,34,68,0.45)] mb-10 relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

              <div className="lg:col-span-8">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="px-3.5 py-1 rounded-full bg-[#fc4a00] text-white font-extrabold text-xs uppercase tracking-wider shadow">
                    {featured.badge}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#8d0303] border border-amber-300/30 text-amber-200 text-xs font-semibold">
                    {featured.type}
                  </span>
                  {isAdmin && onDeleteUpcomingEvent && (
                    <button
                      type="button"
                      onClick={() => onDeleteUpcomingEvent(featured.id)}
                      className="px-3 py-1 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1 shadow cursor-pointer transition-colors"
                      title="Admin: Delete Featured Event"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>{lang === 'hi' ? 'यह बैनर हटाएं' : 'Delete Banner Event'}</span>
                    </button>
                  )}
                </div>

                <h3 className="text-2xl sm:text-4xl font-extrabold text-white mb-3 font-editorial tracking-tight leading-tight">
                  {lang === 'hi' ? featured.hindiTitle : featured.title}
                </h3>

                <p className="text-sm text-slate-200 leading-relaxed mb-6 max-w-2xl font-normal">
                  {featured.description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-200 mb-6">
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/10 border border-white/15">
                    <Calendar className="w-4 h-4 text-[#fc4a00] shrink-0" />
                    <div>
                      <span className="text-[10px] text-amber-300 block uppercase font-bold">Date & Time</span>
                      <span className="font-bold text-white">{featured.date}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/10 border border-white/15">
                    <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-amber-300 block uppercase font-bold">Venue / Location</span>
                      <span className="font-bold text-white truncate block max-w-[240px]">{featured.location}</span>
                    </div>
                  </div>
                </div>

                {/* RSVP Counter bar */}
                <div className="mb-6 max-w-md">
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
                    <span>Confirmed Alumni Delegates</span>
                    <span className="text-[#fc4a00] font-extrabold">{featured.rsvpCount} / {featured.seatsTotal}</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-[#fc4a00] h-full rounded-full transition-all"
                      style={{ width: `${(featured.rsvpCount / featured.seatsTotal) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => handleRsvp(featured)}
                    className="px-7 py-3 rounded-xl btn-mcu-saffron text-sm shadow-xl hover:scale-102 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Ticket className="w-4 h-4" />
                    <span>{t.actions.rsvpEvent}</span>
                  </button>
                  {isAdmin && onOpenAdminEvents && (
                    <button
                      type="button"
                      onClick={() => onOpenAdminEvents('')}
                      className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-amber-200 border border-amber-300/35 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <PlusCircle className="w-4 h-4 text-[#fc4a00]" />
                      <span>{lang === 'hi' ? '+ नया आगामी इवेंट / स्लाइड जोड़ें' : '+ Add Conclave / Slide (Admin)'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Graphic Icon / Visual Right */}
              <div className="lg:col-span-4 hidden lg:flex flex-col items-center justify-center p-8 rounded-2xl bg-white/5 border border-white/15 text-center">
                <div className="relative w-24 h-24 flex items-center justify-center mb-4">
                  <div className="mcu-logo-aura absolute -inset-2 rounded-full bg-gradient-to-tr from-[#680a13]/40 via-amber-400/20 to-[#fc4a00]/30 blur-lg pointer-events-none" />
                  <div className="mcu-logo-orbit-ring absolute -inset-2 rounded-full border border-dashed border-amber-300/35 pointer-events-none">
                    <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#fc4a00] shadow-[0_0_8px_#fc4a00]" />
                  </div>
                  <img
                    src="/mcu-logo.png"
                    alt="MCU Crest"
                    loading="lazy"
                    decoding="async"
                    className="mcu-logo-3d-alive w-full h-full object-contain relative z-10"
                  />
                </div>
                <span className="px-3 py-1 rounded-full bg-[#8d0303] text-amber-200 text-xs font-bold mb-2 border border-amber-300/30">
                  {lang === 'hi' ? 'सफलता के मंत्र' : 'Mantras of Success'}
                </span>
                <h4 className="text-lg font-bold text-white font-editorial mb-1">
                  {lang === 'hi' ? 'अभ्युदय 2026 महाकुंभ' : 'Abhyuday 2026 Conclave'}
                </h4>
                <p className="text-xs text-slate-300 max-w-[220px] mb-4 font-medium">
                  {lang === 'hi'
                    ? 'पूर्व विद्यार्थियों व नए पत्रकारों का महासंगम, गणेश शंकर विद्यार्थी सभागार में'
                    : 'Grand confluence of prominent alumni editors, broadcasters & young media scholars.'}
                </p>
                <div className="px-3.5 py-1.5 rounded-full bg-[#fc4a00]/30 text-[11px] text-amber-200 font-bold border border-[#fc4a00]/50">
                  3-Day Statutory Media Fest
                </div>
              </div>

            </div>

            {/* 2. MEDIA SHOWCASE AREA: HD SLIDE CAROUSEL */}
            <div ref={showcaseRef} className="mt-10 pt-8 border-t border-white/15 relative z-10">

              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="text-lg sm:text-xl font-bold text-white font-editorial">
                      {lang === 'hi' ? 'अभ्युदय 2026: आधिकारिक मीडिया गैलरी' : 'Abhyuday 2026: Official Media Gallery'}
                    </h4>
                    <span className="hidden sm:inline-block px-2 py-0.5 text-[9px] font-black uppercase bg-[#8d0303] text-amber-300 rounded border border-amber-300/30">
                      Official Uploads
                    </span>
                    {isAdmin && onOpenAdminEvents && (
                      <button
                        type="button"
                        onClick={() => onOpenAdminEvents('__SLIDES__')}
                        className="px-2.5 py-1 rounded-lg bg-[#fc4a00] hover:bg-[#e04000] text-white text-[11px] font-extrabold flex items-center gap-1 shadow cursor-pointer"
                      >
                        <Upload className="w-3 h-3" />
                        <span>{lang === 'hi' ? '+ स्लाइड अपलोड करें' : '+ Upload HD Slide'}</span>
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-amber-200 font-medium">
                    {lang === 'hi'
                      ? 'विश्वविद्यालय वेबसाइट mcu.ac.in की आधिकारिक हाई-रेज़ोल्यूशन स्लाइड्स'
                      : 'Official high-resolution slide captures from mcu.ac.in'}
                  </p>
                </div>

                <div className="flex items-center bg-black/40 px-3.5 py-1.5 rounded-xl border border-white/15 self-start sm:self-auto shrink-0 text-xs font-bold text-amber-200 gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-[#fc4a00]" />
                  <span>{lang === 'hi' ? `📸 ${activeSlides.length} HD स्लाइड्स` : `📸 ${activeSlides.length} HD Slides`}</span>
                </div>
              </div>

              {/* HD SLIDESHOW GALLERY */}
              {activeSlides.length > 0 && (
                <div
                  className="animate-fadeIn"
                  onMouseEnter={() => setIsPaused(true)}
                  onMouseLeave={() => setIsPaused(false)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-amber-200 font-semibold">
                      {lang === 'hi' ? 'स्लाइडर पर माउस रखने पर यह रुक जाएगा' : 'Hover over slide to pause auto-advance'}
                    </span>
                    <div className="flex items-center gap-2">
                      {isAdmin && onDeleteEventSlide && activeSlides[activeSlide] && (
                        <button
                          type="button"
                          onClick={() => onDeleteEventSlide(activeSlides[activeSlide].id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1 shadow cursor-pointer"
                          title="Admin: Delete Current Slide"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{lang === 'hi' ? 'स्लाइड हटाएं' : 'Delete Slide'}</span>
                        </button>
                      )}
                      <span className="text-xs font-mono text-amber-300 font-bold px-2.5 py-1 bg-black/40 rounded-lg border border-white/10">
                        {String(Math.min(activeSlide + 1, activeSlides.length)).padStart(2, '0')} / {String(activeSlides.length).padStart(2, '0')}
                      </span>
                      <button
                        onClick={prevSlide}
                        className="p-2 rounded-lg bg-white/10 hover:bg-[#fc4a00] text-white transition-all border border-white/15 active:scale-95 cursor-pointer"
                        aria-label="Previous slide"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={nextSlide}
                        className="p-2 rounded-lg bg-white/10 hover:bg-[#fc4a00] text-white transition-all border border-white/15 active:scale-95 cursor-pointer"
                        aria-label="Next slide"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Main Slide Display */}
                  {activeSlides[activeSlide] && (
                    <div className="relative rounded-2xl overflow-hidden bg-slate-950 border-2 border-amber-400/50 shadow-2xl group">
                      <div
                        className="aspect-[4/3] sm:aspect-[21/9] max-h-[460px] w-full relative cursor-pointer bg-black flex items-center justify-center"
                        onClick={() =>
                          setLightboxPhoto({
                            ...abhyudaySlideItems[activeSlide],
                            list: abhyudaySlideItems,
                            index: activeSlide,
                          })
                        }
                      >
                        <img
                          src={activeSlides[activeSlide].image}
                          alt={activeSlides[activeSlide].title}
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            if (activeSlides[activeSlide].fallbackUrl && e.target.src !== activeSlides[activeSlide].fallbackUrl) {
                              e.target.src = activeSlides[activeSlide].fallbackUrl;
                            }
                          }}
                          className="w-full h-full object-contain object-center transition-all duration-500 ease-in-out"
                        />

                        {/* Click to Expand Action */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLightboxPhoto({
                              ...abhyudaySlideItems[activeSlide],
                              list: abhyudaySlideItems,
                              index: activeSlide,
                            });
                          }}
                          className="absolute top-3 right-3 p-2 rounded-xl bg-black/75 hover:bg-[#fc4a00] text-white border border-white/20 transition-all opacity-80 hover:opacity-100 flex items-center gap-1.5 text-xs font-semibold shadow-lg cursor-pointer"
                          title="Open Fullscreen HD"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="hidden sm:inline">फुल स्क्रीन</span>
                        </button>
                      </div>

                      {/* Clean Caption Footer Below Image */}
                      <div className="bg-[#002244] px-4 py-3 border-t border-white/10 text-white">
                        <h5 className="text-sm sm:text-base font-bold font-editorial text-amber-200 mb-0.5">
                          {lang === 'hi' ? activeSlides[activeSlide].title : activeSlides[activeSlide].titleEn || activeSlides[activeSlide].title}
                        </h5>
                        <p className="text-xs text-slate-300 leading-relaxed font-medium">
                          {lang === 'hi' ? activeSlides[activeSlide].caption : activeSlides[activeSlide].captionEn || activeSlides[activeSlide].caption}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Slide Thumbnails Row */}
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 sm:gap-2.5 mt-3">
                    {activeSlides.map((slide, idx) => (
                      <div
                        key={slide.id}
                        onClick={() => setActiveSlide(idx)}
                        className={`relative aspect-[16/10] rounded-xl overflow-hidden border-2 transition-all group cursor-pointer ${
                          activeSlide === idx
                            ? 'border-[#fc4a00] ring-2 ring-[#fc4a00]/60 scale-105 shadow-xl'
                            : 'border-white/15 opacity-60 hover:opacity-100 hover:border-amber-300'
                        }`}
                        title={lang === 'hi' ? slide.title : slide.titleEn}
                      >
                        <img
                          src={slide.image}
                          alt={slide.title}
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            if (slide.fallbackUrl && e.target.src !== slide.fallbackUrl) {
                              e.target.src = slide.fallbackUrl;
                            }
                          }}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                        {isAdmin && onDeleteEventSlide && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteEventSlide(slide.id);
                            }}
                            className="absolute top-1 right-1 p-1 rounded-md bg-rose-600/95 hover:bg-rose-700 text-white shadow cursor-pointer z-10"
                            title="Delete Slide"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                        {activeSlide === idx && (
                          <div className="absolute bottom-0 inset-x-0 h-1 bg-[#fc4a00]" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

        {/* 3. HISTORICAL MCU EVENT MEDIA ARCHIVE (2021, 2024, 2025, 2026 UPLOADS) */}
        <div className="mt-16 mb-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#003366] text-white text-xs font-bold mb-2">
                <Layers className="w-3.5 h-3.5 text-amber-300" />
                <span>आधिकारिक छायाचित्र एवं मीडिया आर्काइव</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-[#003366] font-editorial">
                {lang === 'hi' ? 'एमसीयू ऐतिहासिक समारोह आर्काइव (2021 - 2026)' : 'MCU Official Events Archive (2021 - 2026)'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
                {lang === 'hi'
                  ? 'विश्वविद्यालय की आधिकारिक वेबसाइट (mcu.ac.in/wp-content/uploads/) से 2021, 2024, 2025 और 2026 के सभी प्रमुख छायाचित्र'
                  : 'Curated historical photo albums directly from official university web uploads (2021-2026)'}
              </p>
            </div>

            {/* Year Filter Buttons + Admin Upload Button */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {isAdmin && onOpenAdminEvents && (
                <button
                  type="button"
                  onClick={() => onOpenAdminEvents('')}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#fc4a00] to-[#8d0303] text-white text-xs font-extrabold shadow-md flex items-center gap-1.5 cursor-pointer hover:scale-102 transition-all"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{lang === 'hi' ? '+ नया इवेंट / फ़ोटो अपलोड (Admin)' : '+ Upload Event / Photos (Admin)'}</span>
                </button>
              )}
              {yearsList.map((yr) => (
                <button
                  key={yr.id}
                  onClick={() => setSelectedYear(yr.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectedYear === yr.id
                      ? 'bg-[#003366] text-white shadow-md ring-2 ring-[#fc4a00]'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span>{yr.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 11: Enclosed Institutional Frame for Historical Events Archive with Pagination */}
          <div id="archive-events-frame-container" className="relative rounded-3xl border-2 border-amber-900/15 bg-gradient-to-b from-stone-50/70 via-white to-stone-50/60 p-4 sm:p-7 shadow-sm">

            {/* Frame Header Console */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 mb-6 bg-white/95 rounded-2xl border border-amber-900/10 shadow-2xs text-xs font-semibold text-slate-700">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#fc4a00] animate-pulse" />
                <span className="text-[#002244] font-bold">
                  {lang === 'hi' ? 'ऐतिहासिक समारोह आर्काइव कंसोल' : 'Events Archive Console'}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-600 font-medium">
                  {lang === 'hi'
                    ? `पृष्ठ ${archivePage} पर ${paginatedArchive.length} समारोह (कुल ${filteredArchive.length} ऐतिहासिक आयोजन)`
                    : `Showing ${paginatedArchive.length} of ${filteredArchive.length} Historical Conclaves`}
                </span>
              </div>

              {totalArchivePages > 1 && (
                <div className="flex items-center gap-2 text-amber-900 font-mono text-[11px] font-bold bg-amber-50 px-3 py-1 rounded-xl border border-amber-200/60">
                  <span>PAGE {archivePage} OF {totalArchivePages}</span>
                </div>
              )}
            </div>

            {filteredArchive.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-800 mb-1">
                  {lang === 'hi' ? 'इस वर्ष का कोई रिकॉर्ड नहीं मिला' : 'No Events Found for Selected Year'}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  {lang === 'hi' ? 'कृपया अन्य वर्ष चुनें या "सभी वर्ष" पर क्लिक करें।' : 'Please choose another year or click "All Years".'}
                </p>
              </div>
            ) : (
              <div className="relative border-l-2 border-amber-400/30 ml-2 sm:ml-4 pl-4 sm:pl-8 space-y-8">
                {paginatedArchive.map((arch) => {
                  const isExpanded = expandedEvents[arch.id];
                  const galleryArr = Array.isArray(arch.gallery) ? arch.gallery : [];
                  const visibleGallery = isExpanded ? galleryArr : galleryArr.slice(0, 4);

                  return (
                    <div
                      key={arch.id}
                      className="relative group"
                    >
                      {/* Timeline Milestone Dot Node */}
                      <div className="absolute -left-[25px] sm:-left-[41px] top-6 w-4 h-4 rounded-full bg-gradient-to-r from-[#fc4a00] to-[#e65100] border-2 border-white shadow-md ring-4 ring-amber-400/20 group-hover:scale-125 transition-transform" />

                      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-amber-400/50 transition-all duration-300 flex flex-col justify-between">
                        <div>
                          {/* Badge, Year, and Admin Action Controls Header */}
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-3 py-1 rounded-full bg-[#680a13] text-amber-200 text-xs font-bold shadow-xs">
                                {arch.badge}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-md bg-[#003366]/10 text-[#003366] font-display text-xs font-black">
                                Year {arch.year}
                              </span>
                            </div>

                            {isAdmin && (
                              <div className="flex items-center gap-2">
                                {onOpenAdminEvents && (
                                  <button
                                    type="button"
                                    onClick={() => onOpenAdminEvents(arch.id)}
                                    className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-[#003366] border border-sky-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                    title="Admin: Add More Photos to this Event"
                                  >
                                    <PlusCircle className="w-3.5 h-3.5 text-[#0284c7]" />
                                    <span>{lang === 'hi' ? '+ फ़ोटो जोड़ें' : '+ Add Photo'}</span>
                                  </button>
                                )}
                                {onDeleteArchiveEvent && (
                                  <button
                                    type="button"
                                    onClick={() => onDeleteArchiveEvent(arch.id)}
                                    className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                    title="Admin: Delete Entire Event Album"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>{lang === 'hi' ? 'इवेंट हटाएं' : 'Delete Event'}</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          <h4 className="text-lg sm:text-xl font-bold text-[#003366] group-hover:text-[#fc4a00] transition-colors mb-1.5 font-editorial">
                            {lang === 'hi' ? arch.hindiTitle || arch.title : arch.title}
                          </h4>

                          <p className="text-xs text-slate-600 mb-4 leading-relaxed line-clamp-2 font-normal">
                            {arch.description}
                          </p>

                          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mb-4 font-medium">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-[#fc4a00]" />
                              {arch.date}
                            </span>
                            <span className="flex items-center gap-1 truncate max-w-[260px]">
                              <MapPin className="w-3.5 h-3.5 text-[#680a13]" />
                              {arch.venue}
                            </span>
                          </div>

                          {/* Gallery Thumbnails Grid for this Event */}
                          {visibleGallery.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
                              {visibleGallery.map((img, idx) => (
                                <div
                                  key={idx}
                                  onClick={() => {
                                    const eventPhotoList = galleryArr.map((g, gIdx) => ({
                                      archiveEventId: arch.id,
                                      photoIndex: gIdx,
                                      src: g.src,
                                      fallback: g.fallback,
                                      title: g.title,
                                      year: arch.year,
                                      eventTitle: lang === 'hi' ? arch.hindiTitle || arch.title : arch.title,
                                      caption: arch.description,
                                    }));
                                    setLightboxPhoto({
                                      ...eventPhotoList[idx],
                                      list: eventPhotoList,
                                      index: idx,
                                    });
                                  }}
                                  className="relative aspect-video rounded-xl overflow-hidden cursor-pointer border border-slate-200 group/img bg-slate-200 shadow-xs"
                                  title={img.title}
                                >
                                  <img
                                    src={img.isGif ? '/abhyuday/abhyuday-1.jpeg' : img.src}
                                    alt={img.title}
                                    loading="lazy"
                                    decoding="async"
                                    onError={(e) => {
                                      if (img.fallback && e.target.src !== img.fallback) {
                                        e.target.src = img.fallback;
                                      }
                                    }}
                                    className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                                  />
                                  <div className="absolute inset-0 bg-black/35 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                                    <Eye className="w-4 h-4 drop-shadow" />
                                  </div>
                                  {isAdmin && onDeleteArchivePhoto && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteArchivePhoto(arch.id, idx);
                                      }}
                                      className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-rose-600/95 hover:bg-rose-700 text-white shadow-md z-10 cursor-pointer transition-transform hover:scale-105"
                                      title="Admin: Delete this Photo from Event"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  {img.isGif && (
                                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-red-600 text-white text-[8px] font-black uppercase">
                                      GIF
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Action Footer */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                          <span className="text-slate-500 font-semibold">
                            {galleryArr.length} {lang === 'hi' ? 'छायाचित्र उपलब्ध' : 'Official Photos'}
                          </span>
                          {galleryArr.length > 4 && (
                            <button
                              onClick={() => toggleExpand(arch.id)}
                              className="px-3.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 hover:border-[#fc4a00] hover:text-[#fc4a00] font-bold transition-all text-slate-700 cursor-pointer"
                            >
                              {isExpanded
                                ? (lang === 'hi' ? 'कम दिखाएं' : 'Show Less')
                                : (lang === 'hi' ? `सभी ${galleryArr.length} तस्वीरें देखें` : `View All ${galleryArr.length} Photos`)}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Frame Bottom Pagination Bar for Historical Events Archive */}
            {filteredArchive.length > 0 && totalArchivePages > 1 && (
              <div className="mt-8 pt-6 border-t border-amber-900/15 flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Pagination Info */}
                <div className="text-xs text-slate-600 font-medium text-center sm:text-left">
                  {lang === 'hi' ? (
                    <span>
                      कुल <strong>{filteredArchive.length}</strong> में से{' '}
                      <strong className="text-[#003366]">{(archivePage - 1) * archiveItemsPerPage + 1}–{Math.min(archivePage * archiveItemsPerPage, filteredArchive.length)}</strong> समारोह • पृष्ठ{' '}
                      <strong className="text-[#fc4a00] font-bold">{archivePage}</strong> / <strong>{totalArchivePages}</strong>
                    </span>
                  ) : (
                    <span>
                      Showing <strong className="text-[#003366]">{(archivePage - 1) * archiveItemsPerPage + 1}–{Math.min(archivePage * archiveItemsPerPage, filteredArchive.length)}</strong> of{' '}
                      <strong>{filteredArchive.length}</strong> Conclaves • Page{' '}
                      <strong className="text-[#fc4a00] font-bold">{archivePage}</strong> of <strong>{totalArchivePages}</strong>
                    </span>
                  )}
                </div>

                {/* Pagination Action Controls: Prev, Bullets/Pages 1 2 3, Next */}
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center">
                  <button
                    onClick={() => handleArchivePageChange(Math.max(1, archivePage - 1))}
                    disabled={archivePage === 1}
                    className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                      archivePage === 1
                        ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                        : 'bg-white hover:bg-amber-50 text-[#003366] hover:text-[#fc4a00] border border-slate-200 hover:border-amber-400 active:scale-95'
                    }`}
                    title={lang === 'hi' ? 'पिछला पृष्ठ' : 'Previous Page'}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>{lang === 'hi' ? 'पिछला' : 'Previous'}</span>
                  </button>

                  <div className="flex items-center gap-1 sm:gap-1.5">
                    {getArchivePageNumbers().map((pg, idx) => {
                      if (pg === '...') {
                        return (
                          <span key={`archive-dots-${idx}`} className="px-2 py-1 text-slate-400 font-bold text-xs select-none">
                            …
                          </span>
                        );
                      }
                      const isActive = archivePage === pg;
                      return (
                        <button
                          key={`archive-page-${pg}`}
                          onClick={() => handleArchivePageChange(pg)}
                          className={`min-w-[34px] sm:min-w-[38px] h-8 sm:h-9 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer shadow-xs ${
                            isActive
                              ? 'bg-gradient-to-r from-[#8d0303] to-[#fc4a00] text-white shadow-md shadow-red-950/20 ring-2 ring-amber-300 scale-105'
                              : 'bg-white hover:bg-amber-50 text-slate-700 hover:text-[#003366] border border-slate-200 hover:border-amber-400 active:scale-95'
                          }`}
                          title={lang === 'hi' ? `पृष्ठ ${pg}` : `Page ${pg}`}
                        >
                          {pg}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handleArchivePageChange(Math.min(totalArchivePages, archivePage + 1))}
                    disabled={archivePage === totalArchivePages}
                    className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                      archivePage === totalArchivePages
                        ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                        : 'bg-white hover:bg-amber-50 text-[#003366] hover:text-[#fc4a00] border border-slate-200 hover:border-amber-400 active:scale-95'
                    }`}
                    title={lang === 'hi' ? 'अगला पृष्ठ' : 'Next Page'}
                  >
                    <span>{lang === 'hi' ? 'अगला' : 'Next'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* 4. OTHER UPCOMING CONCLAVES & REGISTRATION */}
        <div>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#003366] font-editorial">
                {lang === 'hi' ? 'अन्य आगामी राष्ट्रीय एवं वैश्विक संगोष्ठियां' : 'Other Upcoming Conclaves & Summits'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                {lang === 'hi' ? 'पूर्व छात्रों एवं विद्यार्थियों के लिए विशेष सत्र' : 'Special interactive chapters across Delhi, Mumbai & Bhopal'}
              </p>
            </div>
            {isAdmin && onOpenAdminEvents && (
              <button
                type="button"
                onClick={() => onOpenAdminEvents('__UPCOMING__')}
                className="px-4 py-2 rounded-xl bg-[#003366] hover:bg-[#fc4a00] text-white text-xs font-extrabold shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <PlusCircle className="w-4 h-4 text-amber-300" />
                <span>{lang === 'hi' ? '+ आगामी संगोष्ठी जोड़ें (Admin)' : '+ Add Upcoming Conclave (Admin)'}</span>
              </button>
            )}
          </div>

          {/* Enclosed Institutional Frame for Upcoming Conclaves with Pagination */}
          <div id="upcoming-events-frame-container" className="relative rounded-3xl border-2 border-amber-900/15 bg-gradient-to-b from-stone-50/70 via-white to-stone-50/60 p-4 sm:p-7 shadow-sm">

            {/* Frame Header Console */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 mb-6 bg-white/95 rounded-2xl border border-amber-900/10 shadow-2xs text-xs font-semibold text-slate-700">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#003366] animate-pulse" />
                <span className="text-[#002244] font-bold">
                  {lang === 'hi' ? 'आगामी संगोष्ठी कंसोल' : 'Upcoming Conclaves Console'}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-600 font-medium">
                  {lang === 'hi'
                    ? `पृष्ठ ${upcomingPage} पर ${paginatedUpcoming.length} सत्र (कुल ${remaining.length} आगामी संगोष्ठियां)`
                    : `Showing ${paginatedUpcoming.length} of ${remaining.length} Upcoming Conclaves`}
                </span>
              </div>

              {totalUpcomingPages > 1 && (
                <div className="flex items-center gap-2 text-amber-900 font-mono text-[11px] font-bold bg-amber-50 px-3 py-1 rounded-xl border border-amber-200/60">
                  <span>PAGE {upcomingPage} OF {totalUpcomingPages}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {paginatedUpcoming.map((evt, idx) => (
                <ScrollReveal key={evt.id} variant="tilt-in" delay={idx * 80}>
                  <Tilt3DCard intensity={7} className="h-full">
                    <div
                      className="mcu-interactive-card h-full bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-[#fc4a00]"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="px-2.5 py-0.5 rounded-md bg-[#003366]/10 text-[#003366] text-xs font-bold border border-[#003366]/20">
                            {evt.badge}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                              <Users className="w-3 h-3 text-slate-400" />
                              {evt.rsvpCount} Attending
                            </span>
                            {isAdmin && onDeleteUpcomingEvent && (
                              <button
                                type="button"
                                onClick={() => onDeleteUpcomingEvent(evt.id)}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 transition-colors cursor-pointer"
                                title="Admin: Delete Conclave"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <h4 className="text-base font-bold text-[#003366] mb-2 font-editorial line-clamp-2">
                          {lang === 'hi' ? evt.hindiTitle || evt.title : evt.title}
                        </h4>

                        <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed font-normal">
                          {evt.description}
                        </p>

                        <div className="space-y-1.5 text-xs text-slate-700 font-medium mb-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-[#fc4a00]" />
                            <span>{evt.date}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-500 truncate">
                            <MapPin className="w-3.5 h-3.5 text-[#8d0303] shrink-0" />
                            <span className="truncate">{evt.location}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRsvp(evt)}
                        className="w-full py-2.5 rounded-xl bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Ticket className="w-3.5 h-3.5 text-amber-300" />
                        <span>{t.actions.rsvpEvent}</span>
                      </button>
                    </div>
                  </Tilt3DCard>
                </ScrollReveal>
              ))}
            </div>

            {/* Frame Bottom Pagination Bar for Upcoming Conclaves */}
            {remaining.length > 0 && totalUpcomingPages > 1 && (
              <div className="mt-8 pt-6 border-t border-amber-900/15 flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Pagination Info */}
                <div className="text-xs text-slate-600 font-medium text-center sm:text-left">
                  {lang === 'hi' ? (
                    <span>
                      कुल <strong>{remaining.length}</strong> में से{' '}
                      <strong className="text-[#003366]">{(upcomingPage - 1) * upcomingItemsPerPage + 1}–{Math.min(upcomingPage * upcomingItemsPerPage, remaining.length)}</strong> सत्र • पृष्ठ{' '}
                      <strong className="text-[#fc4a00] font-bold">{upcomingPage}</strong> / <strong>{totalUpcomingPages}</strong>
                    </span>
                  ) : (
                    <span>
                      Showing <strong className="text-[#003366]">{(upcomingPage - 1) * upcomingItemsPerPage + 1}–{Math.min(upcomingPage * upcomingItemsPerPage, remaining.length)}</strong> of{' '}
                      <strong>{remaining.length}</strong> Conclaves • Page{' '}
                      <strong className="text-[#fc4a00] font-bold">{upcomingPage}</strong> of <strong>{totalUpcomingPages}</strong>
                    </span>
                  )}
                </div>

                {/* Pagination Action Controls: Prev, Bullets/Pages 1 2, Next */}
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center">
                  <button
                    onClick={() => handleUpcomingPageChange(Math.max(1, upcomingPage - 1))}
                    disabled={upcomingPage === 1}
                    className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                      upcomingPage === 1
                        ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                        : 'bg-white hover:bg-amber-50 text-[#003366] hover:text-[#fc4a00] border border-slate-200 hover:border-amber-400 active:scale-95'
                    }`}
                    title={lang === 'hi' ? 'पिछला पृष्ठ' : 'Previous Page'}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>{lang === 'hi' ? 'पिछला' : 'Previous'}</span>
                  </button>

                  <div className="flex items-center gap-1 sm:gap-1.5">
                    {getUpcomingPageNumbers().map((pg, idx) => {
                      if (pg === '...') {
                        return (
                          <span key={`upcoming-dots-${idx}`} className="px-2 py-1 text-slate-400 font-bold text-xs select-none">
                            …
                          </span>
                        );
                      }
                      const isActive = upcomingPage === pg;
                      return (
                        <button
                          key={`upcoming-page-${pg}`}
                          onClick={() => handleUpcomingPageChange(pg)}
                          className={`min-w-[34px] sm:min-w-[38px] h-8 sm:h-9 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer shadow-xs ${
                            isActive
                              ? 'bg-gradient-to-r from-[#8d0303] to-[#fc4a00] text-white shadow-md shadow-red-950/20 ring-2 ring-amber-300 scale-105'
                              : 'bg-white hover:bg-amber-50 text-slate-700 hover:text-[#003366] border border-slate-200 hover:border-amber-400 active:scale-95'
                          }`}
                          title={lang === 'hi' ? `पृष्ठ ${pg}` : `Page ${pg}`}
                        >
                          {pg}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handleUpcomingPageChange(Math.min(totalUpcomingPages, upcomingPage + 1))}
                    disabled={upcomingPage === totalUpcomingPages}
                    className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                      upcomingPage === totalUpcomingPages
                        ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                        : 'bg-white hover:bg-amber-50 text-[#003366] hover:text-[#fc4a00] border border-slate-200 hover:border-amber-400 active:scale-95'
                    }`}
                    title={lang === 'hi' ? 'अगला पृष्ठ' : 'Next Page'}
                  >
                    <span>{lang === 'hi' ? 'अगला' : 'Next'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* LIGHTBOX PHOTO MODAL (Portaled to document.body so it always opens in current viewport) */}
      {lightboxPhoto &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn"
            onClick={() => setLightboxPhoto(null)}
          >
            <div
              className="relative max-w-5xl w-full max-h-[92vh] flex flex-col bg-slate-900 rounded-2xl overflow-hidden border border-white/20 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Top Bar */}
              <div className="flex items-center justify-between p-4 bg-slate-950 border-b border-white/10 text-white">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="px-2.5 py-0.5 rounded bg-[#fc4a00] text-xs font-bold shrink-0">
                    {lightboxPhoto.year}
                  </span>
                  {Array.isArray(lightboxPhoto.list) && lightboxPhoto.list.length > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white text-xs font-mono font-semibold shrink-0">
                      {(lightboxPhoto.index ?? 0) + 1} / {lightboxPhoto.list.length}
                    </span>
                  )}
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold truncate">
                      {lightboxPhoto.title}
                    </h4>
                    <span className="text-[11px] text-amber-300 truncate block">
                      {lightboxPhoto.eventTitle}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isAdmin && lightboxPhoto.archiveEventId && typeof lightboxPhoto.photoIndex === 'number' && onDeleteArchivePhoto && (
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteArchivePhoto(lightboxPhoto.archiveEventId, lightboxPhoto.photoIndex);
                        setLightboxPhoto(null);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      title="Admin: Delete this Photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{lang === 'hi' ? 'फ़ोटो हटाएं' : 'Delete Photo'}</span>
                    </button>
                  )}
                  {isAdmin && lightboxPhoto.slideId && onDeleteEventSlide && (
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteEventSlide(lightboxPhoto.slideId);
                        setLightboxPhoto(null);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      title="Admin: Delete this Slide"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{lang === 'hi' ? 'स्लाइड हटाएं' : 'Delete Slide'}</span>
                    </button>
                  )}
                  {lightboxPhoto.fallback && (
                    <a
                      href={lightboxPhoto.fallback}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs transition-colors"
                      title="View Original on mcu.ac.in"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={() => setLightboxPhoto(null)}
                    className="p-2 rounded-lg bg-white/10 hover:bg-red-600 text-white transition-colors cursor-pointer"
                    title="Close (Esc)"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Image Body with Prev / Next Buttons */}
              <div className="flex-1 min-h-0 bg-black flex items-center justify-center p-2 relative overflow-hidden">
                <img
                  src={lightboxPhoto.src}
                  alt={lightboxPhoto.title}
                  onError={(e) => {
                    if (lightboxPhoto.fallback && e.target.src !== lightboxPhoto.fallback) {
                      e.target.src = lightboxPhoto.fallback;
                    }
                  }}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                />

                {/* Previous Photo Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLightboxPrev();
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/80 text-white hover:bg-[#fc4a00] border border-white/15 transition-colors shadow-lg cursor-pointer"
                  title="Previous photo (Left Arrow)"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Next Photo Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLightboxNext();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/80 text-white hover:bg-[#fc4a00] border border-white/15 transition-colors shadow-lg cursor-pointer"
                  title="Next photo (Right Arrow)"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Footer Caption */}
              {lightboxPhoto.caption && (
                <div className="p-3 sm:p-4 bg-slate-950 border-t border-white/10 text-xs text-slate-300 text-center">
                  <p>{lightboxPhoto.caption}</p>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}

    </section>
  );
};
