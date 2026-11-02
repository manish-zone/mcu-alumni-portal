import 'package:flutter/foundation.dart';
import '../core/network/api_client.dart';
import '../models/event_model.dart';

class EventsProvider extends ChangeNotifier {
  final ApiClient _api = ApiClient();

  List<EventModel> events = [];
  bool isLoading = false;

  EventsProvider() {
    fetchEvents();
  }

  Future<void> fetchEvents() async {
    isLoading = true;
    notifyListeners();

    try {
      final res = await _api.get('/events');
      if (res.statusCode == 200 && res.data != null) {
        final List list;
        if (res.data is List) {
          list = res.data;
        } else if (res.data is Map && res.data['events'] is List) {
          list = res.data['events'];
        } else {
          list = [];
        }

        if (list.isNotEmpty) {
          events = list.map((e) => EventModel.fromJson(Map<String, dynamic>.from(e))).toList();
          isLoading = false;
          notifyListeners();
          return;
        }
      }
    } catch (_) {}

    events = [
      EventModel(
        id: 1,
        title: 'Abhyuday 2026: 35th National Alumni Conclave',
        hindiTitle: 'अभ्युदय 2026: 35वां राष्ट्रीय पूर्व छात्र महाकुंभ',
        category: 'Annual Flagship',
        eventDate: 'November 28, 2026 • 10:00 AM IST',
        venue: 'Ganesh Shankar Vidyarthi Auditorium, MCU Bhopal',
        campusName: 'Bhopal Main Campus',
        description:
            'Join over 2,500 MCU alumni leaders across India and abroad for a day of panel keynotes, lifetime achievement honours, and networking.',
        bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
        totalSeats: 2500,
        rsvpCount: 840,
        badgeText: 'National Conclave • Open RSVP',
        organizerName: 'MCU Alumni & Academic Council',
      ),
      EventModel(
        id: 2,
        title: 'Media-Tech & Generative AI Masterclass',
        hindiTitle: 'मीडिया-टेक एवं जनरेटिव एआई कार्यशाला',
        category: 'Masterclass',
        eventDate: 'December 12, 2026 • 02:30 PM IST',
        venue: 'Virtual Livestream & MCU Digital Lab',
        campusName: 'Bhopal Main Campus',
        description:
            'Hands-on workshop led by alumni tech directors on leveraging AI tools for investigative journalism, automated video editing, and data integrity.',
        bannerUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80',
        totalSeats: 500,
        rsvpCount: 310,
        badgeText: 'Virtual & In-person',
        organizerName: 'Faculty of Computer Applications & IT',
      ),
    ];

    isLoading = false;
    notifyListeners();
  }
}
