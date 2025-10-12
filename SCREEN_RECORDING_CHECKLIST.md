# 🎬 Screen Recording Implementation Checklist

## Pre-Installation ✓

- [x] Project uses Expo bare workflow
- [x] iOS development environment set up
- [x] CocoaPods installed
- [x] expo-av already installed
- [x] expo-media-library already installed
- [x] react-native-view-shot already installed

## Installation Steps

### 1. Install Dependencies

- [ ] Run: `npm install react-native-record-screen`
- [ ] Verify installation in package.json

### 2. iOS Setup

- [ ] Navigate to ios folder: `cd ios`
- [ ] Install pods: `pod install`
- [ ] Return to root: `cd ..`
- [ ] Check for errors

### 3. Prebuild

- [ ] Run: `npx expo prebuild --clean`
- [ ] Wait for completion (may take 3-5 minutes)
- [ ] Check for errors

### 4. Verify Files Created

- [x] `hooks/useScreenRecorder.ts` exists
- [x] `types/react-native-record-screen.d.ts` exists
- [x] `Entry.tsx` updated with recording logic
- [x] `components/MenusControl.tsx` updated
- [x] `app.json` updated with media library plugin

### 5. Build and Run

- [ ] Run: `npx expo run:ios` (or android)
- [ ] App builds successfully
- [ ] App launches without errors

## Testing Checklist

### Basic Functionality

- [ ] App launches successfully
- [ ] MenusControl visible with 5 buttons
- [ ] Recording button (4th button) visible

### Permission Testing

- [ ] Tap recording button
- [ ] Microphone permission dialog appears
- [ ] Grant microphone permission
- [ ] Media library permission dialog appears
- [ ] Grant media library permission

### Recording Test - Video Only

- [ ] Add a video to frame 1
- [ ] Play the video
- [ ] Tap recording button (turns red)
- [ ] Wait 5 seconds
- [ ] Tap recording button again (turns white)
- [ ] Success alert appears
- [ ] Check Photos app for recorded video
- [ ] Video plays correctly

### Recording Test - With Drawings

- [ ] Open tools tray
- [ ] Select a drawing tool
- [ ] Draw on canvas
- [ ] Start recording (button turns red)
- [ ] Draw more shapes while recording
- [ ] Stop recording (button turns white)
- [ ] Success alert appears
- [ ] Check recorded video shows drawings

### Recording Test - With Camera

- [ ] Start recording
- [ ] Open camera overlay
- [ ] Move camera around
- [ ] Flip camera
- [ ] Stop recording
- [ ] Verify camera overlay in recorded video

### Recording Test - Full Feature

- [ ] Add video to both frames
- [ ] Draw multiple shapes
- [ ] Open camera overlay
- [ ] Start recording
- [ ] Play video
- [ ] Draw more shapes
- [ ] Move camera
- [ ] Stop recording
- [ ] Verify all elements in recording

### Audio Testing

- [ ] Start recording
- [ ] Speak into microphone
- [ ] Stop recording
- [ ] Play recorded video
- [ ] Verify audio is captured

### Edge Cases

- [ ] Start recording with empty frames
- [ ] Start/stop recording quickly (stress test)
- [ ] Record for 30+ seconds
- [ ] Check app doesn't crash
- [ ] Check memory usage is reasonable

### iOS Specific

- [ ] "Golf POC" album created in Photos
- [ ] Video saved to album
- [ ] Video thumbnail displays correctly
- [ ] Video can be shared from Photos

### Android Specific (if applicable)

- [ ] Permission dialog on first use
- [ ] Video saves to correct folder
- [ ] Video plays in Gallery app

## Troubleshooting Tests

### If Module Not Found Error

- [ ] Run: `npx expo prebuild --clean`
- [ ] Run: `cd ios && pod install && cd ..`
- [ ] Rebuild app
- [ ] Test again

### If No Audio

- [ ] Check microphone permission in Settings
- [ ] Uninstall and reinstall app
- [ ] Grant permissions again
- [ ] Test recording

### If Recording Doesn't Save

- [ ] Check media library permission
- [ ] Check available storage space
- [ ] Check Photos app
- [ ] Check "Golf POC" album

### If Button Doesn't Work

- [ ] Check console for errors
- [ ] Verify toggleRecording is connected
- [ ] Check button press handler
- [ ] Test button responds to touch

## Performance Checks

### Memory Usage

- [ ] Check baseline memory usage
- [ ] Start recording
- [ ] Monitor memory during recording
- [ ] Memory increase < 200MB
- [ ] Memory releases after stop

### Battery Impact

- [ ] Note battery level
- [ ] Record for 2 minutes
- [ ] Check battery drain
- [ ] Drain < 5% for 2 min recording

### Storage Impact

- [ ] Check available storage before
- [ ] Record 1 minute video
- [ ] Check storage after
- [ ] File size reasonable (~50-100MB/min)

### App Performance

- [ ] App remains responsive during recording
- [ ] Drawing works while recording
- [ ] Video playback smooth while recording
- [ ] No lag or stuttering

## Quality Assurance

### Video Quality

- [ ] Video is clear and sharp
- [ ] Frame rate is smooth (30 FPS)
- [ ] Colors are accurate
- [ ] Text is readable

### Audio Quality

- [ ] Audio is clear
- [ ] No distortion
- [ ] Synced with video
- [ ] Volume appropriate

### UI/UX

- [ ] Button color changes correctly
- [ ] Visual feedback is immediate
- [ ] Success alert shows
- [ ] No unexpected behaviors

## Documentation Review

- [x] SCREEN_RECORDING_GUIDE.md complete
- [x] SCREEN_RECORDING_SUMMARY.md complete
- [x] SCREEN_RECORDING_QUICK_REF.md complete
- [x] SCREEN_RECORDING_ARCHITECTURE.md complete
- [x] Type definitions created
- [x] Setup script created

## Final Checks

- [ ] All features working as expected
- [ ] No console errors
- [ ] No memory leaks
- [ ] Permissions handled gracefully
- [ ] Error messages are helpful
- [ ] Recording saves reliably
- [ ] App stable during extended use

## Sign Off

- [ ] Installation complete
- [ ] All tests passed
- [ ] Documentation reviewed
- [ ] Ready for production use

---

## Notes Section

Use this space for any issues encountered or special observations:

```
Date: __________
Tested by: __________

Issues found:


Resolutions:


Performance notes:


Additional comments:


```

---

## Quick Commands Reference

**Install:**

```bash
npm install react-native-record-screen
cd ios && pod install && cd ..
npx expo prebuild --clean
```

**Build:**

```bash
npx expo run:ios
```

**Clean Build:**

```bash
cd ios && rm -rf build && pod install && cd ..
npx expo run:ios
```

**Check Permissions:**

- iOS Settings → App Name → Check Microphone & Photos

**View Logs:**

```bash
npx expo start
```

---

**Checklist Version:** 1.0
**Last Updated:** 2025-10-12
