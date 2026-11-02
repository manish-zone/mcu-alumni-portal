import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

class ApiEndpoints {
  /// Base API URL for MCU Microservices Gateway (Port 8000)
  /// - Android Emulator: 10.0.2.2 points to host PC localhost
  /// - iOS Simulator / Desktop / Web: localhost:8000
  /// - Physical Phone on Wi-Fi: change to your PC LAN IP (e.g. 192.168.1.x:8000)
  static String get baseUrl {
    if (kIsWeb) {
      return 'http://localhost:8000/api';
    }
    try {
      if (Platform.isAndroid) {
        return 'http://10.0.2.2:8000/api';
      }
    } catch (_) {}
    return 'http://localhost:8000/api';
  }

  // Auth Service
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String profile = '/auth/profile';
  static const String updateProfile = '/auth/profile/update';
  static const String forgotPassword = '/auth/forgot-password';

  // Alumni Service
  static const String alumniList = '/alumni';
  static const String alumniSearch = '/alumni/search';
  static const String alumniDetail = '/alumni/'; // + id

  // Jobs Service
  static const String jobsList = '/jobs';
  static const String jobApply = '/jobs/apply';
  static const String createJob = '/jobs';

  // Events Service
  static const String eventsList = '/events';
  static const String eventRsvp = '/events/rsvp';

  // Engagement & Memories
  static const String memories = '/memories';
  static const String mentorship = '/mentorship';
  static const String mentorshipRequest = '/mentorship/request';

  // Meta & Stats
  static const String metaStats = '/meta/stats';
}

