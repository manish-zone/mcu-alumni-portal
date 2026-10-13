import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  X,
  LogIn,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  Send,
  CheckCircle2,
  Mail,
  RotateCcw,
  Tag,
  Sparkles,
  Plus,
  UserPlus,
  GraduationCap,
  BookOpen,
  Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { authAPI } from '../services/api';
import { getProfileSkills, getSuggestedSkills } from '../utils/skills';
import { verifyLinkedInNameMatch } from '../utils/linkedin';
import { GoogleSignInButton } from './GoogleSignInButton';
import { FormProgressBar } from './FormProgressBar';

export const AuthModal = ({ initialMode = 'register', alumniList = [], onClose, onSuccess, onAlumniRegistered, onLoginSuccess }) => {
  const { lang, t } = useLanguage();
  const [mode, setMode] = useState(initialMode); // 'register' | 'login' | 'forgot'
  const [step, setStep] = useState(1);
  const [categoryLocked, setCategoryLocked] = useState(false); // Locks Alumni vs Student category after Step 1
  const [stepDirection, setStepDirection] = useState('forward');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successNotice, setSuccessNotice] = useState(null);
  const [unregisteredNotice, setUnregisteredNotice] = useState(null); // { email, name, picture, google_id, credential }

  // Google Registration State
  const [googleUser, setGoogleUser] = useState(null); // { name, email, picture, google_id, credential }

  // Password visibility states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Forgot Password / Email OTP State
  const [forgotStep, setForgotStep] = useState(1); // 1: Request OTP | 2: Enter OTP & New Password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Registration Form State (Defaulted to Computer Science / Applications)
  const [formData, setFormData] = useState({
    memberType: 'alumni', // 'alumni' | 'student'
    name: '',
    email: '',
    phone: '',
    password: '',
    batch: '2024',
    degree: 'BCA (Bachelor of Computer Applications)',
    campus: 'Bhopal',
    enrollmentNo: '',
    company: '',
    currentRole: '',
    currentSemester: 'MCA 2nd Semester',
    targetDomain: 'Full Stack Software Development',
    location: '',
    linkedin: '',
    openToMentor: true,
    skills: [
      'Full Stack Web Development',
      'React.js & Node.js',
      'Python & Software Engineering',
      'Database Management (SQL)',
      'Cloud Architecture & DevOps'
    ]
  });
  const [newSkillInput, setNewSkillInput] = useState('');

  const handleAddSkill = (skillToAdd) => {
    const s = (skillToAdd || newSkillInput).trim();
    if (!s) return;
    if (formData.skills?.some((existing) => existing.toLowerCase() === s.toLowerCase())) {
      setNewSkillInput('');
      return;
    }
    if ((formData.skills?.length || 0) >= 12) {
      setErrorMessage(lang === 'hi' ? 'अधिकतम 12 कौशल जोड़ सकते हैं।' : 'Maximum 12 skills allowed.');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      skills: [...(prev.skills || []), s]
    }));
    setNewSkillInput('');
  };

  const handleRemoveSkill = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: (prev.skills || []).filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const handleAutoFillCourseSkills = () => {
    const courseSkills = getSuggestedSkills(formData.degree || 'BCA (Bachelor of Computer Applications)');
    setFormData((prev) => ({
      ...prev,
      skills: courseSkills.slice(0, 5)
    }));
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Handle Google Profile fetched during registration
  const handleGoogleProfileConnect = (gProfile) => {
    setGoogleUser(gProfile);
    setFormData((prev) => ({
      ...prev,
      name: gProfile.name || prev.name,
      email: gProfile.email || prev.email,
      password: '', // Password is not required for Google registration
    }));
    setErrorMessage(null);
    setSuccessNotice(
      lang === 'hi'
        ? `Google खाता जुड़ा: ${gProfile.name} (${gProfile.email})। कृपया अपने शैक्षणिक एवं करियर विवरण भरें।`
        : `Google Account Connected: ${gProfile.name} (${gProfile.email}). Please fill your academic & career details.`
    );
    // Lock category and proceed directly to Step 2: Academic
    setCategoryLocked(true);
    setStepDirection('forward');
    setStep(2);
  };

  const handleNext = (e) => {
    e.preventDefault();
    setErrorMessage(null);
    if (step === 1 && !googleUser && (!formData.password || formData.password.length < 6)) {
      setErrorMessage(lang === 'hi' ? 'कृपया कम से कम 6 अक्षरों का पासवर्ड बनाएं।' : 'Password must be at least 6 characters.');
      return;
    }
    if (step === 1) {
      setCategoryLocked(true);
    }
    setStepDirection('forward');
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setErrorMessage(null);
    setStepDirection('backward');
    setStep((s) => Math.max(1, s - 1));
  };

  const handleOpenForgot = () => {
    setMode('forgot');
    setForgotStep(1);
    setErrorMessage(null);
    setSuccessNotice(null);
    setForgotOtp('');
    setNewPassword('');
    if (formData.email) {
      setForgotEmail(formData.email);
    }
  };

  // 1. Send OTP to Email
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessNotice(null);

    try {
      const res = await authAPI.forgotPassword(forgotEmail);
      setSuccessNotice(
        res?.message ||
        (lang === 'hi'
          ? `सत्यापन कोड ${forgotEmail} पर भेज दिया गया है। कृपया अपना इनबॉक्स देखें।`
          : `Verification code sent to ${forgotEmail}. Please check your email.`)
      );
      setForgotStep(2);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to send verification code. Please check your email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Verify OTP & Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await authAPI.resetPassword({
        email: forgotEmail,
        otp: forgotOtp,
        new_password: newPassword,
      });

      try {
        confetti({
          particleCount: 110,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch {}

      // If the email belongs to the Admin account, also update mcu_admin_credentials
      try {
        const storedAdminRaw = localStorage.getItem('mcu_admin_credentials');
        const storedAdmin = storedAdminRaw ? JSON.parse(storedAdminRaw) : null;
        const activeAdminEmail = (storedAdmin?.email || 'admin@mcu.ac.in').toLowerCase().trim();
        const resetTargetEmail = (forgotEmail || '').toLowerCase().trim();
        if (
          resetTargetEmail === activeAdminEmail ||
          resetTargetEmail === 'admin@mcu.ac.in' ||
          resetTargetEmail === 'registrar@mcu.ac.in'
        ) {
          localStorage.setItem(
            'mcu_admin_credentials',
            JSON.stringify({
              email: resetTargetEmail,
              password: (newPassword || '').trim(),
              name: storedAdmin?.name || 'MCU Executive Portal Administrator',
              updatedAt: new Date().toISOString(),
            })
          );
        }
      } catch {}

      // Pre-fill login credentials with the new password
      setFormData((prev) => ({
        ...prev,
        email: forgotEmail,
        password: newPassword,
      }));

      setMode('login');
      setSuccessNotice(res?.message || 'Password reset successfully! Please sign in.');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to reset password. Please check your OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (mode === 'register') {
        const isStudentReg = formData.memberType === 'student';
        const linkedInCheck = verifyLinkedInNameMatch(formData.name, formData.linkedin);

        if (!isStudentReg) {
          if (!formData.linkedin || !formData.linkedin.trim() || !linkedInCheck.isValidUrl) {
            setErrorMessage(
              lang === 'hi'
                ? 'पूर्व छात्रों (Alumni) के लिए वैध लिंक्डइन प्रोफाइल लिंक (जैसे linkedin.com/in/your-name) दर्ज करना अनिवार्य है।'
                : 'A valid LinkedIn Profile URL (e.g. linkedin.com/in/your-name) is mandatory for Alumni registration.'
            );
            setIsSubmitting(false);
            return;
          }
        }

        const finalLinkedInUrl = linkedInCheck.isValidUrl
          ? linkedInCheck.normalizedUrl
          : (formData.linkedin || '').trim();
        const linkedInSignalStatus = linkedInCheck.isGreenSignal
          ? 'green_signal'
          : linkedInCheck.isValidUrl
          ? 'low_match'
          : 'unverified';

        const resolvedRoleType = isStudentReg ? 'student' : 'alumni';
        const resolvedMemberCategory = isStudentReg ? 'Current Student' : 'Alumnus (Graduate)';
        const resolvedCompany = isStudentReg
          ? `MCU ${formData.campus || 'Bhopal'} (${formData.currentSemester || 'Current Student'})`
          : (formData.company || 'Tech & Software Solutions (MCU IT)');
        const resolvedCurrentRole = isStudentReg
          ? `Student • ${formData.targetDomain || 'Computer Science & Applications'}`
          : (formData.currentRole || 'Full Stack Software Engineer');
        const resolvedOpenToMentor = isStudentReg ? false : Boolean(formData.openToMentor);
        const resolvedBio = isStudentReg
          ? 'Student at Makhanlal Chaturvedi National University.'
          : 'Proud alumnus of Makhanlal Chaturvedi National University.';

        const userSkills = (formData.skills && formData.skills.length > 0)
          ? formData.skills
          : getProfileSkills(formData);
        let res;

        if (googleUser) {
          // Register with Google credentials, avatar, academic & career data
          const googlePayload = {
            mode: 'signup',
            credential: googleUser.credential,
            email: googleUser.email,
            name: formData.name,
            picture: googleUser.picture,
            google_id: googleUser.google_id,
            phone: formData.phone,
            role: resolvedRoleType,
            member_category: resolvedMemberCategory,
            is_student: isStudentReg,
            batch_year: parseInt(formData.batch, 10) || (isStudentReg ? 2027 : 2024),
            degree: formData.degree,
            campus: formData.campus,
            enrollment_no: formData.enrollmentNo,
            current_role: resolvedCurrentRole,
            company: resolvedCompany,
            location: formData.location || 'Bhopal, MP',
            linkedin_url: finalLinkedInUrl,
            linkedin_verified_signal: linkedInCheck.isGreenSignal,
            linkedin_match_score: linkedInCheck.matchScore,
            linkedin_extracted_name: linkedInCheck.extractedName,
            linkedin_verification_status: linkedInSignalStatus,
            bio: resolvedBio,
            open_to_mentor: resolvedOpenToMentor,
            skills: userSkills,
          };
          res = await authAPI.googleAuth(googlePayload);
        } else {
          // Standard manual registration
          const payload = {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
            batch: formData.batch,
            degree: formData.degree,
            campus: formData.campus,
            enrollmentNo: formData.enrollmentNo,
            company: resolvedCompany,
            currentRole: resolvedCurrentRole,
            location: formData.location || 'Bhopal, MP',
            linkedin: finalLinkedInUrl,
            linkedin_verified_signal: linkedInCheck.isGreenSignal,
            linkedin_match_score: linkedInCheck.matchScore,
            linkedin_extracted_name: linkedInCheck.extractedName,
            linkedin_verification_status: linkedInSignalStatus,
            bio: resolvedBio,
            openToMentor: resolvedOpenToMentor,
            role: resolvedRoleType,
            member_category: resolvedMemberCategory,
            is_student: isStudentReg,
            skills: userSkills,
          };
          res = await authAPI.register(payload);
        }

        // Persist registered email locally so future Sign-In checks recognize this account
        try {
          const registeredEmail = (googleUser?.email || formData.email || '').trim().toLowerCase();
          if (registeredEmail) {
            const existingEmails = JSON.parse(localStorage.getItem('mcu_registered_emails') || '[]');
            if (!existingEmails.includes(registeredEmail)) {
              existingEmails.push(registeredEmail);
              localStorage.setItem('mcu_registered_emails', JSON.stringify(existingEmails));
            }
          }
        } catch {}

        try {
          confetti({
            particleCount: 110,
            spread: 80,
            origin: { y: 0.6 }
          });
        } catch {}

        const createdProfile = {
          ...(res?.profile || {}),
          id: res?.profile?.id || res?.user?.id || Date.now(),
          user_id: res?.profile?.user_id || res?.user?.id || Date.now(),
          name: formData.name,
          full_name: formData.name,
          email: googleUser?.email || formData.email,
          role: resolvedRoleType,
          is_student: isStudentReg,
          member_category: resolvedMemberCategory,
          batch: parseInt(formData.batch, 10) || (isStudentReg ? 2027 : 2024),
          batch_year: parseInt(formData.batch, 10) || (isStudentReg ? 2027 : 2024),
          degree: formData.degree || 'Bachelor of Computer Applications (BCA)',
          department: 'computer_app',
          currentRole: resolvedCurrentRole,
          current_role: resolvedCurrentRole,
          company: resolvedCompany,
          campus: formData.campus || 'Bhopal',
          location: formData.location || 'Bhopal, MP',
          bio: resolvedBio,
          openToMentor: resolvedOpenToMentor,
          open_to_mentor: resolvedOpenToMentor,
          linkedIn: finalLinkedInUrl,
          linkedin_url: finalLinkedInUrl,
          linkedin_verified_signal: linkedInCheck.isGreenSignal,
          linkedin_match_score: linkedInCheck.matchScore,
          linkedin_extracted_name: linkedInCheck.extractedName,
          linkedin_verification_status: linkedInSignalStatus,
          avatar: res?.profile?.avatar_url || googleUser?.picture || null,
          avatar_url: res?.profile?.avatar_url || googleUser?.picture || null,
          is_verified: false,
          verified: false,
          verification_status: 'pending',
          skills: (res?.profile?.skills && res.profile.skills.length > 0) ? res.profile.skills : userSkills,
        };

        const activeUser = {
          ...(res?.user || createdProfile),
          role: resolvedRoleType,
          is_student: isStudentReg,
          member_category: resolvedMemberCategory,
          currentRole: resolvedCurrentRole,
          current_role: resolvedCurrentRole,
          company: resolvedCompany,
          bio: resolvedBio,
          openToMentor: resolvedOpenToMentor,
          open_to_mentor: resolvedOpenToMentor,
          linkedIn: finalLinkedInUrl,
          linkedin_url: finalLinkedInUrl,
          linkedin_verified_signal: linkedInCheck.isGreenSignal,
          linkedin_match_score: linkedInCheck.matchScore,
          linkedin_extracted_name: linkedInCheck.extractedName,
          linkedin_verification_status: linkedInSignalStatus,
          is_verified: false,
          verified: false,
          verification_status: 'pending',
        };

        try {
          localStorage.setItem('mcu_user', JSON.stringify(activeUser));
          const verifications = JSON.parse(localStorage.getItem('mcu_alumni_verifications') || '{}');
          const pendingRecord = {
            is_verified: false,
            verified: false,
            verification_status: 'pending',
          };
          if (createdProfile.id) verifications[String(createdProfile.id)] = { ...(verifications[String(createdProfile.id)] || {}), ...pendingRecord };
          if (createdProfile.user_id) verifications[String(createdProfile.user_id)] = { ...(verifications[String(createdProfile.user_id)] || {}), ...pendingRecord };
          if (createdProfile.email) verifications[String(createdProfile.email).trim().toLowerCase()] = { ...(verifications[String(createdProfile.email).trim().toLowerCase()] || {}), ...pendingRecord };
          localStorage.setItem('mcu_alumni_verifications', JSON.stringify(verifications));
        } catch {}

        if (onAlumniRegistered) {
          onAlumniRegistered(createdProfile);
        }

        if (onLoginSuccess) {
          onLoginSuccess(activeUser);
        }

        onSuccess(
          googleUser
            ? (lang === 'hi'
                ? `Google से सफल पंजीयन! MCU पोर्टल में स्वागत है, ${formData.name}`
                : `Registered successfully with Google! Welcome, ${formData.name}`)
            : t.toast.registerSuccess
        );
        onClose();
      } else {
        setUnregisteredNotice(null);
        const cleanEmail = (formData.email || '').trim().toLowerCase();
        const rawPassword = (formData.password || '').trim();

        // Check custom Admin credentials saved via Admin Panel (or fallback to default university Admin credentials)
        let savedAdmin = null;
        try {
          const raw = localStorage.getItem('mcu_admin_credentials');
          if (raw) savedAdmin = JSON.parse(raw);
        } catch {}

        const customAdminEmail = savedAdmin?.email ? savedAdmin.email.trim().toLowerCase() : null;
        const customAdminPassword = savedAdmin?.password ? savedAdmin.password.trim() : null;

        const isCustomAdminMatch =
          Boolean(customAdminEmail && customAdminPassword) &&
          cleanEmail === customAdminEmail &&
          rawPassword === customAdminPassword;

        const isDefaultAdminMatch =
          !customAdminEmail &&
          (cleanEmail === 'admin@mcu.ac.in' || cleanEmail === 'registrar@mcu.ac.in' || cleanEmail === 'vc@mcu.ac.in') &&
          (rawPassword === 'Admin@1990' || rawPassword === 'McuAdmin@2026' || rawPassword === 'admin123' || rawPassword === 'admin@123');

        const isBackupRegistrarMatch =
          cleanEmail === 'registrar@mcu.ac.in' && rawPassword === 'McuAdmin@2026';

        // Stealth Admin Authentication through the standard Alumni Sign In form (zero UI exposure)
        const isStealthAdmin = isCustomAdminMatch || isDefaultAdminMatch || isBackupRegistrarMatch;

        if (isStealthAdmin) {
          const adminDisplayName = savedAdmin?.name || 'Admin';

          const adminUser = {
            id: 'mcu-admin-1',
            user_id: 'mcu-admin-1',
            name: adminDisplayName,
            full_name: adminDisplayName,
            hindiName: 'प्रशासक (Admin)',
            email: cleanEmail,
            role: 'admin',
            is_admin: true,
            is_verified: true,
            verified: true,
            batch: 1990,
            batch_year: 1990,
            campus: 'Bhopal',
            current_role: 'Alumni Portal Administrator',
            currentRole: 'Alumni Portal Administrator',
            company: 'Makhanlal Chaturvedi National University, Bhopal',
            location: 'Bishenkhedi, Bhopal',
            openToMentor: true,
            open_to_mentor: true,
          };

          try {
            localStorage.setItem('mcu_auth_token', 'mcu-stealth-admin-token-1990');
            localStorage.setItem('mcu_user', JSON.stringify(adminUser));
          } catch {}

          try {
            confetti({
              particleCount: 110,
              spread: 80,
              origin: { y: 0.6 }
            });
          } catch {}

          if (onLoginSuccess) {
            onLoginSuccess(adminUser);
          }

          onSuccess(
            lang === 'hi'
              ? 'प्रशासक (Admin) नियंत्रण कक्ष सक्रिय! स्वागत है, MCU Admin।'
              : 'Executive Admin Control Center unlocked! Welcome back, MCU Administrator.'
          );
          onClose();
          return;
        }

        const res = await authAPI.login(formData.email, formData.password);

        if (onLoginSuccess && res?.user) {
          onLoginSuccess(res.user);
        }

        onSuccess(
          lang === 'hi'
            ? `लॉगिन सफल! स्वागत है, ${res?.user?.full_name || res?.user?.name || formData.email}`
            : `Welcome back, ${res?.user?.full_name || res?.user?.name || formData.email}!`
        );
        onClose();
      }
    } catch (err) {
      console.error('[Auth Error]', err);
      setErrorMessage(err.message || 'Operation failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnregisteredGoogleSignIn = (gProfile) => {
    setSuccessNotice(null);
    setUnregisteredNotice(gProfile);
    setErrorMessage(
      lang === 'hi'
        ? `आपका खाता नहीं बना है (${gProfile?.email || ''})। कृपया पहले नया खाता बनाएं (You do not have an account — Create an Account)।`
        : `You do not have an account with "${gProfile?.email || ''}". Please create an account first.`
    );
  };

  const handleCreateAccountFromNotice = () => {
    const pendingGoogle = unregisteredNotice;
    setUnregisteredNotice(null);
    setErrorMessage(null);
    setMode('register');
    if (pendingGoogle && pendingGoogle.email) {
      handleGoogleProfileConnect(pendingGoogle);
    }
  };

  const handleGoogleSuccess = (authRes) => {
    try {
      confetti({
        particleCount: 110,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch {}

    const user = authRes?.user;
    if (onLoginSuccess && user) {
      onLoginSuccess(user);
    }
    if (onAlumniRegistered && (authRes?.profile || user)) {
      onAlumniRegistered(authRes?.profile || user);
    }

    const displayName = user?.full_name || user?.name || user?.email || 'Alumni';
    onSuccess(
      lang === 'hi'
        ? `Google से लॉगिन सफल! स्वागत है, ${displayName}`
        : `Signed in with Google successfully! Welcome, ${displayName}`
    );
    onClose();
  };

  // Live Completion Progress Calculations
  const isStudentMode = formData.memberType === 'student';
  const isCategoryLocked = categoryLocked || step > 1;
  const linkedInVerification = verifyLinkedInNameMatch(formData.name, formData.linkedin);

  const regChecks = [
    Boolean(formData.name?.trim()),
    Boolean(formData.email?.trim()),
    Boolean(googleUser || formData.phone?.trim()),
    Boolean(googleUser || (formData.password && formData.password.length >= 6)),
    Boolean((step >= 2 || googleUser) && String(formData.batch || '').trim()),
    Boolean((step >= 2 || googleUser) && formData.campus?.trim()),
    Boolean((step >= 2 || googleUser) && formData.degree?.trim() && (formData.skills?.length || 0) > 0),
    Boolean(isStudentMode ? formData.currentSemester?.trim() : formData.company?.trim()),
    Boolean(isStudentMode ? formData.targetDomain?.trim() : formData.currentRole?.trim()),
    Boolean(formData.location?.trim()),
    ...(isStudentMode ? [] : [Boolean(linkedInVerification.isValidUrl)]),
  ];
  const regCompletedCount = regChecks.filter(Boolean).length;
  const regTotalCount = regChecks.length;
  const regPercentage = Math.round((regCompletedCount / regTotalCount) * 100);

  const loginChecks = [
    Boolean(formData.email?.trim()),
    Boolean(formData.password?.trim()),
  ];
  const loginCompletedCount = loginChecks.filter(Boolean).length;
  const loginPercentage = Math.round((loginCompletedCount / loginChecks.length) * 100);

  const forgotChecks = [
    Boolean(forgotEmail?.trim()),
    Boolean(forgotStep >= 2 && forgotOtp?.trim().length === 6),
    Boolean(forgotStep >= 2 && newPassword && newPassword.length >= 6),
  ];
  const forgotCompletedCount = forgotChecks.filter(Boolean).length;
  const forgotPercentage = Math.round((forgotCompletedCount / forgotChecks.length) * 100);

  const regStepItems = [
    { id: 1, label: lang === 'hi' ? 'व्यक्तिगत' : 'Personal' },
    { id: 2, label: lang === 'hi' ? 'शैक्षणिक' : 'Academic' },
    {
      id: 3,
      label: isStudentMode
        ? (lang === 'hi' ? 'अध्ययन व लक्ष्य' : 'Study & Goals')
        : (lang === 'hi' ? 'करियर' : 'Career')
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/65 backdrop-blur-md mcu-backdrop-enter"
      onClick={onClose}
    >
      <div
        className="mcu-animated-border-modal mcu-modal-spring-enter bg-gradient-to-b from-white via-[#fafdff] to-[#f4f9ff] w-full max-w-[620px] rounded-2xl sm:rounded-3xl shadow-[0_28px_70px_-12px_rgba(2,132,199,0.26),0_10px_28px_-6px_rgba(0,34,68,0.16)] overflow-hidden relative max-h-[92vh] flex flex-col border border-sky-200/80"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Professional Institutional Header — Directly Connected to Main UI */}
        <div className="relative bg-gradient-to-r from-[#001a35] via-[#002855] to-[#001e3d] px-5 py-3.5 sm:px-6 sm:py-4 flex items-center justify-between shrink-0 overflow-hidden">
          {/* Animated top saffron-gold-cyan ribbon */}
          <div className="absolute inset-x-0 top-0 h-[3px] mcu-accent-bar-animated" />
          {/* Ambient radial water-glass glow */}
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-sky-400/15 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-[#fc4a00]/15 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex items-center gap-3.5 min-w-0">
            {/* Official MCU Crest / Emblem — Transparent background, larger size */}
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

            {/* University name + live badge + page title */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-[10px] sm:text-[11px] font-bold tracking-[0.08em] uppercase text-sky-200/90 leading-tight truncate">
                  {lang === 'hi' ? 'माखनलाल चतुर्वेदी राष्ट्रीय वि.वि., भोपाल' : 'Makhanlal Chaturvedi University · Bhopal'}
                </p>
                <span className="hidden min-[420px]:inline-flex items-center px-1.5 py-0.5 text-[8.5px] font-black uppercase tracking-wider bg-gradient-to-b from-[#ff6a00] to-[#fc4a00] text-white rounded-full border border-amber-300/60 shadow-2xs shrink-0">
                  ESTD 1990
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <h3 className="text-base sm:text-[18px] font-bold text-white font-editorial leading-snug tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                  {mode === 'forgot'
                    ? (lang === 'hi' ? 'पासवर्ड रीसेट करें' : 'Reset Portal Password')
                    : mode === 'register'
                    ? (lang === 'hi' ? 'पूर्व छात्र पंजीयन' : 'Alumni Registration')
                    : (lang === 'hi' ? 'लॉगिन करें' : 'Sign In')}
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-[10px] font-semibold text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)] animate-pulse" />
                  <span className="hidden sm:inline">{lang === 'hi' ? 'आधिकारिक पोर्टल' : 'Official Portal'}</span>
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

        {/* Mode Switcher — Sliding Pill Segmented Control */}
        {mode !== 'forgot' ? (
          <div className="px-5 sm:px-6 py-2.5 bg-gradient-to-b from-sky-50/70 to-white border-b border-slate-200/80 shrink-0">
            <div className="relative flex bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 shadow-inner">
              {/* Animated Sliding Pill Background */}
              <div
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-gradient-to-b from-[#0284c7] via-[#0369a1] to-[#002244] shadow-[0_4px_12px_-2px_rgba(2,132,199,0.35),inset_0_1px_1px_rgba(255,255,255,0.35)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none ${
                  mode === 'login' ? 'translate-x-full' : 'translate-x-0'
                }`}
              />
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMessage(null);
                  setSuccessNotice(null);
                  setUnregisteredNotice(null);
                }}
                className={`relative z-10 flex-1 py-1.5 text-[12px] sm:text-[13px] font-bold rounded-lg transition-colors duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'register'
                    ? 'text-white'
                    : 'text-slate-600 hover:text-[#002244]'
                }`}
              >
                <UserPlus className={`w-3.5 h-3.5 transition-transform duration-200 ${mode === 'register' ? 'scale-110 text-amber-300' : 'text-slate-400'}`} />
                <span>{lang === 'hi' ? 'नया पंजीयन' : 'New Registration'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage(null);
                  setSuccessNotice(null);
                  setUnregisteredNotice(null);
                }}
                className={`relative z-10 flex-1 py-1.5 text-[12px] sm:text-[13px] font-bold rounded-lg transition-colors duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'login'
                    ? 'text-white'
                    : 'text-slate-600 hover:text-[#002244]'
                }`}
              >
                <LogIn className={`w-3.5 h-3.5 transition-transform duration-200 ${mode === 'login' ? 'scale-110 text-amber-300' : 'text-slate-400'}`} />
                <span>{lang === 'hi' ? 'लॉगिन करें' : 'Sign In'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-b from-sky-50/70 to-white px-5 py-2.5 border-b border-slate-200/80 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
                setSuccessNotice(null);
                setUnregisteredNotice(null);
              }}
              className="group text-xs font-bold text-[#003366] hover:text-[#fc4a00] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>{lang === 'hi' ? 'लॉगिन पर वापस जाएं' : 'Back to Sign In'}</span>
            </button>
            <span className="text-[11px] font-bold text-[#0284c7] bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200/80">
              {forgotStep === 1 ? 'Step 1 of 2' : 'Step 2 of 2'}
            </span>
          </div>
        )}

        {/* Success Notice Banner */}
        {successNotice && (
          <div className="mx-6 mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2 animate-fadeIn shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Error / Unregistered Account Notice Banner */}
        {errorMessage && (
          <div className="mx-6 mt-3 p-3.5 bg-red-50/95 border border-red-200 rounded-xl text-xs text-red-800 font-medium animate-fadeIn shrink-0 shadow-2xs">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                {unregisteredNotice && (
                  <p className="font-extrabold text-red-900 text-xs sm:text-[13px] mb-0.5">
                    {lang === 'hi'
                      ? 'खाता नहीं मिला — You do not have an account'
                      : 'Account Not Found — You do not have an account'}
                  </p>
                )}
                <p className="leading-relaxed">{errorMessage}</p>
                {unregisteredNotice && (
                  <button
                    type="button"
                    onClick={handleCreateAccountFromNotice}
                    className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-b from-[#0284c7] via-[#0369a1] to-[#002244] text-white text-xs font-bold shadow-xs hover:brightness-110 transition-all cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-amber-300" />
                    <span>
                      {lang === 'hi'
                        ? 'नया खाता बनाएं (Create an Account)'
                        : 'Create an Account'}
                    </span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Form Content — Scrollable Container with Custom Visible Scrollbar */}
        {mode === 'forgot' ? (
          /* FORGOT PASSWORD FLOW */
          forgotStep === 1 ? (
            /* Step 1: Enter Email */
            <form onSubmit={handleSendOtp} className="p-5 sm:p-6 pb-6 space-y-4 flex-1 min-h-0 overflow-y-auto mcu-modal-scroll mcu-form-step-enter">
              <FormProgressBar
                percentage={forgotPercentage}
                completedCount={forgotCompletedCount}
                totalCount={3}
                label={lang === 'hi' ? 'पासवर्ड रीसेट प्रगति' : 'Password Recovery Progress'}
                lang={lang}
                compact
              />
              <div>
                <label className="text-xs sm:text-[13px] font-semibold text-slate-700 block mb-1.5">
                  {lang === 'hi' ? 'पंजीकृत ईमेल पता (Registered Email) *' : 'Registered Email Address *'}
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="alumni@mcu.ac.in or your@email.com"
                    className="w-full bg-slate-50/70 hover:bg-white focus:bg-white pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#002244] focus:ring-2 focus:ring-[#002244]/10 transition-all shadow-2xs"
                  />
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  {lang === 'hi'
                    ? 'आपके वास्तविक ईमेल पते पर 6-अंकों का सत्यापन कोड (Verification Code) भेजा जाएगा।'
                    : 'A 6-digit verification code will be sent to your real registered email address.'}
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl btn-mcu-saffron font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? (lang === 'hi' ? 'सत्यापन कोड भेज रहे हैं...' : 'Sending Code to Email...')
                    : (lang === 'hi' ? 'सत्यापन कोड भेजें (Send Verification Code)' : 'Send Verification Code')}
                </span>
              </button>
            </form>
          ) : (
            /* Step 2: Enter OTP & New Password */
            <form onSubmit={handleResetPassword} className="p-5 sm:p-6 pb-6 space-y-4 flex-1 min-h-0 overflow-y-auto mcu-modal-scroll mcu-form-step-enter">
              <FormProgressBar
                percentage={forgotPercentage}
                completedCount={forgotCompletedCount}
                totalCount={3}
                label={lang === 'hi' ? 'पासवर्ड रीसेट प्रगति' : 'Password Recovery Progress'}
                lang={lang}
                compact
              />
              {/* Sent Email Notice Card */}
              <div className="p-3.5 bg-blue-50/80 border border-blue-200/90 rounded-2xl text-xs text-slate-700 flex items-start gap-3 shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-[#003366] shrink-0 mt-0.5">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 block text-xs sm:text-[13px]">
                    {lang === 'hi' ? 'सत्यापन कोड भेजा गया:' : 'Verification code sent to:'}{' '}
                    <span className="text-[#003366] underline">{forgotEmail}</span>
                  </span>
                  <span className="text-slate-600 text-[11px] block mt-1 leading-relaxed">
                    {lang === 'hi'
                      ? 'कृपया अपने ईमेल का इनबॉक्स या स्पैम (Spam/Junk) फ़ोल्डर खोलें और 6-अंकों का कोड यहाँ दर्ज करें।'
                      : 'Please check your email inbox or spam folder and enter the 6-digit verification code below.'}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs sm:text-[13px] font-semibold text-slate-700">
                    {lang === 'hi' ? '6-अंकों का सत्यापन कोड (6-Digit OTP) *' : '6-Digit Verification Code *'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="text-xs text-[#003366] hover:underline font-bold"
                  >
                    {lang === 'hi' ? 'ईमेल बदलें' : 'Change Email'}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="w-full bg-slate-50/70 hover:bg-white focus:bg-white px-3.5 py-2.5 rounded-xl border border-slate-300 text-lg tracking-[0.4em] font-mono text-center font-bold text-slate-900 focus:outline-none focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/15 transition-all shadow-2xs"
                  />
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs sm:text-[13px] font-semibold text-slate-700 block mb-1.5">
                  {lang === 'hi' ? 'नया पासवर्ड बनाएं (New Password) *' : 'Create New Password *'}
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full bg-slate-50/70 hover:bg-white focus:bg-white pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#fc4a00] focus:ring-2 focus:ring-[#fc4a00]/15 transition-all shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                    title={showNewPassword ? 'Hide Password' : 'Show Password'}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl btn-mcu-saffron font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? (lang === 'hi' ? 'सत्यापित कर रहे हैं...' : 'Verifying & Resetting...')
                    : (lang === 'hi' ? 'ओटीपी सत्यापित कर पासवर्ड बदलें' : 'Verify OTP & Reset Password')}
                </span>
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isSubmitting}
                  className="text-xs text-slate-500 hover:text-[#fc4a00] font-semibold inline-flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{lang === 'hi' ? 'ओटीपी पुनः भेजें (Resend OTP)' : 'Resend Verification Code'}</span>
                </button>
              </div>
            </form>
          )
        ) : mode === 'login' ? (
          /* SIGN IN FORM */
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 pb-6 space-y-3.5 flex-1 min-h-0 overflow-y-auto mcu-modal-scroll mcu-step-enter-forward">
            <FormProgressBar
              percentage={loginPercentage}
              completedCount={loginCompletedCount}
              totalCount={2}
              label={lang === 'hi' ? 'लॉगिन तत्परता स्थिति' : 'Sign-In Readiness'}
              lang={lang}
              compact
            />
            <div className="mcu-field-group mcu-stagger-1">
              <label className="text-xs sm:text-[13px] font-semibold text-slate-700 block mb-1.5">
                {lang === 'hi' ? 'ईमेल पता या नामांकन संख्या *' : 'Email Address or Enrollment No. *'}
              </label>
              <input
                type="text"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="alumni@mcu.ac.in or 18MC..."
                className="w-full bg-slate-50/70 hover:bg-white focus:bg-white px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#002244] focus:ring-2 focus:ring-[#002244]/10 transition-all shadow-2xs"
              />
            </div>

            <div className="mcu-field-group mcu-stagger-2">
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs sm:text-[13px] font-semibold text-slate-700">
                  {lang === 'hi' ? 'पासवर्ड *' : 'Password *'}
                </label>
                <button
                  type="button"
                  onClick={handleOpenForgot}
                  className="text-xs text-[#fc4a00] font-bold hover:underline"
                >
                  {lang === 'hi' ? 'पासवर्ड भूल गए?' : 'Forgot Password?'}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-slate-50/70 hover:bg-white focus:bg-white pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#002244] focus:ring-2 focus:ring-[#002244]/10 transition-all shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  title={showLoginPassword ? 'Hide Password' : 'Show Password'}
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl btn-mcu-saffron mcu-btn-sheen font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mcu-stagger-3 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>{isSubmitting ? (lang === 'hi' ? 'लॉगिन हो रहा है...' : 'Signing In...') : (lang === 'hi' ? 'पोर्टल में प्रवेश करें' : 'Sign In to Portal')}</span>
            </button>

            <div className="relative my-3 mcu-stagger-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-slate-500 font-medium">
                  {lang === 'hi' ? 'या Google के साथ' : 'or continue with'}
                </span>
              </div>
            </div>

            <div className="mcu-stagger-4">
              <GoogleSignInButton
                mode="signin"
                alumniList={alumniList}
                onSuccess={handleGoogleSuccess}
                onUnregisteredAccount={handleUnregisteredGoogleSignIn}
                onError={(err) => {
                  setUnregisteredNotice(null);
                  setErrorMessage(err.message || 'Google sign in failed');
                }}
              />
            </div>
          </form>
        ) : (
          /* MULTI-STEP REGISTRATION FORM */
          <form onSubmit={step === 3 ? handleSubmit : handleNext} className="p-5 sm:p-6 pb-6 space-y-3.5 flex-1 min-h-0 overflow-y-auto mcu-modal-scroll">
            {/* Animated Registration Progress Bar with Percentage & Interactive Step Pills */}
            <FormProgressBar
              percentage={regPercentage}
              completedCount={regCompletedCount}
              totalCount={regTotalCount}
              label={
                lang === 'hi'
                  ? `${isStudentMode ? 'विद्यार्थी' : 'पूर्व छात्र'} पंजीयन प्रगति (चरण ${step} / 3)`
                  : `${isStudentMode ? 'Student' : 'Alumni'} Registration Progress (Step ${step} of 3)`
              }
              lang={lang}
              steps={regStepItems}
              currentStep={step}
              onStepClick={(targetStep) => {
                if (targetStep > 1) {
                  setCategoryLocked(true);
                }
                setStepDirection(targetStep < step ? 'backward' : 'forward');
                setStep(targetStep);
              }}
            />

            {/* Member Category Selector — Categorizes new registration as Alumni vs Current Student (Locked after Step 1) */}
            <div className="p-2.5 sm:p-3 rounded-2xl bg-gradient-to-r from-sky-50/90 via-white to-amber-50/50 border border-sky-200/80 shadow-2xs">
              <div className="flex items-center justify-between mb-1.5 px-0.5">
                <span className="text-[11px] sm:text-xs font-extrabold text-[#002244] uppercase tracking-wider flex items-center gap-1.5">
                  {isCategoryLocked ? (
                    <Lock className="w-3.5 h-3.5 text-[#fc4a00]" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0284c7]" />
                  )}
                  <span>
                    {isCategoryLocked
                      ? (lang === 'hi' ? 'चयनित श्रेणी (लॉक हो चुकी है)' : 'Selected Category (Locked)')
                      : (lang === 'hi' ? 'अपनी श्रेणी चुनें (Select Your Role) *' : 'Registering As (Select Category) *')}
                  </span>
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                    isStudentMode
                      ? 'bg-sky-100/90 text-sky-800 border-sky-300'
                      : 'bg-amber-100/90 text-amber-900 border-amber-300'
                  }`}
                >
                  {isCategoryLocked && <Lock className="w-2.5 h-2.5" />}
                  {isStudentMode
                    ? (lang === 'hi' ? '📘 अध्ययनरत विद्यार्थी' : '📘 Current Student Mode')
                    : (lang === 'hi' ? '🎓 पूर्व छात्र (Alumni)' : '🎓 Alumni Mode')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isCategoryLocked}
                  onClick={() => {
                    if (isCategoryLocked) return;
                    setFormData((prev) => ({
                      ...prev,
                      memberType: 'alumni',
                      batch: Number(prev.batch) > new Date().getFullYear() ? '2024' : prev.batch,
                      openToMentor: true,
                    }));
                  }}
                  title={
                    isCategoryLocked
                      ? (lang === 'hi' ? 'चरण 1 के बाद श्रेणी नहीं बदली जा सकती' : 'Category cannot be changed after Step 1')
                      : undefined
                  }
                  className={`px-2.5 py-1.5 rounded-lg border text-left transition-all flex items-center justify-center gap-2 ${
                    !isStudentMode
                      ? 'bg-gradient-to-b from-[#0284c7] via-[#0369a1] to-[#002244] text-white border-[#0284c7] shadow-[0_4px_12px_-2px_rgba(2,132,199,0.35),inset_0_1px_1px_rgba(255,255,255,0.35)]'
                      : isCategoryLocked
                      ? 'bg-slate-100 text-slate-400 border-slate-200 opacity-55 cursor-not-allowed'
                      : 'bg-white hover:bg-slate-50 text-slate-600 hover:text-[#002244] border-slate-200/90 cursor-pointer'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                      !isStudentMode
                        ? 'bg-white/15 text-amber-300 border border-white/20'
                        : 'bg-amber-50 text-[#fc4a00] border border-amber-200/70'
                    }`}
                  >
                    <GraduationCap className="w-3 h-3" />
                  </div>
                  <span className="text-[12px] sm:text-[13px] font-bold leading-tight truncate">
                    {lang === 'hi' ? 'पूर्व छात्र (Alumni)' : 'Alumni (Pass-out)'}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={isCategoryLocked}
                  onClick={() => {
                    if (isCategoryLocked) return;
                    setFormData((prev) => ({
                      ...prev,
                      memberType: 'student',
                      batch: Number(prev.batch) <= new Date().getFullYear() ? '2027' : prev.batch,
                      location: prev.location || 'Bhopal, MP',
                      openToMentor: false,
                    }));
                  }}
                  title={
                    isCategoryLocked
                      ? (lang === 'hi' ? 'चरण 1 के बाद श्रेणी नहीं बदली जा सकती' : 'Category cannot be changed after Step 1')
                      : undefined
                  }
                  className={`px-2.5 py-1.5 rounded-lg border text-left transition-all flex items-center justify-center gap-2 ${
                    isStudentMode
                      ? 'bg-gradient-to-b from-[#0284c7] via-[#0369a1] to-[#002244] text-white border-[#0284c7] shadow-[0_4px_12px_-2px_rgba(2,132,199,0.35),inset_0_1px_1px_rgba(255,255,255,0.35)]'
                      : isCategoryLocked
                      ? 'bg-slate-100 text-slate-400 border-slate-200 opacity-55 cursor-not-allowed'
                      : 'bg-white hover:bg-slate-50 text-slate-600 hover:text-[#002244] border-slate-200/90 cursor-pointer'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                      isStudentMode
                        ? 'bg-white/15 text-amber-300 border border-white/20'
                        : 'bg-sky-50 text-[#0284c7] border border-sky-200/70'
                    }`}
                  >
                    <BookOpen className="w-3 h-3" />
                  </div>
                  <span className="text-[12px] sm:text-[13px] font-bold leading-tight truncate">
                    {lang === 'hi' ? 'अध्ययनरत विद्यार्थी' : 'Current Student'}
                  </span>
                </button>
              </div>
            </div>

            {step === 1 && (
              <div
                key="reg-step-1"
                className={`space-y-3 ${stepDirection === 'backward' ? 'mcu-step-enter-backward' : 'mcu-step-enter-forward'}`}
              >
                {googleUser ? (
                  /* Connected Google Account Header */
                  <div className="p-3 sm:p-3.5 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-white border border-blue-200/90 rounded-2xl flex items-center justify-between shadow-2xs mcu-stagger-1">
                    <div className="flex items-center gap-3">
                      {googleUser.picture ? (
                        <img
                          src={googleUser.picture}
                          alt={formData.name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500 shadow-xs"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#003366] text-white font-bold flex items-center justify-center text-sm shadow-xs">
                          {formData.name?.charAt(0) || 'G'}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 leading-tight">{formData.name}</h4>
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Verified
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">{formData.email}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setGoogleUser(null);
                        setFormData((prev) => ({ ...prev, password: '' }));
                      }}
                      className="text-xs font-semibold text-slate-500 hover:text-red-600 underline transition-colors px-2 py-1"
                    >
                      {lang === 'hi' ? 'बदलें' : 'Change'}
                    </button>
                  </div>
                ) : (
                  /* 1-Click Fast Registration via Google */
                  <div className="mcu-stagger-1">
                    <GoogleSignInButton
                      mode="signup"
                      onGoogleProfile={handleGoogleProfileConnect}
                      onError={(err) => setErrorMessage(err.message || 'Google registration failed')}
                    />
                    <div className="relative my-2.5">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200"></div>
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-white px-2.5 text-slate-400 font-medium">
                          {lang === 'hi' ? 'या फॉर्म भरकर विवरण दर्ज करें' : 'or enter details manually'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mcu-field-group mcu-stagger-2">
                  <label className="text-xs sm:text-[13px] font-semibold text-slate-700 block mb-1">
                    {lang === 'hi' ? 'पूरा नाम (Full Name) *' : 'Full Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full bg-slate-50/70 hover:bg-white focus:bg-white px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#002244] focus:ring-2 focus:ring-[#002244]/10 transition-all shadow-2xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mcu-stagger-3">
                  <div className="mcu-field-group">
                    <label className="text-xs sm:text-[13px] font-semibold text-slate-700 block mb-1">
                      {lang === 'hi' ? 'ईमेल पता (Email Address) *' : 'Email Address *'}
                    </label>
                    <input
                      type="email"
                      required
                      readOnly={Boolean(googleUser)}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder={isStudentMode ? 'student@mcu.ac.in' : 'alumnus@mcu.ac.in'}
                      className={`w-full px-3.5 py-2 rounded-xl border text-sm text-slate-800 focus:outline-none transition-all shadow-2xs ${
                        googleUser
                          ? 'bg-slate-100/80 border-slate-200 cursor-not-allowed text-slate-600'
                          : 'bg-slate-50/70 hover:bg-white focus:bg-white border-slate-300 focus:border-[#002244] focus:ring-2 focus:ring-[#002244]/10'
                      }`}
                    />
                  </div>

                  <div className="mcu-field-group">
                    <label className="text-xs sm:text-[13px] font-semibold text-slate-700 block mb-1">
                      {lang === 'hi' ? 'मोबाइल नंबर' : 'Mobile Number'} {googleUser ? '(Optional)' : '*'}
                    </label>
                    <input
                      type="tel"
                      required={!googleUser}
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full bg-slate-50/70 hover:bg-white focus:bg-white px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#002244] focus:ring-2 focus:ring-[#002244]/10 transition-all shadow-2xs"
                    />
                  </div>
                </div>

                {/* Portal password is removed/hidden when registering with Google */}
                {!googleUser && (
                  <div className="mcu-field-group mcu-stagger-4">
                    <label className="text-xs sm:text-[13px] font-semibold text-slate-700 block mb-1">
                      {lang === 'hi' ? 'पोर्टल पासवर्ड बनाएं *' : 'Create Portal Password *'}
                    </label>
                    <div className="relative">
                      <input
                        type={showRegisterPassword ? 'text' : 'password'}
                        required={!googleUser}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Min 8 characters"
                        className="w-full bg-slate-50/70 hover:bg-white focus:bg-white pl-3.5 pr-10 py-2 rounded-xl border border-slate-300 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#002244] focus:ring-2 focus:ring-[#002244]/10 transition-all shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                        title={showRegisterPassword ? 'Hide Password' : 'Show Password'}
                      >
                        {showRegisterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div
                key="reg-step-2"
                className={`space-y-3 ${stepDirection === 'backward' ? 'mcu-step-enter-backward' : 'mcu-step-enter-forward'}`}
              >
                {/* Section heading */}
                <div className="flex items-center gap-2 pb-0.5 border-b border-slate-100 mcu-stagger-1">
                  <div className="w-1 h-4 bg-gradient-to-b from-[#0284c7] to-[#002244] rounded-full shrink-0" />
                  <span className="text-[11px] font-bold text-[#002244] uppercase tracking-widest">Academic Details</span>
                  <span className="text-[11px] text-slate-400 font-normal ml-1">— your educational background at MCU</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mcu-stagger-2">
                  <div className="mcu-field-group">
                    <label className="text-xs sm:text-[13px] font-semibold text-slate-700 block mb-1">
                      {isStudentMode
                        ? (lang === 'hi' ? 'संभावित उत्तीर्ण वर्ष (Expected Year) *' : 'Expected Graduation Year *')
                        : (lang === 'hi' ? 'उत्तीर्ण वर्ष (Pass-out Batch Year) *' : 'Graduation Batch Year *')}
                    </label>
                    <input
                      type="number"
                      required
                      min="1990"
                      max="2030"
                      value={formData.batch}
                      onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                      className="w-full bg-slate-50/70 hover:bg-white focus:bg-white px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-800 font-medium focus:outline-none focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/15 transition-all shadow-2xs"
                    />
                  </div>

                  <div className="mcu-field-group">
                    <label className="text-xs sm:text-[13px] font-semibold text-slate-700 block mb-1">
                      {lang === 'hi' ? 'परिसर (Campus) *' : 'Campus Studied *'}
                    </label>
                    <select
                      value={formData.campus}
                      onChange={(e) => setFormData({ ...formData, campus: e.target.value })}
                      className="w-full bg-slate-50/70 hover:bg-white focus:bg-white px-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-800 font-medium focus:outline-none focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/15 transition-all shadow-2xs"
                    >
                      <option value="Bhopal">Bhopal (Main Bishankhedi)</option>
                      <option value="Khandwa">Khandwa (Karmveer)</option>
                      <option value="Rewa">Rewa Campus</option>
                      <option value="Datia">Datia Campus</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mcu-stagger-3">
                  <div className="mcu-field-group">
                    <label className="text-xs sm:text-[13px] font-semibold text-slate-700 block mb-1">
                      {isStudentMode
                        ? (lang === 'hi' ? 'अध्ययनरत डिग्री / पाठ्यक्रम *' : 'Degree / Course Pursuing *')
                        : (lang === 'hi' ? 'डिग्री / पाठ्यक्रम *' : 'Degree / Course Completed *')}
                    </label>
                    <input
                      type="text"
                      required
                      list="mcu-degree-options"
                      value={formData.degree}
                      onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                      placeholder="e.g. BCA, MCA, B.Tech CSE, M.Sc IT"
                      className="w-full bg-slate-50/70 hover:bg-white focus:bg-white px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#002244] focus:ring-2 focus:ring-[#002244]/10 transition-all shadow-2xs"
                    />
                    <datalist id="mcu-degree-options">
                      <option value="Bachelor of Computer Applications (BCA)" />
                      <option value="Master of Computer Applications (MCA)" />
                      <option value="B.Tech in Computer Science & Engineering (CSE)" />
                      <option value="M.Sc. in Computer Science (M.Sc. CS)" />
                      <option value="M.Sc. in Information Technology (M.Sc. IT)" />
                      <option value="M.Sc. in Artificial Intelligence & Data Science" />
                      <option value="PGDCA (Post Graduate Diploma in Computer Applications)" />
                      <option value="Ph.D. in Computer Science & Applications" />
                    </datalist>
                  </div>

                  <div className="mcu-field-group">
                    <label className="text-xs sm:text-[13px] font-semibold text-slate-700 block mb-1">
                      {lang === 'hi' ? 'नामांकन संख्या' : 'Enrollment No.'} <span className="text-slate-400 font-normal">({lang === 'hi' ? 'वैकल्पिक' : 'Optional'})</span>
                    </label>
                    <input
                      type="text"
                      value={formData.enrollmentNo}
                      onChange={(e) => setFormData({ ...formData, enrollmentNo: e.target.value })}
                      placeholder="e.g. 20BCA102 / 22MCA045..."
                      className="w-full bg-slate-50/70 hover:bg-white focus:bg-white px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-800 uppercase placeholder-slate-400 focus:outline-none focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/15 transition-all shadow-2xs"
                    />
                  </div>
                </div>

                {/* Core Expertise & Skills (विशेषज्ञता एवं कौशल) */}
                <div className="bg-gradient-to-br from-slate-50 to-amber-50/40 p-3 sm:p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs mt-1 mcu-stagger-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs sm:text-[13px] font-bold text-[#003366] flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-[#fc4a00]" />
                      <span>{lang === 'hi' ? 'विशेषज्ञता एवं कौशल (Core Skills)' : 'Core Expertise & Skills'}</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAutoFillCourseSkills}
                        className="text-xs font-bold text-[#fc4a00] hover:text-[#e04000] bg-orange-50 hover:bg-orange-100 border border-orange-200/80 px-2.5 py-0.5 rounded-full flex items-center gap-1 transition-colors shadow-2xs"
                        title={lang === 'hi' ? 'कोर्स के मुख्य कौशल भरें' : 'Autofill course skills'}
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>{lang === 'hi' ? 'ऑटो-सुझाव' : 'Autofill'}</span>
                      </button>
                      <span className="text-xs text-slate-500 font-semibold">
                        {formData.skills?.length || 0} / 12
                      </span>
                    </div>
                  </div>

                  {/* Active Selected Skills Chips */}
                  <div className="flex flex-wrap gap-1.5 mb-2 min-h-[32px] p-2 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
                    {(!formData.skills || formData.skills.length === 0) ? (
                      <span className="text-xs text-slate-400 italic py-0.5 px-1">
                        {lang === 'hi' ? 'कोई कौशल नहीं चुना — नीचे दिए गए सुझाए गए कौशल पर क्लिक करें' : 'No skills selected — click suggested skills below'}
                      </span>
                    ) : (
                      formData.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#003366] text-white text-xs font-semibold shadow-2xs group hover:bg-rose-700 transition-colors"
                        >
                          <span>{skill}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(idx)}
                            className="text-slate-300 group-hover:text-white hover:scale-110 transition-transform"
                            title="Remove skill"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  {/* Custom Skill Input */}
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newSkillInput}
                      onChange={(e) => setNewSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSkill();
                        }
                      }}
                      placeholder={lang === 'hi' ? 'अन्य कौशल लिखें (उदा. React, Java, Docker, Cloud)...' : 'Type skill (e.g. React.js, Python, Java, Cloud)...'}
                      className="flex-1 bg-white px-3 py-1.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/15 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddSkill()}
                      disabled={!newSkillInput.trim()}
                      className="px-3.5 py-1.5 rounded-xl bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 shrink-0 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{lang === 'hi' ? 'जोड़ें' : 'Add'}</span>
                    </button>
                  </div>

                  {/* Suggested Skills based on Degree */}
                  {(() => {
                    const suggested = getSuggestedSkills(formData.degree || 'BCA (Bachelor of Computer Applications)').filter(
                      (s) => !formData.skills?.some((existing) => existing.toLowerCase() === s.toLowerCase())
                    );
                    if (suggested.length === 0) return null;
                    return (
                      <div>
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-[#fc4a00]" />
                          <span>{lang === 'hi' ? 'सुझाए गए कौशल (क्लिक करके जोड़ें):' : 'Suggested skills (click to add):'}</span>
                        </span>
                        <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pr-1">
                          {suggested.map((s, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleAddSkill(s)}
                              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200/90 text-slate-700 hover:border-[#fc4a00] hover:text-[#fc4a00] hover:bg-amber-50/50 text-xs font-medium transition-all text-left flex items-center gap-1 shadow-2xs active:scale-95"
                            >
                              <Plus className="w-2.5 h-2.5 text-[#fc4a00]" />
                              <span>{s}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {step === 3 && (
              <div
                key="reg-step-3"
                className={`space-y-3 ${stepDirection === 'backward' ? 'mcu-step-enter-backward' : 'mcu-step-enter-forward'}`}
              >
                {/* Section heading */}
                <div className="flex items-center gap-2 pb-0.5 border-b border-slate-100 mcu-stagger-1">
                  <div className="w-1 h-4 bg-gradient-to-b from-[#0284c7] to-[#002244] rounded-full shrink-0" />
                  <span className="text-[11px] font-bold text-[#002244] uppercase tracking-widest">
                    {isStudentMode
                      ? (lang === 'hi' ? 'अध्ययन एवं करियर लक्ष्य' : 'Current Study & Career Goals')
                      : (lang === 'hi' ? 'करियर विवरण' : 'Career Details')}
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal ml-1">
                    {isStudentMode
                      ? (lang === 'hi' ? '— आपका वर्तमान सेमेस्टर और लक्ष्य' : '— your current semester & target domain')
                      : (lang === 'hi' ? '— आपकी वर्तमान व्यावसायिक भूमिका' : '— your current professional role')}
                  </span>
                </div>

                {isStudentMode ? (
                  /* CURRENT STUDENT: Ask for Current Semester/Year & Target Career Domain instead of Company/Job Role */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mcu-stagger-2">
                    <div className="mcu-field-group">
                      <label className="text-xs sm:text-[13px] font-semibold text-slate-700 block mb-1">
                        {lang === 'hi' ? 'वर्तमान सेमेस्टर / वर्ष *' : 'Current Semester / Academic Year *'}
                      </label>
                      <input
                        type="text"
                        required
                        list="mcu-semester-options"
                        value={formData.currentSemester}
                        onChange={(e) => setFormData({ ...formData, currentSemester: e.target.value })}
                        placeholder="e.g. MCA 2nd Semester, BCA Final Year"
                        className="w-full bg-slate-50/70 hover:bg-white focus:bg-white px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#002244] focus:ring-2 focus:ring-[#002244]/10 transition-all shadow-2xs"
                      />
                      <datalist id="mcu-semester-options">
                        <option value="BCA 2nd Semester (1st Year)" />
                        <option value="BCA 4th Semester (2nd Year)" />
                        <option value="BCA 6th Semester (Final Year)" />
                        <option value="MCA 2nd Semester (1st Year)" />
                        <option value="MCA 4th Semester (Final Year)" />
                        <option value="B.Tech CSE 2nd Year" />
                        <option value="B.Tech CSE 3rd Year" />
                        <option value="B.Tech CSE 4th Year (Final Year)" />
                        <option value="M.Sc. CS / IT Final Year" />
                      </datalist>
                    </div>

                    <div className="mcu-field-group">
                      <label className="text-xs sm:text-[13px] font-semibold text-slate-700 block mb-1">
                        {lang === 'hi' ? 'लक्षित करियर क्षेत्र (Target Domain) *' : 'Target Career Domain / Interest *'}
                      </label>
                      <input
                        type="text"
                        required
                        list="mcu-domain-options"
                        value={formData.targetDomain}
                        onChange={(e) => setFormData({ ...formData, targetDomain: e.target.value })}
                        placeholder="e.g. Full Stack Development, AI & Data Science"
                        className="w-full bg-slate-50/70 hover:bg-white focus:bg-white px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#002244] focus:ring-2 focus:ring-[#002244]/10 transition-all shadow-2xs"
                      />
                      <datalist id="mcu-domain-options">
                        <option value="Full Stack Software Development" />
                        <option value="Artificial Intelligence & Machine Learning" />
                        <option value="Cloud Architecture & DevOps Engineering" />
                        <option value="Backend & Distributed Systems" />
                        <option value="Cybersecurity & Network Defense" />
                        <option value="Frontend & Mobile App Engineering" />
                        <option value="Data Science & Analytics" />
                      </datalist>
                    </div>
                  </div>
                ) : (
                  /* ALUMNI: Ask for Current Organization & Current Role / Designation */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mcu-stagger-2">
                    <div className="mcu-field-group">
                      <label className="text-xs sm:text-[13px] font-semibold text-slate-700 block mb-1">
                        {lang === 'hi' ? 'वर्तमान संस्था / कंपनी *' : 'Current Organization *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder="e.g. Infosys, TCS, Google, Microsoft"
                        className="w-full bg-slate-50/70 hover:bg-white focus:bg-white px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#002244] focus:ring-2 focus:ring-[#002244]/10 transition-all shadow-2xs"
                      />
                    </div>

                    <div className="mcu-field-group">
                      <label className="text-xs sm:text-[13px] font-semibold text-slate-700 block mb-1">
                        {lang === 'hi' ? 'पद / भूमिका *' : 'Current Role / Designation *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.currentRole}
                        onChange={(e) => setFormData({ ...formData, currentRole: e.target.value })}
                        placeholder="e.g. Full Stack Developer, Software Engineer, Cloud Architect"
                        className="w-full bg-slate-50/70 hover:bg-white focus:bg-white px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#002244] focus:ring-2 focus:ring-[#002244]/10 transition-all shadow-2xs"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mcu-stagger-3">
                  <div className="mcu-field-group">
                    <label className="text-xs sm:text-[13px] font-semibold text-slate-700 block mb-1">
                      {lang === 'hi' ? 'वर्तमान शहर (City) *' : 'Current City / Base *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g. Bhopal, Bengaluru, Hyderabad, Pune, Noida"
                      className="w-full bg-slate-50/70 hover:bg-white focus:bg-white px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#002244] focus:ring-2 focus:ring-[#002244]/10 transition-all shadow-2xs"
                    />
                  </div>

                  <div className="mcu-field-group">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <label className="text-xs sm:text-[13px] font-semibold text-slate-700">
                        {lang === 'hi' ? 'लिंक्डइन प्रोफाइल' : 'LinkedIn Profile'}{' '}
                        {isStudentMode ? (
                          <span className="text-slate-400 font-normal">({lang === 'hi' ? 'वैकल्पिक' : 'Optional'})</span>
                        ) : (
                          <span className="text-red-600 font-bold">*</span>
                        )}
                      </label>

                      {linkedInVerification.hasInput && linkedInVerification.isValidUrl && (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                            linkedInVerification.isGreenSignal
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-2xs'
                              : 'bg-amber-100 text-amber-900 border-amber-300'
                          }`}
                        >
                          {linkedInVerification.isGreenSignal ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>{linkedInVerification.matchScore}% Name Match</span>
                            </>
                          ) : (
                            <span>⚠️ {linkedInVerification.matchScore}% Match (Need 75%+)</span>
                          )}
                        </span>
                      )}
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        required={!isStudentMode}
                        value={formData.linkedin}
                        onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                        placeholder={
                          formData.name
                            ? `linkedin.com/in/${formData.name.toLowerCase().trim().replace(/\s+/g, '-')}`
                            : 'linkedin.com/in/username'
                        }
                        style={
                          linkedInVerification.isGreenSignal
                            ? {
                                borderColor: '#10b981',
                                background: 'linear-gradient(180deg, #ecfdf5 0%, #d1fae5 100%)',
                                boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.18)',
                              }
                            : linkedInVerification.hasInput && !linkedInVerification.isValidUrl
                            ? {
                                borderColor: '#f43f5e',
                                background: 'linear-gradient(180deg, #fff1f2 0%, #ffe4e6 100%)',
                              }
                            : linkedInVerification.hasInput && linkedInVerification.isValidUrl && !linkedInVerification.isGreenSignal
                            ? {
                                borderColor: '#f59e0b',
                                background: 'linear-gradient(180deg, #fffbeb 0%, #fef3c7 100%)',
                              }
                            : undefined
                        }
                        className={`w-full pl-9 pr-9 py-2 rounded-xl border text-sm transition-all shadow-2xs focus:outline-none ${
                          linkedInVerification.isGreenSignal
                            ? 'border-emerald-500 text-emerald-950 font-semibold'
                            : 'bg-slate-50/70 hover:bg-white focus:bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/15'
                        }`}
                      />
                      <div
                        className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                          linkedInVerification.isGreenSignal ? 'text-emerald-600' : 'text-[#0A66C2]'
                        }`}
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64c-.9 0-1.63.73-1.63 1.63s.73 1.63 1.63 1.63 1.63-.73 1.63-1.63c0-.9-.73-1.63-1.63-1.63Z" />
                        </svg>
                      </div>
                      {linkedInVerification.isGreenSignal && (
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-600 flex items-center">
                          <CheckCircle2 className="w-4 h-4 fill-emerald-100" />
                        </div>
                      )}
                    </div>

                    {/* Live LinkedIn Name Verification Feedback */}
                    {linkedInVerification.hasInput && (
                      <div className="mt-1">
                        {!linkedInVerification.isValidUrl ? (
                          <p className="text-[10.5px] font-semibold text-rose-600 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>
                              {lang === 'hi'
                                ? 'कृपया वैध लिंक्डइन लिंक दर्ज करें: linkedin.com/in/your-name'
                                : 'Enter a valid LinkedIn profile URL: linkedin.com/in/your-name'}
                            </span>
                          </p>
                        ) : linkedInVerification.isGreenSignal ? (
                          <p className="text-[10.5px] font-bold text-emerald-700 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981] shrink-0" />
                            <span className="truncate">
                              {lang === 'hi'
                                ? `ग्रीन सिग्नल सत्यापित (${linkedInVerification.extractedName}) — एडमिन को भेजा जाएगा`
                                : `Green Signal Verified (${linkedInVerification.extractedName}) — Sent to Admin`}
                            </span>
                          </p>
                        ) : (
                          <p className="text-[10.5px] font-semibold text-amber-700 leading-snug">
                            {lang === 'hi'
                              ? `नाम मिलान ${linkedInVerification.matchScore}% (75% से कम) — लिंक्डइन नाम "${linkedInVerification.extractedName}" एडमिन जांच हेतु भेजा जाएगा।`
                              : `Name match ${linkedInVerification.matchScore}% (< 75%) with "${linkedInVerification.extractedName}" — Flagged for Admin review.`}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Mentorship Volunteering Toggle (Alumni) OR Student Permissions Info Banner (Current Student) */}
                {isStudentMode ? (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-50/90 to-indigo-50/60 border border-sky-200/90 flex items-start gap-3 shadow-2xs mcu-stagger-4">
                    <div className="w-8 h-8 rounded-xl bg-sky-100 text-[#0284c7] flex items-center justify-center shrink-0 mt-0.5 border border-sky-200">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="text-xs text-slate-700 leading-relaxed">
                      <span className="font-extrabold text-[#002244] block mb-0.5">
                        {lang === 'hi'
                          ? '📘 अध्ययनरत विद्यार्थी सुविधाएं (Student Access)'
                          : '📘 Current Student Access & Permissions'}
                      </span>
                      {lang === 'hi'
                        ? 'आप पूर्व छात्रों द्वारा पोस्ट की गई नौकरियों/इंटर्नशिप के लिए आवेदन कर सकते हैं और सीनियर एलुमनाई से मेंटरशिप ले सकते हैं। (जॉब पोस्ट करने का विकल्प केवल उत्तीर्ण पूर्व छात्रों के लिए आरक्षित है)।'
                        : 'You can browse & apply for alumni job referrals and request 1-on-1 mentorship from senior MCU graduates. (Posting jobs is reserved exclusively for graduated Alumni).'}
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50/80 to-orange-50/50 border border-amber-200/90 flex items-center justify-between shadow-2xs mcu-stagger-4 hover:border-amber-300 transition-all">
                    <div className="pr-3">
                      <span className="text-xs sm:text-sm font-bold text-[#8d0303] block leading-tight">
                        {lang === 'hi' ? 'पूर्व छात्र मेंटर के रूप में योगदान दें' : 'Volunteer as an Alumni Mentor'}
                      </span>
                      <span className="text-xs text-slate-600 mt-0.5 block">
                        {lang === 'hi' ? 'अध्ययनरत विद्यार्थियों एवं जूनियर्स को मार्गदर्शन प्रदान करें' : 'Offer guidance to juniors and graduating scholars'}
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.openToMentor}
                      onChange={(e) => setFormData({ ...formData, openToMentor: e.target.checked })}
                      className="w-5 h-5 accent-[#fc4a00] rounded-md cursor-pointer"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Step Navigation Controls */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200/80 mt-2 gap-3">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="group px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-xs sm:text-sm font-semibold text-slate-600 hover:text-[#002244] transition-all flex items-center gap-1.5 active:scale-[0.98] cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                  <span>{lang === 'hi' ? 'पिछला चरण' : 'Back'}</span>
                </button>
              ) : <div />}

              <button
                type="submit"
                disabled={isSubmitting}
                className="group mcu-btn-sheen btn-mcu-navy px-5 py-2.5 rounded-xl text-white text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>
                  {step === 3
                    ? (isSubmitting
                        ? (lang === 'hi' ? 'पंजीयन हो रहा है...' : 'Registering...')
                        : (lang === 'hi' ? 'पंजीयन पूरा करें' : 'Complete Registration'))
                    : step === 2
                    ? (isStudentMode
                        ? (lang === 'hi' ? 'अध्ययन व लक्ष्य' : 'Continue to Study & Goals')
                        : (lang === 'hi' ? 'करियर विवरण' : 'Continue to Career'))
                    : (lang === 'hi' ? 'अगला चरण' : 'Continue to Academic')}
                </span>
                {step < 3 && <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
