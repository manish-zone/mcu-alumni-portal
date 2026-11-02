import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LanguageProvider extends ChangeNotifier {
  String _lang = 'en';
  String get lang => _lang;
  bool get isHindi => _lang == 'hi';

  // CMS dynamic portal content (synced with web LanguageContext)
  String alumniCount = '38,000+';
  String directoryTitleEn = 'Global Alumni Directory';
  String directoryTitleHi = 'वैश्विक पूर्व छात्र निर्देशिका';
  String directorySubtitleEn = 'Search and connect with over 38,000 media and tech professionals worldwide.';
  String directorySubtitleHi = 'विश्वभर में कार्यरत 38,000+ पूर्व छात्रों से सीधे जुड़ें और संपर्क सूत्र स्थापित करें।';
  String heroTickerEn = '🟢 Live Network: 38,000+ Verified Alumni across Global Media & Tech Enterprises';
  String heroTickerHi = '🟢 लाइव नेटवर्क: 38,000+ सत्यापित पूर्व छात्र विश्वभर के मीडिया एवं IT संस्थानों में';

  LanguageProvider() {
    _loadLanguagePreference();
  }

  Future<void> _loadLanguagePreference() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _lang = prefs.getString('mcu_portal_lang') ?? 'en';
      notifyListeners();
    } catch (_) {}
  }

  Future<void> toggleLanguage() async {
    _lang = _lang == 'en' ? 'hi' : 'en';
    notifyListeners();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('mcu_portal_lang', _lang);
    } catch (_) {}
  }

  // Helper getters for bilingual UI
  String get universityName => isHindi
      ? 'माखनलाल चतुर्वेदी राष्ट्रीय पत्रकारिता एवं संचार विश्वविद्यालय'
      : 'Makhanlal Chaturvedi National University of Journalism & Communication';

  String get shortUniversityName => isHindi
      ? 'माखनलाल चतुर्वेदी वि.वि. भोपाल'
      : 'MCU University Bhopal';

  String get associationBadge => isHindi
      ? 'पूर्व छात्र महासंघ'
      : 'MCU Alumni Association';

  String get heroBadge => isHindi
      ? '35 वर्षों की गौरवशाली पत्रकारिता यात्रा (1990 - 2026)'
      : '35 Years of Media Excellence (1990 - 2026)';

  String get heroPrefix => isHindi
      ? 'जहाँ भारतीय पत्रकारिता को मिली'
      : 'Where Indian Media Finds Its';

  String get heroHighlight => isHindi
      ? 'आवाज और अस्मिता'
      : 'Voice & Conscience';

  String get heroDescription => isHindi
      ? 'माखनलाल चतुर्वेदी राष्ट्रीय पत्रकारिता एवं संचार विश्वविद्यालय के 38,000+ से अधिक संपादक, टीवी एंकर, फिल्म निर्माता, जनसंपर्क निदेशक व मीडिया-टेक विशेषज्ञ वैश्विक फलक पर राष्ट्र का गौरव बढ़ा रहे हैं।'
      : 'Makhanlal Chaturvedi National University of Journalism and Communication brings together 38,000+ editors, broadcasters, filmmakers, PR leaders, and media-tech pioneers shaping public discourse across the globe.';

  String get directoryTitle => isHindi ? directoryTitleHi : directoryTitleEn;
  String get directorySubtitle => isHindi ? directorySubtitleHi : directorySubtitleEn;
  String get liveTicker => isHindi ? heroTickerHi : heroTickerEn;

  String get findAlumni => isHindi ? 'पूर्व छात्र खोजें' : 'Explore Alumni Directory';
  String get registerAlumni => isHindi ? 'पूर्व छात्र पंजीयन' : 'Register as Alumni';
  String get findMentor => isHindi ? 'मेंटर खोजें' : 'Find a Mentor';
  String get browseJobs => isHindi ? 'रोजगार अवसर' : 'Browse Jobs';
}
