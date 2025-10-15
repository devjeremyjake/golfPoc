// ViewRecorder.tsx - Native Module Bridge for View Recording

import { File } from 'expo-file-system';
import * as LegacyFileSystem from 'expo-file-system/legacy';
import { findNodeHandle, NativeModules, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

const { ViewRecorderModule } = NativeModules;

export interface RecordingResult {
	success: boolean;
	videoPath?: string;
	error?: string;
}

class ViewRecorder {
	private isRecording: boolean = false;
	// Fallback state (JS capture)
	private fallbackFrames: string[] = [];
	private fallbackInterval: any = null;

	/**
	 * Start recording a specific view with audio
	 * @param viewRef - Reference to the React Native view to record
	 * @returns Promise with recording result
	 */
	async startRecording(viewRef: View | null): Promise<RecordingResult> {
		if (this.isRecording) {
			throw new Error('Recording is already in progress');
		}

		if (!viewRef) {
			console.error('ViewRecorder: View reference is null');
			throw new Error('View reference is null');
		}

		console.log('ViewRecorder: viewRef:', viewRef);

		const viewTag = findNodeHandle(viewRef);
		console.log('ViewRecorder: viewTag:', viewTag);

		if (!viewTag) {
			console.error('ViewRecorder: Could not find view handle');
			throw new Error('Could not find view handle');
		}

		try {
			console.log('ViewRecorder: Calling native module with viewTag:', viewTag);
			const result = await ViewRecorderModule.startRecording(viewTag);
			console.log('ViewRecorder: Native module result:', result);
			this.isRecording = true;
			return result;
		} catch (error: any) {
			console.warn(
				'ViewRecorder: Native startRecording failed, attempting JS fallback:',
				error?.message || error
			);
			// If UIManager isn't available (likely running in Expo Go or Fabric mismatch), fallback to JS capture
			if (
				error &&
				(error.message?.includes('UIManager is not available') ||
					error.code === 'UI_MANAGER_NULL')
			) {
				// Start a lightweight JS capture loop (captures frames as images to cache)
				this.fallbackFrames = [];
				this.fallbackInterval = setInterval(async () => {
					try {
						const uri = await captureRef(viewRef, {
							format: 'png',
							quality: 0.8,
						});
						this.fallbackFrames.push(uri);
						console.log('ViewRecorder: captured fallback frame', uri);
					} catch (e) {
						console.warn('ViewRecorder: fallback capture error', e);
					}
				}, 200); // ~5 fps

				this.isRecording = true;
				return { success: true };
			}

			console.error('ViewRecorder: Error starting view recording:', error);
			throw error;
		}
	}

	/**
	 * Stop the current recording and return the video path
	 * @returns Promise with the video file path
	 */
	async stopRecording(): Promise<string> {
		if (!this.isRecording) {
			throw new Error('No recording in progress');
		}

		try {
			// Try native stop first
			try {
				const result = await ViewRecorderModule.stopRecording();
				this.isRecording = false;
				if (result.success && result.videoPath) {
					return result.videoPath;
				} else {
					return Promise.reject(new Error('Failed to stop native recording'));
				}
			} catch (nativeStopError) {
				// If native stop failed because native wasn't available, try JS fallback consolidation
				if (this.fallbackInterval) {
					clearInterval(this.fallbackInterval as any);
					this.fallbackInterval = null;
				}
				if (this.fallbackFrames.length > 0) {
					// Save frames list to a JSON file as a simple artifact and return path
					const cacheDir =
						LegacyFileSystem.cacheDirectory ||
						LegacyFileSystem.documentDirectory ||
						'';
					const dir = cacheDir + 'viewrec_fallback/';
					await LegacyFileSystem.makeDirectoryAsync(dir, {
						intermediates: true,
					}).catch(() => {});
					const out = dir + `frames_${Date.now()}.json`;

					// Use new File API instead of deprecated writeAsStringAsync
					const file = new File(out);
					await file.create();
					await file.write(JSON.stringify(this.fallbackFrames));

					this.isRecording = false;
					return out;
				}
				this.isRecording = false;
				throw nativeStopError;
			}
		} catch (error) {
			this.isRecording = false;
			console.error('Error stopping view recording:', error);
			throw error;
		}
	}

	/**
	 * Check if currently recording
	 */
	getIsRecording(): boolean {
		return this.isRecording;
	}
}

export const viewRecorder = new ViewRecorder();
