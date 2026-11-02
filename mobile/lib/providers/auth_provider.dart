import 'package:flutter/foundation.dart';
import '../core/network/api_client.dart';
import '../core/storage/secure_storage.dart';
import '../models/user_model.dart';

class AuthProvider extends ChangeNotifier {
  final ApiClient _api = ApiClient();
  final SecureStorageService _storage = SecureStorageService();

  bool isLoading = false;
  UserModel? user;
  String? token;
  String? error;

  bool get isAuthenticated => token != null && token!.isNotEmpty && user != null;

  AuthProvider() {
    checkInitialAuth();
  }

  Future<void> checkInitialAuth() async {
    isLoading = true;
    notifyListeners();

    token = await _storage.getToken();
    user = await _storage.getUser();

    isLoading = false;
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    isLoading = true;
    error = null;
    notifyListeners();

    try {
      final res = await _api.post('/auth/login', data: {
        'email': email.trim(),
        'password': password,
      });

      if (res.statusCode == 200 && res.data != null) {
        final data = res.data is Map<String, dynamic> ? res.data : {};
        token = data['token']?.toString() ?? '';
        final userRaw = data['user'] ?? data['profile'] ?? {};
        user = UserModel.fromJson(Map<String, dynamic>.from(userRaw));

        await _storage.saveToken(token!);
        await _storage.saveUser(user!);

        isLoading = false;
        error = null;
        notifyListeners();
        return true;
      } else {
        isLoading = false;
        error = res.data?['error']?.toString() ?? 'Login failed. Please check credentials.';
        notifyListeners();
        return false;
      }
    } catch (e) {
      isLoading = false;
      error = 'Cannot connect to MCU server. Please ensure backend is running.';
      notifyListeners();
      return false;
    }
  }

  Future<bool> register(Map<String, dynamic> payload) async {
    isLoading = true;
    error = null;
    notifyListeners();

    try {
      final res = await _api.post('/auth/register', data: payload);
      if (res.statusCode == 200 || res.statusCode == 201) {
        isLoading = false;
        error = null;
        notifyListeners();
        return true;
      } else {
        isLoading = false;
        error = res.data?['error']?.toString() ?? 'Registration failed';
        notifyListeners();
        return false;
      }
    } catch (e) {
      isLoading = false;
      error = 'Registration error: $e';
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await _storage.clearAll();
    user = null;
    token = null;
    error = null;
    notifyListeners();
  }
}
