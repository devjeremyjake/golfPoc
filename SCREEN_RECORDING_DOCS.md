# Screen Recording Implementation - Documentation

## Overview

This implementation uses native screen recording APIs to capture the full screen including VideoView content, with audio recording and the ability to crop menu areas.

## Platform Implementations

### Android (MediaProjection API)

- **API Used**: MediaProjection API (API 21+)
- **Location**: `modules/screen-recorder/android/src/main/java/com/screenrecorder/`
- **Key Features**:
  - Full screen capture including VideoView surfaces
  - Simultaneous audio recording from microphone
  - Video encoding with H.264 codec
  - Audio encoding with AAC codec
  - Muxing video and audio into MP4 container
  - Configurable crop parameters (top and bottom)

### iOS (ReplayKit)

- **API Used**: ReplayKit (iOS 9.0+)
- **Location**: `modules/screen-recorder/ios/`
- **Key Features**:
  - Full screen capture including all views
  - Microphone audio capture
  - H.264 video encoding
  - AAC audio encoding
  - Automatic save to Photos library
  - Configurable crop parameters

## How It Works

### Flow

1. **Permission Request**: App requests necessary permissions (screen recording, audio, storage)
2. **Start Recording**:
   - Android: System permission dialog appears for screen capture
   - iOS: User may see ReplayKit permission dialog
   - Crop parameters (top/bottom heights) are passed to native modules
3. **Recording**: Full screen is captured, audio is recorded, both are encoded and muxed
4. **Stop Recording**: Recording stops, file is saved to device storage/gallery

### Cropping

The implementation accepts two parameters:

- `cropTop`: Height in pixels to crop from the top (menu area)
- `cropBottom`: Height in pixels to crop from the bottom (controls area)

**Current values in Entry.tsx:**

- Top: 80 pixels (header menu)
- Bottom: 180 pixels (video controls)

You can adjust these values based on your UI layout.

## Limitations & Considerations

### Android Limitations

1. **MediaProjection Permission Dialog**

   - Users must grant permission via system dialog on each recording session
   - Cannot be bypassed due to Android security requirements
   - The dialog appears every time `startRecording()` is called

2. **Performance**

   - High-resolution screens may impact performance
   - Default bitrate: 6 Mbps (adjustable in `ScreenRecorderModule.kt`)
   - Default frame rate: 30 fps

3. **Audio Recording**

   - Only captures microphone audio (not system/internal audio)
   - System audio capture requires AUDIO_PLAYBACK_CAPTURE (Android 10+) with additional restrictions
   - Internal audio recording has many limitations and app restrictions

4. **Crop Implementation**

   - Current Android implementation records full screen
   - Post-processing crop would require additional video processing library
   - For true cropping, consider using FFmpeg or similar

5. **File Size**

   - MP4 files can become large with extended recordings
   - Consider implementing file size limits or compression options

6. **Battery Usage**
   - Screen recording is power-intensive
   - Consider warning users or implementing time limits

### iOS Limitations

1. **ReplayKit Restrictions**

   - Cannot record during certain system operations
   - Some apps/content may be blocked from recording (DRM content)
   - Recording indicator appears in status bar (cannot be hidden)

2. **Audio Capture**

   - Only captures microphone audio
   - System audio requires separate ReplayKit broadcast extension (complex setup)
   - Cannot capture both mic and system audio simultaneously without extension

3. **Crop Implementation**

   - Current iOS implementation records full screen
   - Real-time cropping requires Core Image processing (performance impact)
   - Post-processing crop recommended using AVFoundation

4. **Performance**

   - Screen recording can cause frame drops on older devices
   - Retina displays produce large file sizes
   - Consider quality/resolution settings for older devices

5. **Background Recording**

   - ReplayKit stops when app goes to background
   - Cannot record when screen is locked

6. **File Access**
   - Recordings saved to Photos library require permission
   - File is saved locally first, then copied to Photos
   - Consider implementing local file management

### General Limitations

1. **React Native Bridge Overhead**

   - Some latency when starting/stopping recording
   - Not suitable for real-time synchronized operations

2. **Platform Differences**

   - Android and iOS have different recording behaviors
   - File formats may vary slightly
   - Audio quality settings differ between platforms

3. **Testing Requirements**

   - Must test on physical devices
   - Simulators/emulators have limited recording support
   - Test on various screen sizes and resolutions

4. **Storage Management**
   - No automatic cleanup of old recordings
   - Consider implementing storage management
   - Monitor available storage before recording

## Future Improvements

### Recommended Enhancements

1. **Post-Recording Crop**

   - Use FFmpeg to crop video after recording
   - More reliable than real-time cropping
   - Can be done in background

2. **Quality Settings**

   - Add user-configurable quality presets
   - Adaptive bitrate based on device capabilities
   - Resolution options (720p, 1080p, 4K)

3. **File Management**

   - Implement recording history
   - Auto-delete old recordings
   - Cloud backup integration

4. **Progress Indicators**

   - Recording duration display
   - File size estimation
   - Storage space warnings

5. **Advanced Features**
   - Pause/resume recording (requires buffer management)
   - Watermark overlay
   - Drawing overlay capture (currently captured by default)
   - Multiple video format exports

## Usage Example

```typescript
import ScreenRecorder from './modules/screen-recorder';

// Request permissions (call once on app start)
await ScreenRecorder.requestPermissions();

// Start recording with crop
const cropTop = 80; // pixels to crop from top
const cropBottom = 180; // pixels to crop from bottom
await ScreenRecorder.startRecording(cropTop, cropBottom);

// Check if recording
const isActive = await ScreenRecorder.isRecordingActive();

// Stop recording
await ScreenRecorder.stopRecording();
```

## Troubleshooting

### Android Issues

- **Black screen in recording**: Ensure FOREGROUND_SERVICE permission is granted
- **No audio**: Check RECORD_AUDIO permission
- **Crash on stop**: Ensure proper cleanup order (audio → video → muxer)

### iOS Issues

- **Recording not starting**: Check ReplayKit availability on device
- **No audio**: Verify microphone permissions
- **File not saving**: Check Photos library permissions

## Build Requirements

### Android

- Minimum SDK: 21 (Android 5.0)
- Target SDK: 34+
- Required permissions in AndroidManifest.xml (already added)

### iOS

- Minimum iOS: 11.0
- Required frameworks: ReplayKit, AVFoundation, Photos
- Required permissions in Info.plist (already added)

## Performance Tips

1. **Reduce Resolution**: Consider scaling down for better performance
2. **Lower Bitrate**: Reduce bitrate for smaller files (trade-off: quality)
3. **Limit Duration**: Implement maximum recording duration
4. **Monitor Memory**: Screen recording uses significant memory
5. **Test on Low-End Devices**: Ensure acceptable performance on minimum spec devices

## Known Issues

1. **Android**: MediaProjection dialog cannot be suppressed
2. **iOS**: Recording indicator in status bar cannot be hidden
3. **Both**: System audio capture not implemented (complex requirements)
4. **Both**: Real-time cropping not implemented (performance concerns)

## Support

For issues or questions about the screen recording implementation, refer to:

- Android: [MediaProjection API Documentation](https://developer.android.com/reference/android/media/projection/MediaProjection)
- iOS: [ReplayKit Documentation](https://developer.apple.com/documentation/replaykit)
