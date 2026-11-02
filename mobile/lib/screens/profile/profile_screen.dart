import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../auth/login_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final user = authProvider.user;

    if (!authProvider.isAuthenticated || user == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Member Account')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: AppColors.primaryNavy.withOpacity(0.08),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.account_circle, size: 72, color: AppColors.primaryNavy),
                ),
                const SizedBox(height: 18),
                const Text(
                  'Join the Official MCU Network',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: AppColors.primaryNavy,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Sign in with your university registered alumni account to apply for jobs, request mentorship, and post memories.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(builder: (_) => const LoginScreen()),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.accentSaffron,
                    ),
                    child: const Text('Sign In to Account'),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Alumni Membership Card'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Membership Badge Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: AppColors.heroGradient,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primaryNavy.withOpacity(0.25),
                    blurRadius: 16,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'MAKHANLAL CHATURVEDI UNIVERSITY',
                        style: TextStyle(
                          color: Colors.white70,
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1.2,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.accentSaffron,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          user.role.toUpperCase(),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 30,
                        backgroundColor: Colors.white24,
                        backgroundImage: user.avatarUrl != null ? NetworkImage(user.avatarUrl!) : null,
                        child: user.avatarUrl == null
                            ? Text(
                                user.name.isNotEmpty ? user.name[0] : 'U',
                                style: const TextStyle(fontSize: 22, color: Colors.white, fontWeight: FontWeight.bold),
                              )
                            : null,
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              user.name,
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w800,
                                color: Colors.white,
                              ),
                            ),
                            Text(
                              user.email,
                              style: const TextStyle(fontSize: 12, color: Colors.white70),
                            ),
                            if (user.currentRole != null)
                              Text(
                                '${user.currentRole} ${user.company != null ? "• ${user.company}" : ""}',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: Colors.white.withOpacity(0.9),
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Batch of ${user.batchYear ?? 2020}',
                        style: const TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.w700),
                      ),
                      const Row(
                        children: [
                          Icon(Icons.verified, size: 14, color: AppColors.goldAccent),
                          SizedBox(width: 4),
                          Text(
                            'Verified Alumnus',
                            style: TextStyle(color: AppColors.goldAccent, fontSize: 11, fontWeight: FontWeight.w700),
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Profile Actions
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.cardBorder),
              ),
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(Icons.school, color: AppColors.primaryNavy),
                    title: const Text('Department', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                    subtitle: Text(user.departmentName ?? 'Journalism & Media', style: const TextStyle(fontSize: 12)),
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(Icons.account_balance, color: AppColors.primaryNavy),
                    title: const Text('Campus', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                    subtitle: Text(user.campusName ?? 'Bhopal Main Campus', style: const TextStyle(fontSize: 12)),
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(Icons.workspace_premium, color: AppColors.primaryNavy),
                    title: const Text('Mentor Status', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                    subtitle: Text(
                      user.openToMentor ? 'Available for Mentorship' : 'Not open for mentoring',
                      style: TextStyle(
                        fontSize: 12,
                        color: user.openToMentor ? AppColors.success : AppColors.textSecondary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () async {
                  await context.read<AuthProvider>().logout();
                  if (!context.mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Logged out successfully.')),
                  );
                },
                icon: const Icon(Icons.logout, size: 18, color: AppColors.error),
                label: const Text('Sign Out', style: TextStyle(color: AppColors.error)),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppColors.error),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
