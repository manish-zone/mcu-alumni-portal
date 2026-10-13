import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { X, Heart, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { FormProgressBar } from './FormProgressBar';

export const GivingModal = ({ initiative, onClose, onSuccess }) => {
  const { lang, t } = useLanguage();
  const [selectedAmount, setSelectedAmount] = useState('5000');
  const [customAmount, setCustomAmount] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!initiative) return null;

  const tiers = ['1000', '2500', '5000', '10000', '25000'];

  const givingFields = [
    Boolean(selectedAmount || Number(customAmount) > 0),
    Boolean(donorName?.trim().length >= 2),
    Boolean(donorEmail?.trim().includes('@')),
    Boolean(panNumber?.trim().length >= 5),
  ];
  const givingCompleted = givingFields.filter(Boolean).length;
  const givingPercentage = Math.round((givingCompleted / givingFields.length) * 100);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}
      onSuccess(t.toast.donationSuccess);
      onClose();
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
                  {lang === 'hi' ? 'पूर्व छात्र सहयोग एवं योगदान' : 'Alumni Giving Pledge'}
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-[10px] font-semibold text-emerald-300 truncate max-w-[230px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)] animate-pulse shrink-0" />
                  <span className="truncate">{lang === 'hi' ? initiative.hindiTitle : initiative.title}</span>
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

        <form onSubmit={handleSubmit} className="p-6 pb-6 space-y-4 flex-1 min-h-0 overflow-y-auto mcu-modal-scroll mcu-form-step-enter">
          <FormProgressBar
            percentage={givingPercentage}
            completedFields={givingCompleted}
            totalFields={givingFields.length}
            title={lang === 'hi' ? 'सहयोग प्रतिज्ञा प्रगति' : 'Giving Pledge Progress'}
            lang={lang}
          />
          {/* Preset Contribution Amounts */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">
              {lang === 'hi' ? 'योगदान राशि चुनें (INR)' : 'Select Contribution Amount (INR)'}
            </label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {tiers.map((amt) => (
                <button
                  type="button"
                  key={amt}
                  onClick={() => {
                    setSelectedAmount(amt);
                    setCustomAmount('');
                  }}
                  className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                    selectedAmount === amt && !customAmount
                      ? 'bg-[#8d0303] text-white border-[#8d0303] shadow-md'
                      : 'bg-slate-50 text-slate-700 border-slate-300 hover:border-[#8d0303]'
                  }`}
                >
                  ₹{Number(amt).toLocaleString('en-IN')}
                </button>
              ))}
            </div>

            <input
              type="number"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                setSelectedAmount('');
              }}
              placeholder="Or enter custom amount in ₹"
              className="w-full bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#8d0303]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Donor Name *
              </label>
              <input
                type="text"
                required
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                placeholder="Manish Vishwakarma"
                className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#8d0303]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Email Address (for 80G Receipt) *
              </label>
              <input
                type="email"
                required
                value={donorEmail}
                onChange={(e) => setDonorEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#8d0303]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              PAN Number (Optional for Tax Exemption Certificate)
            </label>
            <input
              type="text"
              maxLength={10}
              value={panNumber}
              onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
              placeholder="e.g. ABCDE1234F"
              className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 font-mono uppercase placeholder-slate-400 focus:outline-none focus:border-[#8d0303]"
            />
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Tax Deductible under Section 80G of Income Tax Act</span>
            </div>
            <p className="text-emerald-900/80">
              Contributions directly fund student research grants, field travel stipends, and open access studio gear.
            </p>
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
              <Heart className="w-4 h-4 fill-white" />
              <span>{isSubmitting ? 'Processing...' : 'Complete Pledge'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
