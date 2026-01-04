# Network Monitoring Dependencies

## Required Packages

Add these dependencies to your `pubspec.yaml`:

```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # Network monitoring
  connectivity_plus: ^5.0.2
  internet_connection_checker: ^1.0.0+1
  
  # Existing dependencies...
  http: ^1.1.0
  # ... other dependencies
```

## Installation

Run:
```bash
flutter pub get
```

## Platform-Specific Setup

### Android
No additional setup required. The `connectivity_plus` package handles Android permissions automatically.

### iOS
Add to `ios/Runner/Info.plist`:
```xml
<key>NSLocalNetworkUsageDescription</key>
<string>This app needs network access to check connectivity</string>
```

### Web
No additional setup required.

## Notes

- `connectivity_plus`: Detects network interface changes (WiFi, mobile data, etc.)
- `internet_connection_checker`: Verifies actual internet access (not just network interface)
- Both packages work together to provide robust connectivity detection

