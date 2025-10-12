# 🎬 Screen Recording - Quick Reference

## Installation (Choose One)

### Automated:

```bash
./setup-screen-recording.sh
```

### Manual:

```bash
npm install react-native-record-screen
cd ios && pod install && cd ..
npx expo prebuild --clean
npx expo run:ios
```

## Usage

**Start/Stop Recording**: Tap recording button (4th button in MenusControl)

- 🔴 Red = Recording
- ⚪ White = Not recording

## What's Recorded?

Everything in the View (lines 1536-1789):

- Videos (both frames)
- Canvas drawings
- Camera overlay
- All animations

## Files

| File                          | Purpose                |
| ----------------------------- | ---------------------- |
| `hooks/useScreenRecorder.ts`  | Recording logic        |
| `Entry.tsx`                   | Integration            |
| `components/MenusControl.tsx` | Button control         |
| `SCREEN_RECORDING_GUIDE.md`   | Full documentation     |
| `SCREEN_RECORDING_SUMMARY.md` | Implementation details |

## Settings

- **Quality**: High (30 FPS, 5 Mbps)
- **Audio**: Enabled
- **Save Location**: Camera Roll / "Golf POC" album (iOS)

## Troubleshooting

**Module not found?**

```bash
npx expo prebuild --clean
cd ios && pod install && cd ..
```

**No save?** → Check permissions in Settings

**No audio?** → Check microphone permission

## Documentation

📖 See `SCREEN_RECORDING_GUIDE.md` for complete details
📋 See `SCREEN_RECORDING_SUMMARY.md` for implementation info
