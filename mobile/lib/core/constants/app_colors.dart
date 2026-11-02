import 'package:flutter/material.dart';

/// Official Brand Colors for Makhanlal Chaturvedi National University
/// (MCU) - Perfectly Matched to the Web Application (Liquid Crystal & Royal Heritage)
class AppColors {
  // Royal Heritage Navy Palette
  static const Color royalNavyDark = Color(0xFF002244);
  static const Color primaryNavy = Color(0xFF003366);
  static const Color primaryNavyLight = Color(0xFF0369A1);
  static const Color primaryLight = Color(0xFF0369A1);
  static const Color skyAccent = Color(0xFF0284C7);
  static const Color skyHighlight = Color(0xFF38BDF8);

  // Saffron & Crimson Heritage Palette
  static const Color saffronLight = Color(0xFFFF6A00);
  static const Color accentSaffron = Color(0xFFFC4A00);
  static const Color saffronDark = Color(0xFFC23600);
  static const Color crimsonRed = Color(0xFF8D0303);
  static const Color royalCrimson = Color(0xFF680A13);

  // Gold & Amber Honors Palette
  static const Color goldAccent = Color(0xFFF59E0B);
  static const Color goldDark = Color(0xFFD97706);
  static const Color goldLightBg = Color(0xFFFEF3C7);

  // Executive Pearl-White & Soft Sky Backgrounds
  static const Color bgPearlLight = Color(0xFFF4FAFF);
  static const Color bgWhite = Color(0xFFFFFFFF);
  static const Color bgSoftSky = Color(0xFFEEF5FB);
  static const Color background = Color(0xFFF4FAFF);
  static const Color surface = Color(0xFFFFFFFF);

  // 3D Water-Glass Borders & Shading
  static const Color glassBorder = Color(0xFFBAE6FD);
  static const Color cardBorder = Color(0xFFE2E8F0);
  static const Color cardBorderHover = Color(0xFF93C5FD);

  // Typography Colors
  static const Color textHeadline = Color(0xFF002244);
  static const Color textPrimary = Color(0xFF0F172A);
  static const Color textSecondary = Color(0xFF475569);
  static const Color textMuted = Color(0xFF94A3B8);

  // Status Colors
  static const Color successGreen = Color(0xFF10B981);
  static const Color success = Color(0xFF10B981);
  static const Color warningAmber = Color(0xFFF59E0B);
  static const Color warning = Color(0xFFF59E0B);
  static const Color errorRed = Color(0xFFEF4444);
  static const Color error = Color(0xFFEF4444);
  static const Color info = Color(0xFF0284C7);

  // Official Web Gradients
  static const LinearGradient royalHeaderGradient = LinearGradient(
    colors: [Color(0xFFFFFFFF), Color(0xFFF0F9FF), Color(0xFFE0F2FE)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  static const LinearGradient royalNavyGradient = LinearGradient(
    colors: [royalNavyDark, primaryNavy, Color(0xFF0369A1)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient heroGradient = LinearGradient(
    colors: [royalNavyDark, primaryNavy, Color(0xFF0369A1)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient saffronBadgeGradient = LinearGradient(
    colors: [saffronLight, accentSaffron, crimsonRed],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  static const LinearGradient pearlBgGradient = LinearGradient(
    colors: [bgPearlLight, bgWhite, bgSoftSky],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  static const LinearGradient aquaGlassButtonGradient = LinearGradient(
    colors: [Color(0xFF0284C7), Color(0xFF0369A1), Color(0xFF003366)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );
}
