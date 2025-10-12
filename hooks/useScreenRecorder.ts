import { Audio } from 'expo-av';
import * as MediaLibrary from 'expo-media-library';
import { useCallback, useRef, useState } from 'react';
import { Platform } from 'react-native';
// @ts-ignore
import RecordScreen from 'react-native-record-screen';

export const useScreenRecorder = () => {
	const [isRecording, setIsRecording] = useState(false);
	const [isPaused, setIsPaused] = useState(false);
	const audioRecording = useRef<Audio.Recording | null>(null);
	const videoUri = useRef<string | null>(null);

	// Start screen recording with audio
	const startRecording = useCallback(async () => {
		try {
			// Request permissions
			const { status: audioStatus } = await Audio.requestPermissionsAsync();
			const { status: mediaLibraryStatus } =
				await MediaLibrary.requestPermissionsAsync();

			if (audioStatus !== 'granted' || mediaLibraryStatus !== 'granted') {
				alert('Permissions required for recording!');
				return;
			}

			// Configure audio settings for recording
			await Audio.setAudioModeAsync({
				allowsRecordingIOS: true,
				playsInSilentModeIOS: true,
				staysActiveInBackground: true,
				shouldDuckAndroid: true,
				playThroughEarpieceAndroid: false,
			});

			// Start audio recording
			const { recording } = await Audio.Recording.createAsync(
				Audio.RecordingOptionsPresets.HIGH_QUALITY
			);
			audioRecording.current = recording;

			// Start screen recording (iOS uses ReplayKit, Android uses MediaProjection)
			await RecordScreen.startRecording({
				mic: true, // Enable microphone
				fps: 30, // Frames per second
				bitrate: 5000000, // 5 Mbps for good quality
			}).catch((error: any) => {
				console.error('Screen recording error:', error);
				throw error;
			});

			setIsRecording(true);
			setIsPaused(false);
			console.log('Recording started successfully');
		} catch (error) {
			console.error('Failed to start recording:', error);
			alert('Failed to start recording: ' + error);
		}
	}, []);

	// Stop screen recording and save to camera roll
	const stopRecording = useCallback(async () => {
		try {
			if (!isRecording) return;

			// Stop screen recording
			const videoUrl = await RecordScreen.stopRecording().catch(
				(error: any) => {
					console.error('Error stopping screen recording:', error);
					return null;
				}
			);

			// Stop audio recording
			if (audioRecording.current) {
				await audioRecording.current.stopAndUnloadAsync();
				await Audio.setAudioModeAsync({
					allowsRecordingIOS: false,
				});
			}

			setIsRecording(false);
			setIsPaused(false);

			// Save video to camera roll
			if (videoUrl) {
				videoUri.current = videoUrl;

				// Save to media library
				const asset = await MediaLibrary.createAssetAsync(videoUrl);

				if (Platform.OS === 'ios') {
					// Create album if it doesn't exist
					const album = await MediaLibrary.getAlbumAsync('Golf POC');
					if (album == null) {
						await MediaLibrary.createAlbumAsync('Golf POC', asset, false);
					} else {
						await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
					}
				}

				alert('Recording saved to camera roll!');
				console.log('Recording saved:', videoUrl);
				return videoUrl;
			}
		} catch (error) {
			console.error('Failed to stop recording:', error);
			alert('Failed to save recording: ' + error);
		}
	}, [isRecording]);

	// Pause recording (if supported)
	const pauseRecording = useCallback(async () => {
		try {
			if (isRecording && !isPaused) {
				// Pause audio
				if (audioRecording.current) {
					await audioRecording.current.pauseAsync();
				}

				// Note: react-native-record-screen doesn't support pause on iOS
				// This is a limitation of ReplayKit
				setIsPaused(true);
				console.log('Recording paused');
			}
		} catch (error) {
			console.error('Failed to pause recording:', error);
		}
	}, [isRecording, isPaused]);

	// Resume recording (if supported)
	const resumeRecording = useCallback(async () => {
		try {
			if (isRecording && isPaused) {
				// Resume audio
				if (audioRecording.current) {
					await audioRecording.current.startAsync();
				}

				setIsPaused(false);
				console.log('Recording resumed');
			}
		} catch (error) {
			console.error('Failed to resume recording:', error);
		}
	}, [isRecording, isPaused]);

	// Toggle recording on/off
	const toggleRecording = useCallback(async () => {
		if (isRecording) {
			await stopRecording();
		} else {
			await startRecording();
		}
	}, [isRecording, startRecording, stopRecording]);

	// Clean up on unmount
	const cleanup = useCallback(async () => {
		if (isRecording) {
			await stopRecording();
		}
	}, [isRecording, stopRecording]);

	return {
		isRecording,
		isPaused,
		startRecording,
		stopRecording,
		pauseRecording,
		resumeRecording,
		toggleRecording,
		cleanup,
	};
};
