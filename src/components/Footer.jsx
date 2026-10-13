import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  MapPin,
  Phone,
  Mail,
  Feather,
  ExternalLink
} from 'lucide-react';

export const Footer = () => {
  const { lang, t } = useLanguage();

  const scrollTo = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-[#00172e] border-t-4 border-[#fc4a00] text-slate-300 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">

        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-white/10">

          {/* Col 1: University Identity & Official Logo */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                <div className="mcu-logo-aura absolute -inset-1.5 rounded-full bg-gradient-to-tr from-[#680a13]/35 via-amber-400/15 to-[#fc4a00]/25 blur-md pointer-events-none" />
                <img
                  src="/mcu-logo.png"
                  alt="Makhanlal Chaturvedi University Logo"
                  className="mcu-logo-nav-alive relative z-10 w-full h-full object-contain drop-shadow-md"
                />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white font-editorial tracking-tight leading-tight">
                  {lang === 'hi'
                    ? 'माखनलाल चतुर्वेदी राष्ट्रीय पत्रकारिता एवं संचार विश्वविद्यालय'
                    : 'Makhanlal Chaturvedi National University'}
                </h3>
                <p className="text-xs font-bold text-[#fc4a00] mt-0.5 tracking-wide">
                  {lang === 'hi'
                    ? 'पूर्व छात्र महासंघ • राष्ट्रीय नेटवर्क'
                    : 'Alumni Association • National Network'}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed max-w-md font-normal">
              {lang === 'hi'
                ? 'एशिया का प्रथम पत्रकारिता एवं संचार विश्वविद्यालय (स्थापना 1990)। 38,000 से अधिक पूर्व छात्र देश एवं दुनिया के प्रमुख मीडिया, प्रसारण, जनसंपर्क एवं तकनीकी संस्थानों में सेवारत हैं।'
                : "Asia's first national university dedicated to journalism and mass communication (estd. 1990). Connecting 38,000+ alumni across leading national and international media houses, broadcasting networks, and creative institutions."}
            </p>

            <div className="inline-flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10 text-[11px] text-amber-200">
              <Feather className="w-4 h-4 text-amber-300 shrink-0" />
              <span>
                {lang === 'hi'
                  ? 'नामकरण: महान स्वतंत्रता सेनानी एवं राष्ट्रकवि पं. माखनलाल चतुर्वेदी'
                  : 'Named in honor of freedom fighter & poet Pt. Makhanlal Chaturvedi'}
              </span>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs uppercase tracking-wider font-extrabold text-amber-400 font-display">
              {lang === 'hi' ? 'त्वरित लिंक' : 'Quick Navigation'}
            </h4>
            <ul className="space-y-2 font-medium">
              <li>
                <button onClick={() => scrollTo('home')} className="hover:text-[#fc4a00] transition-colors cursor-pointer">
                  {t.nav.home}
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('directory')} className="hover:text-[#fc4a00] transition-colors cursor-pointer">
                  {t.nav.directory}
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('mentorship')} className="hover:text-[#fc4a00] transition-colors cursor-pointer">
                  {t.nav.mentorship}
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('jobs')} className="hover:text-[#fc4a00] transition-colors cursor-pointer">
                  {t.nav.jobs}
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('events')} className="hover:text-[#fc4a00] transition-colors cursor-pointer">
                  {t.nav.events}
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('gallery')} className="hover:text-[#fc4a00] transition-colors cursor-pointer">
                  {t.nav.gallery}
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('giving')} className="hover:text-[#fc4a00] transition-colors cursor-pointer">
                  {t.nav.giving}
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: University Campuses */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs uppercase tracking-wider font-extrabold text-amber-400 font-display">
              {lang === 'hi' ? 'विश्वविद्यालय परिसर' : 'MCU Campuses'}
            </h4>
            <ul className="space-y-2 font-medium">
              <li className="text-white font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#fc4a00]"></span>
                <span>Bhopal (Main Campus)</span>
              </li>
              <li className="text-slate-300 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                <span>Khandwa (Karmveer)</span>
              </li>
              <li className="text-slate-300 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                <span>Rewa Campus</span>
              </li>
              <li className="text-slate-300 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                <span>Datia Campus</span>
              </li>
            </ul>
            <div className="pt-2">
              <a
                href="https://www.mcu.ac.in"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-amber-300 hover:text-white font-bold transition-colors"
              >
                <span>Official mcu.ac.in Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Col 4: Alumni Relations Office Contacts */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs uppercase tracking-wider font-extrabold text-amber-400 font-display">
              {lang === 'hi' ? 'पूर्व छात्र संपर्क प्रकोष्ठ' : 'Alumni Relations Cell'}
            </h4>
            <div className="space-y-2.5 font-medium">
              <div className="flex items-start gap-2 text-slate-300">
                <MapPin className="w-4 h-4 text-[#fc4a00] shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  Bishankhedi, Suraj Nagar, Bhadbhada Road, Bhopal, Madhya Pradesh - 462044
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Phone className="w-4 h-4 text-amber-300 shrink-0" />
                <span>+91 755 2553523 / 2725300</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Mail className="w-4 h-4 text-rose-300 shrink-0" />
                <span>alumni@mcu.ac.in</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Deep Crimson Bar matching official mcu.ac.in footer strip */}
      <div className="bg-[#52050c] py-4 text-white text-[11px] border-t border-[#680a13]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="text-slate-200">
            © {new Date().getFullYear()} Makhanlal Chaturvedi National University of Journalism and Communication (MCU Bhopal). All Rights Reserved.
          </div>

          <div className="flex items-center gap-3 text-amber-200 font-medium">
            <span>Act No. 15 of 1990 (M.P. Vidhan Sabha)</span>
            <span>•</span>
            <span>UGC 12(B) Approved</span>
            <span>•</span>
            <span className="text-white font-bold">Alumni Portal</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
