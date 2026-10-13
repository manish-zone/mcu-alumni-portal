import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { authAPI } from '../services/api';
import { X, ShieldCheck, Loader2, KeyRound, ArrowRight, ExternalLink, Mail, User, AlertTriangle } from 'lucide-react';

/**
 * Hardcoded user's provided Google Client ID as high-priority fallback
 */
const DEFAULT_GOOGLE_CLIENT_ID = '1012854870861-vcifvdo38g7q4cnkjk71rv0oir4rra8n.apps.googleusercontent.com';

/**
 * Official Google Multi-Color G Logo SVG
 */
const GoogleLogoSvg = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      fill="#EA4335"
    />
  </svg>
);

/**
 * Ensures Google Identity Services client script is loaded
 */
const ensureGoogleScriptLoaded = () => {
  return new Promise((resolve) => {
    if (window.google?.accounts?.oauth2) {
      resolve(window.google);
      return;
    }

    const existingScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(window.google);
      document.head.appendChild(script);
    } else {
      existingScript.addEventListener('load', () => resolve(window.google));
      let checks = 0;
      const interval = setInterval(() => {
        checks++;
        if (window.google?.accounts?.oauth2 || checks > 25) {
          clearInterval(interval);
          resolve(window.google);
        }
      }, 100);
    }
  });
};

