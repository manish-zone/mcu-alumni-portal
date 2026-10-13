import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../context/LanguageContext';
import {
  X,
  FileText,
  Download,
  ExternalLink,
  Mail,
  Phone,
  GraduationCap,
  Briefcase,
  CheckCircle2,
  Clock,
  XCircle,
  User,
  Calendar,
  Building2,
  Share2
} from 'lucide-react';

export const ResumePreviewModal = ({
  application,
  currentUser = null,
  isApplicant = false,
  canManageStatus = false,
  onClose,
  onUpdateStatus
}) => {
  const { lang } = useLanguage();

  const isCurrentUserApplicant = Boolean(
    isApplicant || (
      currentUser && application && (
        (currentUser.id && application.applicant_user_id && String(currentUser.id) === String(application.applicant_user_id)) ||
        (currentUser.email && application.applicant_email && currentUser.email.toLowerCase().trim() === application.applicant_email.toLowerCase().trim())
      )
    )
  );

  const canEditStatus = Boolean(onUpdateStatus && canManageStatus && !isCurrentUserApplicant);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!application) return null;

  const isPdf = application.resume_file_url && (
    application.resume_file_url.includes('application/pdf') ||
    application.resume_file_name?.toLowerCase().endsWith('.pdf') ||
    application.resume_file_url.startsWith('blob:')
  );

  const isImage = application.resume_file_url && (
    application.resume_file_url.includes('image/') ||
    /\.(jpe?g|png|webp)$/i.test(application.resume_file_name || '')
  );

  const handleDownload = () => {
    if (!application.resume_file_url) return;
    const a = document.createElement('a');
    a.href = application.resume_file_url;
    a.download = application.resume_file_name || `${application.applicant_name}_Resume.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenNewTab = () => {
    if (!application.resume_file_url) return;
    const win = window.open();
    if (win) {
      if (isPdf || isImage) {
        win.document.write(
          `<iframe src="${application.resume_file_url}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
        );
      } else {
        win.location.href = application.resume_file_url;
      }
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-slate-950/65 backdrop-blur-md mcu-backdrop-enter"
      onClick={onClose}
    >
      <div
        className="mcu-animated-border-modal mcu-modal-spring-enter bg-gradient-to-b from-white via-[#fafdff] to-[#f4f9ff] w-full max-w-[650px] rounded-2xl sm:rounded-3xl border border-sky-200/80 shadow-[0_28px_70px_-12px_rgba(2,132,199,0.26),0_10px_28px_-6px_rgba(0,34,68,0.16)] overflow-hidden relative max-h-[92vh] flex flex-col"
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
                  {application.applicant_name} — {lang === 'hi' ? 'छात्र रिज्यूमे' : 'Student Resume'}
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-[10px] font-semibold text-emerald-300 truncate max-w-[220px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)] animate-pulse shrink-0" />
                  <span className="truncate">{application.job_title} • {application.company_name}</span>
                </span>
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

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto mcu-modal-scroll flex-1 space-y-4">

          {/* Candidate Profile Strip */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5 text-slate-700">
                <GraduationCap className="w-4 h-4 text-[#003366]" />
                <span className="font-bold">{application.applicant_degree}</span>
                {application.mcu_batch && (
                  <span className="text-slate-500 font-medium">({lang === 'hi' ? 'बैच' : 'Batch'} {application.mcu_batch})</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <Mail className="w-3.5 h-3.5 text-amber-600" />
                <a href={`mailto:${application.applicant_email}`} className="text-[#003366] hover:underline font-semibold">
                  {application.applicant_email}
                </a>
              </div>
              {application.applicant_phone && (
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <a href={`tel:${application.applicant_phone}`} className="text-emerald-700 hover:underline font-semibold">
                    {application.applicant_phone}
                  </a>
                </div>
              )}
            </div>

            {application.portfolio_url && (
              <a
                href={application.portfolio_url.startsWith('http') ? application.portfolio_url : `https://${application.portfolio_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0A66C2] border border-blue-200 font-bold inline-flex items-center gap-1 text-[11px] transition-colors"
              >
                <span>Portfolio / GitHub</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* Student Cover Note */}
          {application.cover_note && (
            <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs text-slate-700 space-y-1">
              <span className="text-[10px] font-bold text-[#8d0303] uppercase tracking-wider block">
                {lang === 'hi' ? 'विद्यार्थी का संदेश / पिच (Candidate Note):' : 'Candidate Note / Cover Pitch:'}
              </span>
              <p className="italic text-slate-800 leading-relaxed font-sans">
                "{application.cover_note}"
              </p>
            </div>
          )}

          {/* Resume Viewer / File Preview */}
          <div className="rounded-2xl border-2 border-slate-300 bg-slate-100 p-2 overflow-hidden flex flex-col items-center justify-center min-h-[350px]">
            {application.resume_file_url ? (
              isPdf ? (
                <iframe
                  src={application.resume_file_url}
                  className="w-full h-[460px] rounded-xl border border-slate-300 bg-white"
                  title="Candidate Resume"
                />
              ) : isImage ? (
                <div className="max-h-[460px] overflow-auto rounded-xl">
                  <img
                    src={application.resume_file_url}
                    alt={application.resume_file_name || 'Resume'}
                    className="max-w-full h-auto object-contain rounded-xl shadow-sm"
                  />
                </div>
              ) : (
                <div className="text-center py-10 px-4 space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-sm">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">
                      {application.resume_file_name || 'Resume Document'}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      {lang === 'hi'
                        ? 'इस फ़ाइल प्रारूप को सीधे डाउनलोड करके देखा जा सकता है।'
                        : 'This document can be downloaded and opened on your device.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="px-5 py-2.5 rounded-xl bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold transition-all shadow-md inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>{lang === 'hi' ? 'फ़ाइल डाउनलोड करें' : 'Download Resume File'}</span>
                  </button>
                </div>
              )
            ) : (
              <div className="text-center py-12 px-4 space-y-2">
                <FileText className="w-12 h-12 text-slate-400 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700">
                  {lang === 'hi' ? 'कोई अलग रिज्यूमे फ़ाइल संलग्न नहीं है' : 'No external resume file attached'}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {lang === 'hi'
                    ? 'विद्यार्थी ने ऊपर दिए गए विवरण, पोर्टफोलियो एवं संपर्क जानकारी के आधार पर आवेदन किया है।'
                    : 'Candidate applied using their profile info, degree credentials, and portfolio link above.'}
                </p>
              </div>
            )}
          </div>

          {/* Quick File Action Bar */}
          {application.resume_file_url && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <span className="text-xs text-slate-500 font-medium">
                📄 {application.resume_file_name || 'Resume Document'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenNewTab}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{lang === 'hi' ? 'नई विंडो में खोलें' : 'Open in New Window'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-3.5 py-1.5 rounded-lg bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{lang === 'hi' ? 'डाउनलोड करें' : 'Download'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Manage Status Bar for Alumnus OR Read-only Status Display for Student */}
          {canEditStatus ? (
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#003366] uppercase tracking-wider">
                  {lang === 'hi' ? 'रेफरल स्थिति प्रबंधित करें (Manage Referral Status)' : 'Update Referral Status'}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  application.status === 'referred' || application.status === 'accepted'
                    ? 'bg-emerald-600 text-white'
                    : application.status === 'under_review'
                    ? 'bg-blue-600 text-white'
                    : application.status === 'rejected'
                    ? 'bg-red-600 text-white'
                    : 'bg-amber-500 text-white'
                }`}>
                  {application.status === 'referred' || application.status === 'accepted' ? '✅ Referred to HR' :
                   application.status === 'under_review' ? '🔍 Under Review' :
                   application.status === 'rejected' ? '❌ Not Shortlisted' : '⏳ Submitted / Pending'}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onUpdateStatus(application.id, 'referred')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                    application.status === 'referred' || application.status === 'accepted'
                      ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                      : 'bg-white text-emerald-700 border border-emerald-300 hover:bg-emerald-50'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{lang === 'hi' ? 'रेफरल अग्रेषित करें (Refer to HR)' : 'Refer to HR'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateStatus(application.id, 'under_review')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                    application.status === 'under_review'
                      ? 'bg-[#fc4a00] text-white ring-2 ring-[#fc4a00]'
                      : 'bg-white text-[#fc4a00] border border-orange-300 hover:bg-orange-50'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{lang === 'hi' ? 'समीक्षाधीन (Under Review)' : 'Under Review'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateStatus(application.id, 'rejected')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                    application.status === 'rejected'
                      ? 'bg-red-600 text-white ring-2 ring-red-400'
                      : 'bg-white text-red-600 border border-red-200 hover:bg-red-50'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>{lang === 'hi' ? 'अस्वीकृत करें (Decline)' : 'Decline'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Read-Only Status Display for Applicant/Student (No option buttons) */
            <div className={`p-4 rounded-2xl border ${
              application.status === 'referred' || application.status === 'accepted'
                ? 'bg-emerald-50/80 border-emerald-300'
                : application.status === 'under_review'
                ? 'bg-orange-50/80 border-orange-300'
                : application.status === 'rejected'
                ? 'bg-red-50/80 border-red-200'
                : 'bg-amber-50/80 border-amber-300'
            } flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  {lang === 'hi' ? 'रेफरल स्थिति (Referral Status):' : 'Current Referral Status:'}
                </span>
                <p className="text-xs font-medium text-slate-700">
                  {application.status === 'referred' || application.status === 'accepted'
                    ? (lang === 'hi' ? '🎉 बधाई! पूर्व छात्र ने आपका आवेदन स्वीकार कर लिया है एवं HR को रेफर कर दिया है।' : '🎉 Congratulations! The alumnus accepted your referral and forwarded it to HR.')
                    : application.status === 'under_review'
                    ? (lang === 'hi' ? '🔍 पूर्व छात्र वर्तमान में आपके रिज्यूमे व प्रोफाइल की समीक्षा कर रहे हैं।' : '🔍 The alumnus is currently reviewing your resume and profile.')
                    : application.status === 'rejected'
                    ? (lang === 'hi' ? 'पूर्व छात्र द्वारा इस अवसर के लिए रेफरल अग्रेषित नहीं किया जा सका।' : 'The referral could not be forwarded for this opportunity.')
                    : (lang === 'hi' ? '⏳ आपका आवेदन सफलतापूर्वक प्रेषित हो चुका है, पूर्व छात्र की समीक्षा की प्रतीक्षा है।' : '⏳ Application submitted. Waiting for alumnus review.')}
                </p>
              </div>

              <div className="shrink-0">
                <span className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-xs ${
                  application.status === 'referred' || application.status === 'accepted'
                    ? 'bg-emerald-600 text-white shadow-emerald-200'
                    : application.status === 'under_review'
                    ? 'bg-[#fc4a00] text-white font-bold shadow-orange-200'
                    : application.status === 'rejected'
                    ? 'bg-red-600 text-white shadow-red-200'
                    : 'bg-amber-500 text-white shadow-amber-200'
                }`}>
                  {application.status === 'referred' || application.status === 'accepted' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{lang === 'hi' ? 'रेफरल स्वीकृत (Accepted)' : 'Referred & Accepted'}</span>
                    </>
                  ) : application.status === 'under_review' ? (
                    <>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{lang === 'hi' ? 'समीक्षाधीन (Under Review)' : 'Under Review'}</span>
                    </>
                  ) : application.status === 'rejected' ? (
                    <>
                      <XCircle className="w-3.5 h-3.5" />
                      <span>{lang === 'hi' ? 'अस्वीकृत (Declined)' : 'Declined'}</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{lang === 'hi' ? 'प्रतीक्षारत (Pending)' : 'Pending Review'}</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {canEditStatus ? (
              <>
                <a
                  href={`mailto:${application.applicant_email}?subject=Regarding your MCU Referral Application for ${encodeURIComponent(application.job_title)}`}
                  className="px-3 py-2 rounded-xl bg-white border border-slate-300 hover:border-[#003366] text-[#003366] text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Mail className="w-3.5 h-3.5 text-amber-600" />
                  <span>{lang === 'hi' ? 'ईमेल भेजें' : 'Email Student'}</span>
                </a>
                {application.applicant_phone && (
                  <a
                    href={`tel:${application.applicant_phone}`}
                    className="px-3 py-2 rounded-xl bg-white border border-slate-300 hover:border-emerald-600 text-emerald-700 text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{lang === 'hi' ? 'कॉल करें' : 'Call'}</span>
                  </a>
                )}
              </>
            ) : (
              application.alumni_email && (
                <a
                  href={`mailto:${application.alumni_email}?subject=Inquiry regarding my referral application for ${encodeURIComponent(application.job_title)}`}
                  className="px-3 py-2 rounded-xl bg-white border border-slate-300 hover:border-[#003366] text-[#003366] text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Mail className="w-3.5 h-3.5 text-amber-600" />
                  <span>{lang === 'hi' ? 'पूर्व छात्र को ईमेल करें' : 'Email Alumnus'}</span>
                </a>
              )
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold transition-colors cursor-pointer"
          >
            {lang === 'hi' ? 'बंद करें' : 'Close'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
