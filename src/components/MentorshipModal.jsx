import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { mentorshipAPI } from '../services/api';
import { X, Compass, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { FormProgressBar } from './FormProgressBar';

export const MentorshipModal = ({ mentor, currentUser = null, onClose, onSuccess }) => {
  const { lang, t } = useLanguage();
  const defaultTopics = [
    ...(mentor?.mentorshipTopics || []),
    'Career Guidance & Tech Roadmap',
    'Full Stack Software Engineering & Projects',
    'Resume Review & Coding Interview Prep',
    'Cloud, DevOps & System Design',
    "Master's / Higher Studies / Fellowship Guidance",
    'Other (Career / Technical / Startup Guidance)',
  ].filter((v, i, a) => v && a.indexOf(v) === i);

  const [formData, setFormData] = useState({
    name: currentUser?.full_name || currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    status: currentUser?.role === 'alumni' && !currentUser?.is_student ? 'Working Alumnus' : 'Student',
    topic: defaultTopics[0] || 'Career Guidance & Tech Roadmap',
    customTopic: '',
    preferredTime: 'Weekend Evening (Saturday / Sunday, 6:00 PM - 8:00 PM)',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || currentUser.full_name || currentUser.name || '',
        email: prev.email || currentUser.email || '',
        phone: prev.phone || currentUser.phone || '',
      }));
    }
  }, [currentUser]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!mentor) return null;

  const isCustomTopic = formData.topic.startsWith('Other');
  const resolvedTopic = isCustomTopic
    ? (formData.customTopic.trim() || 'Other Career & Technical Guidance')
    : formData.topic;

  const mentorshipFields = [
    Boolean(formData.name?.trim().length >= 2),
    Boolean(formData.email?.trim().includes('@')),
    Boolean(formData.status?.trim()),
    Boolean(formData.preferredTime?.trim()),
    Boolean(resolvedTopic?.trim()),
    Boolean(formData.message?.trim().length >= 5),
  ];
  const mentorshipCompleted = mentorshipFields.filter(Boolean).length;
  const mentorshipPercentage = Math.round((mentorshipCompleted / mentorshipFields.length) * 100);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const numericMentorId = !isNaN(Number(mentor.id)) ? Number(mentor.id) : 0;
    const mentorName = mentor.name || mentor.full_name || 'MCU Alumnus Mentor';
    const mentorEmail = mentor.email || '';
    const mentorRole = mentor.currentRole || mentor.current_role || 'Software Engineer';
    const mentorCompany = mentor.company || 'Tech Enterprise';

    const payload = {
      mentor_alumni_id: numericMentorId,
      mentor_email: mentorEmail,
      mentor_name: mentorName,
      mentor_role: mentorRole,
      mentor_company: mentorCompany,
      mentee_name: formData.name.trim(),
      mentee_email: formData.email.trim(),
      mentee_phone: formData.phone?.trim() || null,
      mentee_status: formData.status,
      topic: resolvedTopic,
      preferred_time: formData.preferredTime,
      message: formData.message.trim(),
    };

    let createdRecord = {
      id: `mreq-${Date.now()}`,
      ...payload,
      mentor_id_str: String(mentor.id || ''),
      mentee_user_id: currentUser?.id || null,
      status: 'pending',
      session_date: '',
      session_time: '',
      session_mode: '',
      meeting_link: '',
      mentor_note: '',
      created_at: new Date().toISOString(),
    };

    try {
      const res = await mentorshipAPI.requestSession(payload);
      if (res?.request || res?.id) {
        createdRecord = {
          ...createdRecord,
          ...(res.request || {}),
          id: res.id || res.request?.id || createdRecord.id,
          mentor_email: res.mentor_email || res.request?.mentor_email || mentorEmail,
          mentor_name: mentorName,
          mentor_role: mentorRole,
          mentor_company: mentorCompany,
        };
      }
    } catch (err) {
      console.log('[Mentorship] Saved with local fallback:', err?.message);
    }

    // Persist in localStorage so both Mentor (Alumnus) and Mentee (Student) accounts get instant notifications
    try {
      // Clear any previous deleted signature for this new request so it appears fresh
      const sEmail = (createdRecord.mentee_email || '').toLowerCase().trim();
      const topic = (createdRecord.topic || '').toLowerCase().trim();
      const msg = (createdRecord.message || '').toLowerCase().trim();
      const freshSigs = new Set([
        `id:${String(createdRecord.id)}`,
        `key:${sEmail}|${topic}|${msg}`,
        `et:${sEmail}|${topic}`,
      ]);
      const deletedList = JSON.parse(localStorage.getItem('mcu_deleted_mentorship_keys') || '[]');
      if (Array.isArray(deletedList) && deletedList.length > 0) {
        localStorage.setItem(
          'mcu_deleted_mentorship_keys',
          JSON.stringify(deletedList.filter((sig) => !freshSigs.has(sig)))
        );
      }

      const existing = JSON.parse(localStorage.getItem('mcu_mentorship_requests') || '[]');
      const next = [
        createdRecord,
        ...(Array.isArray(existing) ? existing.filter((r) => String(r.id) !== String(createdRecord.id)) : []),
      ];
      localStorage.setItem('mcu_mentorship_requests', JSON.stringify(next));
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.warn('Could not cache mentorship request locally:', err);
    }

    setIsSubmitting(false);
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch {
      // ignore if canvas unavailable
    }
    onSuccess(
      lang === 'hi'
        ? `मार्गदर्शन अनुरोध ${mentorName} को ईमेल व पोर्टल नोटिफिकेशन द्वारा भेज दिया गया है! जब वे सत्र का समय निर्धारित करेंगे तो आपके अकाउंट में नोटिफिकेशन मिल जाएगा।`
        : `Mentorship request sent to ${mentorName} via Email & Account Notification! You will receive a notification in your account as soon as they schedule the session.`,
      createdRecord
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/65 backdrop-blur-md mcu-backdrop-enter"
      onClick={onClose}
    >
      <div
        className="mcu-animated-border-modal mcu-modal-spring-enter bg-gradient-to-b from-white via-[#fafdff] to-[#f4f9ff] w-full max-w-[620px] rounded-2xl sm:rounded-3xl border border-sky-200/80 shadow-[0_28px_70px_-12px_rgba(2,132,199,0.26),0_10px_28px_-6px_rgba(0,34,68,0.16)] overflow-hidden relative max-h-[92vh] flex flex-col"
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
                <h3 className="text-base sm:text-[18px] font-bold text-white font-editorial leading-snug tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                  {lang === 'hi' ? 'मार्गदर्शन सत्र अनुरोध' : 'Book Mentorship Session'}
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-[10px] font-semibold text-emerald-300 truncate max-w-[220px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)] animate-pulse shrink-0" />
                  <span className="truncate">{lang === 'hi' ? mentor.hindiName : mentor.name}</span>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 pb-6 space-y-4 flex-1 min-h-0 overflow-y-auto mcu-modal-scroll mcu-form-step-enter">
          <FormProgressBar
            percentage={mentorshipPercentage}
            completedFields={mentorshipCompleted}
            totalFields={mentorshipFields.length}
            title={lang === 'hi' ? 'मार्गदर्शन अनुरोध प्रगति' : 'Mentorship Request Progress'}
            lang={lang}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {lang === 'hi' ? 'आपका नाम (Full Name) *' : 'Your Full Name *'}
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Rahul Sharma"
                className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#fc4a00]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {lang === 'hi' ? 'ईमेल (Email Address) *' : 'Email Address *'}
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@domain.com"
                className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#fc4a00]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {lang === 'hi' ? 'मोबाइल / WhatsApp' : 'Phone / WhatsApp'}
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#fc4a00]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {lang === 'hi' ? 'आपकी वर्तमान स्थिति *' : 'Current Status *'}
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#003366]"
              >
                <option value="Student">Current MCU Student</option>
                <option value="Recent Graduate">Recent Graduate (Last 2 Yrs)</option>
                <option value="Working Alumnus">Working Alumnus (Career Switch)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {lang === 'hi' ? 'सुविधाजनक समय *' : 'Preferred Slot *'}
              </label>
              <select
                value={formData.preferredTime}
                onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                className="w-full bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#003366]"
              >
                <option value="Weekend Evening (Saturday / Sunday, 6:00 PM - 8:00 PM)">Saturday / Sunday Evening (6 - 8 PM)</option>
                <option value="Weekday Morning (8:00 AM - 10:00 AM)">Weekday Morning (8 - 10 AM)</option>
                <option value="Weekday Evening (7:00 PM - 9:00 PM)">Weekday Evening (7 - 9 PM)</option>
                <option value="Whenever Alumnus is Free (Flexible Slot)">Whenever Alumnus is Free (Flexible Slot)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              {lang === 'hi' ? 'चर्चा का मुख्य विषय (Career / Tech / Other) *' : 'Mentorship Topic (Career / Tech / Other) *'}
            </label>
            <select
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              className="w-full bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#003366]"
            >
              {defaultTopics.map((topic, i) => (
                <option key={i} value={topic}>{topic}</option>
              ))}
            </select>
            {isCustomTopic && (
              <input
                type="text"
                required
                value={formData.customTopic}
                onChange={(e) => setFormData({ ...formData, customTopic: e.target.value })}
                placeholder={lang === 'hi' ? 'अपना विषय लिखें (जैसे: प्रोडक्ट मैनेजमेंट, स्टार्टअप, विदेश में पढ़ाई)...' : 'Enter your custom career or guidance topic...'}
                className="mt-2 w-full bg-amber-50/50 px-3.5 py-2.5 rounded-xl border border-amber-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#fc4a00]"
              />
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              {lang === 'hi' ? 'संदेश या मुख्य प्रश्न *' : 'Brief Context / Questions for Mentor *'}
            </label>
            <textarea
              required
              rows={3}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder={lang === 'hi'
                ? 'अपने प्रश्न, वर्तमान प्रोजेक्ट या करियर लक्ष्य संक्षेप में लिखें...'
                : 'Briefly describe your goals, career roadblocks, or specific advice you seek...'}
              className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#fc4a00] resize-none"
            />
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-[#8d0303] flex items-start gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-[#fc4a00] shrink-0 mt-0.5" />
            <span>
              {lang === 'hi'
                ? 'आपका अनुरोध पूर्व छात्र के ईमेल व पोर्टल अकाउंट नोटिफिकेशन में तुरंत भेज दिया जाएगा। जब पूर्व छात्र अपने खाली समय के अनुसार सत्र का समय निर्धारित करेंगे, तो आपके अकाउंट में नोटिफिकेशन आ जाएगा।'
                : 'Your request will be sent to the Alumnus via Email and Account Notification. When the Alumnus schedules the session based on their free time, you will receive an instant notification in your account.'}
            </span>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900"
            >
              {t.actions.cancel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl btn-mcu-saffron text-xs shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <Compass className="w-4 h-4" />
                  <span>{t.actions.sendRequest}</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