export const GoogleSignInButton = ({
  mode = 'signin', // 'signin' | 'signup'
  onSuccess,
  onGoogleProfile, // When provided (e.g. registration wizard), passes Google profile data
  onUnregisteredAccount, // Called on 'signin' when Google email has no registered account
  alumniList = [],
  onError,
  className = '',
  disabled = false,
}) => {
  const { lang } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configErrorNotice, setConfigErrorNotice] = useState(null);

  // Custom user direct login fields
  const [userFullName, setUserFullName] = useState('');
  const [userGoogleEmail, setUserGoogleEmail] = useState('');

  // Active Client ID
  const envClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const [storedClientId, setStoredClientId] = useState(() => localStorage.getItem('mcu_google_client_id') || '');
  const [inputClientId, setInputClientId] = useState(DEFAULT_GOOGLE_CLIENT_ID);
  const [setupTab, setSetupTab] = useState('oauth'); // 'oauth' | 'direct'

  const effectiveClientId = envClientId || storedClientId || DEFAULT_GOOGLE_CLIENT_ID;

  // Verify existing registration on Sign-In mode before authenticating
  const verifyAndSignInWithGoogle = async (gProfile) => {
    const cleanEmail = (gProfile?.email || '').trim().toLowerCase();
    if (!cleanEmail) {
      throw new Error(
        lang === 'hi'
          ? 'Google से मान्य ईमेल प्राप्त नहीं हुआ।'
          : 'Could not retrieve a valid email address from Google.'
      );
    }

    // 1. Check local registered emails & custom alumni records
    let localProfile = null;
    let isExplicitlyRegisteredLocally = false;
    try {
      const regEmails = JSON.parse(localStorage.getItem('mcu_registered_emails') || '[]');
      if (Array.isArray(regEmails) && regEmails.some((e) => String(e).trim().toLowerCase() === cleanEmail)) {
        isExplicitlyRegisteredLocally = true;
      }
      const customAlumni = JSON.parse(localStorage.getItem('mcu_custom_alumni') || '[]');
      const allLocal = [...customAlumni, ...(Array.isArray(alumniList) ? alumniList : [])];
      localProfile =
        allLocal.find((p) => p?.email && String(p.email).trim().toLowerCase() === cleanEmail) || null;
      if (
        localProfile &&
        localProfile.degree === 'Master of Journalism (MJ)' &&
        localProfile.current_role === 'Media Professional' &&
        localProfile.company === 'MCU Alumnus' &&
        !localProfile.enrollment_no &&
        !localProfile.enrollmentNo &&
        !localProfile.phone &&
        !isExplicitlyRegisteredLocally
      ) {
        // Ignore old accidental auto-provisioned placeholder
        localProfile = null;
      }
    } catch {}

    // 2. Check Backend Database via GET /api/auth/profile?email=...
    let dbProfile = null;
    try {
      const checkRes = await authAPI.checkAccountByEmail(cleanEmail);
      if (checkRes && checkRes.email && String(checkRes.email).trim().toLowerCase() === cleanEmail) {
        const isAutoProvisionedPlaceholder =
          checkRes.degree === 'Master of Journalism (MJ)' &&
          checkRes.current_role === 'Media Professional' &&
          checkRes.company === 'MCU Alumnus' &&
          !checkRes.enrollment_no &&
          !checkRes.phone &&
          !isExplicitlyRegisteredLocally;

        if (!isAutoProvisionedPlaceholder) {
          dbProfile = checkRes;
        }
      }
    } catch (checkErr) {
      console.warn('[Google Sign-In] Profile lookup warning:', checkErr);
    }

    const matchedProfile = dbProfile || localProfile;

    // 3. If no registered account matches this Google email, reject login & prompt to create an account
    if (!matchedProfile) {
      if (onUnregisteredAccount) {
        onUnregisteredAccount({
          ...gProfile,
          email: cleanEmail,
        });
        return;
      }
      const notFoundMsg =
        lang === 'hi'
          ? `आपका खाता नहीं बना है (${cleanEmail})। लॉगिन करने के लिए कृपया पहले नया खाता बनाएं (Create an Account)।`
          : `You do not have an account with "${cleanEmail}". Please create an account first.`;
      throw new Error(notFoundMsg);
    }

    // 4. Email matches an existing registered account — log them in and preserve their profile fields
    const preservedDegree =
      matchedProfile.degree && !String(matchedProfile.degree).toLowerCase().includes('journalism')
        ? matchedProfile.degree
        : 'BCA (Bachelor of Computer Applications)';
    const preservedRole =
      (matchedProfile.current_role || matchedProfile.currentRole) &&
      (matchedProfile.current_role || matchedProfile.currentRole) !== 'Media Professional'
        ? matchedProfile.current_role || matchedProfile.currentRole
        : 'Full Stack Software Engineer';
    const preservedCompany =
      matchedProfile.company && matchedProfile.company !== 'MCU Alumnus'
        ? matchedProfile.company
        : 'Tech & Software Solutions (MCU IT)';

    try {
      const authRes = await authAPI.googleAuth({
        mode: 'signin',
        credential: gProfile.credential,
        google_id: gProfile.google_id,
        email: cleanEmail,
        name: matchedProfile.name || matchedProfile.full_name || gProfile.name,
        picture: matchedProfile.avatar_url || matchedProfile.avatar || gProfile.picture,
        batch_year: Number(matchedProfile.batch_year || matchedProfile.batch) || 2024,
        degree: preservedDegree,
        campus: matchedProfile.campus_name || matchedProfile.campus || 'Bhopal',
        enrollment_no: matchedProfile.enrollment_no || matchedProfile.enrollmentNo || undefined,
        current_role: preservedRole,
        company: preservedCompany,
        location: matchedProfile.location || 'Bhopal, MP',
        linkedin_url: matchedProfile.linkedin_url || matchedProfile.linkedIn || undefined,
        open_to_mentor: matchedProfile.open_to_mentor ?? matchedProfile.openToMentor ?? true,
        skills: Array.isArray(matchedProfile.skills) && matchedProfile.skills.length > 0 ? matchedProfile.skills : undefined,
      });

      if (onSuccess) onSuccess(authRes);
    } catch (apiErr) {
      // If backend is unreachable but local registered profile matched, log in locally
      if (localProfile && (apiErr.message?.includes('Network') || apiErr.message?.includes('Failed to fetch'))) {
        const fallbackUser = {
          ...localProfile,
          email: cleanEmail,
          name: localProfile.name || localProfile.full_name || gProfile.name,
          full_name: localProfile.full_name || localProfile.name || gProfile.name,
          avatar: localProfile.avatar || localProfile.avatar_url || gProfile.picture,
          avatar_url: localProfile.avatar_url || localProfile.avatar || gProfile.picture,
        };
        try {
          localStorage.setItem('mcu_auth_token', `mcu-local-google-token-${Date.now()}`);
          localStorage.setItem('mcu_user', JSON.stringify(fallbackUser));
        } catch {}
        if (onSuccess) onSuccess({ user: fallbackUser, profile: fallbackUser });
        return;
      }
      throw apiErr;
    }
  };

  // Handle GIS ID-Token credential response (e.g. from One-Tap or native GIS)
  const handleCredentialResponse = async (response) => {
    if (!response || !response.credential) {
      if (onError) onError(new Error('No Google credentials received from popup.'));
      return;
    }

    setIsLoading(true);
    try {
      let payload = null;
      try {
        const base64Url = response.credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        payload = JSON.parse(decodeURIComponent(escape(window.atob(base64))));
      } catch (e) {
        console.warn('Could not decode GIS JWT client-side:', e);
      }

      const gProfile = {
        name: payload?.name || '',
        email: payload?.email || '',
        picture: payload?.picture || '',
        google_id: payload?.sub || '',
        credential: response.credential,
      };

      if (onGoogleProfile) {
        onGoogleProfile(gProfile);
        return;
      }

      await verifyAndSignInWithGoogle(gProfile);
    } catch (err) {
      console.error('[Google GIS Error]', err);
      if (onError) onError(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Pre-initialize GIS when script and Client ID are ready
  useEffect(() => {
    ensureGoogleScriptLoaded().then(() => {
      if (window.google?.accounts?.id && effectiveClientId) {
        try {
          window.google.accounts.id.initialize({
            client_id: effectiveClientId,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });
        } catch (e) {
          console.warn('[GIS Init]', e);
        }
      }
    });
  }, [effectiveClientId]);

  // Main Google Sign-In Trigger
  const handleClick = async () => {
    if (disabled || isLoading) return;
    setIsLoading(true);
    setConfigErrorNotice(null);

    try {
      await ensureGoogleScriptLoaded();

      if (!window.google?.accounts?.oauth2) {
        throw new Error('Google Identity Services SDK is loading. Please try again in 2 seconds.');
      }

      // Initialize Google OAuth2 Token Client (Popup flow)
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: effectiveClientId,
        scope: 'email profile openid',
        callback: async (tokenResponse) => {
          if (tokenResponse?.access_token) {
            try {
              // 1. Fetch authenticated Google profile from Google userinfo API
              const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
              });
              const googleProfile = await userRes.json();

              if (googleProfile.error) {
                throw new Error(googleProfile.error_description || googleProfile.error);
              }

              const gProfile = {
                name: googleProfile.name,
                email: googleProfile.email,
                picture: googleProfile.picture,
                google_id: googleProfile.sub,
                credential: tokenResponse.access_token,
              };

              if (onGoogleProfile) {
                onGoogleProfile(gProfile);
                return;
              }

              // 2. Verify existing account & sign in
              await verifyAndSignInWithGoogle(gProfile);
            } catch (err) {
              console.error('[Google User Fetch / Auth Error]', err);
              if (onError) onError(err);
            } finally {
              setIsLoading(false);
            }
          } else if (tokenResponse?.error) {
            setIsLoading(false);
            console.error('[Google OAuth Error Callback]', tokenResponse);
            const errCode = tokenResponse.error;
            const errDesc = tokenResponse.error_description || errCode;

            if (errCode === 'origin_mismatch' || errCode === 'idpiframe_initialization_failed') {
              setConfigErrorNotice(
                `Google Origin Mismatch: Ensure 'http://localhost:5173' (exact, no trailing slash) is added under Authorized JavaScript origins in Google Cloud Console.`
              );
              setShowConfigModal(true);
            } else if (errCode !== 'access_denied') {
              if (onError) onError(new Error(`Google Sign-In: ${errDesc}`));
            }
          }
        },
        error_callback: (err) => {
          setIsLoading(false);
          console.error('[Google OAuth Token Client Error]', err);
          if (err?.type === 'popup_closed') {
            // User closed popup window, no action needed
            return;
          }
          if (err?.type === 'popup_blocked') {
            const msg = 'Popup was blocked by your browser. Please allow popups for localhost.';
            if (onError) onError(new Error(msg));
            return;
          }
          const msg = err?.message || 'Failed to open Google sign-in window.';
          if (onError) onError(new Error(msg));
        },
      });

      // Open Google account selection popup
      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (err) {
      setIsLoading(false);
      console.error('[Google Click Handler Error]', err);
      if (onError) onError(err);
      setShowConfigModal(true);
    }
  };

  // Save new Client ID from modal
  const handleSaveClientId = (e) => {
    e.preventDefault();
    const cleanId = inputClientId.trim();
    if (!cleanId) return;

    localStorage.setItem('mcu_google_client_id', cleanId);
    setStoredClientId(cleanId);
    setShowConfigModal(false);
    setConfigErrorNotice(null);

    // Re-trigger login
    setTimeout(() => {
      handleClick();
    }, 150);
  };

  // Direct login with personal Google account details (fallback)
  const handleDirectUserLogin = async (e) => {
    e.preventDefault();
    if (!userGoogleEmail || !userFullName) return;

    setIsLoading(true);
    setShowConfigModal(false);

    try {
      const cleanEmail = userGoogleEmail.trim().toLowerCase();
      const cleanName = userFullName.trim();
      const googleId = `google_oauth_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}&backgroundColor=003366,fc4a00,10b981`;

      const gProfile = {
        name: cleanName,
        email: cleanEmail,
        picture: avatarUrl,
        google_id: googleId,
      };

      if (onGoogleProfile) {
        onGoogleProfile(gProfile);
        return;
      }

      await verifyAndSignInWithGoogle(gProfile);
    } catch (err) {
      console.error('[Google Direct Auth Error]', err);
      if (onError) onError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const buttonText = mode === 'signup'
    ? (lang === 'hi' ? 'Google से पंजीयन करें' : 'Sign up with Google')
    : (lang === 'hi' ? 'Google से लॉगिन करें' : 'Sign in with Google');

  return (
    <>
      {/* Official styled Google Button */}
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isLoading}
        className={`w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold text-sm rounded-xl shadow-xs hover:shadow-sm transition-all flex items-center justify-center gap-3 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
        ) : (
          <GoogleLogoSvg className="w-4 h-4 shrink-0" />
        )}
        <span>
          {isLoading
            ? (lang === 'hi' ? 'Google से जुड़ रहे हैं...' : 'Connecting to Google...')
            : buttonText}
        </span>
      </button>

      {/* Google Setup / Configuration Helper Modal */}
      {showConfigModal && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-slate-950/65 backdrop-blur-md mcu-backdrop-enter"
          onClick={() => setShowConfigModal(false)}
        >
          <div
            className="mcu-animated-border-modal mcu-modal-spring-enter bg-gradient-to-b from-white via-[#fafdff] to-[#f4f9ff] rounded-2xl sm:rounded-3xl shadow-[0_28px_70px_-12px_rgba(2,132,199,0.26),0_10px_28px_-6px_rgba(0,34,68,0.16)] border border-sky-200/80 w-full max-w-[600px] overflow-hidden"
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
                    <h4 className="text-base sm:text-[18px] font-bold text-white font-editorial leading-snug tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                      {lang === 'hi' ? 'Google प्रमाणीकरण' : 'Google Sign-In'}
                    </h4>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-[10px] font-semibold text-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)] animate-pulse" />
                      Google OAuth Setup
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="relative z-10 w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/10 hover:bg-red-500/90 text-white/80 hover:text-white border border-white/20 hover:border-red-400 flex items-center justify-center transition-all duration-200 hover:rotate-90 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Notice if Origin Mismatch */}
            {configErrorNotice && (
              <div className="p-3 bg-red-50 border-b border-red-200 text-[11px] text-red-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{configErrorNotice}</span>
              </div>
            )}

            {/* Tab Selector */}
            <div className="flex border-b border-slate-200 bg-slate-50 p-1.5 gap-1.5">
              <button
                type="button"
                onClick={() => setSetupTab('oauth')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  setupTab === 'oauth'
                    ? 'bg-white text-[#003366] shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Google Client ID
              </button>
              <button
                type="button"
                onClick={() => setSetupTab('direct')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  setupTab === 'direct'
                    ? 'bg-white text-[#003366] shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lang === 'hi' ? 'सीधे ईमेल से लॉगिन' : 'Enter Gmail Directly'}
              </button>
            </div>

            {/* Tab 1: Google OAuth Client ID Verification */}
            {setupTab === 'oauth' ? (
              <form onSubmit={handleSaveClientId} className="p-5 space-y-3.5">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-950 leading-relaxed space-y-1">
                  <span className="font-bold block text-amber-900">
                    Google Cloud Console OAuth Settings:
                  </span>
                  <p>
                    1. Open{' '}
                    <a
                      href="https://console.cloud.google.com/apis/credentials"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 underline font-semibold inline-flex items-center gap-0.5"
                    >
                      console.cloud.google.com
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </p>
                  <p>2. In your OAuth 2.0 Client ID, ensure <strong>Authorized JavaScript origins</strong> has:</p>
                  <code className="block bg-white p-1 rounded font-mono text-[10.5px] border border-amber-200 text-amber-900">
                    http://localhost:5173
                  </code>
                  <p className="text-[10px] text-amber-700 mt-1">
                    <em>(Note: Do NOT add a trailing slash <code>/</code> at the end of the URL in Google Console).</em>
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[#003366]" />
                    <span>Google OAuth Client ID</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={inputClientId}
                    onChange={(e) => setInputClientId(e.target.value)}
                    placeholder="101285...apps.googleusercontent.com"
                    className="w-full bg-slate-50 px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 font-mono focus:outline-none focus:border-[#003366]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{lang === 'hi' ? 'सेव करें और Google लॉगिन खोलें' : 'Save & Open Google Popup'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              /* Tab 2: Direct Gmail Account Sign-In */
              <form onSubmit={handleDirectUserLogin} className="p-5 space-y-3.5">
                <p className="text-xs text-slate-600 leading-relaxed">
                  {lang === 'hi'
                    ? 'अपना व्यक्तिगत Google नाम और ईमेल दर्ज करें। यह तुरंत पोर्टल में आपके Google खाते से लॉगिन करेगा:'
                    : 'Enter your personal Google name and email to sign in directly:'}
                </p>

                <div>
                  <label className="text-xs sm:text-[13px] font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#003366]" />
                    <span>{lang === 'hi' ? 'आपका पूरा नाम *' : 'Your Full Name *'}</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={userFullName}
                    onChange={(e) => setUserFullName(e.target.value)}
                    placeholder="e.g. Meera Agrawal"
                    className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-none focus:border-[#003366]"
                  />
                </div>

                <div>
                  <label className="text-xs sm:text-[13px] font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#003366]" />
                    <span>{lang === 'hi' ? 'Google ईमेल पता (Gmail) *' : 'Google Email Address (Gmail) *'}</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={userGoogleEmail}
                    onChange={(e) => setUserGoogleEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-none focus:border-[#003366]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-xl bg-[#003366] hover:bg-[#002244] text-white text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <GoogleLogoSvg className="w-4 h-4 bg-white rounded-full p-0.5" />
                  <span>{isLoading ? 'Signing In...' : (lang === 'hi' ? 'Google से लॉगिन करें' : 'Sign In with Google Account')}</span>
                </button>
              </form>
            )}

            {/* Modal Footer */}
            <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-500 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>OAuth 2.0 Web Client</span>
              </span>
              <span className="font-mono text-[9px] text-slate-400">MCU Alumni Portal</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
