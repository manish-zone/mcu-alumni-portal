import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../core/constants/app_colors.dart';

/// 3D Animated Sacred Orbital MCU Crest
/// Exactly Replicating the Official MCU Hero Medallion from the Web Portal
class MCUAnimatedCrest extends StatefulWidget {
  final double size;
  const MCUAnimatedCrest({super.key, this.size = 110});

  @override
  State<MCUAnimatedCrest> createState() => _MCUAnimatedCrestState();
}

class _MCUAnimatedCrestState extends State<MCUAnimatedCrest>
    with SingleTickerProviderStateMixin {
  late AnimationController _animController;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 14),
    )..repeat();
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.size;

    return AnimatedBuilder(
      animation: _animController,
      builder: (context, child) {
        final angle = _animController.value * 2 * math.pi;

        return SizedBox(
          width: s + 36,
          height: s + 36,
          child: Stack(
            alignment: Alignment.center,
            children: [
              // 1. Breathing Saffron-Gold Royal Aura Glow
              Container(
                width: s + 20,
                height: s + 20,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      AppColors.skyAccent.withValues(alpha: 0.25),
                      AppColors.goldAccent.withValues(alpha: 0.18),
                      AppColors.accentSaffron.withValues(alpha: 0.12),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),

              // 2. Outer Clockwise Orbital Ring + Nodes
              Transform.rotate(
                angle: angle,
                child: Container(
                  width: s + 24,
                  height: s + 24,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: AppColors.skyAccent.withValues(alpha: 0.35),
                      width: 1.2,
                    ),
                  ),
                  child: Stack(
                    children: [
                      // Top Saffron-Gold Node
                      Align(
                        alignment: Alignment.topCenter,
                        child: Container(
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: const LinearGradient(
                              colors: [AppColors.accentSaffron, AppColors.goldAccent],
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.accentSaffron.withValues(alpha: 0.8),
                                blurRadius: 6,
                              ),
                            ],
                          ),
                        ),
                      ),
                      // Bottom Sky Node
                      Align(
                        alignment: Alignment.bottomCenter,
                        child: Container(
                          width: 6,
                          height: 6,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: AppColors.skyAccent,
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.skyAccent.withValues(alpha: 0.8),
                                blurRadius: 5,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // 3. Inner Counter-Rotating Orbital Ring + Node
              Transform.rotate(
                angle: -angle * 1.3,
                child: Container(
                  width: s + 10,
                  height: s + 10,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: AppColors.accentSaffron.withValues(alpha: 0.35),
                      width: 1.0,
                    ),
                  ),
                  child: Align(
                    alignment: Alignment.centerRight,
                    child: Container(
                      width: 6,
                      height: 6,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppColors.accentSaffron,
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.accentSaffron.withValues(alpha: 0.8),
                            blurRadius: 6,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),

              // 4. Official High-Resolution MCU University Crest
              Container(
                width: s,
                height: s,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primaryNavy.withValues(alpha: 0.22),
                      blurRadius: 16,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Image.asset(
                  'assets/images/mcu-logo.png',
                  fit: BoxFit.contain,
                  errorBuilder: (_, __, ___) => CircleAvatar(
                    backgroundColor: Colors.white,
                    child: Text(
                      'MCU',
                      style: TextStyle(
                        fontFamily: 'serif',
                        fontSize: s * 0.28,
                        fontWeight: FontWeight.w900,
                        color: AppColors.primaryNavy,
                      ),
                    ),
                  ),
                ),
              ),

              // 5. Floating 3D "ESTD 1990" Pill
              Positioned(
                bottom: 2,
                right: 8,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
                  decoration: BoxDecoration(
                    gradient: AppColors.saffronBadgeGradient,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.amber.shade200, width: 1.2),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.royalCrimson.withValues(alpha: 0.4),
                        blurRadius: 8,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                  child: const Text(
                    'ESTD 1990',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 9,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.1,
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
