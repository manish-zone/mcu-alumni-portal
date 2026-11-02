import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/auth_provider.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePass = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    final email = _emailController.text.trim();
    final pass = _passwordController.text;

    if (email.isEmpty || pass.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter both email and password.')),
      );
      return;
    }

    final authProvider = context.read<AuthProvider>();
    final success = await authProvider.login(email, pass);

    if (!mounted) return;

    if (success) {
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: AppColors.primaryNavy,
          content: Text('Welcome back to MCU Alumni Portal!'),
        ),
      );
    } else {
      final error = authProvider.error ?? 'Invalid email or password.';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(backgroundColor: AppColors.error, content: Text(error)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('MCU Member Login'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 68,
                height: 68,
                decoration: BoxDecoration(
                  color: AppColors.primaryNavy,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Center(
                  child: Text(
                    'MCU',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 2,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 18),
            const Center(
              child: Text(
                'Sign In to Alumni Network',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                  color: AppColors.primaryNavy,
                ),
              ),
            ),
            const SizedBox(height: 4),
            const Center(
              child: Text(
                'Official portal for MCU students, alumni & faculty',
                style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
              ),
            ),
            const SizedBox(height: 28),
            const Text(
              'University Email / Login ID',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
            ),
            const SizedBox(height: 6),
            TextField(
              controller: _emailController,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(
                hintText: 'e.g. yourname@mcu.ac.in or gmail.com',
                prefixIcon: Icon(Icons.email_outlined, size: 20),
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Password',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
            ),
            const SizedBox(height: 6),
            TextField(
              controller: _passwordController,
              obscureText: _obscurePass,
              decoration: InputDecoration(
                hintText: 'Enter your password',
                prefixIcon: const Icon(Icons.lock_outline, size: 20),
                suffixIcon: IconButton(
                  icon: Icon(_obscurePass ? Icons.visibility_off : Icons.visibility, size: 20),
                  onPressed: () {
                    setState(() {
                      _obscurePass = !_obscurePass;
                    });
                  },
                ),
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: authProvider.isLoading ? null : _handleLogin,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.accentSaffron,
                ),
                child: authProvider.isLoading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Text('Sign In', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800)),
              ),
            ),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.background,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.cardBorder),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    '💡 Quick Demo Accounts:',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.primaryNavy),
                  ),
                  const SizedBox(height: 4),
                  InkWell(
                    onTap: () {
                      _emailController.text = 'admin@mcu.ac.in';
                      _passwordController.text = 'Admin@1990';
                    },
                    child: const Text(
                      '• Admin: admin@mcu.ac.in / Admin@1990 (Tap to auto-fill)',
                      style: TextStyle(fontSize: 11, color: AppColors.info, fontWeight: FontWeight.w600),
                    ),
                  ),
                  const SizedBox(height: 2),
                  InkWell(
                    onTap: () {
                      _emailController.text = 'priyanka.sharma@alumni.mcu.ac.in';
                      _passwordController.text = 'Alumni@2026';
                    },
                    child: const Text(
                      '• Alumnus: priyanka.sharma@alumni.mcu.ac.in (Tap to auto-fill)',
                      style: TextStyle(fontSize: 11, color: AppColors.info, fontWeight: FontWeight.w600),
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
