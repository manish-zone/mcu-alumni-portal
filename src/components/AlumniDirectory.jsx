import React, { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { alumniProfiles } from '../data/mockData';
import {
  Search,
  MapPin,
  Building2,
  GraduationCap,
  Sparkles,
  RotateCcw,
  ArrowUpRight,
  Compass,
  Calendar,
  LayoutGrid,
  List,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ShieldCheck
} from 'lucide-react';
import {
  getAlumniLinkedInUrl,
  getMcuLinkedInSearchUrl
} from '../utils/linkedin';
import { getProfileSkills, normalizeComputerProfile, isCurrentStudent } from '../utils/skills';
import { ScrollReveal, Tilt3DCard } from './ScrollReveal';


// Reusable official LinkedIn Icon component
export const LinkedInIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64c-.9 0-1.63.73-1.63 1.63s.73 1.63 1.63 1.63 1.63-.73 1.63-1.63c0-.9-.73-1.63-1.63-1.63Z" />
  </svg>
);

export const AlumniDirectory = ({
  searchQuery,
  onSearchQueryChange,
  onSelectAlumni,
  onRequestMentorship,
  profiles: externalProfiles = null,
}) => {
  const { lang, t, portalContent } = useLanguage();
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedCampus, setSelectedCampus] = useState('all');
  const [selectedBatch, setSelectedBatch] = useState('all');
  const [mentorOnly, setMentorOnly] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // 6 profiles per page to maintain fixed compact UI

  const effectiveProfiles = useMemo(() => {
    const raw = (externalProfiles && externalProfiles.length > 0)
      ? externalProfiles
      : alumniProfiles;
    return raw.map((p) => normalizeComputerProfile(p, alumniProfiles));
  }, [externalProfiles]);

  // Compute available batch years dynamically from loaded profiles + standard MCU graduation batches
  const availableBatches = useMemo(() => {
    const set = new Set();
    effectiveProfiles.forEach((p) => {
      const b = p.batch || p.batch_year;
      if (b) set.add(b.toString());
    });
    const standardYears = [
      '2026', '2025', '2024', '2023', '2022', '2021', '2020',
      '2019', '2018', '2017', '2016', '2015', '2014', '2013',
      '2012', '2011', '2010', '2008', '2006', '2005', '2000',
      '1995', '1991'
    ];
    standardYears.forEach((y) => set.add(y));
    return Array.from(set).sort((a, b) => parseInt(b, 10) - parseInt(a, 10));
  }, [effectiveProfiles]);

  // Filter profiles based on state
  const filteredProfiles = useMemo(() => {
    return effectiveProfiles.filter((profile) => {
      const name = profile.name || profile.full_name || '';
      const hindiName = profile.hindiName || profile.hindi_name || '';
      const company = profile.company || '';
      const currentRole = profile.currentRole || profile.current_role || '';
      const location = profile.location || '';
      const degree = profile.degree || '';
      const batch = (profile.batch || profile.batch_year || '').toString();
      const skills = getProfileSkills(profile);

      // Text search match
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query ||
        name.toLowerCase().includes(query) ||
        hindiName.includes(query) ||
        company.toLowerCase().includes(query) ||
        currentRole.toLowerCase().includes(query) ||
        degree.toLowerCase().includes(query) ||
        location.toLowerCase().includes(query) ||
        batch.includes(query) ||
        skills.some((s) => s.toLowerCase().includes(query));

      // Batch year match
      const matchesBatch = selectedBatch === 'all' || batch === selectedBatch;

      // Program / Dept match (All, MCA, BCA, M.Sc. CS, B.Tech CSE)
      const degLower = degree.toLowerCase();
      const matchesDept =
        selectedDept === 'all' ||
        selectedDept === 'computer_app' ||
        (selectedDept === 'mca' && (degLower.includes('mca') || degLower.includes('master of computer'))) ||
        (selectedDept === 'bca' && (degLower.includes('bca') || degLower.includes('bachelor of computer'))) ||
        (selectedDept === 'msc' && (degLower.includes('m.sc') || degLower.includes('msc') || degLower.includes('master of science'))) ||
        (selectedDept === 'btech' && (degLower.includes('b.tech') || degLower.includes('btech') || degLower.includes('engineering')));

      // Campus match
      const profileCampus = (profile.campus || profile.campus_name || '').toLowerCase();
      const matchesCampus = selectedCampus === 'all' || profileCampus.includes(selectedCampus.toLowerCase());

      // Mentor match
      const openMentor = profile.openToMentor ?? profile.open_to_mentor;
      const matchesMentor = !mentorOnly || openMentor;

      return matchesSearch && matchesBatch && matchesDept && matchesCampus && matchesMentor;
    });
  }, [effectiveProfiles, searchQuery, selectedBatch, selectedDept, selectedCampus, mentorOnly]);

  // Reset to first page when search/filter criteria changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedBatch, selectedDept, selectedCampus, mentorOnly]);

  const totalPages = Math.ceil(filteredProfiles.length / itemsPerPage) || 1;

  // Paginated subset of profiles
  const paginatedProfiles = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProfiles.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProfiles, currentPage, itemsPerPage]);

  // Compute page numbers with ellipsis for cleaner pagination display
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }
    if (currentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  const handlePageChange = (page) => {
    if (page === '...' || page === currentPage) return;
    setCurrentPage(page);
    const frameEl = document.getElementById('alumni-frame-container');
    if (frameEl) {
      frameEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const resetFilters = () => {
    onSearchQueryChange('');
    setSelectedBatch('all');
    setSelectedDept('all');
    setSelectedCampus('all');
    setMentorOnly(false);
    setCurrentPage(1);
  };

  return (
    <section id="directory" className="pt-10 pb-16 relative z-10 bg-gradient-to-b from-[#f8fbff]/95 via-white/95 to-[#f0f9ff]/90 border-t border-sky-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <ScrollReveal variant="fade-up">
          <div className="text-center max-w-3xl mx-auto mb-7">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#003366] tracking-tight font-editorial">
              {t.sections.directoryTitle}
            </h2>
            <p className="mt-1.5 text-sm sm:text-base text-slate-600 font-normal max-w-2xl mx-auto leading-relaxed">
              {t.sections.directorySubtitle}
            </p>
          </div>
        </ScrollReveal>

        {/* 3D Water-Glass Executive Networking Filter Console */}
        <ScrollReveal variant="tilt-in" delay={100}>
          <div className="relative overflow-hidden bg-gradient-to-b from-white via-[#f7fbff] to-sky-50/85 p-4 sm:p-5 rounded-[24px] border-[1.5px] border-sky-300/80 shadow-[0_18px_42px_-12px_rgba(2,132,199,0.16),0_4px_14px_-4px_rgba(0,34,68,0.06),inset_0_2px_3px_rgba(255,255,255,1),inset_0_-2px_5px_rgba(14,165,233,0.12)] mb-6">
            {/* Specular Top Sheen */}
            <div className="pointer-events-none absolute inset-x-10 top-0 h-[35%] bg-gradient-to-b from-white/90 via-white/40 to-transparent rounded-b-[100%]" />

            {/* Top Header Row: Institutional Department Identity + Program Filter Track + View Mode Switcher */}
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3.5 mb-3.5 border-b border-sky-200/80">
              {/* Left: Official Department Identity Badge */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-[#0284c7] via-[#0369a1] to-[#002244] text-white flex items-center justify-center shrink-0 shadow-[0_6px_14px_-3px_rgba(2,132,199,0.4),inset_0_1.5px_1px_rgba(255,255,255,0.4)] border border-sky-300/50">
                  <GraduationCap className="w-5 h-5 text-amber-300" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-[13px] sm:text-[15px] font-extrabold text-[#002244] tracking-tight truncate">
                      {lang === 'hi'
                        ? 'कंप्यूटर विज्ञान एवं अनुप्रयोग विभाग'
                        : 'Department of Computer Science & Applications'}
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/90 text-[11px] font-bold text-emerald-700 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{filteredProfiles.length} {lang === 'hi' ? 'सदस्य' : 'Members'}</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium truncate">
                    {lang === 'hi'
                      ? 'आधिकारिक पूर्व छात्र एवं छात्र नेटवर्क • BCA • MCA • M.Sc. CS • B.Tech CSE'
                      : 'Official Alumni & Student Network • BCA • MCA • M.Sc. CS • B.Tech CSE'}
                  </p>
                </div>
              </div>

              {/* Right: Segmented Program Filter Pills + Reset + Grid/List View Toggle */}
              <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2">
                {/* Segmented Program Track */}
                <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-gradient-to-b from-sky-100/80 via-sky-50/60 to-white border border-sky-200/90 shadow-[inset_0_1.5px_3px_rgba(2,132,199,0.12)] overflow-x-auto scrollbar-none">
                  {[
                    { id: 'all', label: lang === 'hi' ? 'सभी (All)' : 'All Programs' },
                    { id: 'mca', label: 'MCA' },
                    { id: 'bca', label: 'BCA' },
                    { id: 'msc', label: 'M.Sc. CS' },
                    { id: 'btech', label: 'B.Tech' },
                  ].map((prog) => {
                    const active = selectedDept === prog.id;
                    return (
                      <button
                        key={prog.id}
                        type="button"
                        onClick={() => setSelectedDept(prog.id)}
                        className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs sm:text-[13px] font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
                          active
                            ? 'bg-gradient-to-b from-[#0284c7] via-[#0369a1] to-[#002244] text-white shadow-[0_4px_10px_-2px_rgba(2,132,199,0.4),inset_0_1px_1px_rgba(255,255,255,0.35)]'
                            : 'text-slate-600 hover:text-[#002244] hover:bg-white/80'
                        }`}
                      >
                        {prog.label}
                      </button>
                    );
                  })}
                </div>

                {/* Clear Filters Button (Appears when any filter is active) */}
                {(searchQuery || selectedBatch !== 'all' || selectedDept !== 'all' || selectedCampus !== 'all' || mentorOnly) && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-[#fc4a00] border border-amber-300/80 text-xs font-extrabold transition-all cursor-pointer shadow-2xs"
                    title={t.actions.clear}
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{t.actions.clear}</span>
                  </button>
                )}

                {/* Grid vs List View Mode Toggle */}
                <div className="hidden sm:inline-flex items-center bg-gradient-to-b from-sky-100/80 to-white p-1 rounded-xl border border-sky-200/90 shadow-inner">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                      viewMode === 'grid'
                        ? 'bg-gradient-to-b from-[#003366] to-[#002244] text-white shadow-xs'
                        : 'text-slate-500 hover:text-[#003366]'
                    }`}
                    title="Grid View"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                      viewMode === 'list'
                        ? 'bg-gradient-to-b from-[#003366] to-[#002244] text-white shadow-xs'
                        : 'text-slate-500 hover:text-[#003366]'
                    }`}
                    title="List View"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Control Row: Unified 4-Column Precision Search & Filter Bar */}
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 sm:gap-3 items-center">

              {/* 1. Search Input (5 cols on desktop) */}
              <div className="sm:col-span-2 lg:col-span-5 relative group">
                <div className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-gradient-to-b from-sky-50 to-sky-100/90 border border-sky-200/90 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,1)] group-focus-within:border-[#0284c7] transition-colors">
                  <Search className="w-3.5 h-3.5 text-[#0284c7]" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchQueryChange(e.target.value)}
                  placeholder={lang === 'hi' ? 'नाम, भूमिका, कंपनी या कौशल खोजें...' : 'Search by name, role, company, or skill...'}
                  className="w-full h-11 bg-gradient-to-b from-white to-sky-50/40 pl-11 pr-8 rounded-xl border border-sky-200/95 text-[13px] sm:text-sm font-semibold text-slate-800 placeholder-slate-400 shadow-[0_2px_6px_rgba(2,132,199,0.05),inset_0_1px_2px_rgba(2,132,199,0.04)] focus:outline-none focus:bg-white focus:border-[#0284c7] focus:ring-2 focus:ring-sky-400/20 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchQueryChange('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 flex items-center justify-center text-[10px] font-bold transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* 2. Pass-out Year / Batch Select (3 cols on desktop) */}
              <div className="lg:col-span-3 relative group">
                <div className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-gradient-to-b from-sky-50 to-sky-100/90 border border-sky-200/90 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,1)]">
                  <Calendar className="w-3.5 h-3.5 text-[#0284c7]" />
                </div>
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className={`w-full h-11 appearance-none bg-gradient-to-b from-white to-sky-50/40 pl-11 pr-8 rounded-xl border text-[13px] sm:text-sm font-bold shadow-[0_2px_6px_rgba(2,132,199,0.05),inset_0_1px_0_rgba(255,255,255,1)] focus:outline-none focus:border-[#0284c7] focus:ring-2 focus:ring-sky-400/20 transition-all cursor-pointer ${
                    selectedBatch !== 'all'
                      ? 'border-[#0284c7] text-[#003366] bg-sky-50/60'
                      : 'border-sky-200/95 text-slate-700 hover:border-sky-300'
                  }`}
                  title="Pass-out Year / उत्तीर्ण वर्ष"
                >
                  <option value="all">
                    {lang === 'hi' ? 'सभी उत्तीर्ण वर्ष (All Years)' : 'All Pass-out Years'}
                  </option>
                  {availableBatches.map((year) => (
                    <option key={year} value={year}>
                      {lang === 'hi' ? `बैच ${year}` : `Batch of ${year}`}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-hover:text-[#0284c7] transition-colors" />
              </div>

              {/* 3. Campus Select (2 cols on desktop) */}
              <div className="lg:col-span-2 relative group">
                <div className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-gradient-to-b from-sky-50 to-sky-100/90 border border-sky-200/90 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,1)]">
                  <MapPin className="w-3.5 h-3.5 text-[#0284c7]" />
                </div>
                <select
                  value={selectedCampus}
                  onChange={(e) => setSelectedCampus(e.target.value)}
                  className={`w-full h-11 appearance-none bg-gradient-to-b from-white to-sky-50/40 pl-11 pr-7 rounded-xl border text-[13px] sm:text-sm font-bold shadow-[0_2px_6px_rgba(2,132,199,0.05),inset_0_1px_0_rgba(255,255,255,1)] focus:outline-none focus:border-[#0284c7] focus:ring-2 focus:ring-sky-400/20 transition-all cursor-pointer ${
                    selectedCampus !== 'all'
                      ? 'border-[#0284c7] text-[#003366] bg-sky-50/60'
                      : 'border-sky-200/95 text-slate-700 hover:border-sky-300'
                  }`}
                >
                  <option value="all">
                    {lang === 'hi' ? 'सभी परिसर' : 'All Campuses'}
                  </option>
                  <option value="Bhopal">Bhopal Campus</option>
                  <option value="Khandwa">Khandwa Campus</option>
                  <option value="Rewa">Rewa Campus</option>
                  <option value="Datia">Datia Campus</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-hover:text-[#0284c7] transition-colors" />
              </div>

              {/* 4. Mentors Only Toggle (2 cols on desktop) */}
              <div className="lg:col-span-2 flex items-center">
                <button
                  type="button"
                  onClick={() => setMentorOnly(!mentorOnly)}
                  className={`w-full h-11 flex items-center justify-center gap-2 px-3 rounded-xl text-[13px] sm:text-sm font-extrabold border transition-all duration-200 cursor-pointer ${
                    mentorOnly
                      ? 'bg-gradient-to-b from-[#ff6a00] via-[#fc4a00] to-[#c2410c] border-amber-300 text-white shadow-[0_6px_16px_-3px_rgba(252,74,0,0.42),inset_0_1.5px_1px_rgba(255,255,255,0.45)] -translate-y-[1px]'
                      : 'bg-gradient-to-b from-white to-sky-50/70 border-sky-200/95 text-[#002855] hover:border-[#fc4a00]/60 hover:text-[#fc4a00] shadow-[0_2px_6px_rgba(2,132,199,0.06),inset_0_1px_0_rgba(255,255,255,1)]'
                  }`}
                >
                  <Sparkles className={`w-3.5 h-3.5 shrink-0 ${mentorOnly ? 'text-amber-200 fill-amber-200' : 'text-[#fc4a00]'}`} />
                  <span className="truncate">{lang === 'hi' ? 'केवल मेंटर्स' : 'Mentors Only'}</span>
                </button>
              </div>

            </div>
          </div>
        </ScrollReveal>

        {/* Section 9: Alumni Profiles Enclosed Frame with Pagination */}
        <div id="alumni-frame-container" className="relative rounded-3xl border-2 border-sky-200/90 bg-gradient-to-b from-sky-50/70 via-white to-sky-50/60 p-4 sm:p-7 shadow-sm">

          {/* Frame Header Console */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 mb-6 bg-gradient-to-b from-white via-sky-50/60 to-white backdrop-blur-md rounded-2xl border border-sky-200/90 shadow-[0_6px_16px_-4px_rgba(2,132,199,0.1),inset_0_1.5px_1px_rgba(255,255,255,1)] text-xs font-semibold text-slate-700">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.7)] animate-pulse" />
              <span className="text-[#002244] font-extrabold">
                {lang === 'hi' ? 'पूर्व छात्र डायरेक्टरी फ्रेम' : 'Alumni Directory Console'}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600 font-medium">
                {lang === 'hi'
                  ? `पृष्ठ ${currentPage} पर ${paginatedProfiles.length} सदस्य (कुल ${filteredProfiles.length} पूर्व छात्र)`
                  : `Showing ${paginatedProfiles.length} of ${filteredProfiles.length} Alumni Members`}
              </span>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-2 text-sky-900 font-mono text-[11px] font-extrabold bg-gradient-to-b from-white to-sky-100/80 px-3 py-1 rounded-xl border border-sky-300/80 shadow-[inset_0_1px_1px_rgba(255,255,255,1)]">
                <span>PAGE {currentPage} OF {totalPages}</span>
              </div>
            )}
          </div>

          {filteredProfiles.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <GraduationCap className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800 mb-1">
                {lang === 'hi' ? 'पोर्टल में कोई रिकॉर्ड नहीं मिला' : 'No Alumni Found in Portal'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mb-4 leading-relaxed font-normal">
                {lang === 'hi'
                  ? `खोज "${searchQuery || selectedBatch}" स्थानीय पोर्टल डेटाबेस में पंजीकृत नहीं है। आप सीधे लिंक्डइन पर खोज सकते हैं:`
                  : `"${searchQuery || selectedBatch}" is not yet registered in the local portal. Search live across ${portalContent?.alumniCount || '38,000+'} MCU pass-outs on LinkedIn:`}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <a
                  href={getMcuLinkedInSearchUrl(searchQuery, selectedBatch)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A66C2] hover:bg-[#004182] text-white text-xs font-bold transition-all shadow-md"
                >
                  <LinkedInIcon className="w-4 h-4" />
                  <span>
                    {lang === 'hi'
                      ? `LinkedIn पर "${searchQuery || (selectedBatch !== 'all' ? `बैच ${selectedBatch}` : 'MCU')}" खोजें ↗`
                      : `Search "${searchQuery || (selectedBatch !== 'all' ? `Batch of ${selectedBatch}` : 'MCU')}" on LinkedIn ↗`}
                  </span>
                </a>

                <button
                  onClick={resetFilters}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  {t.actions.clear}
                </button>
              </div>
            </div>
          ) : viewMode === 'list' ? (
            /* List View */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
              {paginatedProfiles.map((alumni, idx) => {
              const name = alumni.name || alumni.full_name || 'MCU Computer Alumnus';
              const hindiName = alumni.hindiName || alumni.hindi_name || name;
              const batch = alumni.batch || alumni.batch_year || 'Alumnus';
              const campus = alumni.campus || alumni.campus_name || 'Bhopal';
              const currentRole = alumni.currentRole || alumni.current_role || 'Full Stack Software Engineer';
              const company = alumni.company || 'Tech & Software Solutions (MCU IT)';
              const avatar = alumni.avatar || alumni.avatar_url || null;
              const openToMentor = alumni.openToMentor ?? alumni.open_to_mentor;
              const linkedInLink = getAlumniLinkedInUrl(alumni);
              const skills = getProfileSkills(alumni);

              const normalizedAlumni = {
                ...alumni,
                name,
                hindiName,
                batch,
                campus,
                currentRole,
                company,
                avatar,
                openToMentor,
                skills,
                linkedIn: linkedInLink,
              };

              return (
                <div
                  key={alumni.id ? `list-${alumni.id}-${idx}` : `list-${idx}`}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-200 shadow-xs shrink-0">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#003366] to-[#002244] text-white flex items-center justify-center font-bold text-base font-editorial pb-2">
                          {name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {/* Inside-Image Bottom Role Watermark (Editorial & Professional) */}
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-4.5 bg-gradient-to-t from-[#001529]/80 via-[#001529]/30 to-transparent" />
                      <span
                        className={`pointer-events-none absolute inset-x-0 bottom-[2px] z-10 flex items-center justify-center gap-0.5 text-center font-editorial text-[6.5px] font-extrabold uppercase tracking-[0.12em] leading-none ${
                          isCurrentStudent(alumni) ? 'text-sky-50' : 'text-amber-50'
                        } [text-shadow:0_1px_1.5px_rgba(0,0,0,1),0_2px_4px_rgba(0,0,0,0.9)]`}
                      >
                        <span className={`w-1 h-[1px] rounded-full ${isCurrentStudent(alumni) ? 'bg-sky-300/90' : 'bg-amber-300/90'}`} />
                        <span>
                          {isCurrentStudent(alumni)
                            ? (lang === 'hi' ? 'छात्र' : 'STUDENT')
                            : (lang === 'hi' ? 'पूर्व छात्र' : 'ALUMNI')}
                        </span>
                        <span className={`w-1 h-[1px] rounded-full ${isCurrentStudent(alumni) ? 'bg-sky-300/90' : 'bg-amber-300/90'}`} />
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-[#003366] font-editorial truncate">
                          {lang === 'hi' ? hindiName : name}
                        </h4>
                        {alumni.is_verified === false || alumni.verification_status === 'pending' ? (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded shrink-0">
                            ⏳ Unverified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded shrink-0" title="Admin Verified MCU Alumnus">
                            <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" /> Verified
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-[#fc4a00] bg-[#fc4a00]/10 px-1.5 py-0.2 rounded shrink-0">
                          {lang === 'hi' ? `बैच ${batch}` : `Batch of ${batch}`}
                        </span>
                        {!isCurrentStudent(alumni) && openToMentor && (
                          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold border border-emerald-200">
                            <Sparkles className="w-2.5 h-2.5" /> Mentor
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 font-medium truncate mt-0.5">
                        {currentRole} • <span className="text-[#680a13] font-semibold">{company}</span>
                      </p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{campus} Campus</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                    <button
                      onClick={() => onSelectAlumni(normalizedAlumni)}
                      className="px-3.5 py-2 rounded-xl bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <span>{t.actions.viewProfile}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href={linkedInLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-[#0A66C2]/10 hover:bg-[#0A66C2] text-[#0A66C2] hover:text-white border border-[#0A66C2]/30 transition-all shadow-xs"
                      title="LinkedIn"
                    >
                      <LinkedInIcon className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Grid View (Section 9: Professional Alumni Cards) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedProfiles.map((alumni, idx) => {
              const isStudentCard = isCurrentStudent(alumni);
              const name = alumni.name || alumni.full_name || (isStudentCard ? 'MCU Computer Student' : 'MCU Computer Alumnus');
              const hindiName = alumni.hindiName || alumni.hindi_name || name;
              const batch = alumni.batch || alumni.batch_year || (isStudentCard ? '2026' : 'Alumnus');
              const campus = alumni.campus || alumni.campus_name || 'Bhopal';
              const currentRole = alumni.currentRole || alumni.current_role || (isStudentCard ? 'Computer Science Student (Pursuing)' : 'Full Stack Software Engineer');
              const company = alumni.company || (isStudentCard ? 'MCU Bhopal (Current Student)' : 'Tech & Software Solutions (MCU IT)');
              const avatar = alumni.avatar || alumni.avatar_url || null;
              const openToMentor = isStudentCard ? false : true;
              const rawCardBio = String(alumni.bio || '').trim();
              const isOldDefaultAlumniBio =
                !isStudentCard &&
                (rawCardBio
                  .toLowerCase()
                  .startsWith('computer science & applications alumnus from makhanlal chaturvedi national university') ||
                  rawCardBio
                    .toLowerCase()
                    .startsWith('computer science & applications alumnus of makhanlal chaturvedi national university') ||
                  rawCardBio
                    .toLowerCase()
                    .includes('specializing in full-stack software engineering, cloud architecture, and modern web systems'));
              const bio = (isStudentCard && (!rawCardBio || rawCardBio.toLowerCase().includes('alumnus') || rawCardBio.toLowerCase().includes('alumni') || rawCardBio.toLowerCase().includes('actively building')))
                ? 'Student at Makhanlal Chaturvedi National University.'
                : ((isOldDefaultAlumniBio || !rawCardBio)
                    ? (isStudentCard ? 'Student at Makhanlal Chaturvedi National University.' : 'Proud alumnus of Makhanlal Chaturvedi National University.')
                    : rawCardBio);
              const skills = getProfileSkills(alumni);
              const linkedInLink = getAlumniLinkedInUrl(alumni);

              const normalizedAlumni = {
                ...alumni,
                name,
                hindiName,
                batch,
                campus,
                currentRole,
                company,
                avatar,
                openToMentor,
                bio,
                skills,
                linkedIn: linkedInLink,
              };

              return (
                <ScrollReveal
                  key={alumni.id ? `alumni-${alumni.id}-${idx}` : `alumni-idx-${idx}`}
                  variant="tilt-in"
                  delay={idx * 75}
                >
                  <Tilt3DCard intensity={7} className="h-full">
                    <div
                      className="mcu-interactive-card h-full bg-white rounded-2xl px-5 py-3.5 border border-sky-200/85 shadow-sm flex flex-col justify-between group"
                    >
                      <div>
                        {/* Card Header: 3D Water-Glass Avatar & Institutional Badges */}
                        <div className="flex items-start gap-3 mb-2">
                          <div className="relative shrink-0 p-1 rounded-2xl bg-gradient-to-b from-white via-sky-50 to-sky-100/80 border border-sky-200/90 shadow-[0_6px_14px_-4px_rgba(2,132,199,0.2),inset_0_1.5px_1px_rgba(255,255,255,1)]">
                            <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-sky-100">
                              {avatar ? (
                                <img
                                  src={avatar}
                                  alt={name}
                                  className="w-full h-full object-cover group-hover:scale-102 transition-all duration-200"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-sky-500 via-blue-600 to-[#003366] border border-white/80 group-hover:scale-102 transition-all duration-200 flex items-center justify-center text-white font-bold text-lg font-editorial pb-2">
                                  {name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              {/* Inside-Image Bottom Role Watermark (Editorial & Professional) */}
                              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t from-[#001529]/80 via-[#001529]/30 to-transparent" />
                              <span
                                className={`pointer-events-none absolute inset-x-0 bottom-[2px] z-10 flex items-center justify-center gap-0.5 text-center font-editorial text-[7.5px] font-extrabold uppercase tracking-[0.13em] leading-none ${
                                  isStudentCard ? 'text-sky-50' : 'text-amber-50'
                                } [text-shadow:0_1px_1.5px_rgba(0,0,0,1),0_2px_4px_rgba(0,0,0,0.9)]`}
                              >
                                <span className={`w-1 h-[1px] rounded-full ${isStudentCard ? 'bg-sky-300/95' : 'bg-amber-300/95'}`} />
                                <span>
                                  {isStudentCard
                                    ? (lang === 'hi' ? 'छात्र' : 'STUDENT')
                                    : (lang === 'hi' ? 'पूर्व छात्र' : 'ALUMNI')}
                                </span>
                                <span className={`w-1 h-[1px] rounded-full ${isStudentCard ? 'bg-sky-300/95' : 'bg-amber-300/95'}`} />
                              </span>
                            </div>
                            {openToMentor && (
                              <div
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gradient-to-b from-amber-400 to-[#fc4a00] border border-white rounded-full flex items-center justify-center text-white shadow-sm z-20"
                                title="Open to Mentor"
                              >
                                <Sparkles className="w-2.5 h-2.5 fill-white" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span className="text-[11px] font-bold text-sky-800 bg-gradient-to-b from-white to-sky-100/75 px-2 py-0.5 rounded-md border border-sky-200/90 shadow-2xs shrink-0">
                                {lang === 'hi' ? `बैच ${batch}` : `Batch of ${batch}`}
                              </span>
                              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1 truncate">
                                <MapPin className="w-3 h-3 text-sky-600 shrink-0" />
                                <span className="truncate">{campus}</span>
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <h3 className="text-base font-bold text-[#003366] group-hover:text-sky-600 transition-colors font-editorial truncate leading-tight">
                                {lang === 'hi' ? hindiName : name}
                              </h3>
                              {alumni.is_verified === false || alumni.verification_status === 'pending' ? (
                                <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-bold shrink-0" title="Pending Admin Verification">
                                  ⏳ Pending
                                </span>
                              ) : (
                                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" title="Verified MCU Alumnus" />
                              )}
                            </div>
                            <p className="text-xs text-slate-700 font-semibold truncate leading-tight mt-0.5">
                              {currentRole}
                            </p>
                            <p className="text-[11px] text-[#680a13] font-bold truncate flex items-center gap-1 mt-0.5 leading-tight">
                              <Building2 className="w-3 h-3 text-[#680a13] shrink-0" />
                              <span className="truncate">{company}</span>
                            </p>
                          </div>
                        </div>

                        {/* Bio snippet */}
                        <p className="text-xs text-slate-600 line-clamp-1 mb-2 leading-snug font-normal">
                          {bio}
                        </p>

                        {/* 3D Water-Glass Skills tags */}
                        <div className="flex flex-wrap gap-1.5 mb-2.5">
                          {skills.slice(0, 3).map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-0.5 text-[10px] rounded-lg bg-gradient-to-b from-white to-sky-50/80 border border-sky-200/85 text-[#0c4a6e] font-semibold shadow-2xs"
                            >
                              {skill}
                            </span>
                          ))}
                          {skills.length > 3 && (
                            <span className="px-1.5 py-0.5 text-[10px] text-sky-700 font-bold">
                              +{skills.length - 3}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-2 border-t border-sky-100 flex items-center justify-between gap-2">
                        {/* View Profile Modal */}
                        <button
                          onClick={() => onSelectAlumni(normalizedAlumni)}
                          className="flex-1 py-1.5 px-2.5 rounded-xl btn-mcu-navy text-white text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>{t.actions.viewProfile}</span>
                          <ArrowUpRight className="w-3.5 h-3.5 text-white/90" />
                        </button>

                        {/* Direct LinkedIn Connect Button */}
                        <a
                          href={linkedInLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-xl bg-gradient-to-b from-white to-sky-50 hover:from-[#0A66C2] hover:to-[#004182] text-[#0A66C2] hover:text-white border border-sky-200/90 transition-all flex items-center justify-center shadow-2xs cursor-pointer"
                          title={lang === 'hi' ? 'LinkedIn पर जुड़ें' : 'Connect on LinkedIn'}
                        >
                          <LinkedInIcon className="w-4 h-4" />
                        </a>

                        {/* Mentor Request Button */}
                        {openToMentor && (
                          <button
                            onClick={() => onRequestMentorship(normalizedAlumni)}
                            className="py-1.5 px-2.5 rounded-xl btn-mcu-saffron text-white text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                            title={t.actions.requestMentorship}
                          >
                            <Compass className="w-3.5 h-3.5 text-white" />
                            <span className="hidden sm:inline">{lang === 'hi' ? 'मेंटर' : 'Mentor'}</span>
                          </button>
                        )}
                      </div>

                    </div>
                  </Tilt3DCard>
                </ScrollReveal>
              );
            })}
          </div>

        )}

        {/* Frame Bottom Pagination Bar with Prev, Bullets/Pages 1 2 3 4, Next */}
        {filteredProfiles.length > 0 && totalPages > 1 && (
          <div className="mt-8 pt-6 border-t border-sky-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Pagination Info */}
            <div className="text-xs text-slate-600 font-medium text-center sm:text-left">
              {lang === 'hi' ? (
                <span>
                  कुल <strong>{filteredProfiles.length}</strong> में से{' '}
                  <strong className="text-[#003366]">{(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredProfiles.length)}</strong> पूर्व छात्र • पृष्ठ{' '}
                  <strong className="text-[#fc4a00] font-bold">{currentPage}</strong> / <strong>{totalPages}</strong>
                </span>
              ) : (
                <span>
                  Showing <strong className="text-[#003366]">{(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredProfiles.length)}</strong> of{' '}
                  <strong>{filteredProfiles.length}</strong> Alumni • Page{' '}
                  <strong className="text-[#fc4a00] font-bold">{currentPage}</strong> of <strong>{totalPages}</strong>
                </span>
              )}
            </div>

            {/* Pagination Action Controls: Prev, Bullets/Pages 1 2 3 4, Next */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center">
              {/* Previous Button */}
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                  currentPage === 1
                    ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                    : 'bg-white hover:bg-amber-50 text-[#003366] hover:text-[#fc4a00] border border-slate-200 hover:border-amber-400 active:scale-95'
                }`}
                title={lang === 'hi' ? 'पिछला पृष्ठ' : 'Previous Page'}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{lang === 'hi' ? 'पिछला' : 'Previous'}</span>
              </button>

              {/* Bullets / Page Numbers: 1, 2, 3, 4 ... */}
              <div className="flex items-center gap-1 sm:gap-1.5">
                {getPageNumbers().map((pg, idx) => {
                  if (pg === '...') {
                    return (
                      <span key={`dots-${idx}`} className="px-2 py-1 text-slate-400 font-bold text-xs select-none">
                        …
                      </span>
                    );
                  }
                  const isActive = currentPage === pg;
                  return (
                    <button
                      key={`page-${pg}`}
                      onClick={() => handlePageChange(pg)}
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

              {/* Next Button */}
              <button
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                  currentPage === totalPages
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
    </section>
  );
};
