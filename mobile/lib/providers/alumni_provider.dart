import 'package:flutter/foundation.dart';
import '../core/network/api_client.dart';
import '../models/alumni_model.dart';

class AlumniProvider extends ChangeNotifier {
  final ApiClient _api = ApiClient();

  List<AlumniModel> _allAlumni = [];
  bool isLoading = false;
  String searchQuery = '';
  String selectedDepartment = 'All';

  List<AlumniModel> get allAlumni => _allAlumni;

  List<AlumniModel> get filteredAlumni {
    final query = searchQuery.trim().toLowerCase();
    return _allAlumni.where((alumnus) {
      final matchesQuery = query.isEmpty ||
          alumnus.name.toLowerCase().contains(query) ||
          alumnus.company.toLowerCase().contains(query) ||
          alumnus.currentRole.toLowerCase().contains(query) ||
          alumnus.location.toLowerCase().contains(query) ||
          alumnus.batchYear.toString().contains(query);

      final matchesDept = selectedDepartment == 'All' || alumnus.department == selectedDepartment;

      return matchesQuery && matchesDept;
    }).toList();
  }

  AlumniProvider() {
    fetchAlumni();
  }

  void setSearchQuery(String q) {
    searchQuery = q;
    notifyListeners();
  }

  void setDepartment(String dept) {
    selectedDepartment = dept;
    notifyListeners();
  }

  Future<void> fetchAlumni() async {
    isLoading = true;
    notifyListeners();

    try {
      final res = await _api.get('/alumni');
      if (res.statusCode == 200 && res.data != null) {
        final List list;
        if (res.data is List) {
          list = res.data;
        } else if (res.data is Map && res.data['data'] is List) {
          list = res.data['data'];
        } else if (res.data is Map && res.data['alumni'] is List) {
          list = res.data['alumni'];
        } else {
          list = [];
        }

        if (list.isNotEmpty) {
          _allAlumni = list.map((e) => AlumniModel.fromJson(Map<String, dynamic>.from(e))).toList();
          isLoading = false;
          notifyListeners();
          return;
        }
      }
    } catch (_) {}

    // Fallback roster from official MCU mock directory
    _allAlumni = [
      AlumniModel(
        id: 1,
        name: 'Mayank Gupta',
        hindiName: 'मयंक गुप्ता',
        email: 'mayank.g@media.org',
        batchYear: 2012,
        department: 'Journalism & New Media',
        campus: 'Bhopal Main Campus',
        currentRole: 'Senior Managing Editor',
        company: 'NDTV India',
        location: 'New Delhi',
        openToMentor: true,
        skills: ['Broadcast Journalism', 'Prime Time Anchoring', 'Investigative Reporting'],
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
      ),
      AlumniModel(
        id: 2,
        name: 'Priyanka Sharma',
        hindiName: 'प्रियंका शर्मा',
        email: 'priyanka.s@techmedia.in',
        batchYear: 2015,
        department: 'Computer Applications & Media Tech',
        campus: 'Bhopal Main Campus',
        currentRole: 'Lead UI/UX Architect',
        company: 'Google India',
        location: 'Bengaluru',
        openToMentor: true,
        skills: ['Flutter & React', 'Design Systems', 'Product Strategy'],
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80',
      ),
      AlumniModel(
        id: 3,
        name: 'Vikramaditya Verma',
        hindiName: 'विक्रमादित्य वर्मा',
        email: 'vikram.v@filmcraft.com',
        batchYear: 2008,
        department: 'Electronic Media & Cinema',
        campus: 'Bhopal Main Campus',
        currentRole: 'Director & Cinematographer',
        company: 'National Film Awards Winner',
        location: 'Mumbai',
        openToMentor: true,
        skills: ['Documentary Production', 'Cinematography', 'Sound Design'],
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
      ),
      AlumniModel(
        id: 4,
        name: 'Ananya Deshmukh',
        hindiName: 'अनन्या देशमुख',
        email: 'ananya.d@prhub.com',
        batchYear: 2018,
        department: 'Public Relations & Advertising',
        campus: 'Noida Campus',
        currentRole: 'Head of Corporate Communications',
        company: 'Tata Consultancy Services',
        location: 'Mumbai',
        openToMentor: false,
        skills: ['Crisis Communication', 'Brand Strategy', 'Media Relations'],
        avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80',
      ),
    ];

    isLoading = false;
    notifyListeners();
  }
}
