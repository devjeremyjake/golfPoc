#!/bin/bash

# Screen Recording Setup Script for Golf POC

echo "🎬 Setting up Screen Recording for Golf POC..."
echo ""

# Step 1: Install npm dependencies
echo "📦 Installing react-native-record-screen..."
npm install react-native-record-screen

if [ $? -ne 0 ]; then
    echo "❌ Failed to install npm packages"
    exit 1
fi

echo "✅ npm packages installed successfully"
echo ""

# Step 2: Install iOS Pods
echo "🍎 Installing iOS CocoaPods dependencies..."
cd ios
pod install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install CocoaPods"
    cd ..
    exit 1
fi

cd ..
echo "✅ CocoaPods installed successfully"
echo ""

# Step 3: Run prebuild
echo "🔨 Running Expo prebuild (this may take a few minutes)..."
npx expo prebuild --clean

if [ $? -ne 0 ]; then
    echo "❌ Prebuild failed"
    exit 1
fi

echo "✅ Prebuild completed successfully"
echo ""

# Final instructions
echo "✨ Setup Complete! ✨"
echo ""
echo "Next steps:"
echo "  1. Check ios/golfpoc/Info.plist for required permissions"
echo "  2. Run: npx expo run:ios (or npx expo run:android)"
echo "  3. Test the recording button in MenusControl"
echo ""
echo "For detailed information, see SCREEN_RECORDING_GUIDE.md"
