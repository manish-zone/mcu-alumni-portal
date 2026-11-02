import 'package:flutter/material.dart';
import '../core/constants/app_colors.dart';

class MCULiveMarquee extends StatefulWidget {
  final String text;
  final String badgeText;
  final bool isNotice;

  const MCULiveMarquee({
    super.key,
    required this.text,
    this.badgeText = 'LIVE NETWORK',
    this.isNotice = false,
  });

  @override
  State<MCULiveMarquee> createState() => _MCULiveMarqueeState();
}

class _MCULiveMarqueeState extends State<MCULiveMarquee>
    with SingleTickerProviderStateMixin {
  late ScrollController _scrollController;
  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);

    WidgetsBinding.instance.addPostFrameCallback((_) => _startScrolling());
  }

  void _startScrolling() async {
    while (mounted) {
      await Future.delayed(const Duration(milliseconds: 800));
      if (!mounted || !_scrollController.hasClients) break;

      final maxScroll = _scrollController.position.maxScrollExtent;
      if (maxScroll <= 0) continue;

      await _scrollController.animateTo(
        maxScroll,
        duration: Duration(milliseconds: (maxScroll * 35).toInt()),
        curve: Curves.linear,
      );

      await Future.delayed(const Duration(milliseconds: 1200));
      if (!mounted || !_scrollController.hasClients) break;

      _scrollController.jumpTo(0);
    }
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
      decoration: BoxDecoration(
        color: widget.isNotice ? const Color(0xFFFFF7ED) : const Color(0xFFFEF3C7),
        border: Border(
          bottom: BorderSide(
            color: widget.isNotice ? const Color(0xFFFED7AA) : const Color(0xFFFDE68A),
            width: 1,
          ),
        ),
      ),
      child: Row(
        children: [
          // Live Indicator Badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
            decoration: BoxDecoration(
              gradient: widget.isNotice
                  ? AppColors.saffronBadgeGradient
                  : const LinearGradient(
                      colors: [AppColors.royalNavyDark, AppColors.skyAccent],
                    ),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                FadeTransition(
                  opacity: _pulseController,
                  child: Container(
                    width: 6,
                    height: 6,
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
                const SizedBox(width: 5),
                Text(
                  widget.badgeText,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 9,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.6,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(width: 10),

          // Scrolling Marquee Text
          Expanded(
            child: SingleChildScrollView(
              controller: _scrollController,
              scrollDirection: Axis.horizontal,
              physics: const NeverScrollableScrollPhysics(),
              child: Text(
                widget.text,
                style: TextStyle(
                  fontSize: 11.5,
                  fontWeight: FontWeight.w700,
                  color: widget.isNotice ? const Color(0xFFC2410C) : const Color(0xFF78350F),
                  letterSpacing: 0.2,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

