import React, { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  Briefcase,
  Building2,
  MapPin,
  Clock,
  PlusCircle,
  Search,
  ArrowUpRight,
  ShieldCheck,
  Laptop,
  ChevronLeft,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { ScrollReveal, Tilt3DCard } from './ScrollReveal';
import { isCurrentStudent, isVerifiedAlumnus } from '../utils/skills';

export const JobBoard = ({
  jobs,
  currentUser,
  isVerifiedAlumni = false,
  onApplyJob,
  onOpenPostJob,
  onPostJob,
  onApproveJob = null,
  onOpenAdminJobs = null,
}) => {
  const { lang, t } = useLanguage();
  const [selectedType, setSelectedType] = useState('All');
  const [searchFilter, setSearchFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4; // 4 job openings per page maintains compact height and prevents main UI stretch

  const handlePostJob = onOpenPostJob || onPostJob;
  const isAdmin = Boolean(currentUser?.is_admin || currentUser?.role === 'admin');
  const isStudent = isCurrentStudent(currentUser);
  const isVerified = Boolean(isAdmin || isVerifiedAlumni || isVerifiedAlumnus(currentUser));

  const isOwner = (job) => {
    if (!job || !currentUser) return false;
    try {
      const userJobKey = `mcu_my_job_ids_${currentUser.id || currentUser.email}`;
      const myJobIds = JSON.parse(localStorage.getItem(userJobKey) || '[]');
      if (myJobIds.includes(job.id) || myJobIds.includes(job.dbId)) return true;
    } catch {}

    if (job.authorEmail && currentUser.email && job.authorEmail.toLowerCase() === currentUser.email.toLowerCase()) return true;
    if (job.authorId && currentUser.id && job.authorId === currentUser.id) return true;
    if (job.posted_by_user_id && currentUser.id && Number(job.posted_by_user_id) === Number(currentUser.id)) return true;
    if (job.referral_alumnus_email && currentUser.email && job.referral_alumnus_email.toLowerCase() === currentUser.email.toLowerCase()) return true;

    // Fallback: only match postedBy if job does NOT belong to someone else's ID or email
    if (!job.posted_by_user_id && !job.authorEmail && !job.authorId) {
      const cName = (currentUser.name || currentUser.full_name || '').toLowerCase().trim();
      if (cName && job.postedBy && job.postedBy.toLowerCase().includes(cName)) return true;
    }
    return false;
  };

  const myPostedCount = jobs.filter(isOwner).length;
  const pendingAdminCount = jobs.filter((j) => j.approval_status === 'pending').length;

  const types = [
    'All',
    '💻 Computer & IT',
    'Full-time',
    'Fellowship / Contract',
    'Internship',
    ...(myPostedCount > 0 ? ['⭐ My Posts'] : []),
    ...(isAdmin && pendingAdminCount > 0 ? [`⏳ Pending Admin (${pendingAdminCount})`] : []),
  ];

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // Public visitors only see approved jobs; job owner and Admin can also see pending/rejected jobs
      const status = job.approval_status || 'approved';
      if (status !== 'approved' && !isAdmin && !isOwner(job)) {
        return false;
      }

      let matchesType = true;
      if (selectedType === 'All') {
        matchesType = true;
      } else if (selectedType.startsWith('⏳ Pending Admin')) {
        matchesType = job.approval_status === 'pending';
      } else if (selectedType === '💻 Computer & IT') {
        const isTechTag = job.tags?.some(tag =>
          /computer|it|software|react|node|python|java|cloud|aws|dev|mca|bca|tech|data|ai|web|program/i.test(tag)
        );
        const isTechTitle = /software|developer|engineer|tech|programmer|analyst|full stack|cloud|web|frontend|backend|devops|data|ai|mca|bca/i.test(job.title);
        const isTechDesc = /software|developer|engineer|tech|programmer|react|python|java|cloud|web|code/i.test(job.description);
        matchesType = isTechTag || isTechTitle || isTechDesc;
      } else if (selectedType === '⭐ My Posts') {
        matchesType = isOwner(job);
      } else {
        matchesType = job.type.includes(selectedType);
      }

      const q = searchFilter.toLowerCase();
      const matchesSearch = !q ||
        job.title.toLowerCase().includes(q) ||
        job.company.toLowerCase().includes(q) ||
        job.location.toLowerCase().includes(q) ||
        job.tags.some(t => t.toLowerCase().includes(q));

      return matchesType && matchesSearch;
    });
  }, [jobs, selectedType, searchFilter, currentUser, isAdmin]);

  // Reset to first page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedType, searchFilter]);

  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage) || 1;

  // Paginated slice of job listings
  const paginatedJobs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredJobs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredJobs, currentPage, itemsPerPage]);

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
    const frameEl = document.getElementById('jobs-frame-container');
    if (frameEl) {
      frameEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  return (
    <section id="jobs" className="py-20 relative z-10 bg-gradient-to-b from-[#f8fbff]/95 via-white/95 to-[#f0f9ff]/90 border-t border-sky-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <ScrollReveal variant="fade-up">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-b from-white via-sky-50 to-sky-100/90 text-[#0c4a6e] border border-sky-300/90 text-xs font-extrabold mb-3.5 shadow-[0_8px_20px_-4px_rgba(2,132,199,0.18),inset_0_1.5px_1px_rgba(255,255,255,1)]">
                <Briefcase className="w-3.5 h-3.5 text-sky-600" />
                <span>{lang === 'hi' ? 'पूर्व छात्र करियर मंच' : 'Alumni Career Exchange'}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#003366] tracking-tight font-editorial">
                {t.sections.jobsTitle}
              </h2>
              <p className="mt-1.5 text-sm sm:text-base text-slate-600 font-normal max-w-xl leading-relaxed">
                {t.sections.jobsSubtitle}
              </p>
            </div>

            <div className="mt-4 md:mt-0">
              {isStudent ? (
                <div
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-b from-white via-sky-50 to-sky-100/90 text-[#003366] border border-sky-300/90 text-xs font-extrabold shadow-xs flex items-center gap-2"
                  title={
                    lang === 'hi'
                      ? 'जॉब पोस्ट करने का अधिकार केवल पूर्व छात्रों (Alumni) के पास है'
                      : 'Job posting is reserved exclusively for graduated MCU Alumni'
                  }
                >
                  <BookOpen className="w-4 h-4 text-[#0284c7] shrink-0" />
                  <span>
                    {lang === 'hi'
                      ? '📘 विद्यार्थी मोड: रेफरल हेतु आवेदन करें'
                      : '📘 Student Mode • Apply for Alumni Referrals'}
                  </span>
                </div>
              ) : currentUser && !isVerified ? (
                <button
                  onClick={handlePostJob}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-b from-amber-50 via-amber-100/90 to-orange-100/80 text-amber-950 border border-amber-300 text-xs sm:text-sm font-extrabold shadow-xs transition-all flex items-center gap-2 cursor-pointer hover:border-amber-400"
                  title={
                    lang === 'hi'
                      ? 'एमसीयू एडमिन द्वारा सत्यापित होने के बाद ही पूर्व छात्र जॉब पोस्ट कर सकते हैं'
                      : 'Alumni can post jobs once verified by MCU Admin'
                  }
                >
                  <Clock className="w-4 h-4 text-[#fc4a00] shrink-0" />
                  <span>
                    {lang === 'hi'
                      ? '🔒 एडमिन सत्यापन लंबित • जॉब पोस्ट लॉक'
                      : '🔒 Pending Admin Verification to Post Job'}
                  </span>
                </button>
              ) : (
                <button
                  onClick={handlePostJob}
                  className="px-5 py-2.5 rounded-xl btn-mcu-saffron text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{t.actions.postJob}</span>
                </button>
              )}
            </div>
          </div>
        </ScrollReveal>

        {/* 3D Water-Glass Filters Bar */}
        <ScrollReveal variant="tilt-in" delay={60}>
          <div className="relative overflow-hidden bg-gradient-to-b from-white via-[#f8fbff] to-sky-50/75 p-4 sm:p-5 rounded-[24px] border-[1.5px] border-sky-200/90 shadow-[0_14px_34px_-8px_rgba(2,132,199,0.12),inset_0_2px_2px_rgba(255,255,255,1)] mb-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Job Type Pills */}
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
              {types.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                    selectedType === type
                      ? 'bg-gradient-to-b from-sky-500 via-blue-600 to-[#003366] text-white border-sky-300 shadow-[0_6px_14px_-3px_rgba(2,132,199,0.38),inset_0_1.5px_1px_rgba(255,255,255,0.4)]'
                      : 'bg-gradient-to-b from-white to-sky-50/80 text-slate-700 border-sky-200/85 hover:text-[#003366] hover:border-sky-300 shadow-[inset_0_1px_1px_rgba(255,255,255,1)]'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Search box */}
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-sky-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search positions or media houses..."
                className="w-full bg-gradient-to-b from-white to-sky-50/60 pl-9 pr-3 py-2 rounded-xl border border-sky-200/95 text-xs text-slate-800 placeholder-slate-400 shadow-[inset_0_2px_4px_rgba(2,132,199,0.05),inset_0_1px_0_rgba(255,255,255,1)] focus:outline-none focus:border-sky-500 transition-all"
              />
            </div>
          </div>
        </ScrollReveal>

        {/* Jobs & Careers Enclosed Frame Container with Pagination */}
        <div id="jobs-frame-container" className="relative rounded-3xl border-2 border-sky-200/90 bg-gradient-to-b from-sky-50/70 via-white to-sky-50/60 p-4 sm:p-7 shadow-sm">

          {/* Frame Header Console */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 mb-6 bg-gradient-to-b from-white via-sky-50/60 to-white backdrop-blur-md rounded-2xl border border-sky-200/90 shadow-[0_6px_16px_-4px_rgba(2,132,199,0.1),inset_0_1.5px_1px_rgba(255,255,255,1)] text-xs font-semibold text-slate-700">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.7)] animate-pulse" />
              <span className="text-[#003366] font-extrabold">
                {lang === 'hi' ? 'करियर अवसर कंसोल' : 'Career Opportunities Console'}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600 font-medium">
                {lang === 'hi'
                  ? `पृष्ठ ${currentPage} पर ${paginatedJobs.length} अवसर (कुल ${filteredJobs.length} उपलब्ध)`
                  : `Showing ${paginatedJobs.length} of ${filteredJobs.length} Opportunities`}
              </span>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-2 text-sky-900 font-mono text-[11px] font-extrabold bg-gradient-to-b from-white to-sky-100/80 px-3 py-1 rounded-xl border border-sky-300/80 shadow-[inset_0_1px_1px_rgba(255,255,255,1)]">
                <span>PAGE {currentPage} OF {totalPages}</span>
              </div>
            )}
          </div>

          {/* Jobs List (Clean Enterprise Cards) */}
          <div className="space-y-4">
            {filteredJobs.length === 0 ? (
              <div className="text-center py-14 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <Briefcase className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-500 mb-3 font-normal">
                  {lang === 'hi' ? 'कोई परिणाम नहीं मिला।' : 'No openings match your criteria.'}
                </p>
                {!isStudent && (
                  <button
                    onClick={handlePostJob}
                    className="px-4 py-2 rounded-xl btn-mcu-saffron text-xs font-bold inline-flex items-center gap-1.5 shadow-sm hover:scale-[1.02] cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>{t.actions.postJob}</span>
                  </button>
                )}
              </div>
            ) : (
              paginatedJobs.map((job, idx) => (
                <ScrollReveal key={job.id} variant="tilt-in" delay={idx * 75}>
                  <Tilt3DCard intensity={4}>
                    <div
                      className="mcu-interactive-card bg-white rounded-2xl p-5 sm:p-6 border border-sky-200/85 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 group"
                    >
                      {/* Job Details Left */}
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2.5">
                          {job.approval_status === 'pending' && (
                            <span className="px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 text-xs font-extrabold flex items-center gap-1 animate-pulse">
                              <span>⏳</span>
                              <span>
                                {lang === 'hi'
                                  ? 'प्रशासक सत्यापन लंबित (Pending Admin Verification)'
                                  : 'Pending Admin & Alumnus Verification'}
                              </span>
                            </span>
                          )}
                          {job.approval_status === 'rejected' && (
                            <span className="px-2.5 py-0.5 rounded-lg bg-rose-100 text-rose-800 border border-rose-300 text-xs font-extrabold">
                              ❌ Rejected by Admin
                            </span>
                          )}
                          {(!job.approval_status || job.approval_status === 'approved') && (
                            <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/90 text-[11px] font-bold flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              <span>{lang === 'hi' ? 'सत्यापित अवसर' : 'Admin Verified'}</span>
                            </span>
                          )}
                          {isOwner(job) && (
                            <span className="px-2.5 py-0.5 rounded-lg bg-gradient-to-b from-amber-400 to-amber-500 text-slate-950 text-xs font-black shadow-2xs flex items-center gap-1 animate-fadeIn">
                              <span>⭐</span>
                              <span>{lang === 'hi' ? 'आपके द्वारा पोस्टेड' : 'Posted by You'}</span>
                            </span>
                          )}
                          {(job.tags?.some(t => /computer|it|software|react|node|python|mca|bca/i.test(t)) || /software|developer|engineer|tech/i.test(job.title)) && (
                            <span className="px-2.5 py-0.5 rounded-lg bg-gradient-to-b from-white to-sky-100/85 text-sky-800 border border-sky-300/80 text-xs font-bold flex items-center gap-1 shadow-2xs">
                              <Laptop className="w-3 h-3 text-sky-600" />
                              <span>{lang === 'hi' ? 'कंप्यूटर विभाग' : 'Computer Dept'}</span>
                            </span>
                          )}
                          <span className="px-2.5 py-0.5 rounded-lg bg-gradient-to-b from-white to-sky-50/90 border border-sky-200/90 text-[#003366] text-xs font-bold shadow-2xs">
                            {job.type}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-lg bg-gradient-to-b from-white to-slate-100/80 border border-slate-200/90 text-slate-700 text-xs font-semibold shadow-2xs">
                            Exp: {job.experience}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-lg bg-gradient-to-b from-white to-rose-50/90 border border-rose-200/90 text-[#680a13] text-xs font-bold shadow-2xs">
                            {job.salary}
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-[#003366] group-hover:text-sky-600 transition-colors font-editorial">
                          {job.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-4 mt-1 mb-2.5 text-xs text-slate-600 font-medium">
                          <span className="flex items-center gap-1 text-[#680a13] font-bold">
                            <Building2 className="w-3.5 h-3.5 text-[#680a13] shrink-0" />
                            {job.company}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                            {job.location}
                          </span>
                          <span className="flex items-center gap-1 text-[#003366] font-semibold">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#fc4a00] shrink-0" />
                            Ref: {job.postedBy}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-2 max-w-3xl leading-relaxed mb-3 font-normal">
                          {job.description}
                        </p>

                        <div className="flex flex-wrap gap-1.5">
                          {job.tags.map((tag, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-0.5 text-[10px] rounded-lg bg-gradient-to-b from-white to-sky-50/75 border border-sky-200/80 text-[#0c4a6e] font-semibold shadow-2xs"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Job Action Right */}
                      <div className="shrink-0 flex md:flex-col items-center md:items-end justify-between md:justify-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-sky-100">
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 font-semibold">
                          <Clock className="w-3 h-3 text-[#fc4a00]" />
                          {job.deadline}
                        </span>

                        <div className="flex items-center gap-2 flex-wrap">
                          {isAdmin && job.approval_status === 'pending' && onApproveJob && (
                            <button
                              type="button"
                              onClick={() => onApproveJob(job.id, true)}
                              className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Verify & Approve</span>
                            </button>
                          )}
                          <button
                            onClick={() => onApplyJob(job)}
                            className="px-5 py-2.5 rounded-xl btn-mcu-saffron text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>{t.actions.applyJob}</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </Tilt3DCard>
                </ScrollReveal>
              ))
            )}
          </div>

          {/* Frame Bottom Pagination Bar with Prev, Bullets/Pages 1 2 3 4, Next */}
          {filteredJobs.length > 0 && totalPages > 1 && (
            <div className="mt-8 pt-6 border-t border-sky-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Pagination Info */}
              <div className="text-xs text-slate-600 font-medium text-center sm:text-left">
                {lang === 'hi' ? (
                  <span>
                    कुल <strong>{filteredJobs.length}</strong> में से{' '}
                    <strong className="text-[#003366]">{(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredJobs.length)}</strong> अवसर • पृष्ठ{' '}
                    <strong className="text-[#fc4a00] font-bold">{currentPage}</strong> / <strong>{totalPages}</strong>
                  </span>
                ) : (
                  <span>
                    Showing <strong className="text-[#003366]">{(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredJobs.length)}</strong> of{' '}
                    <strong>{filteredJobs.length}</strong> Opportunities • Page{' '}
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
