import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/constants/app_colors.dart';
import '../providers/language_provider.dart';
import '../providers/auth_provider.dart';
import '../screens/auth/login_screen.dart';
import '../screens/directory/alumni_directory_screen.dart';

class MCUAppBar extends StatelessWidget implements PreferredSizeWidget {
  const MCUAppBar({super.key});

  @override
  Size get preferredSize => const Size.fromHeight(66);

  @override
  Widget build(BuildContext context) {
    final langProvider = context.watch<LanguageProvider>();
    final authProvider = context.watch<AuthProvider>();
    final isHindi = langProvider.isHindi;

    return Container(
      decoration: BoxDecoration(
        gradient: AppColors.royalHeaderGradient,
        border: const Border(
          bottom: BorderSide(color: AppColors.glassBorder, width: 1.5),
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.skyAccent.withValues(alpha: 0.12),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          child: Row(
            children: [
              // 1. Official Crest Logo
              Container(
                width: 44,
                height: 44,
                padding: const EdgeInsets.all(2),
                child: Image.asset(
                  'assets/images/mcu-logo.png',
                  fit: BoxFit.contain,
                  errorBuilder: (_, __, ___) => Container(
                    decoration: BoxDecoration(
                      color: AppColors.primaryNavy,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Center(
                      child: Text(
                        'MCU',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                  ),
                ),
              ),

              const SizedBox(width: 8),

              // 2. Bilingual University & Alumni Association Typography
              Expanded(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            langProvider.shortUniversityName,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 13.5,
                              fontWeight: FontWeight.w900,
                              color: AppColors.royalNavyDark,
                              fontFamily: 'serif',
                              letterSpacing: -0.2,
                            ),
                          ),
                        ),
                        const SizedBox(width: 5),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                          decoration: BoxDecoration(
                            gradient: AppColors.saffronBadgeGradient,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Text(
                            'ESTD 1990',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 7.5,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        Container(
                          width: 6,
                          height: 6,
                          decoration: const BoxDecoration(
                            color: AppColors.successGreen,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          langProvider.associationBadge,
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            color: AppColors.crimsonRed,
                          ),
                        ),
                        const SizedBox(width: 4),
                        const Text('•', style: TextStyle(color: AppColors.skyAccent, fontSize: 10)),
                        const SizedBox(width: 4),
                        Flexible(
                          child: Text(
                            isHindi ? 'राष्ट्रीय मीडिया नेटवर्क' : 'National Media Network',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              color: AppColors.primaryNavy.withValues(alpha: 0.85),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(width: 6),

              // 3. Quick Search Button
              IconButton(
                visualDensity: VisualDensity.compact,
                onPressed: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const AlumniDirectoryScreen()),
                  );
                },
                icon: Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.glassBorder),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.skyAccent.withValues(alpha: 0.1),
                        blurRadius: 4,
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.search,
                    color: AppColors.accentSaffron,
                    size: 16,
                  ),
                ),
              ),

              // 4. Aqua Glass Language Switcher Button (English / हिंदी)
              GestureDetector(
                onTap: () => langProvider.toggleLanguage(),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
                  decoration: BoxDecoration(
                    gradient: AppColors.aquaGlassButtonGradient,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.glassBorder.withValues(alpha: 0.7)),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.skyAccent.withValues(alpha: 0.3),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.language, color: AppColors.goldAccent, size: 13),
                      const SizedBox(width: 4),
                      Text(
                        isHindi ? 'EN' : 'हिंदी',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(width: 4),

              // 5. User Avatar / Sign In Button
              if (!authProvider.isAuthenticated)
                TextButton(
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const LoginScreen()),
                    );
                  },
                  style: TextButton.styleFrom(
                    visualDensity: VisualDensity.compact,
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                  ),
                  child: Text(
                    isHindi ? 'लॉगिन' : 'Sign In',
                    style: const TextStyle(
                      color: AppColors.royalNavyDark,
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                )
              else
                Padding(
                  padding: const EdgeInsets.only(left: 4),
                  child: CircleAvatar(
                    radius: 15,
                    backgroundColor: AppColors.primaryNavy,
                    child: Text(
                      authProvider.user?.name.isNotEmpty == true
                          ? authProvider.user!.name[0].toUpperCase()
                          : 'U',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

