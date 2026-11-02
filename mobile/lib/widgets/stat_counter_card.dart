import 'package:flutter/material.dart';
import '../core/constants/app_colors.dart';

class StatCounterCard extends StatelessWidget {
  final String value;
  final String label;
  final String hindiLabel;
  final bool isHindi;
  final IconData icon;
  final Color iconColor;

  const StatCounterCard({
    super.key,
    required this.value,
    required this.label,
    required this.hindiLabel,
    required this.isHindi,
    required this.icon,
    this.iconColor = AppColors.accentSaffron,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.glassBorder.withValues(alpha: 0.7)),
        boxShadow: [
          BoxShadow(
            color: AppColors.skyAccent.withValues(alpha: 0.08),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
          BoxShadow(
            color: AppColors.royalNavyDark.withValues(alpha: 0.04),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: Stack(
          children: [
            // Top Navy Accent Bar
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              child: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [AppColors.royalNavyDark, AppColors.skyAccent],
                  ),
                ),
              ),
            ),

            // Top-right subtle glow orb
            Positioned(
              top: -16,
              right: -16,
              child: Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.skyHighlight.withValues(alpha: 0.12),
                ),
              ),
            ),

            // Card Content
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // 3D Glass Icon Pedestal
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          Colors.white,
                          AppColors.bgPearlLight,
                          const Color(0xFFE0F2FE),
                        ],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                      ),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: AppColors.glassBorder,
                        width: 1.2,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.skyAccent.withValues(alpha: 0.15),
                          blurRadius: 8,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Center(
                      child: Icon(icon, color: iconColor, size: 22),
                    ),
                  ),

                  const SizedBox(height: 10),

                  // Value (e.g. 38,000+)
                  Text(
                    value,
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                      color: AppColors.royalNavyDark,
                      letterSpacing: -0.5,
                    ),
                  ),

                  const SizedBox(height: 2),

                  // Label
                  Text(
                    isHindi ? hindiLabel : label,
                    textAlign: TextAlign.center,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textSecondary,
                      letterSpacing: 0.3,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

