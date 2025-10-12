# Screen Recording Architecture

## Component Flow

```
┌─────────────────────────────────────────────────────────────┐
│                         Entry.tsx                            │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  useScreenRecorder Hook                             │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │ - isRecording: boolean                        │  │    │
│  │  │ - isPaused: boolean                          │  │    │
│  │  │ - startRecording(): Promise<void>            │  │    │
│  │  │ - stopRecording(): Promise<void>             │  │    │
│  │  │ - toggleRecording(): Promise<void>           │  │    │
│  │  │ - cleanup(): Promise<void>                   │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────┘    │
│                           │                                  │
│                           │ Props                            │
│                           ▼                                  │
│  ┌────────────────────────────────────────────────────┐    │
│  │          MenusControl Component                     │    │
│  │                                                      │    │
│  │  [+] [⊞] [📷] [🔴] [⋮]                             │    │
│  │              ↑                                       │    │
│  │         Recording Button                             │    │
│  │    (Line 37 - 4th button)                           │    │
│  │                                                      │    │
│  │  onClick → toggleRecording()                        │    │
│  │  color → isRecording ? red : white                  │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │     View (ref={imageRef}) - Lines 1536-1789        │    │
│  │                                                      │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │  Video Frames                                 │  │    │
│  │  │  ┌──────────┐  ┌──────────┐                  │  │    │
│  │  │  │ Frame 1  │  │ Frame 2  │                  │  │    │
│  │  │  │ VideoView│  │ VideoView│                  │  │    │
│  │  │  └──────────┘  └──────────┘                  │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  │                                                      │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │  Canvas Overlay (SVG)                        │  │    │
│  │  │  - Paths, Circles, Lines                     │  │    │
│  │  │  - Arrows, Angles, Rectangles                │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  │                                                      │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │  Camera Tray (Optional)                      │  │    │
│  │  │  - CameraView                                │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Recording Process Flow

```
┌──────────────┐
│ User Action  │
│ (Tap Button) │
└──────┬───────┘
       │
       ▼
┌─────────────────────┐
│ toggleRecording()   │
│ called              │
└──────┬──────────────┘
       │
       ▼
   ┌───────────────┐
   │ isRecording?  │
   └───┬───────┬───┘
       │       │
   No  │       │  Yes
       │       │
       ▼       ▼
┌──────────┐ ┌──────────┐
│  Start   │ │   Stop   │
│Recording │ │Recording │
└────┬─────┘ └────┬─────┘
     │            │
     ▼            ▼
┌─────────────────────────────┐  ┌─────────────────────────┐
│ 1. Request Permissions      │  │ 1. Stop Screen Record   │
│ 2. Start Audio Recording    │  │ 2. Stop Audio Recording │
│ 3. Start Screen Recording   │  │ 3. Save to Camera Roll  │
│ 4. Set isRecording = true   │  │ 4. Set isRecording=false│
│ 5. Button turns RED         │  │ 5. Button turns WHITE   │
└─────────────────────────────┘  │ 6. Show Success Alert   │
                                 └─────────────────────────┘
```

## Data Flow

```
┌──────────────────────────────────────────────────────────┐
│                  Native Layer                             │
│                                                           │
│  ┌─────────────────┐        ┌─────────────────┐         │
│  │   iOS ReplayKit │        │  expo-av Audio  │         │
│  │  (Screen Record)│        │   (Microphone)  │         │
│  └────────┬────────┘        └────────┬────────┘         │
│           │                          │                   │
└───────────┼──────────────────────────┼───────────────────┘
            │                          │
            │                          │
┌───────────┼──────────────────────────┼───────────────────┐
│           │   JavaScript Layer       │                   │
│           │                          │                   │
│  ┌────────▼────────┐        ┌────────▼────────┐         │
│  │ react-native-   │        │   Audio.        │         │
│  │ record-screen   │        │   Recording     │         │
│  └────────┬────────┘        └────────┬────────┘         │
│           │                          │                   │
│           └──────────┬───────────────┘                   │
│                      │                                   │
│           ┌──────────▼──────────┐                        │
│           │  useScreenRecorder  │                        │
│           │       Hook          │                        │
│           └──────────┬──────────┘                        │
│                      │                                   │
│           ┌──────────▼──────────┐                        │
│           │     Entry.tsx       │                        │
│           │   (Integration)     │                        │
│           └──────────┬──────────┘                        │
│                      │                                   │
│           ┌──────────▼──────────┐                        │
│           │   MenusControl.tsx  │                        │
│           │  (UI Button)        │                        │
│           └─────────────────────┘                        │
│                                                           │
└───────────────────────────────────────────────────────────┘
            │
            │ Save
            ▼
