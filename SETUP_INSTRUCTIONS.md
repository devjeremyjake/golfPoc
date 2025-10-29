# Setup Instructions

## Building the App with Screen Recording

### Prerequisites

- Node.js and npm installed
- Xcode (for iOS)
- Android Studio (for Android)
- CocoaPods installed (`sudo gem install cocoapods`)

## iOS Setup

1. **Install iOS dependencies**:

```bash
cd ios
pod install
cd ..
```

2. **Open Xcode project**:

```bash
open ios/golfpoc.xcworkspace
```

3. **Build and run**:

```bash
npm run ios
```

**Note**: The compile errors you see in VS Code for iOS files are normal - they'll resolve once `pod install` is run, as it installs the React Native dependencies.

## Android Setup

1. **Clean and rebuild**:

```bash
cd android
./gradlew clean
cd ..
```

2. **Build and run**:

```bash
npm run android
```

## Testing the Screen Recording

1. **Start the app** on a physical device (simulators have limited recording support)

2. **Grant permissions** when prompted:

   - Android: Screen capture permission dialog will appear when you start recording
   - iOS: Microphone permission will be requested
   - Both: Storage/Photos permissions

3. **Test recording**:
   - Tap the record button in your app
   - Record some video playback and drawings
   - Stop recording
   - Check your device gallery/Photos for the saved video

## Troubleshooting

### iOS Errors During Development

If you see import errors in VS Code for iOS files:

- These are expected and will resolve after `pod install`
- The files will compile correctly when building

### Android Build Issues

If you encounter build errors:

```bash
cd android
./gradlew clean
rm -rf .gradle
cd ..
rm -rf node_modules
npm install
cd android
./gradlew clean
```

### Recording Not Working

- **Android**: Ensure you grant the screen capture permission in the system dialog
- **iOS**: Check that microphone permission is granted in Settings
- **Both**: Test on physical devices, not simulators

### Module Not Found

If you get "ScreenRecorder module not found":

- **Android**: Verify `ScreenRecorderPackage` is added to `MainApplication.kt`
- **iOS**: Run `pod install` and rebuild
- **Both**: Try cleaning and rebuilding

## Adjusting Crop Parameters

To change the areas that are cropped from the recording, edit `Entry.tsx`:

```typescript
const handleStart = async () => {
	// Adjust these values based on your UI layout
	const cropTop = 80; // Height to crop from top (in pixels)
	const cropBottom = 180; // Height to crop from bottom (in pixels)

	await ScreenRecorder.startRecording(cropTop, cropBottom);
	// ...
};
```

Measure your header and footer menu heights to set appropriate values.

## First Build Checklist

- [ ] Run `npm install` in project root
- [ ] Run `pod install` in ios directory
- [ ] Clean Android build (`./gradlew clean`)
- [ ] Test on physical Android device
- [ ] Test on physical iOS device
- [ ] Verify permissions are granted
- [ ] Check that videos save to gallery
- [ ] Verify audio is recorded
- [ ] Test that VideoView content is captured (no black screens)

## Known First-Time Issues

1. **iOS Bridging Header Errors**: Normal until `pod install` is run
2. **Android Package Not Found**: Clean and rebuild
3. **Permission Denied**: Grant permissions in device settings
4. **Black Screen Still Occurring**: This was the old issue with view.draw() - the new implementation should capture VideoView correctly

## Support

Refer to:

- `SCREEN_RECORDING_DOCS.md` - Detailed documentation
- `IMPLEMENTATION_SUMMARY.md` - Implementation overview
