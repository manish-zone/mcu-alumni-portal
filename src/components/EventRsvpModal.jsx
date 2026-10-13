import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { X, Calendar, MapPin, Ticket, CheckCircle2, QrCode } from 'lucide-react';
import confetti from 'canvas-confetti';
import { FormProgressBar } from './FormProgressBar';

export const EventRsvpModal = ({ event, onClose, onSuccess }) => {
  const { lang, t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    batchYear: '',
    campus: 'Bhopal',
    guests: '1'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [passId, setPassId] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!event) return null;

  const rsvpFields = [
    Boolean(formData.name?.trim().length >= 2),
    Boolean(formData.email?.trim().includes('@')),
    Boolean(String(formData.batchYear || '').trim().length >= 4),
    Boolean(formData.campus?.trim()),
    Boolean(formData.guests?.trim()),
  ];
  const rsvpCompleted = rsvpFields.filter(Boolean).length;
  const rsvpPercentage = Math.round((rsvpCompleted / rsvpFields.length) * 100);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      const generatedPass = `MCU-${event.id.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
      setPassId(generatedPass);
      setIsConfirmed(true);

      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch {}

      onSuccess(t.toast.rsvpSuccess);
    }, 900);
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
                  {lang === 'hi' ? 'पूर्व छात्र प्रवेश पास आरक्षण' : 'Reserve Alumni Pass'}
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-[10px] font-semibold text-emerald-300 truncate max-w-[230px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)] animate-pulse shrink-0" />
                  <span className="truncate">{lang === 'hi' ? event.hindiTitle : event.title}</span>
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

        {/* Modal Content */}
        {!isConfirmed ? (
          <form onSubmit={handleSubmit} className="p-6 pb-6 space-y-4 flex-1 min-h-0 overflow-y-auto mcu-modal-scroll mcu-form-step-enter">
            <FormProgressBar
              percentage={rsvpPercentage}
              completedFields={rsvpCompleted}
              totalFields={rsvpFields.length}
              title={lang === 'hi' ? 'ई-पास आरक्षण प्रगति' : 'E-Pass Reservation Progress'}
              lang={lang}
            />
            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-slate-700 space-y-1">
              <div className="flex items-center gap-2 text-[#003366] font-bold">
                <Calendar className="w-3.5 h-3.5 text-[#fc4a00]" />
                <span>{event.date} • {event.time}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 text-[11px]">
                <MapPin className="w-3.5 h-3.5 text-[#8d0303] shrink-0" />
                <span className="truncate">{event.location}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {lang === 'hi' ? 'आपका नाम *' : 'Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Manish Vishwakarma"
                  className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#fc4a00]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {lang === 'hi' ? 'ईमेल पता *' : 'Email Address *'}
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="alumni@domain.com"
                  className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#fc4a00]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {lang === 'hi' ? 'बैच वर्ष *' : 'Batch Year *'}
                </label>
                <input
                  type="number"
                  required
                  min="1990"
                  max="2026"
                  value={formData.batchYear}
                  onChange={(e) => setFormData({ ...formData, batchYear: e.target.value })}
                  placeholder="e.g. 2014"
                  className="w-full bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#003366]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Campus
                </label>
                <select
                  value={formData.campus}
                  onChange={(e) => setFormData({ ...formData, campus: e.target.value })}
                  className="w-full bg-slate-50 px-2.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#003366]"
                >
                  <option value="Bhopal">Bhopal</option>
                  <option value="Khandwa">Khandwa</option>
                  <option value="Rewa">Rewa</option>
                  <option value="Datia">Datia</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Guests Attending
                </label>
                <select
                  value={formData.guests}
                  onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
                  className="w-full bg-slate-50 px-2.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#003366]"
                >
                  <option value="1">1 (Self)</option>
                  <option value="2">2 (With Spouse/Guest)</option>
                  <option value="3">3 (Family)</option>
                </select>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-3">
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
                <Ticket className="w-4 h-4" />
                <span>{isSubmitting ? 'Confirming...' : t.actions.rsvpEvent}</span>
              </button>
            </div>

          </form>
        ) : (
          /* Pass Confirmed View */
          <div className="p-6 text-center space-y-5">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border-2 border-emerald-300">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-xl font-bold text-[#003366] font-editorial">
                {lang === 'hi' ? 'ई-पास सफलतापूर्वक जनरेट हुआ!' : 'Alumni E-Pass Confirmed!'}
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                Your delegate pass has been confirmed for {event.title}.
              </p>
            </div>

            {/* Simulated Digital Ticket */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#003366] to-[#002244] text-white border-2 border-[#fc4a00] text-left relative overflow-hidden shadow-xl">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-300 block tracking-wider">
                    MCU ALUMNI DELEGATE PASS
                  </span>
                  <span className="text-sm font-mono font-bold text-white">{passId}</span>
                </div>
                <div className="p-1.5 rounded-lg bg-white">
                  <QrCode className="w-8 h-8 text-[#003366]" />
                </div>
              </div>

              <div className="text-xs text-amber-100 font-semibold mb-1">
                {formData.name} (MCU Batch of {formData.batchYear})
              </div>
              <div className="text-[11px] text-slate-300">
                {event.date} • {event.location}
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold transition-colors shadow-md"
            >
              {t.actions.close}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
