# Android APK Build Guide for FinanceAI

## Overview
This guide explains how to build an Android APK for the FinanceAI application. The Android app is a WebView wrapper that loads the web application and provides native mobile functionality.

## Prerequisites

### Required Software
1. **Android Studio** (Latest version recommended)
   - Download from: https://developer.android.com/studio
   - Includes Android SDK and build tools

2. **Java Development Kit (JDK) 8 or higher**
   - Android Studio typically includes this
   - Verify with: `java -version`

3. **Git** (for cloning the repository)

### Hardware Requirements
- 8GB RAM minimum (16GB recommended)
- 4GB available disk space
- Internet connection for downloading dependencies

## Project Structure

```
FinanceAI/
├── app/                               # Android app module
│   ├── src/main/
│   │   ├── AndroidManifest.xml        # App permissions and configuration
│   │   ├── java/com/financeai/app/    # Kotlin/Java source code
│   │   │   ├── MainActivity.kt        # Main WebView activity
│   │   │   └── SplashActivity.kt      # Splash screen
│   │   └── res/                       # Android resources
│   │       ├── layout/                # UI layouts
│   │       ├── values/                # Strings, colors, themes
│   │       └── mipmap-*/             # App icons
│   ├── build.gradle.kts               # App-level build configuration
│   └── proguard-rules.pro             # Code obfuscation rules
├── build.gradle.kts                   # Project-level build configuration
└── settings.gradle.kts                # Project settings
```

## Build Instructions

### Method 1: Android Studio (Recommended)

1. **Open Project**
   ```bash
   # Clone the repository
   git clone <repository-url>
   cd FinanceAI
   
   # Open Android Studio
   # File > Open > Select the FinanceAI folder
   ```

2. **Configure Project**
   - Wait for Gradle sync to complete
   - Ensure Android SDK is installed (SDK Manager > SDK Platforms)
   - Install build tools if prompted

3. **Update Configuration**
   - Open `app/src/main/java/com/financeai/app/MainActivity.kt`
   - Update the `BASE_URL` constant to your deployed web app URL:
     ```kotlin
     companion object {
         private const val BASE_URL = "https://your-app-domain.replit.app"
     }
     ```

4. **Build APK**
   - **Debug APK**: `Build > Build Bundle(s) / APK(s) > Build APK(s)`
   - **Release APK**: `Build > Generate Signed Bundle / APK`
   
   For release builds, you'll need to create a keystore:
   - `Build > Generate Signed Bundle / APK > APK`
   - Create new keystore or use existing
   - Fill in certificate details
   - Choose release build variant

### Method 2: Command Line

1. **Setup Environment**
   ```bash
   # Set ANDROID_HOME environment variable
   export ANDROID_HOME=/path/to/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
   ```

2. **Build Debug APK**
   ```bash
   cd FinanceAI
   ./gradlew assembleDebug
   ```

3. **Build Release APK**
   ```bash
   # Create keystore (first time only)
   keytool -genkey -v -keystore release-key.keystore -alias financeai -keyalg RSA -keysize 2048 -validity 10000
   
   # Build release APK
   ./gradlew assembleRelease
   ```

## APK Locations

After successful build:
- **Debug APK**: `app/build/outputs/apk/debug/app-debug.apk`
- **Release APK**: `app/build/outputs/apk/release/app-release.apk`

## Key Features

### WebView Integration
- Loads the FinanceAI web application
- Full JavaScript support for AI interactions
- File upload capability for document analysis
- Session management and authentication

### Native Android Features
- Splash screen with branding
- Pull-to-refresh functionality
- File picker integration
- Back button navigation
- Deep linking for file associations

### Security & Permissions
- Internet access for API calls
- File access for document uploads
- Camera access for document scanning
- Network state monitoring

## Configuration Options

### App Metadata
Edit `app/src/main/res/values/strings.xml`:
```xml
<string name="app_name">FinanceAI</string>
<string name="app_subtitle">Análise Financeira Inteligente</string>
```

### App Colors
Edit `app/src/main/res/values/colors.xml`:
```xml
<color name="primary_color">#6366f1</color>
<color name="secondary_color">#8b5cf6</color>
```

### Server URL
Update `MainActivity.kt`:
```kotlin
private const val BASE_URL = "https://your-domain.replit.app"
```

## Deployment

### Testing
1. Enable USB debugging on Android device
2. Connect device via USB
3. Run: `adb install app/build/outputs/apk/debug/app-debug.apk`

### Distribution
1. **Google Play Store**
   - Create Google Play Console account
   - Upload signed APK/AAB
   - Complete store listing

2. **Direct Distribution**
   - Share APK file directly
   - Users must enable "Unknown sources" in Android settings

## Troubleshooting

### Common Issues

1. **Gradle Sync Failures**
   - Check internet connection
   - Update Android Studio
   - Clean project: `Build > Clean Project`

2. **Build Errors**
   - Verify Android SDK installation
   - Check Gradle wrapper version
   - Update dependencies in `build.gradle.kts`

3. **WebView Loading Issues**
   - Verify BASE_URL is correct and accessible
   - Check network connectivity
   - Enable CORS on web server if needed

4. **File Upload Not Working**
   - Ensure permissions in AndroidManifest.xml
   - Test file picker functionality
   - Check WebView JavaScript interface

### Debug Commands
```bash
# Check connected devices
adb devices

# View app logs
adb logcat | grep FinanceAI

# Uninstall app
adb uninstall com.financeai.app

# Install APK
adb install -r app-debug.apk
```

## Performance Optimization

### APK Size Reduction
- Enable ProGuard for release builds
- Use vector drawables instead of PNGs
- Remove unused resources

### WebView Performance
- Enable hardware acceleration
- Use appropriate cache settings
- Optimize web app for mobile

## Security Considerations

### Release Builds
- Always sign release APKs
- Store keystore securely
- Use strong passwords

### Web Security
- Ensure HTTPS for all API calls
- implement proper authentication
- Validate all user inputs

## Support

For technical issues:
1. Check Android Studio logs
2. Review WebView console output
3. Test on multiple devices/Android versions
4. Consult Android documentation

## Version Management

Update version in `app/build.gradle.kts`:
```kotlin
defaultConfig {
    versionCode = 2      // Increment for each release
    versionName = "1.1.0" // Semantic versioning
}
```

This Android APK provides a native mobile experience for the FinanceAI web application while maintaining full functionality and seamless integration with the existing backend services.