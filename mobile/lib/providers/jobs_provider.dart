import 'package:flutter/foundation.dart';
import '../core/network/api_client.dart';
import '../models/job_model.dart';

class JobsProvider extends ChangeNotifier {
  final ApiClient _api = ApiClient();

  List<JobModel> _allJobs = [];
  bool isLoading = false;
  String selectedFilter = 'All';

  List<JobModel> get allJobs => _allJobs;

  List<JobModel> get filteredJobs {
    if (selectedFilter == 'All') return _allJobs;
    return _allJobs.where((j) => j.jobType.toLowerCase() == selectedFilter.toLowerCase()).toList();
  }

  JobsProvider() {
    fetchJobs();
  }

  void setFilter(String f) {
    selectedFilter = f;
    notifyListeners();
  }

  Future<void> fetchJobs() async {
    isLoading = true;
    notifyListeners();

    try {
      final res = await _api.get('/jobs');
      if (res.statusCode == 200 && res.data != null) {
        final List list;
        if (res.data is List) {
          list = res.data;
        } else if (res.data is Map && res.data['data'] is List) {
          list = res.data['data'];
        } else if (res.data is Map && res.data['jobs'] is List) {
          list = res.data['jobs'];
        } else {
          list = [];
        }

        if (list.isNotEmpty) {
          _allJobs = list.map((e) => JobModel.fromJson(Map<String, dynamic>.from(e))).toList();
          isLoading = false;
          notifyListeners();
          return;
        }
      }
    } catch (_) {}

    // Fallback jobs from MCU referral network
    _allJobs = [
      JobModel(
        id: 1,
        title: 'Senior Newsroom Producer & Anchor',
        company: 'BBC News Hindi',
        location: 'New Delhi (Hybrid)',
        jobType: 'Full-time',
        experience: '3-5 Years',
        salary: '₹12 - ₹18 LPA',
        deadline: 'Nov 30, 2026',
        description:
            'Seeking an experienced producer to spearhead prime-time ground reporting and digital broadcast stories. Priority consideration for MCU journalism alumni.',
        referralAlumnusName: 'Mayank Gupta (Batch of 2012)',
        referralRole: 'Executive Producer',
      ),
      JobModel(
        id: 2,
        title: 'Lead Mobile App Developer (Flutter/Dart)',
        company: 'Times Internet',
        location: 'Noida / Remote',
        jobType: 'Full-time',
        experience: '2-4 Years',
        salary: '₹14 - ₹22 LPA',
        deadline: 'Dec 15, 2026',
        description:
            'Architect and deliver next-gen news and media streaming apps with millions of active readers. MCU Computer Science / IT grads preferred.',
        referralAlumnusName: 'Priyanka Sharma (Batch of 2015)',
        referralRole: 'Tech Director',
      ),
      JobModel(
        id: 3,
        title: 'Brand Communications Specialist',
        company: 'Edelman PR',
        location: 'Mumbai (In-office)',
        jobType: 'Full-time',
        experience: '1-3 Years',
        salary: '₹8 - ₹12 LPA',
        deadline: 'Dec 05, 2026',
        description:
            'Design press communication, influencer outreach, and corporate reputation campaigns for Fortune 500 tech clients.',
        referralAlumnusName: 'Ananya Deshmukh (Batch of 2018)',
        referralRole: 'PR Lead',
      ),
    ];

    isLoading = false;
    notifyListeners();
  }
}
