import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  Menu,
  X,
  Globe,
  UserPlus,
  LogIn,
  Search,
  Sparkles,
  LogOut,
  ChevronDown,
  Edit3,
  Briefcase,
  FileText,
  Send,
  Home,
  Users,
  Compass,
  Calendar,
  Camera,
  HeartHandshake,
  PlusCircle,
  ShieldCheck
} from 'lucide-react';
import { isCurrentStudent, isVerifiedAlumnus } from '../utils/skills';

export const Navbar = ({
  onOpenAuth,
  onQuickSearch,
  currentUser = null,
  isVerifiedAlumni = false,
  applicationCount = 0,
  mySubmittedCount = 0,
  acceptedApplicationCount = 0,
  underReviewApplicationCount = 0,
  rejectedApplicationCount = 0,
  receivedMentorshipCount = 0,
  myMentorshipCount = 0,
  scheduledMentorshipCount = 0,
  adminPendingCount = 0,
  broadcastNotice = null,
  onOpenAdminPanel = null,
  onOpenProfile,
  onOpenMyJobs,
  onOpenPostJob,
  onOpenApplications,
  onOpenMyApplications,
  onOpenMentorship,
  onLogout
}) => {
  const { lang, toggleLanguage, t } = useLanguage();
  const isAdmin = Boolean(currentUser?.is_admin || currentUser?.role === 'admin');
  const isStudent = isCurrentStudent(currentUser);
  const isVerified = Boolean(isAdmin || isVerifiedAlumni || isVerifiedAlumnus(currentUser));
  const [isScrolled, setIsScrolled] = useState(false);
  const [navDockHidden, setNavDockHidden] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    let ticking = false;
    const sections = ['home', 'directory', 'mentorship', 'jobs', 'events', 'gallery', 'giving'];
    lastScrollYRef.current = window.scrollY || 0;
    let cachedBounds = [];
    let isDesktopViewport = window.innerWidth >= 1024;

    const measureSections = () => {
      isDesktopViewport = window.innerWidth >= 1024;
      if (!isDesktopViewport) return;
      cachedBounds = sections.map((section) => {
        const el = document.getElementById(section);
        return el
          ? { id: section, top: el.offsetTop, bottom: el.offsetTop + el.offsetHeight }
          : null;
      }).filter(Boolean);
    };

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastScrollYRef.current;

        setIsScrolled((prev) => {
          const next = y > 30;
          return prev === next ? prev : next;
        });

        // Only compute desktop nav dock & active section state on desktop viewports (>= 1024px)
        if (isDesktopViewport) {
          if (y <= 30) {
            setNavDockHidden((prev) => (prev ? false : prev));
          } else if (delta > 30 && y > 200) {
            setNavDockHidden((prev) => (prev ? prev : true));
          } else if (delta < -18) {
            setNavDockHidden((prev) => (prev ? false : prev));
          }

          const scrollPos = y + 160;
          for (let i = 0; i < cachedBounds.length; i++) {
            const b = cachedBounds[i];
            if (scrollPos >= b.top && scrollPos < b.bottom) {
              setActiveSection((prev) => (prev === b.id ? prev : b.id));
              break;
            }
          }
        }

        lastScrollYRef.current = y;
        ticking = false;
      });
    };

    measureSections();
    const DelayedMeasure = setTimeout(measureSections, 900);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', measureSections, { passive: true });
    return () => {
      clearTimeout(DelayedMeasure);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', measureSections);
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { id: 'home', label: t.nav.home, Icon: Home },
    { id: 'directory', label: t.nav.directory, Icon: Users },
    { id: 'mentorship', label: t.nav.mentorship, Icon: Compass },
    { id: 'jobs', label: t.nav.jobs, Icon: Briefcase },
    { id: 'events', label: t.nav.events, Icon: Calendar, badge: lang === 'hi' ? 'अभ्युदय 2026' : 'Abhyuday 2026' },
    { id: 'gallery', label: t.nav.gallery, Icon: Camera },
    { id: 'giving', label: t.nav.giving, Icon: HeartHandshake },
  ];

  const scrollTo = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const userAvatar = (currentUser?.avatar_url && typeof currentUser.avatar_url === 'string' && currentUser.avatar_url.trim() !== '')
    ? currentUser.avatar_url
    : ((currentUser?.avatar && typeof currentUser.avatar === 'string' && currentUser.avatar.trim() !== '') ? currentUser.avatar : null);
  const userName = isAdmin ? 'Admin' : (currentUser?.first_name || currentUser?.name || currentUser?.full_name || currentUser?.email?.split('@')[0] || 'Alumnus');

  // Determine Top Right Corner Notification Badge on the User Button
  let notificationBadge = null;

  if (scheduledMentorshipCount > 0) {
    notificationBadge = {
      count: scheduledMentorshipCount + acceptedApplicationCount,
      bgColorClass: 'bg-emerald-600',
      textColorClass: 'text-white',
      title: lang === 'hi'
        ? `🎉 ${scheduledMentorshipCount} मार्गदर्शन सत्र निर्धारित (Mentorship Scheduled)!`
        : `🎉 ${scheduledMentorshipCount} Mentorship Session Scheduled!`,
      status: 'scheduled_mentorship'
    };
  } else if (receivedMentorshipCount > 0) {
    notificationBadge = {
      count: receivedMentorshipCount + applicationCount,
      bgColorClass: 'bg-[#fc4a00]',
      textColorClass: 'text-white',
      title: lang === 'hi'
        ? `🧭 ${receivedMentorshipCount} नए मार्गदर्शन अनुरोध (Mentorship Requests)!`
        : `🧭 ${receivedMentorshipCount} New Mentorship Request(s)!`,
      status: 'incoming_mentorship'
    };
  } else if (acceptedApplicationCount > 0) {
    notificationBadge = {
      count: acceptedApplicationCount,
      bgColorClass: 'bg-emerald-600',
      textColorClass: 'text-white',
      title: lang === 'hi' ? `🎉 ${acceptedApplicationCount} रेफरल स्वीकृत (Accepted)!` : `🎉 ${acceptedApplicationCount} Referral Accepted!`,
      status: 'accepted'
    };
  } else if (underReviewApplicationCount > 0) {
    notificationBadge = {
      count: underReviewApplicationCount,
      bgColorClass: 'bg-[#fc4a00]',
      textColorClass: 'text-white',
      title: lang === 'hi' ? `🔍 ${underReviewApplicationCount} आवेदन समीक्षाधीन (Under Review)` : `🔍 ${underReviewApplicationCount} Application Under Review`,
      status: 'under_review'
    };
  } else if (rejectedApplicationCount > 0) {
    notificationBadge = {
      count: rejectedApplicationCount,
      bgColorClass: 'bg-red-600',
      textColorClass: 'text-white',
      title: lang === 'hi' ? `❌ ${rejectedApplicationCount} आवेदन अस्वीकृत (Declined)` : `❌ ${rejectedApplicationCount} Application Declined`,
      status: 'rejected'
    };
  } else if (applicationCount > 0) {
    notificationBadge = {
      count: applicationCount,
      bgColorClass: 'bg-red-600',
      textColorClass: 'text-white',
      title: lang === 'hi' ? `📄 ${applicationCount} नए प्राप्त आवेदन (New Incoming)` : `📄 ${applicationCount} Received Applications`,
      status: 'incoming'
    };
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40">
      {/* Main Brand & Utilities Bar in 3D Water-Glass (Liquid Crystal 3D Glassmorphism) */}
      <div
        className={`relative z-30 transition-[box-shadow,border-color,background-color] duration-200 overflow-visible py-2 sm:py-2.5 ${
          isScrolled
            ? 'bg-gradient-to-b from-white/98 via-sky-50/96 to-sky-100/95 sm:from-white/92 sm:via-sky-50/88 sm:to-sky-100/85 sm:backdrop-blur-md border-b-2 border-sky-300/75 shadow-[0_10px_24px_-8px_rgba(2,132,199,0.18),inset_0_2px_3px_rgba(255,255,255,1)]'
            : 'bg-gradient-to-b from-white/96 via-sky-50/94 to-cyan-100/92 sm:from-white/90 sm:via-sky-50/82 sm:to-cyan-100/76 sm:backdrop-blur-md border-b-2 border-sky-300/65 shadow-[0_8px_20px_-6px_rgba(2,132,199,0.14),inset_0_2px_3px_rgba(255,255,255,1)]'
        }`}
      >
        {/* 3D Water-Glass Curved Glossy Dome & Specular Rim */}
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/80 via-white/30 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-sky-200/50 via-white to-sky-200/50 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400/75 to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-2 sm:gap-4">

            {/* Brand: Official Logo + Responsive Typography */}
            <div
              onClick={() => scrollTo('home')}
              className="flex items-center gap-2.5 sm:gap-3.5 cursor-pointer group min-w-0 flex-1 sm:flex-initial"
            >
              <div className="shrink-0 flex items-center justify-center">
                <img
                  src="/mcu-logo.png"
                  alt="MCU Bhopal Official Crest"
                  className="h-12 sm:h-14 md:h-16 w-auto object-contain drop-shadow-[0_6px_10px_rgba(0,51,102,0.22)] group-hover:scale-105 transition-transform"
                />
              </div>

              <div className="flex flex-col justify-center min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h1 className="hidden sm:block text-base sm:text-[18px] md:text-[19px] font-bold text-[#002244] group-hover:text-[#fc4a00] transition-colors font-editorial leading-tight tracking-tight drop-shadow-[0_1px_0_rgba(255,255,255,0.9)]">
                    {lang === 'hi'
                      ? 'माखनलाल चतुर्वेदी राष्ट्रीय पत्रकारिता एवं संचार विश्वविद्यालय'
                      : 'Makhanlal Chaturvedi National University of Journalism'}
                  </h1>
                  <h1 className="sm:hidden text-sm min-[400px]:text-base font-bold text-[#002244] group-hover:text-[#fc4a00] transition-colors font-editorial leading-tight truncate drop-shadow-[0_1px_0_rgba(255,255,255,0.9)]">
                    {lang === 'hi'
                      ? 'माखनलाल चतुर्वेदी वि.वि.'
                      : 'MCU University Bhopal'}
                  </h1>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-gradient-to-b from-[#ff6a00] via-[#fc4a00] to-[#b91c1c] text-white rounded-full border border-amber-300/70 shadow-[0_3px_8px_rgba(252,74,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.6)] shrink-0">
                    ESTD 1990
                  </span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-[12px] sm:text-[14px] text-[#8d0303] font-bold tracking-wide mt-0.5 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)] animate-pulse shrink-0" />
                  <span className="truncate">
                    {lang === 'hi' ? 'पूर्व छात्र महासंघ' : 'MCU Alumni Association'}
                  </span>
                  <span className="text-sky-400 hidden min-[380px]:inline">•</span>
                  <span className="text-[#003366]/90 font-semibold hidden min-[380px]:inline truncate">
                    {lang === 'hi' ? 'राष्ट्रीय मीडिया एवं तकनीकी नेटवर्क' : 'National Media & Tech Network'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Action Utilities (3D Water-Glass Capsules) */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              {/* Spotlight Command Search Pill (Ctrl+K) */}
              <button
                onClick={() => onQuickSearch('')}
                className="h-8 sm:h-9 px-2 sm:px-3 rounded-xl bg-gradient-to-b from-white via-sky-50/90 to-sky-100/80 hover:from-white hover:to-sky-50 text-slate-700 hover:text-[#003366] text-xs font-semibold border border-sky-300/85 hover:border-[#0284c7] flex items-center justify-between gap-2 transition-all duration-200 hover:-translate-y-0.5 shrink-0 group cursor-pointer shadow-[0_6px_16px_-4px_rgba(2,132,199,0.2),inset_0_2px_2px_rgba(255,255,255,1),inset_0_-2px_4px_rgba(14,165,233,0.18)]"
                title="Instant Spotlight Search (Ctrl + K)"
              >
                <span className="flex items-center gap-1.5 truncate">
                  <Search className="w-3.5 h-3.5 text-[#fc4a00] group-hover:scale-110 transition-transform shrink-0" />
                  <span className="hidden md:inline text-slate-600 group-hover:text-[#003366] truncate">
                    {lang === 'hi' ? 'त्वरित खोज...' : 'Quick Search...'}
                  </span>
                  <span className="md:hidden hidden sm:inline">
                    {lang === 'hi' ? 'खोजें' : 'Search'}
                  </span>
                </span>
                <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded-md bg-gradient-to-b from-white to-sky-100 border border-sky-300 text-[10px] font-mono font-bold text-[#003366] leading-none shrink-0 shadow-[0_2px_0_rgba(2,132,199,0.25),inset_0_1px_0_rgba(255,255,255,1)]">
                  Ctrl K
                </kbd>
              </button>

              {/* Language Switcher (3D Aqua-Sapphire Glass Button) */}
              <button
                onClick={toggleLanguage}
                className="h-8 sm:h-9 px-2 sm:px-3 rounded-xl bg-gradient-to-b from-[#0284c7] via-[#0369a1] to-[#003366] hover:from-[#0369a1] hover:to-[#002244] text-white text-xs font-bold border border-sky-300/70 flex items-center gap-1 sm:gap-1.5 transition-all duration-200 hover:-translate-y-0.5 shadow-[0_6px_14px_-3px_rgba(2,132,199,0.45),inset_0_2px_2px_rgba(255,255,255,0.6),inset_0_-2px_4px_rgba(0,0,0,0.25)] shrink-0 cursor-pointer"
                title="Toggle Language / भाषा बदलें"
              >
                <Globe className="w-3.5 h-3.5 text-amber-300" />
                <span>{lang === 'en' ? 'हिंदी' : 'EN'}</span>
              </button>

              {/* Authenticated User Display vs Guest Login/Register Buttons */}
              {currentUser ? (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {/* Stealth Admin Control Panel Button (Only visible when logged in as Admin) */}
                  {isAdmin && onOpenAdminPanel && (
                    <button
                      type="button"
                      onClick={() => onOpenAdminPanel('overview')}
                      className="relative h-8 sm:h-9 px-2 sm:px-3.5 rounded-xl bg-gradient-to-r from-[#001a35] via-[#002855] to-[#0284c7] hover:brightness-110 text-white border border-amber-300/80 flex items-center gap-1 sm:gap-1.5 text-xs font-extrabold shadow-[0_6px_16px_-3px_rgba(0,40,85,0.45)] transition-all duration-200 hover:-translate-y-0.5 cursor-pointer shrink-0"
                      title="Open MCU Executive Admin Control Panel"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                      <span className="hidden md:inline">
                        {lang === 'hi' ? 'प्रशासक पैनल (Admin)' : 'Admin Panel'}
                      </span>
                      {adminPendingCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-[#fc4a00] text-white text-[9px] font-black animate-pulse">
                          {adminPendingCount}
                        </span>
                      )}
                    </button>
                  )}

                <div className="relative" ref={dropdownRef}>
                  {/* User Button (3D Water-Glass Capsule) */}
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="relative h-8 w-8 sm:h-9 sm:w-auto p-1 sm:px-2.5 rounded-xl bg-gradient-to-b from-white via-sky-50/90 to-sky-100/80 hover:from-white hover:to-sky-50 text-[#002244] border border-sky-300/85 hover:border-[#0284c7] flex items-center justify-center gap-1 sm:gap-2 text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 shadow-[0_6px_15px_-3px_rgba(2,132,199,0.22),inset_0_2px_2px_rgba(255,255,255,1),inset_0_-2px_4px_rgba(14,165,233,0.2)] shrink-0 group cursor-pointer"
                    title="Your Profile & Settings"
                  >
                    {notificationBadge && (
                      <span
                        className={`absolute -top-1 -right-1 min-w-[15px] h-[15px] px-0.5 rounded-full ${notificationBadge.bgColorClass} ${notificationBadge.textColorClass || 'text-white'} text-[9px] font-bold flex items-center justify-center animate-pulse border border-white shadow-xs z-10`}
                        title={notificationBadge.title}
                      >
                        {notificationBadge.count}
                      </span>
                    )}
                    {userAvatar ? (
                      <img
                        src={userAvatar}
                        alt={userName}
                        className="w-6 h-6 rounded-lg object-cover border border-[#003366]/35 shadow-xs"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#fc4a00] to-[#8d0303] text-white flex items-center justify-center text-xs font-bold shadow-xs border border-amber-300/60">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="hidden sm:inline max-w-[110px] truncate text-[#002244] font-bold">
                      {userName}
                    </span>
                    <ChevronDown className="hidden sm:block w-3 h-3 text-[#fc4a00] transition-transform group-hover:translate-y-0.5" />
                  </button>

                  {/* Dropdown Menu */}
                  {userDropdownOpen && (
                    <div className={`absolute -right-9 sm:right-0 ${isAdmin ? 'mt-1 p-2 space-y-0' : 'mt-2 p-2.5 space-y-0.5'} w-[calc(100vw-1.5rem)] max-w-[315px] sm:w-[340px] sm:max-w-none max-h-[calc(100vh-4.5rem)] overflow-y-auto bg-white rounded-2xl shadow-2xl border-2 border-[#003366]/20 text-slate-800 z-50 animate-fadeIn`}>
                      {/* User Header in Dropdown */}
                      <div className={`px-3 ${isAdmin ? 'py-1.5 mb-1' : 'py-2.5 mb-1.5'} bg-gradient-to-r from-slate-50 to-amber-50/40 rounded-xl flex items-center gap-3.5 border border-slate-200/90 shadow-2xs`}>
                        {userAvatar ? (
                          <img
                            src={userAvatar}
                            alt={userName}
                            className="w-14 h-14 sm:w-[58px] sm:h-[58px] rounded-2xl object-cover border-2 border-[#003366] ring-2 ring-[#003366]/10 shadow-md shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-14 sm:w-[58px] sm:h-[58px] rounded-2xl bg-gradient-to-br from-[#003366] to-[#002244] text-white flex items-center justify-center font-bold text-xl font-editorial shrink-0 shadow-md border-2 border-amber-300/30 ring-2 ring-[#003366]/10">
                            {userName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1 leading-tight">
                          <h4 className="text-sm sm:text-[15px] font-bold text-[#003366] truncate font-editorial">
                            {isAdmin ? 'Admin' : (currentUser.full_name || currentUser.name || userName)}
                          </h4>
                          <p className="text-xs text-slate-600 font-medium truncate mt-0.5">
                            {isAdmin
                              ? 'Alumni Portal Administrator'
                              : ((currentUser.current_role && currentUser.current_role !== 'Media Professional')
                                ? currentUser.current_role
                                : ((currentUser.currentRole && currentUser.currentRole !== 'Media Professional')
                                  ? currentUser.currentRole
                                  : 'Software Engineer'))}
                          </p>
                          {(currentUser.batch_year || currentUser.batch) && (
                            <span className="inline-block mt-1 text-[10.5px] font-bold text-[#fc4a00] bg-[#fc4a00]/10 px-2 py-0.5 rounded-md border border-[#fc4a00]/20">
                              Batch {currentUser.batch_year || currentUser.batch}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Executive Admin Control Center Option (Only for Admin) */}
                      {isAdmin && onOpenAdminPanel && (
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            onOpenAdminPanel('overview');
                          }}
                          className={`w-full text-left px-3 ${isAdmin ? 'py-1.5' : 'py-2'} rounded-xl text-[13px] sm:text-[13.5px] font-bold text-[#003366] hover:text-[#fc4a00] hover:bg-sky-50/80 flex items-center gap-3 transition-colors group cursor-pointer`}
                        >
                          <div className="w-8 h-8 rounded-xl bg-sky-100/90 group-hover:bg-[#003366] group-hover:text-white text-[#003366] border border-sky-200/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] flex items-center justify-center transition-colors shrink-0">
                            <ShieldCheck className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0 leading-snug">
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="truncate">{lang === 'hi' ? 'मुख्य प्रशासक पैनल (Admin)' : 'Admin Control Center'}</span>
                              {adminPendingCount > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-[#fc4a00] text-white text-[10px] font-black shrink-0">
                                  {adminPendingCount} Pending
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-normal truncate">
                              {lang === 'hi'
                                ? 'पूर्व छात्र, जॉब सत्यापन व मेमोरी अपलोड'
                                : 'Verify alumni, jobs & upload year memories'}
                            </div>
                          </div>
                        </button>
                      )}

                      {/* Edit Profile & Photo Button */}
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenProfile();
                        }}
                        className={`w-full text-left px-3 ${isAdmin ? 'py-1.5' : 'py-2'} rounded-xl text-[13px] sm:text-[13.5px] font-bold text-slate-700 hover:text-[#003366] hover:bg-slate-100/90 flex items-center gap-3 transition-colors group`}
                      >
                        <div className="w-8 h-8 rounded-xl bg-[#003366]/10 group-hover:bg-[#003366] group-hover:text-white text-[#003366] flex items-center justify-center transition-colors shrink-0">
                          <Edit3 className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0 leading-snug">
                          <div className="truncate">{lang === 'hi' ? 'प्रोफ़ाइल एवं फ़ोटो संपादित करें' : 'Edit Profile & Photo'}</div>
                          <div className="text-[11px] text-slate-500 font-normal truncate">
                            {lang === 'hi' ? 'फ़ोटो, भूमिका, संस्थान, संपर्क' : 'Update photo, role, company, bio'}
                          </div>
                        </div>
                      </button>

                      {/* Job Posting & Referral Management Options — Restricted to Alumni & Admin ONLY */}
                      {!isStudent && (
                        <>
                          {/* Post an Opportunity Option */}
                          <button
                            onClick={() => {
                              setUserDropdownOpen(false);
                              if (onOpenPostJob) onOpenPostJob();
                            }}
                            className={`w-full text-left px-3 ${isAdmin ? 'py-1.5' : 'py-2'} rounded-xl text-[13px] sm:text-[13.5px] font-bold text-[#8d0303] hover:text-[#fc4a00] hover:bg-amber-50/90 flex items-center gap-3 transition-colors group`}
                          >
                            <div className="w-8 h-8 rounded-xl bg-[#8d0303]/10 group-hover:bg-[#8d0303] group-hover:text-white text-[#8d0303] flex items-center justify-center transition-colors shrink-0">
                              <Briefcase className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0 leading-snug">
                              <div className="flex items-center gap-1.5">
                                <span className="truncate">{lang === 'hi' ? 'रोजगार अवसर पोस्ट करें' : 'Post an Opportunity'}</span>
                                {isVerified ? (
                                  <span className="text-[10px] bg-[#fc4a00] text-white font-bold px-2 py-0.5 rounded-full shrink-0">Jobs</span>
                                ) : (
                                  <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2 py-0.5 rounded-full shrink-0">
                                    🔒 {lang === 'hi' ? 'एडमिन सत्यापन लंबित' : 'Pending Admin'}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 font-normal truncate">
                                {isVerified
                                  ? (lang === 'hi' ? 'Jobs & Careers में प्रसारित करें' : 'Broadcast to Jobs & Careers')
                                  : (lang === 'hi' ? 'एमसीयू एडमिन सत्यापन के बाद उपलब्ध' : 'Unlocks after MCU Admin verification')}
                              </div>
                            </div>
                          </button>

                          {/* Manage My Posted Jobs Option */}
                          <button
                            onClick={() => {
                              setUserDropdownOpen(false);
                              if (onOpenMyJobs) {
                                onOpenMyJobs();
                              } else if (onOpenProfile) {
                                onOpenProfile('job');
                              }
                            }}
                            className={`w-full text-left px-3 ${isAdmin ? 'py-1.5' : 'py-2'} rounded-xl text-[13px] sm:text-[13.5px] font-bold text-[#003366] hover:text-[#fc4a00] hover:bg-blue-50/70 flex items-center gap-3 transition-colors group`}
                          >
                            <div className="w-8 h-8 rounded-xl bg-[#003366]/10 group-hover:bg-[#003366] group-hover:text-white text-[#003366] flex items-center justify-center transition-colors shrink-0">
                              <Briefcase className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0 leading-snug">
                              <div className="flex items-center justify-between gap-1.5">
                                <span className="truncate">{lang === 'hi' ? 'मेरे पोस्ट किए गए अवसर व प्रबंधन' : 'My Posted Jobs & Management'}</span>
                                <span className="text-[10px] bg-red-600 text-white font-bold px-2 py-0.5 rounded-full shrink-0">Manage</span>
                              </div>
                              <div className="text-[11px] text-slate-500 font-normal truncate">
                                {lang === 'hi' ? 'अपने अवसर ट्रैक करें या हटाएं' : 'Track or delete your opportunities'}
                              </div>
                            </div>
                          </button>

                          {/* Received Student Referral Applications (Incoming for Alumnus) */}
                          <button
                            onClick={() => {
                              setUserDropdownOpen(false);
                              if (onOpenApplications) {
                                onOpenApplications();
                              } else if (onOpenProfile) {
                                onOpenProfile('applications');
                              }
                            }}
                            className={`w-full text-left px-3 ${isAdmin ? 'py-1.5' : 'py-2'} rounded-xl text-[13px] sm:text-[13.5px] font-bold text-[#003366] hover:text-[#fc4a00] hover:bg-emerald-50/70 flex items-center gap-3 transition-colors group`}
                          >
                            <div className="w-8 h-8 rounded-xl bg-emerald-100 group-hover:bg-emerald-600 group-hover:text-white text-emerald-800 flex items-center justify-center transition-colors shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0 leading-snug">
                              <div className="flex items-center gap-1.5">
                                <span className="truncate">{lang === 'hi' ? 'प्राप्त छात्र रेफरल आवेदन' : 'Received Applications'}</span>
                                {applicationCount > 0 && (
                                  <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full animate-pulse shrink-0">
                                    {applicationCount} New
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 font-normal truncate">
                                {lang === 'hi' ? 'छात्रों के रिज्यूमे देखें व स्थिति बदलें' : 'View resumes & candidate credentials'}
                              </div>
                            </div>
                          </button>
                        </>
                      )}

                      {/* My Submitted Applications (Outgoing for Applicant) */}
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          if (onOpenMyApplications) {
                            onOpenMyApplications();
                          } else if (onOpenProfile) {
                            onOpenProfile('my_applications');
                          }
                        }}
                        className={`w-full text-left px-3 ${isAdmin ? 'py-1.5' : 'py-2'} rounded-xl text-[13px] sm:text-[13.5px] font-bold text-[#8d0303] hover:text-[#fc4a00] hover:bg-amber-50/80 flex items-center gap-3 transition-colors group`}
                      >
                        <div className="w-8 h-8 rounded-xl bg-amber-100 group-hover:bg-[#8d0303] group-hover:text-white text-[#8d0303] flex items-center justify-center transition-colors shrink-0">
                          <Send className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0 leading-snug">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate">{lang === 'hi' ? 'मेरे द्वारा किए गए आवेदन' : 'My Applied Jobs'}</span>
                            {acceptedApplicationCount > 0 ? (
                              <span className="text-[10px] bg-emerald-600 text-white font-black px-2 py-0.5 rounded-full animate-bounce shadow-xs shrink-0">
                                🎉 {acceptedApplicationCount} Accepted
                              </span>
                            ) : underReviewApplicationCount > 0 ? (
                              <span className="text-[10px] bg-[#fc4a00] text-white font-bold px-2 py-0.5 rounded-full shadow-xs shrink-0">
                                🔍 {underReviewApplicationCount} Under Review
                              </span>
                            ) : rejectedApplicationCount > 0 ? (
                              <span className="text-[10px] bg-red-600 text-white font-bold px-2 py-0.5 rounded-full shadow-xs shrink-0">
                                ❌ {rejectedApplicationCount} Declined
                              </span>
                            ) : mySubmittedCount > 0 ? (
                              <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full shrink-0">
                                {mySubmittedCount}
                              </span>
                            ) : null}
                          </div>
                          <div className="text-[11px] text-slate-500 font-normal truncate">
                            {lang === 'hi' ? 'रेफरल स्थिति व पूर्व छात्र स्वीकृति देखें' : 'Track referral status & approvals'}
                          </div>
                        </div>
                      </button>

                      {/* Mentorship Requests & Session Schedule Notification Option */}
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          if (onOpenMentorship) {
                            onOpenMentorship();
                          } else if (onOpenProfile) {
                            onOpenProfile('mentorship');
                          }
                        }}
                        className={`w-full text-left px-3 ${isAdmin ? 'py-1.5' : 'py-2'} rounded-xl text-[13px] sm:text-[13.5px] font-bold text-[#003366] hover:text-[#fc4a00] hover:bg-sky-50/80 flex items-center gap-3 transition-colors group`}
                      >
                        <div className="w-8 h-8 rounded-xl bg-sky-100 group-hover:bg-[#fc4a00] group-hover:text-white text-[#0284c7] flex items-center justify-center transition-colors shrink-0">
                          <Compass className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0 leading-snug">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate">
                              {isStudent
                                ? (lang === 'hi' ? 'मेरे मार्गदर्शन सत्र (Mentorship)' : 'My Mentorship Sessions')
                                : (lang === 'hi' ? 'मार्गदर्शन अनुरोध व सत्र (Mentorship)' : 'Mentorship Requests & Schedule')}
                            </span>
                            {scheduledMentorshipCount > 0 ? (
                              <span className="text-[10px] bg-emerald-600 text-white font-black px-2 py-0.5 rounded-full animate-bounce shadow-xs shrink-0">
                                🎉 {scheduledMentorshipCount} Scheduled
                              </span>
                            ) : receivedMentorshipCount > 0 ? (
                              <span className="text-[10px] bg-[#fc4a00] text-white font-bold px-2 py-0.5 rounded-full animate-pulse shrink-0">
                                🧭 {receivedMentorshipCount} New
                              </span>
                            ) : myMentorshipCount > 0 ? (
                              <span className="text-[10px] bg-sky-100 text-[#003366] font-bold px-2 py-0.5 rounded-full shrink-0">
                                {myMentorshipCount}
                              </span>
                            ) : null}
                          </div>
                          <div className="text-[11px] text-slate-500 font-normal truncate">
                            {isStudent
                              ? (lang === 'hi' ? 'पूर्व छात्र द्वारा निर्धारित सत्र समय व लिंक देखें' : 'View scheduled session date, time & link')
                              : (lang === 'hi' ? 'छात्रों के अनुरोध देखें व खाली समय में सत्र तय करें' : 'Review student requests & schedule free slot')}
                          </div>
                        </div>
                      </button>

                      {/* Sign Out Button */}
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onLogout();
                        }}
                        className={`w-full text-left px-3 ${isAdmin ? 'py-1.5 mt-0.5 pt-1.5' : 'py-2 mt-1 pt-2'} rounded-xl text-[13px] sm:text-[13.5px] font-bold text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors border-t border-slate-100`}
                      >
                        <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                          <LogOut className="w-4 h-4" />
                        </div>
                        <span>{lang === 'hi' ? 'लॉग आउट (Sign Out)' : 'Sign Out'}</span>
                      </button>
                    </div>
                  )}
                </div>
                </div>
              ) : (
                <>
                  {/* Join / Register Button (3D Saffron Jewel Pill) */}
                  <button
                    onClick={() => onOpenAuth('register')}
                    className="h-9 hidden sm:flex items-center gap-1.5 px-3 md:px-4 rounded-xl text-xs font-bold bg-gradient-to-b from-[#ff6a00] via-[#fc4a00] to-[#b91c1c] text-white border border-amber-300/70 tracking-wide shadow-[0_6px_15px_-3px_rgba(252,74,0,0.45),inset_0_2px_2px_rgba(255,255,255,0.6),inset_0_-2px_4px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 hover:brightness-105 transition-all duration-200 shrink-0 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{t.nav.register}</span>
                  </button>

                  {/* Sign In Button (3D Water-Glass Capsule) */}
                  <button
                    onClick={() => onOpenAuth('login')}
                    className="h-9 hidden lg:flex items-center gap-1.5 px-3.5 rounded-xl text-xs font-bold text-[#003366] bg-gradient-to-b from-white via-sky-50/90 to-sky-100/80 hover:from-white hover:to-sky-50 border border-sky-300/85 hover:border-[#0284c7] transition-all duration-200 hover:-translate-y-0.5 shadow-[0_6px_15px_-3px_rgba(2,132,199,0.2),inset_0_2px_2px_rgba(255,255,255,1),inset_0_-2px_4px_rgba(14,165,233,0.18)] shrink-0 cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5 text-[#fc4a00]" />
                    <span>{t.nav.signIn}</span>
                  </button>
                </>
              )}

              {/* Mobile Menu Button (3D Water-Glass Tile) */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="h-8 w-8 sm:h-9 sm:w-9 lg:hidden flex items-center justify-center rounded-xl bg-gradient-to-b from-white via-sky-50/90 to-sky-100/80 text-[#003366] hover:from-white hover:to-sky-50 border border-sky-300/85 transition-all shadow-[0_5px_12px_-3px_rgba(2,132,199,0.2),inset_0_2px_2px_rgba(255,255,255,1),inset_0_-2px_4px_rgba(14,165,233,0.18)] shrink-0"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* ── EXECUTIVE 3D WATER-GLASS NAVIGATION DOCK (Desktop) ── */}
      <div
        className={`relative z-10 hidden lg:block transition-[transform,opacity] duration-200 ease-out will-change-transform origin-top ${
          navDockHidden
            ? '-translate-y-full opacity-0 pointer-events-none'
            : 'translate-y-0 opacity-100'
        } ${
          isScrolled
            ? 'bg-gradient-to-b from-sky-50/94 via-white/92 to-sky-100/90 backdrop-blur-md border-b-2 border-sky-300/75 shadow-[0_10px_24px_-10px_rgba(2,132,199,0.18),inset_0_1.5px_2px_rgba(255,255,255,0.95)]'
            : 'bg-gradient-to-b from-sky-50/90 via-white/88 to-cyan-50/86 backdrop-blur-md border-b border-sky-300/65 shadow-[0_6px_18px_-8px_rgba(2,132,199,0.12),inset_0_1.5px_2px_rgba(255,255,255,0.9)]'
        }`}
      >
        {/* Top Specular Sheen on Nav Dock */}
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/70 to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between py-1.5">
            {/* 3D Sculpted Water-Glass Navigation Channel Track */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-gradient-to-b from-sky-200/45 via-sky-100/55 to-white/90 border border-sky-300/80 shadow-[inset_0_2px_5px_rgba(2,132,199,0.16),0_2px_4px_rgba(255,255,255,0.95)]">
              {navLinks.map((link) => {
                const isActive = activeSection === link.id;
                const NavIcon = link.Icon;
                return (
                  <button
                    key={link.id}
                    onClick={() => scrollTo(link.id)}
                    className={`relative px-3.5 py-1.5 text-xs rounded-xl transition-all duration-200 whitespace-nowrap flex items-center gap-1.5 cursor-pointer group ${
                      isActive
                        ? 'bg-gradient-to-b from-[#ff6a00] via-[#fc4a00] to-[#8d0303] text-white font-bold shadow-[0_6px_16px_-2px_rgba(252,74,0,0.45),inset_0_2px_2px_rgba(255,255,255,0.65),inset_0_-2px_4px_rgba(0,0,0,0.25)] border border-amber-300/70 -translate-y-[1px]'
                        : 'text-[#002855] font-bold hover:text-[#003366] hover:-translate-y-0.5 hover:bg-gradient-to-b hover:from-white hover:via-sky-50/95 hover:to-sky-100/85 hover:shadow-[0_6px_14px_-3px_rgba(2,132,199,0.22),inset_0_2px_1px_rgba(255,255,255,1),inset_0_-2px_3px_rgba(14,165,233,0.18)] border border-transparent hover:border-sky-300/80'
                    }`}
                  >
                    {NavIcon && (
                      <NavIcon
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          isActive
                            ? 'text-amber-200 scale-105'
                            : 'text-[#0284c7] group-hover:text-[#fc4a00] group-hover:scale-110'
                        }`}
                      />
                    )}
                    <span>{link.label}</span>
                    {link.badge && (
                      <span
                        className={`px-1.5 py-0.5 text-[9px] font-black rounded-md uppercase tracking-wider shadow-2xs ${
                          isActive
                            ? 'bg-white text-[#680a13]'
                            : 'bg-gradient-to-b from-amber-300 to-amber-400 text-slate-950 border border-amber-500/30'
                        }`}
                      >
                        {link.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Right-Side Campus Network Status */}
            <div className="hidden xl:flex items-center gap-3 pl-4">
              <div className="px-3.5 py-1.5 rounded-xl bg-white/75 border border-sky-200/85 shadow-[inset_0_1px_2px_rgba(255,255,255,1),0_2px_6px_rgba(2,132,199,0.08)] flex items-center gap-2 text-[11px] text-[#003366] font-bold whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] shrink-0" />
                <span>{lang === 'hi' ? 'भोपाल • रीवा • खंडवा • दतिया' : 'Bhopal • Rewa • Khandwa • Datia'}</span>
              </div>
            </div>
          </nav>
        </div>
      </div>

      {/* Mobile Menu Drawer (3D Water-Glass) */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-gradient-to-b from-white/96 via-sky-50/95 to-sky-100/95 backdrop-blur-2xl text-slate-800 px-4 pt-3 pb-6 animate-fadeIn shadow-[0_20px_40px_-10px_rgba(2,132,199,0.25)] border-b-2 border-sky-300/80">
          {/* Mobile User Card if Logged In */}
          {currentUser && (
            <div className="p-3 mb-3 rounded-xl bg-gradient-to-b from-white to-sky-50/90 border border-sky-300/80 shadow-[0_6px_14px_-4px_rgba(2,132,199,0.15),inset_0_2px_2px_rgba(255,255,255,1)] flex items-center gap-3">
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={userName}
                  className="w-11 h-11 rounded-xl object-cover border-2 border-[#003366] shrink-0"
                />
              ) : (
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#fc4a00] to-[#8d0303] text-white flex items-center justify-center font-bold text-base font-editorial shrink-0 shadow-sm border-2 border-amber-300/50">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-[#002244] truncate">
                  {userName}
                </div>
                <div className="text-xs text-[#8d0303] font-semibold truncate">
                  {(currentUser.current_role && currentUser.current_role !== 'Media Professional')
                    ? currentUser.current_role
                    : ((currentUser.currentRole && currentUser.currentRole !== 'Media Professional')
                      ? currentUser.currentRole
                      : 'Software Engineer')}
                </div>
                {(currentUser.batch_year || currentUser.batch) && (
                  <span className="text-[10px] text-[#003366] font-bold">
                    Batch of {currentUser.batch_year || currentUser.batch}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5 mb-4">
            {navLinks.map((link) => {
              const NavIcon = link.Icon;
              const isActive = activeSection === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  className={`text-left px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-between ${
                    isActive
                      ? 'bg-gradient-to-b from-[#ff6a00] via-[#fc4a00] to-[#8d0303] text-white shadow-[0_6px_14px_rgba(252,74,0,0.35),inset_0_2px_2px_rgba(255,255,255,0.6)] border border-amber-300/60'
                      : 'text-[#002855] bg-white/70 hover:bg-white border border-sky-200/80 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {NavIcon && (
                      <NavIcon className={`w-4 h-4 ${isActive ? 'text-amber-200' : 'text-[#0284c7]'}`} />
                    )}
                    <span>{link.label}</span>
                    {link.badge && (
                      <span className="px-2 py-0.5 text-[10px] bg-amber-400 text-slate-950 font-black rounded uppercase">
                        {link.badge}
                      </span>
                    )}
                  </div>
                  {isActive && <Sparkles className="w-4 h-4 text-amber-200" />}
                </button>
              );
            })}
          </div>

          {/* Mobile Auth Actions */}
          <div className="pt-3 border-t border-sky-200/80 flex flex-col gap-2">
            {currentUser ? (
              <>
                {isAdmin && onOpenAdminPanel && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAdminPanel('overview');
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[#001a35] via-[#002855] to-[#0284c7] text-white border border-amber-300 text-sm font-extrabold shadow-sm"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-300" />
                    <span>{lang === 'hi' ? 'प्रशासक नियंत्रण कक्ष (Admin Panel)' : 'Executive Admin Control Panel'}</span>
                    {adminPendingCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-[#fc4a00] text-white text-[10px] font-black">
                        {adminPendingCount}
                      </span>
                    )}
                  </button>
                )}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenProfile();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl btn-mcu-saffron text-sm font-bold"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>{lang === 'hi' ? 'प्रोफ़ाइल एवं फ़ोटो संपादित करें' : 'Edit Profile & Photo'}</span>
                </button>
                {!isStudent && (
                  <>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        if (onOpenPostJob) onOpenPostJob();
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-[#8d0303] border border-amber-300/60 text-sm font-bold transition-colors"
                    >
                      <Briefcase className="w-4 h-4 text-[#fc4a00]" />
                      <span>{lang === 'hi' ? 'रोजगार अवसर पोस्ट करें' : 'Post an Opportunity'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        if (onOpenMyJobs) {
                          onOpenMyJobs();
                        } else if (onOpenProfile) {
                          onOpenProfile('job');
                        }
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#003366] border border-sky-200 text-sm font-bold transition-colors"
                    >
                      <Briefcase className="w-4 h-4 text-[#003366]" />
                      <span>{lang === 'hi' ? 'मेरे पोस्ट किए गए अवसर व प्रबंधन' : 'My Posted Jobs & Management'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        if (onOpenApplications) {
                          onOpenApplications();
                        } else if (onOpenProfile) {
                          onOpenProfile('applications');
                        }
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-sm font-bold transition-colors"
                    >
                      <FileText className="w-4 h-4 text-emerald-700" />
                      <span>{lang === 'hi' ? 'प्राप्त छात्र रेफरल आवेदन' : 'Received Applications'}</span>
                      {applicationCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-600 text-white font-bold animate-pulse">
                          {applicationCount} New
                        </span>
                      )}
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onOpenMyApplications) {
                      onOpenMyApplications();
                    } else if (onOpenProfile) {
                      onOpenProfile('my_applications');
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-[#8d0303] border border-amber-200 text-sm font-bold transition-colors"
                >
                  <Send className="w-4 h-4 text-[#fc4a00]" />
                  <span>{lang === 'hi' ? 'मेरे द्वारा किए गए आवेदन' : 'My Applied Jobs'}</span>
                  {acceptedApplicationCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-600 text-white font-bold">
                      🎉 {acceptedApplicationCount} Accepted
                    </span>
                  ) : underReviewApplicationCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#fc4a00] text-white font-bold">
                      🔍 {underReviewApplicationCount} Under Review
                    </span>
                  ) : rejectedApplicationCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-600 text-white font-bold">
                      ❌ {rejectedApplicationCount} Declined
                    </span>
                  ) : null}
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onOpenMentorship) {
                      onOpenMentorship();
                    } else if (onOpenProfile) {
                      onOpenProfile('mentorship');
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#003366] border border-sky-200 text-sm font-bold transition-colors"
                >
                  <Compass className="w-4 h-4 text-[#fc4a00]" />
                  <span>
                    {isStudent
                      ? (lang === 'hi' ? 'मेरे मार्गदर्शन सत्र (Mentorship)' : 'My Mentorship Sessions')
                      : (lang === 'hi' ? 'मार्गदर्शन अनुरोध व सत्र (Mentorship)' : 'Mentorship Requests & Schedule')}
                  </span>
                  {scheduledMentorshipCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-600 text-white font-bold">
                      🎉 {scheduledMentorshipCount} Scheduled
                    </span>
                  ) : receivedMentorshipCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#fc4a00] text-white font-bold animate-pulse">
                      🧭 {receivedMentorshipCount} New
                    </span>
                  ) : null}
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-sm font-bold transition-colors"
                >
                  <LogOut className="w-4 h-4 text-red-600" />
                  <span>{lang === 'hi' ? 'लॉग आउट (Sign Out)' : 'Sign Out'}</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth('register');
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl btn-mcu-saffron text-sm font-bold"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{t.nav.register}</span>
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth('login');
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-b from-white to-sky-50 hover:bg-white text-[#003366] border border-sky-300 shadow-xs text-sm font-bold"
                >
                  <LogIn className="w-4 h-4 text-[#fc4a00]" />
                  <span>{t.nav.signIn}</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
