# Share Feature Setup

## Flutter Dependencies

Add the following dependency to your `pubspec.yaml`:

```yaml
dependencies:
  url_launcher: ^6.2.0
```

Then run:
```bash
flutter pub get
```

## Android Configuration

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<queries>
  <package android:name="com.whatsapp" />
  <package android:name="org.telegram.messenger" />
  <intent>
    <action android:name="android.intent.action.SEND" />
    <data android:mimeType="text/plain" />
  </intent>
</queries>
```

## iOS Configuration

Add to `ios/Runner/Info.plist`:

```xml
<key>LSApplicationQueriesSchemes</key>
<array>
  <string>whatsapp</string>
  <string>tg</string>
  <string>telegram</string>
</array>
```

## Features

- ✅ Share via WhatsApp
- ✅ Share via Telegram  
- ✅ Share via system share sheet
- ✅ Beautiful bottom sheet UI
- ✅ Real-time job data sharing

