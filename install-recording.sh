#!/bin/bash

# Quick Install Command for Screen Recording
# Run this to install everything in one go

echo "🎬 Installing Screen Recording..."
npm install react-native-record-screen && \
cd ios && \
pod install && \
cd .. && \
npx expo prebuild --clean && \
echo "✅ Installation complete! Now run: npx expo run:ios"
