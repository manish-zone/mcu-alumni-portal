import React, { createContext, useContext, useState } from 'react';
import { translations } from '../data/translations';

export const PORTAL_CONTENT_KEY = 'mcu_portal_content_settings';

export const DEFAULT_PORTAL_CONTENT = {
  alumniCount: '38,000+',
  directoryTitleEn: 'Global Alumni Directory',
  directoryTitleHi: 'वैश्विक पूर्व छात्र निर्देशिका',
  directorySubtitleEn: 'Search and connect with over 38,000 media and tech professionals worldwide.',
  directorySubtitleHi: 'विश्वभर में कार्यरत 38,000+ पूर्व छात्रों से सीधे जुड़ें और संपर्क सूत्र स्थापित करें।',
  heroNetworkTickerEn: '🟢 Live Network: 38,000+ Verified Alumni across Global Media & Tech Enterprises',
  heroNetworkTickerHi: '🟢 लाइव नेटवर्क: 38,000+ सत्यापित पूर्व छात्र विश्वभर के मीडिया एवं IT संस्थानों में',
  heroDescriptionEn: 'Makhanlal Chaturvedi National University of Journalism and Communication brings together 38,000+ editors, broadcasters, filmmakers, PR leaders, and media-tech pioneers shaping public discourse across the globe.',
  heroDescriptionHi: 'माखनलाल चतुर्वेदी राष्ट्रीय पत्रकारिता एवं संचार विश्वविद्यालय के 38,000+ से अधिक संपादक, टीवी एंकर, फिल्म निर्माता, जनसंपर्क निदेशक व मीडिया-टेक विशेषज्ञ वैश्विक फलक पर राष्ट्र का गौरव बढ़ा रहे हैं।',
  footerDescEn: "Asia's first national university dedicated to journalism and mass communication (estd. 1990). Connecting 38,000+ alumni across leading national and international media houses, broadcasting networks, and creative institutions.",
  footerDescHi: 'एशिया का प्रथम पत्रकारिता एवं संचार विश्वविद्यालय (स्थापना 1990)। 38,000 से अधिक पूर्व छात्र देश एवं दुनिया के प्रमुख मीडिया, प्रसारण, जनसंपर्क एवं तकनीकी संस्थानों में सेवारत हैं।',
};

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState('en');

  const [portalContent, setPortalContent] = useState(() => {
    try {
      const stored = localStorage.getItem(PORTAL_CONTENT_KEY);
      if (stored) {
        return { ...DEFAULT_PORTAL_CONTENT, ...JSON.parse(stored) };
      }
    } catch {}
    return DEFAULT_PORTAL_CONTENT;
  });

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'en' ? 'hi' : 'en'));
  };

  const updatePortalContent = (newValues) => {
    setPortalContent((prev) => {
      const merged = { ...prev, ...newValues };
      try {
        localStorage.setItem(PORTAL_CONTENT_KEY, JSON.stringify(merged));
      } catch {}
      return merged;
    });
  };

  const resetPortalContent = () => {
    try {
      localStorage.removeItem(PORTAL_CONTENT_KEY);
    } catch {}
    setPortalContent(DEFAULT_PORTAL_CONTENT);
  };

  const baseT = translations[lang] || translations.en;
  const isHi = lang === 'hi';

  const t = {
    ...baseT,
    hero: {
      ...baseT.hero,
      description:
        (isHi ? portalContent.heroDescriptionHi : portalContent.heroDescriptionEn) ||
        baseT.hero?.description,
    },
    sections: {
      ...baseT.sections,
      directoryTitle:
        (isHi ? portalContent.directoryTitleHi : portalContent.directoryTitleEn) ||
        baseT.sections?.directoryTitle,
      directorySubtitle:
        (isHi ? portalContent.directorySubtitleHi : portalContent.directorySubtitleEn) ||
        baseT.sections?.directorySubtitle,
    },
    footer: {
      ...baseT.footer,
      description:
        (isHi ? portalContent.footerDescHi : portalContent.footerDescEn) ||
        baseT.footer?.description,
    },
  };

  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLang,
        toggleLanguage,
        t,
        portalContent,
        updatePortalContent,
        resetPortalContent,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
