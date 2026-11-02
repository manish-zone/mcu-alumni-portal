import 'package:flutter/foundation.dart';
import '../core/network/api_client.dart';
import '../models/memory_model.dart';

class MemoriesProvider extends ChangeNotifier {
  final ApiClient _api = ApiClient();

  List<MemoryModel> memories = [];
  bool isLoading = false;

  MemoriesProvider() {
    fetchMemories();
  }

  Future<void> fetchMemories() async {
    isLoading = true;
    notifyListeners();

    try {
      final res = await _api.get('/memories');
      if (res.statusCode == 200 && res.data != null) {
        final List list;
        if (res.data is List) {
          list = res.data;
        } else if (res.data is Map && res.data['memories'] is List) {
          list = res.data['memories'];
        } else {
          list = [];
        }

        if (list.isNotEmpty) {
          memories = list.map((e) => MemoryModel.fromJson(Map<String, dynamic>.from(e))).toList();
          isLoading = false;
          notifyListeners();
          return;
        }
      }
    } catch (_) {}

    memories = [
      MemoryModel(
        id: 1,
        title: 'Bishankhedi Campus Inauguration',
        hindiTitle: 'बिशनखेड़ी मुख्य परिसर उद्घाटन',
        category: 'Campus Architecture',
        academicYear: '2023',
        imageUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80',
        description: 'The sprawling 50-acre new academic headquarters with state-of-the-art broadcast studios.',
      ),
      MemoryModel(
        id: 2,
        title: 'Nalanda Central Library Reading Hall',
        hindiTitle: 'नालंदा केंद्रीय ग्रंथालय',
        category: 'Library',
        academicYear: '2024',
        imageUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&q=80',
        description: 'Home to over 50,000 archival press editions, doctoral theses, and digital media repository.',
      ),
      MemoryModel(
        id: 3,
        title: 'Ganesh Shankar Vidyarthi Auditorium',
        hindiTitle: 'गणेश शंकर विद्यार्थी सभागार',
        category: 'Auditorium',
        academicYear: '2025',
        imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&q=80',
        description: 'Iconic 1200-seat amphitheatre hosting national convocations and cultural fests.',
      ),
    ];

    isLoading = false;
    notifyListeners();
  }
}
