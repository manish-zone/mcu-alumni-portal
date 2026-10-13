import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  X,
  MapPin,
  GraduationCap,
  Mail,
  Sparkles,
  CheckCircle2,
  Compass,
  ExternalLink,
  Briefcase,
  Trash2,
  FileText,
  Eye,
  Download,
  Clock,
  UserCheck,
  Send
} from 'lucide-react';
import { getAlumniLinkedInUrl, getMcuLinkedInSearchUrl } from '../utils/linkedin';
import { getProfileSkills, normalizeComputerProfile, isCurrentStudent, isVerifiedAlumnus } from '../utils/skills';
import { alumniProfiles } from '../data/mockData';
import { getApplicationDedupeKey } from '../utils/applications';
import { ResumePreviewModal } from './ResumePreviewModal';

export const ProfileDetailModal = ({
  alumni: rawAlumni,
  currentUser = null,
  isVerifiedAlumni = false,
  allJobs = [],
  receivedApplications = [],
  mySubmittedApplications = [],
  onDeleteJob,
  onClose,
  onRequestMentorship,
  onOpenPostJob,
  onOpenManageApplications,
  onOpenMyApplications,
  onUpdateApplicationStatus
}) => {
  const { lang, t } = useLanguage();
  const [previewingApp, setPreviewingApp] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!rawAlumni) return null;

  const alumni = normalizeComputerProfile(rawAlumni, alumniProfiles);
  const isProfileStudent = isCurrentStudent(alumni);
  const isViewerStudent = isCurrentStudent(currentUser);
  const isViewerVerified = Boolean(currentUser?.is_admin || currentUser?.role === 'admin' || isVerifiedAlumni || isVerifiedAlumnus(currentUser));

  // Safe normalization of all profile fields
  const displayName = (lang === 'hi' && alumni.hindiName && alumni.hindiName.trim())
    ? alumni.hindiName
    : (alumni.name || alumni.full_name || alumni.hindi_name || (isProfileStudent ? 'MCU Computer Student' : 'MCU Computer Alumnus'));

  const secondaryName = (lang === 'hi' && (alumni.name || alumni.full_name) && (alumni.name || alumni.full_name) !== displayName)
    ? (alumni.name || alumni.full_name)
    : ((alumni.hindiName && alumni.hindiName !== displayName) ? alumni.hindiName : null);

  const batch = alumni.batch || alumni.batch_year || (isProfileStudent ? '2026' : 'Alumnus');
  const campus = alumni.campus || alumni.campus_name || 'Bhopal';
  const currentRole = alumni.currentRole || alumni.current_role || (isProfileStudent
    ? (lang === 'hi' ? 'कंप्यूटर विज्ञान छात्र (Current Student)' : 'Computer Science Student (Pursuing)')
    : (lang === 'hi' ? 'फुल स्टैक सॉफ्टवेयर इंजीनियर' : 'Full Stack Software Engineer'));
  const company = alumni.company || (isProfileStudent ? 'MCU Bhopal (Current Student)' : 'Tech & Software Solutions (MCU IT)');
  const location = alumni.location || 'Bhopal / Bengaluru, India';
  const degree = alumni.degree || (lang === 'hi' ? 'मास्टर ऑफ कंप्यूटर एप्लीकेशन (MCA)' : 'Master of Computer Applications (MCA)');
  const rawBioText = String(alumni.bio || '').trim();
  const hasAlumnusDefaultBio =
    isProfileStudent &&
    (!rawBioText ||
      rawBioText.toLowerCase().includes('alumnus') ||
      rawBioText.toLowerCase().includes('alumni') ||
      rawBioText.toLowerCase().includes('actively building') ||
      rawBioText.includes('पूर्व छात्र'));
  const isOldDefaultAlumniBio =
    !isProfileStudent &&
    (rawBioText
      .toLowerCase()
      .startsWith('computer science & applications alumnus from makhanlal chaturvedi national university') ||
      rawBioText
        .toLowerCase()
        .startsWith('computer science & applications alumnus of makhanlal chaturvedi national university') ||
      rawBioText
        .toLowerCase()
        .includes('specializing in full-stack software engineering, cloud architecture, and modern web systems'));

  const bio = hasAlumnusDefaultBio
    ? 'Student at Makhanlal Chaturvedi National University.'
    : ((isOldDefaultAlumniBio || !rawBioText)
        ? (isProfileStudent
            ? 'Student at Makhanlal Chaturvedi National University.'
            : (lang === 'hi'
                ? 'माखनलाल चतुर्वेदी राष्ट्रीय विश्वविद्यालय के गर्वित पूर्व छात्र।'
                : 'Proud alumnus of Makhanlal Chaturvedi National University.'))
        : rawBioText);
  const skills = getProfileSkills(alumni);

  const isMe = Boolean(
    currentUser && alumni && (
      (currentUser.id && alumni.id && currentUser.id === alumni.id) ||
      (currentUser.email && alumni.email && currentUser.email.toLowerCase() === alumni.email.toLowerCase()) ||
      ((currentUser.name || currentUser.full_name) && (alumni.name || alumni.full_name) &&
        (currentUser.name || currentUser.full_name).toLowerCase().trim() === (alumni.name || alumni.full_name).toLowerCase().trim())
    )
  );

  const isJobOwner = (job) => {
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

  const isAlumniPoster = (job) => {
    if (!job || !alumni) return false;
    if (job.authorEmail && alumni.email && job.authorEmail.toLowerCase() === alumni.email.toLowerCase()) return true;
    if (job.authorId && alumni.id && job.authorId === alumni.id) return true;
    if (job.posted_by_user_id && alumni.id && Number(job.posted_by_user_id) === Number(alumni.id)) return true;
    const aName = (alumni.name || alumni.full_name || '').toLowerCase();
    if (aName && job.postedBy && job.postedBy.toLowerCase().includes(aName)) return true;
    return false;
  };

  const postedOpportunities = allJobs.filter((job) => isMe ? isJobOwner(job) : isAlumniPoster(job));

  // Compute applications received for this alumnus's referrals
  const isApplicationForAlumni = (app) => {
    if (!app) return false;
    if (app.alumni_id && alumni?.id && String(app.alumni_id) === String(alumni.id)) return true;
    if (app.alumni_email && alumni?.email && app.alumni_email.toLowerCase() === alumni.email.toLowerCase()) return true;
    const aName = (alumni?.name || alumni?.full_name || '').toLowerCase();
    if (aName && app.alumni_name && app.alumni_name.toLowerCase().includes(aName)) return true;
    if (postedOpportunities.some((j) => j.id === app.job_id || j.dbId === app.job_id || (j.title && app.job_title && j.title.toLowerCase() === app.job_title.toLowerCase()))) {
      return true;
    }
    return false;
  };

  const getCombinedAlumniApplications = () => {
    let localApps = [];
    try {
      const stored = JSON.parse(localStorage.getItem('mcu_received_applications') || '[]');
      if (Array.isArray(stored)) {
        localApps = stored;
      }
    } catch {}

    const allCandidateApps = [...(receivedApplications || []), ...localApps];
    const seen = new Set();
    const result = [];
    for (const app of allCandidateApps) {
      if (!app) continue;
      const key = getApplicationDedupeKey(app);
      if (!key || !seen.has(key)) {
        if (key) seen.add(key);
        if (isApplicationForAlumni(app)) {
          result.push(app);
        }
      }
    }
    return result;
  };

  const myAlumniApplications = getCombinedAlumniApplications();

  // Check if current user is the applicant who submitted the referral request
  const isApplicantForUser = (app) => {
    if (!app || !currentUser) return false;
    const curEmail = (currentUser.email || '').toLowerCase().trim();
    const curId = currentUser.id ? String(currentUser.id) : null;
    if (app.applicant_user_id && curId && String(app.applicant_user_id) === curId) return true;
    if (app.applicant_email && curEmail && app.applicant_email.toLowerCase().trim() === curEmail) return true;
    return false;
  };

  const getCombinedSubmittedApplications = () => {
    let localApps = [];
    try {
      const stored = JSON.parse(localStorage.getItem('mcu_received_applications') || '[]');
      if (Array.isArray(stored)) {
        localApps = stored;
      }
    } catch {}

    const allCandidateApps = [...(mySubmittedApplications || []), ...localApps];
    const seen = new Set();
    const result = [];
    for (const app of allCandidateApps) {
      if (!app) continue;
      const key = getApplicationDedupeKey(app);
      if (!key || !seen.has(key)) {
        if (key) seen.add(key);
        if (isApplicantForUser(app)) {
          result.push(app);
        }
      }
    }
    return result;
  };

  const mySubmittedApplicationsList = getCombinedSubmittedApplications();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/65 backdrop-blur-md mcu-backdrop-enter"
      onClick={onClose}
    >
      <div
        className="mcu-animated-border-modal mcu-modal-spring-enter bg-gradient-to-b from-white via-[#fafdff] to-[#f4f9ff] w-full max-w-[640px] rounded-2xl sm:rounded-3xl border border-sky-200/80 shadow-[0_28px_70px_-12px_rgba(2,132,199,0.26),0_10px_28px_-6px_rgba(0,34,68,0.16)] overflow-hidden relative max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Professional Institutional Header */}
        <div className="relative bg-gradient-to-r from-[#001a35] via-[#002855] to-[#001e3d] px-5 py-3.5 sm:px-6 sm:py-4 flex items-center justify-between shrink-0 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[3px] mcu-accent-bar-animated" />
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-sky-400/15 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-[#fc4a00]/15 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex items-center gap-3.5 min-w-0">
            <div className="relative w-13 h-13 sm:w-15 sm:h-15 shrink-0 flex items-center justify-center">
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

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-[10px] sm:text-[11px] font-bold tracking-[0.08em] uppercase text-sky-200/90 leading-tight truncate">
                  {lang === 'hi' ? 'माखनलाल चतुर्वेदी राष्ट्रीय वि.वि., भोपाल' : 'Makhanlal Chaturvedi University · Bhopal'}
                </p>
                <span className="hidden min-[420px]:inline-flex items-center px-1.5 py-0.5 text-[8.5px] font-black uppercase tracking-wider bg-gradient-to-b from-[#ff6a00] to-[#fc4a00] text-white rounded-full border border-amber-300/60 shadow-2xs shrink-0">
                  ESTD 1990
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <h3 className="text-base sm:text-[18px] font-bold text-white font-editorial leading-snug tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)] truncate max-w-[240px] sm:max-w-[300px]">
                  {lang === 'hi' ? (alumni.hindiName || alumni.name) : alumni.name}
                </h3>
                {isProfileStudent ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-400/20 border border-sky-300/40 text-[10px] font-semibold text-sky-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-300 shadow-[0_0_6px_rgba(125,211,252,0.9)] animate-pulse" />
                    📘 {lang === 'hi' ? `वर्तमान छात्र • बैच ${batch}` : `Current Student • Batch of ${batch}`}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-[10px] font-semibold text-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)] animate-pulse" />
                    🎓 MCU Alumnus • {lang === 'hi' ? `बैच ${batch}` : `Batch of ${batch}`}
                  </span>
                )}
                {!isProfileStudent && alumni.openToMentor && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/40 text-[10px] font-semibold text-amber-200">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    {lang === 'hi' ? 'मेंटर' : 'Mentor'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="relative z-10 w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/10 hover:bg-red-500/90 text-white/80 hover:text-white border border-white/20 hover:border-red-400 flex items-center justify-center transition-all duration-200 hover:rotate-90 cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Container with ultra-slim 2.5px 3D Water-Glass Scrollbar */}
        <div className="overflow-y-auto mcu-modal-scroll flex-1 min-h-0 relative">
          {/* Profile Card Body */}
          <div className="px-6 sm:px-8 pb-7 pt-6 sm:pt-7 bg-gradient-to-b from-white via-[#f8fbff]/90 to-white">
            {/* Avatar & Header Info - Harmoniously Padded & Vertically Centered Executive Row */}
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-5 sm:gap-7 mb-6 pb-6 border-b border-sky-200/80">
              {/* 3D Sculpted Water-Glass Avatar Pedestal */}
              <div className="relative shrink-0 z-10 p-2 rounded-[26px] bg-gradient-to-b from-white via-sky-50 to-sky-100/90 border-[1.5px] border-sky-300/90 shadow-[0_18px_38px_-8px_rgba(2,132,199,0.28),0_6px_16px_-4px_rgba(15,23,42,0.08),inset_0_2px_2px_rgba(255,255,255,1)]">
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-[20px] overflow-hidden border border-sky-200/80 bg-white shadow-inner">
                  {alumni.avatar && typeof alumni.avatar === 'string' && alumni.avatar.trim() !== '' ? (
                    <img
                      src={alumni.avatar}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-sky-500 via-blue-600 to-[#003366] border border-white/80 shadow-[inset_0_2px_3px_rgba(255,255,255,0.45)] flex items-center justify-center text-white font-bold text-2xl sm:text-3xl font-editorial pb-3">
                      {(displayName || 'A').charAt(0).toUpperCase()}
                    </div>
                  )}
                  {/* Inside-Image Bottom Role Watermark (Scaled to Large Avatar, Editorial & Professional) */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-9 bg-gradient-to-t from-[#001529]/85 via-[#001529]/35 to-transparent" />
                  <span
                    className={`pointer-events-none absolute inset-x-0 bottom-[4px] z-10 flex items-center justify-center gap-1.5 text-center font-editorial text-[12px] sm:text-[13.5px] font-extrabold uppercase tracking-[0.16em] leading-none ${
                      isProfileStudent ? 'text-sky-50' : 'text-amber-50'
                    } [text-shadow:0_1.5px_2px_rgba(0,0,0,1),0_3px_6px_rgba(0,0,0,0.9)]`}
                  >
                    <span className={`w-2 sm:w-2.5 h-[1.5px] rounded-full ${isProfileStudent ? 'bg-sky-300/95' : 'bg-amber-300/95'}`} />
                    <span>
                      {isProfileStudent
                        ? (lang === 'hi' ? 'छात्र' : 'STUDENT')
                        : (lang === 'hi' ? 'पूर्व छात्र' : 'ALUMNI')}
                    </span>
                    <span className={`w-2 sm:w-2.5 h-[1.5px] rounded-full ${isProfileStudent ? 'bg-sky-300/95' : 'bg-amber-300/95'}`} />
                  </span>
                </div>
                {!isProfileStudent && alumni.openToMentor && (
                  <div
                    className="absolute -top-1.5 -right-1.5 p-1.5 rounded-xl bg-gradient-to-b from-[#fcd34d] via-[#fbaf5d] to-[#f5883d] text-white border-2 border-white shadow-[0_6px_14px_rgba(245,136,61,0.28),inset_0_1px_1px_rgba(255,255,255,0.75)] z-20"
                    title="Open to Mentor"
                  >
                    <Sparkles className="w-3.5 h-3.5 fill-white" />
                  </div>
                )}
              </div>

              {/* Name & Executive Information on Right with Premium Margin & Padding */}
              <div className="text-center sm:text-left flex-1 min-w-0 py-1 sm:py-1.5">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2.5 gap-y-1 mb-2">
                  <h3 className="text-2xl sm:text-[28px] font-extrabold text-slate-900 font-editorial tracking-tight leading-[1.18]">
                    {displayName}
                  </h3>
                  <CheckCircle2 className="w-5 h-5 text-sky-500 fill-sky-50 shrink-0" title={isProfileStudent ? 'Verified MCU Student' : 'Verified MCU Alumnus'} />
                  {secondaryName && (
                    <span className="text-xs sm:text-sm font-semibold text-slate-500">
                      ({secondaryName})
                    </span>
                  )}
                </div>

                <p className="text-sm sm:text-[15px] font-bold mb-3.5 flex items-center justify-center sm:justify-start gap-2.5 flex-wrap">
                  <span className="text-sky-700 font-extrabold">{currentRole}</span>
                  <span className="text-sky-300">•</span>
                  <span className="text-[#8d0303] font-extrabold">{company}</span>
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 text-xs text-slate-700 font-semibold">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-b from-white via-[#f8fbff] to-sky-50/90 border border-sky-200/95 shadow-[0_3px_10px_-2px_rgba(2,132,199,0.1),inset_0_1.5px_1px_rgba(255,255,255,1)]">
                    <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span>{location}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-b from-white via-[#f8fbff] to-sky-50/90 border border-sky-200/95 shadow-[0_3px_10px_-2px_rgba(2,132,199,0.1),inset_0_1.5px_1px_rgba(255,255,255,1)]">
                    <GraduationCap className="w-3.5 h-3.5 text-[#003366] shrink-0" />
                    <span>
                      {String(campus).toLowerCase().includes('campus') ? campus : `${campus} Campus`} • {lang === 'hi' ? `बैच ${batch}` : `Batch of ${batch}`}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* 3D Sculpted Water-Glass Key Facts Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {/* Degree Card */}
              <div
                className="relative overflow-hidden p-3.5 rounded-2xl bg-gradient-to-b from-white via-[#f8fbff] to-sky-50/80 border-[1.5px] border-sky-200/90 text-center shadow-[0_10px_24px_-6px_rgba(2,132,199,0.12),inset_0_2px_2px_rgba(255,255,255,1),inset_0_-2px_4px_rgba(14,165,233,0.1)] hover:-translate-y-0.5 transition-all"
                title={degree}
              >
                <div className="pointer-events-none absolute inset-x-3 top-0 h-[40%] bg-gradient-to-b from-white/90 to-transparent rounded-b-full" />
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block mb-1">
                  {lang === 'hi' ? 'उपाधि / डिग्री' : 'Degree'}
                </span>
                <span className="text-xs sm:text-[13px] font-extrabold text-[#003366] truncate block">
                  {degree}
                </span>
              </div>

              {/* Batch Year Card */}
              <div className="relative overflow-hidden p-3.5 rounded-2xl bg-gradient-to-b from-white via-[#f8fbff] to-sky-50/80 border-[1.5px] border-sky-200/90 text-center shadow-[0_10px_24px_-6px_rgba(2,132,199,0.12),inset_0_2px_2px_rgba(255,255,255,1),inset_0_-2px_4px_rgba(14,165,233,0.1)] hover:-translate-y-0.5 transition-all">
                <div className="pointer-events-none absolute inset-x-3 top-0 h-[40%] bg-gradient-to-b from-white/90 to-transparent rounded-b-full" />
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block mb-1">
                  {isProfileStudent
                    ? (lang === 'hi' ? 'संभावित उत्तीर्ण वर्ष' : 'Expected Grad Year')
                    : (lang === 'hi' ? 'बैच वर्ष' : 'Batch Year')}
                </span>
                <span className="text-xs sm:text-[13px] font-extrabold text-sky-700 block">
                  {lang === 'hi' ? `बैच ${batch}` : `Batch of ${batch}`}
                </span>
              </div>

              {/* Mentorship / Member Category Card */}
              <div className="relative overflow-hidden p-3.5 rounded-2xl bg-gradient-to-b from-white via-[#f8fbff] to-sky-50/80 border-[1.5px] border-sky-200/90 text-center col-span-2 sm:col-span-1 shadow-[0_10px_24px_-6px_rgba(2,132,199,0.12),inset_0_2px_2px_rgba(255,255,255,1),inset_0_-2px_4px_rgba(14,165,233,0.1)] hover:-translate-y-0.5 transition-all">
                <div className="pointer-events-none absolute inset-x-3 top-0 h-[40%] bg-gradient-to-b from-white/90 to-transparent rounded-b-full" />
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block mb-1">
                  {isProfileStudent
                    ? (lang === 'hi' ? 'सदस्य श्रेणी' : 'Member Category')
                    : (lang === 'hi' ? 'मेंटरशिप स्थिति' : 'Mentorship')}
                </span>
                {isProfileStudent ? (
                  <span className="text-xs sm:text-[13px] font-extrabold block text-sky-700">
                    📘 {lang === 'hi' ? 'वर्तमान छात्र' : 'Current Student'}
                  </span>
                ) : (
                  <span className={`text-xs sm:text-[13px] font-extrabold block ${alumni.openToMentor ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {alumni.openToMentor
                      ? (lang === 'hi' ? 'उपलब्ध (Available)' : 'Open to Mentor')
                      : (lang === 'hi' ? 'व्यस्त (Busy)' : 'Currently Unavailable')}
                  </span>
                )}
              </div>
            </div>

            {/* 3D Water-Glass Professional Biography */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2.5">
                <span className="w-1.5 h-4 rounded-full bg-gradient-to-b from-sky-400 to-blue-600 shadow-[0_0_8px_rgba(14,165,233,0.4)]" />
                <h4 className="text-xs uppercase tracking-wider font-extrabold text-[#003366]">
                  {lang === 'hi' ? 'परिचय एवं कार्य अनुभव' : 'Professional Biography'}
                </h4>
              </div>
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-[#f8fbff] to-sky-50/70 p-4 sm:p-5 border-[1.5px] border-sky-200/90 shadow-[0_10px_26px_-8px_rgba(2,132,199,0.12),inset_0_2px_2px_rgba(255,255,255,1)]">
                <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-sky-400 via-blue-600 to-[#003366]" />
                <p className="text-sm text-slate-700 leading-relaxed font-medium pl-2">
                  {bio}
                </p>
              </div>
            </div>

            {/* 3D Water-Glass Skills & Expertise */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2.5">
                <span className="w-1.5 h-4 rounded-full bg-gradient-to-b from-sky-400 to-blue-600 shadow-[0_0_8px_rgba(14,165,233,0.4)]" />
                <h4 className="text-xs uppercase tracking-wider font-extrabold text-[#003366]">
                  {lang === 'hi' ? 'विशेषज्ञता एवं कौशल' : 'Core Expertise & Skills'}
                </h4>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3.5 py-1.5 text-xs rounded-xl bg-gradient-to-b from-white via-sky-50/85 to-sky-100/75 text-[#0c4a6e] border border-sky-300/85 font-bold shadow-[0_4px_12px_-2px_rgba(2,132,199,0.12),inset_0_1.5px_1px_rgba(255,255,255,1),inset_0_-1.5px_2px_rgba(14,165,233,0.12)] hover:-translate-y-0.5 hover:border-sky-400 transition-all inline-flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                    <span>{skill}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Mentorship Focus Topics if open */}
            {alumni.openToMentor && alumni.mentorshipTopics && Array.isArray(alumni.mentorshipTopics) && (
              <div className="mb-6 p-4 rounded-2xl bg-gradient-to-b from-white via-sky-50/50 to-sky-100/40 border border-sky-200/90 shadow-[0_8px_20px_-6px_rgba(2,132,199,0.1),inset_0_2px_2px_rgba(255,255,255,1)]">
                <h4 className="text-xs uppercase tracking-wider font-extrabold text-sky-800 mb-2.5 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-sky-600" />
                  <span>{lang === 'hi' ? 'मेंटरशिप विषय' : 'Guidance Topics'}</span>
                </h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {alumni.mentorshipTopics.map((topic, idx) => (
                    <li key={idx} className="text-xs text-slate-700 font-semibold flex items-center gap-2 bg-white/80 px-3 py-1.5 rounded-xl border border-sky-200/70 shadow-2xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span>{topic}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Opportunities Broadcasted by this Alumnus */}
            {postedOpportunities && postedOpportunities.length > 0 && (
              <div className="mb-6 p-4 rounded-2xl bg-amber-50/80 border border-amber-300 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-[#8d0303]" />
                    <h4 className="text-xs font-bold text-[#003366] uppercase tracking-wider">
                      {isMe
                        ? (lang === 'hi' ? 'मेरे द्वारा प्रसारित अवसर (My Posted Opportunities)' : 'Opportunities Posted by You')
                        : (lang === 'hi' ? 'इस पूर्व छात्र द्वारा प्रसारित अवसर' : 'Opportunities Posted by this Alumnus')} ({postedOpportunities.length})
                    </h4>
                  </div>
                  {isMe ? (
                    <span className="text-[10px] text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded border border-red-200">
                      {lang === 'hi' ? 'हटाने का अधिकार केवल आपके पास है' : 'Exclusive Delete Access'}
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {lang === 'hi' ? 'सक्रिय अवसर' : 'Active Posts'}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {postedOpportunities.map((job) => (
                    <div key={job.id} className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3 shadow-xs hover:border-amber-300 transition-colors">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-slate-900">{job.title}</span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">Live</span>
                        </div>
                        <p className="text-[11px] text-slate-500">{job.company || job.company_name} • {job.location || 'Remote'} • {job.salary || job.salary_range || 'Competitive'}</p>
                      </div>

                      {/* Delete button appears ONLY if current user actually created this job */}
                      {isMe && isJobOwner(job) && onDeleteJob && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(lang === 'hi' ? `क्या आप वाकई "${job.title}" अवसर को स्थायी रूप से हटाना चाहते हैं?` : `Are you sure you want to permanently delete "${job.title}"?`)) {
                              onDeleteJob(job.id);
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                          title={lang === 'hi' ? 'अवसर हटाएं' : 'Delete Opportunity'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{lang === 'hi' ? 'हटाएं' : 'Delete'}</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Student Referral Applications (Visible only to this Alumnus / isMe) */}
            {isMe && myAlumniApplications && myAlumniApplications.length > 0 && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-50/80 border border-emerald-300 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-700" />
                    <h4 className="text-xs font-bold text-[#003366] uppercase tracking-wider">
                      {lang === 'hi' ? 'छात्रों के प्राप्त रेफरल आवेदन' : 'Received Student Applications'} ({myAlumniApplications.length})
                    </h4>
                  </div>
                  {onOpenManageApplications && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenManageApplications();
                      }}
                      className="text-[10px] text-emerald-800 font-bold bg-white px-2.5 py-1 rounded-lg border border-emerald-300 hover:bg-emerald-100 transition-colors inline-flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <span>{lang === 'hi' ? 'सभी प्रबंधित करें' : 'Manage All'}</span>
                      <span>→</span>
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {myAlumniApplications.map((app) => (
                    <div key={app.id} className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3 shadow-xs hover:border-emerald-300 transition-colors">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-slate-900">{app.applicant_name}</span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-50 text-[#003366] border border-blue-200">
                            {app.applicant_degree}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            app.status === 'referred' || app.status === 'accepted'
                              ? 'bg-emerald-100 text-emerald-800'
                              : app.status === 'under_review'
                              ? 'bg-orange-100 text-[#fc4a00] border border-orange-300'
                              : app.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {app.status === 'referred' || app.status === 'accepted' ? 'Referred' :
                             app.status === 'under_review' ? 'In Review' :
                             app.status === 'rejected' ? 'Declined' : 'Pending'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">
                          Applied for: <span className="font-semibold text-slate-700">{app.job_title}</span> • {app.applicant_email}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setPreviewingApp(app)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-xs hover:scale-[1.02]"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-300" />
                        <span>{lang === 'hi' ? 'रिज्यूमे' : 'Resume'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Student's Own Submitted Referral Applications (Visible when isMe) */}
            {isMe && mySubmittedApplicationsList && mySubmittedApplicationsList.length > 0 && (
              <div className="mb-6 p-4 rounded-2xl bg-blue-50/80 border border-blue-300 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-[#8d0303]" />
                    <h4 className="text-xs font-bold text-[#003366] uppercase tracking-wider">
                      {lang === 'hi' ? 'मेरे द्वारा किए गए रेफरल आवेदन' : 'My Applied Referral Jobs'} ({mySubmittedApplicationsList.length})
                    </h4>
                  </div>
                  {onOpenMyApplications && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenMyApplications();
                      }}
                      className="text-[10px] text-[#003366] font-bold bg-white px-2.5 py-1 rounded-lg border border-blue-300 hover:bg-blue-100 transition-colors inline-flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <span>{lang === 'hi' ? 'सभी प्रबंधित करें' : 'Manage All'}</span>
                      <span>→</span>
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {mySubmittedApplicationsList.map((app) => (
                    <div key={app.id} className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3 shadow-xs hover:border-blue-300 transition-colors">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-slate-900">{app.job_title}</span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-50 text-[#8d0303] border border-red-200">
                            {app.company_name}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            app.status === 'referred' || app.status === 'accepted'
                              ? 'bg-emerald-100 text-emerald-800'
                              : app.status === 'under_review'
                              ? 'bg-orange-100 text-[#fc4a00] border border-orange-300'
                              : app.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {app.status === 'referred' || app.status === 'accepted' ? '🎉 Accepted' :
                             app.status === 'under_review' ? 'In Review' :
                             app.status === 'rejected' ? 'Declined' : 'Pending'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">
                          Target Alumnus: <span className="font-semibold text-slate-700">{app.alumni_name || 'Alumnus'}</span> • {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : 'Recent'}
                        </p>
                      </div>

                      {app.resume_file_url && (
                        <button
                          type="button"
                          onClick={() => setPreviewingApp(app)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-xs hover:scale-[1.02]"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-300" />
                          <span>{lang === 'hi' ? 'रिज्यूमे' : 'Resume'}</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3D Water-Glass Executive Footer Actions & Links */}
            <div className="pt-5 border-t border-sky-200/80 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 w-full sm:w-auto">
                <a
                  href={getAlumniLinkedInUrl(alumni)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-b from-[#0A66C2] to-[#004182] hover:from-[#0c72d6] hover:to-[#003366] text-white text-xs font-bold transition-all shadow-[0_8px_18px_-4px_rgba(10,102,194,0.45),inset_0_1.5px_1px_rgba(255,255,255,0.35)] hover:-translate-y-0.5"
                  title="Connect on LinkedIn"
                >
                  <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64c-.9 0-1.63.73-1.63 1.63s.73 1.63 1.63 1.63 1.63-.73 1.63-1.63c0-.9-.73-1.63-1.63-1.63Z" />
                  </svg>
                  <span>{lang === 'hi' ? 'LinkedIn प्रोफाइल देखें' : 'View LinkedIn Profile'}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                {alumni.email && (
                  <a
                    href={`mailto:${alumni.email}`}
                    className="p-2.5 rounded-xl bg-gradient-to-b from-white via-sky-50 to-sky-100/80 hover:from-white hover:to-sky-200/70 text-[#0c4a6e] border border-sky-300/85 shadow-[0_4px_12px_-2px_rgba(2,132,199,0.14),inset_0_1.5px_1px_rgba(255,255,255,1)] transition-all hover:-translate-y-0.5"
                    title="Contact via Email"
                  >
                    <Mail className="w-4 h-4" />
                  </a>
                )}

                {batch && (
                  <a
                    href={getMcuLinkedInSearchUrl('', batch)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-[#0c4a6e] hover:text-sky-700 font-bold px-3 py-2 bg-gradient-to-b from-white via-sky-50/90 to-sky-100/75 rounded-xl border border-sky-300/85 shadow-[0_4px_10px_-2px_rgba(2,132,199,0.1),inset_0_1.5px_1px_rgba(255,255,255,1)] flex items-center gap-1 transition-all hover:-translate-y-0.5"
                  >
                    <span>{lang === 'hi' ? `बैच ${batch} LinkedIn` : `Batch of ${batch} on LinkedIn`}</span>
                    <span>↗</span>
                  </a>
                )}

                {onOpenPostJob && !isProfileStudent && !isViewerStudent && (isMe || currentUser?.is_admin || currentUser?.role === 'admin') && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenPostJob(alumni);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-b from-amber-50 via-orange-50/90 to-amber-100/80 hover:from-amber-100 hover:to-orange-100 text-amber-900 border border-amber-300/90 text-xs font-extrabold transition-all shadow-[0_4px_12px_-2px_rgba(245,158,11,0.18),inset_0_1.5px_1px_rgba(255,255,255,1)] cursor-pointer hover:-translate-y-0.5"
                    title={
                      isViewerVerified
                        ? (lang === 'hi' ? 'इस प्रोफाइल से अवसर पोस्ट करें' : 'Post an opportunity from this profile')
                        : (lang === 'hi' ? 'एडमिन सत्यापन के बाद ही जॉब पोस्ट कर सकते हैं' : 'Requires MCU Admin verification to post jobs')
                    }
                  >
                    <Briefcase className="w-3.5 h-3.5 text-amber-600" />
                    <span>
                      {isViewerVerified
                        ? (lang === 'hi' ? 'अवसर पोस्ट करें' : 'Post Opportunity')
                        : (lang === 'hi' ? '🔒 एडमिन सत्यापन लंबित' : '🔒 Pending Admin Verification')}
                    </span>
                  </button>
                )}
              </div>

              {!isProfileStudent && (
                <button
                  onClick={() => {
                    onClose();
                    onRequestMentorship(alumni);
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8d0303] to-[#fc4a00] hover:from-[#680a13] hover:to-[#e04000] text-white font-extrabold text-xs sm:text-sm ring-2 ring-amber-300 shadow-md shadow-red-950/20 transition-all flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5"
                >
                  <Compass className="w-4 h-4" />
                  <span>{t.actions.requestMentorship}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {previewingApp && (
          <ResumePreviewModal
            application={previewingApp}
            currentUser={currentUser}
            isApplicant={isApplicantForUser(previewingApp)}
            canManageStatus={isMe && isApplicationForAlumni(previewingApp) && !isApplicantForUser(previewingApp)}
            onClose={() => setPreviewingApp(null)}
            onUpdateStatus={(appId, newStatus) => {
              if (onUpdateApplicationStatus) onUpdateApplicationStatus(appId, newStatus);
              setPreviewingApp((prev) => prev ? { ...prev, status: newStatus } : null);
            }}
          />
        )}
      </div>
    </div>
  );
};