┌───────────────────────────────────────────────────────────┐
│                    Storage Layer                          │
│                                                            │
│  ┌─────────────────┐        ┌─────────────────┐          │
│  │  Camera Roll /  │◄───────│ expo-media-     │          │
│  │  Photo Library  │        │   library       │          │
│  │  "Golf POC"     │        │                 │          │
│  └─────────────────┘        └─────────────────┘          │
└───────────────────────────────────────────────────────────┘
```

## State Management

```
┌────────────────────────────────────────┐
│         useScreenRecorder State        │
├────────────────────────────────────────┤
│                                        │
│  isRecording: false ──────────┐       │
│                                │       │
│  ┌──────────────┐             │       │
│  │ Start Button │             │       │
│  │   Pressed    │             │       │
│  └──────┬───────┘             │       │
│         │                     │       │
│         ▼                     │       │
│  isRecording: true ◄──────────┘       │
│         │                             │
│         │ (Recording Active)          │
│         │                             │
│  ┌──────▼───────┐                     │
│  │ Stop Button  │                     │
│  │   Pressed    │                     │
│  └──────┬───────┘                     │
│         │                             │
│         ▼                             │
│  isRecording: false                   │
│                                        │
└────────────────────────────────────────┘
```

## File Structure

```
golfpoc/
│
├── hooks/
│   └── useScreenRecorder.ts ────► Recording logic & state management
│
├── components/
│   ├── MenusControl.tsx ────────► Recording button (line 37)
│   └── VideoControl.tsx
│
├── Entry.tsx ───────────────────► Main component with View to record
│
├── types/
│   └── react-native-record-screen.d.ts ──► TypeScript definitions
│
├── app.json ────────────────────► Expo config with permissions
│
└── Documentation/
    ├── SCREEN_RECORDING_GUIDE.md ──────► Full setup guide
    ├── SCREEN_RECORDING_SUMMARY.md ────► Implementation details
    ├── SCREEN_RECORDING_QUICK_REF.md ──► Quick reference
    └── SCREEN_RECORDING_ARCHITECTURE.md ► This file
```

## Permission Flow

```
┌─────────────────┐
│  App Launches   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│ User Taps Recording Button │
└────────┬────────────────────┘
         │
         ▼
┌───────────────────────────────────┐
│ Check: Microphone Permission?     │
└────┬─────────────────────┬────────┘
     │ No                  │ Yes
     ▼                     │
┌────────────────┐         │
│ Request        │         │
│ Permission     │         │
└────┬───────────┘         │
     │                     │
     └────────┬────────────┘
              │
              ▼
┌───────────────────────────────────┐
│ Check: Media Library Permission?  │
└────┬─────────────────────┬────────┘
     │ No                  │ Yes
     ▼                     │
┌────────────────┐         │
│ Request        │         │
│ Permission     │         │
└────┬───────────┘         │
     │                     │
     └────────┬────────────┘
              │
              ▼
┌───────────────────────────┐
│ All Permissions Granted?  │
└────┬─────────────┬────────┘
     │ No          │ Yes
     ▼             ▼
┌──────────┐  ┌─────────────┐
│ Show     │  │ Start       │
│ Alert    │  │ Recording   │
└──────────┘  └─────────────┘
```

## Technical Stack

```
┌─────────────────────────────────────────┐
│           Technology Stack              │
├─────────────────────────────────────────┤
│                                         │
│  Frontend Framework:                    │
│  └─ React Native (Expo)                │
│                                         │
│  Screen Recording:                      │
│  └─ react-native-record-screen         │
│     └─ iOS: ReplayKit                  │
│     └─ Android: MediaProjection        │
│                                         │
│  Audio Recording:                       │
│  └─ expo-av                            │
│                                         │
│  Media Storage:                         │
│  └─ expo-media-library                 │
│                                         │
│  State Management:                      │
│  └─ React Hooks (useState, useCallback)│
│                                         │
│  Video Processing:                      │
│  └─ Native iOS/Android APIs            │
│                                         │
└─────────────────────────────────────────┘
```
