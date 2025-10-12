# Screen Recording Implementation Guide

## Overview

This guide explains how to set up screen recording with audio in your React Native Expo app. The implementation captures the entire View from line 1536-1789 in Entry.tsx, including video playback and canvas drawings, along with audio recording.

## Installation Steps

### 1. Install Required Dependencies

Run the following command to install the screen recording library:

```bash
npm install react-native-record-screen
```

### 2. Link Native Dependencies (iOS)

Since you're using Expo bare workflow, you need to install CocoaPods dependencies:

```bash
cd ios
pod install
cd ..
```

### 3. Update iOS Info.plist

Add the following permissions to your `ios/golfpoc/Info.plist` file (if not already present):

```xml
<key>NSMicrophoneUsageDescription</key>
<string>Allow $(PRODUCT_NAME) to access your microphone for recording audio</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Allow $(PRODUCT_NAME) to access your photo library</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>Allow $(PRODUCT_NAME) to save recordings to your photo library</string>
```

### 4. Prebuild the App (Required after changes)

After installing new native dependencies, you need to prebuild:

```bash
npx expo prebuild --clean
```

### 5. Build and Run

For iOS:

```bash
npx expo run:ios
```

For Android:

```bash
npx expo run:android
```

## How It Works

### Architecture

1. **useScreenRecorder Hook** (`hooks/useScreenRecorder.ts`)

   - Manages screen recording state
   - Handles audio recording via expo-av
   - Uses react-native-record-screen for screen capture
   - Saves recordings to camera roll via expo-media-library

2. **Entry.tsx Integration**

   - Imports and initializes the useScreenRecorder hook
   - Passes recording state and controls to MenusControl
   - The View with `ref={imageRef}` (lines 1536-1789) is what gets recorded

3. **MenusControl Component**
   - Recording button (line 37) now toggles recording
   - Button color changes (red when recording, white when not)

### Recording Flow

1. **Start Recording**: User taps the recording button

   - Requests microphone and media library permissions
   - Starts audio recording
   - Starts screen recording at 30 FPS with 5 Mbps bitrate
   - Button turns red to indicate recording

2. **During Recording**:

   - Everything in the View is captured (videos, drawings, camera overlay)
   - Audio is recorded simultaneously
   - User can continue using the app normally

3. **Stop Recording**: User taps the recording button again
   - Stops screen recording
   - Stops audio recording
   - Saves the video to camera roll
   - Creates a "Golf POC" album (iOS only)
   - Shows success alert

## Features

- ✅ Records the entire View including:

  - Video playback (both frames)
  - Canvas drawings (paths, circles, lines, arrows, angles, rectangles)
  - Camera overlay
  - All animations and interactions

- ✅ Audio Recording:

  - High-quality audio capture
  - Microphone recording enabled
  - Audio synced with video

- ✅ Automatic Save:

  - Saves to camera roll/photo library
  - Creates custom album "Golf POC" on iOS
  - Shows success notification

- ✅ Visual Feedback:
  - Recording button changes color (red when recording)
  - State management prevents multiple recordings

## Platform Support

### iOS (Primary)

- Uses **ReplayKit** framework
- Best performance and quality
- Native screen recording
- Audio recording supported
- Album creation supported

### Android

- Uses **MediaProjection** API
- Requires user permission dialog
- Good performance
- Audio recording supported

## Customization Options

You can modify recording settings in `hooks/useScreenRecorder.ts`:

```typescript
await RecordScreen.startRecording({
	mic: true, // Enable/disable microphone
	fps: 30, // Frames per second (15, 30, 60)
	bitrate: 5000000, // Video bitrate (higher = better quality)
});
```

### Quality Presets:

- **Low Quality**: fps: 15, bitrate: 1000000
- **Medium Quality**: fps: 30, bitrate: 3000000
- **High Quality**: fps: 30, bitrate: 5000000
- **Ultra Quality**: fps: 60, bitrate: 8000000

## Troubleshooting

### Issue: "Module not found: react-native-record-screen"

**Solution**: Make sure you've installed the package and run `npx expo prebuild --clean`

### Issue: Recording doesn't save

**Solution**: Check that media library permissions are granted in Settings

### Issue: No audio in recording

**Solution**: Verify microphone permissions are granted

### Issue: App crashes on recording

**Solution**:

1. Clean build: `cd ios && rm -rf build && pod install && cd ..`
2. Rebuild: `npx expo run:ios`

### Issue: Android recording quality poor

**Solution**: Increase bitrate in the startRecording configuration

## Testing

1. Launch the app
2. Add a video to one of the frames
3. Draw some shapes on the canvas
4. Tap the recording button (should turn red)
5. Interact with the app (play video, draw more)
6. Tap the recording button again to stop
7. Check your camera roll for the saved video

## Performance Considerations

- **Memory**: Screen recording is memory-intensive. Monitor app memory usage during long recordings.
- **Battery**: Recording drains battery faster. Inform users for long sessions.
- **Storage**: High-quality recordings take significant storage space.

## Future Enhancements

Potential improvements you could add:

1. **Recording Timer**: Show recording duration in UI
2. **Recording Preview**: Preview before saving
3. **Quality Settings**: Let users choose quality
4. **Pause/Resume**: Add pause functionality (limited on iOS)
5. **Recording Indicator**: Add a pulsing red dot indicator
6. **Video Editing**: Trim recordings before saving

## API Reference

### useScreenRecorder Hook

```typescript
const {
	isRecording, // boolean - Is currently recording
	isPaused, // boolean - Is recording paused
	startRecording, // () => Promise<void> - Start recording
	stopRecording, // () => Promise<void> - Stop and save recording
	toggleRecording, // () => Promise<void> - Toggle recording on/off
	cleanup, // () => Promise<void> - Cleanup on unmount
} = useScreenRecorder();
```

## License Notes

- `react-native-record-screen`: MIT License
- Make sure to comply with app store guidelines for screen recording apps
- Inform users that you're recording their screen (privacy policies)

## Additional Resources

- [react-native-record-screen GitHub](https://github.com/Elyx0/react-native-record-screen)
- [Expo AV Documentation](https://docs.expo.dev/versions/latest/sdk/av/)
- [Expo Media Library Documentation](https://docs.expo.dev/versions/latest/sdk/media-library/)

## Support

If you encounter issues:

1. Check the console for error messages
2. Verify all permissions are granted
3. Ensure native dependencies are properly linked
4. Try cleaning and rebuilding the project
