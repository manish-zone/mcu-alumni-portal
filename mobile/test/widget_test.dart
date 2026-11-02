import 'package:flutter_test/flutter_test.dart';
import 'package:mcu_alumni_app/main.dart';

void main() {
  testWidgets('App smoke test loads successfully', (WidgetTester tester) async {
    await tester.pumpWidget(const MCUAlumniApp());
    expect(find.byType(MCUAlumniApp), findsOneWidget);
  });
}
