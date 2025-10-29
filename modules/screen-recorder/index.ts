import { NativeModules, Platform } from 'react-native';

const LINKING_ERROR =
	`The package 'screen-recorder' doesn't seem to be linked. Make sure: \n\n` +
	Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
	'- You rebuilt the app after installing the package\n' +
	'- You are not using Expo Go\n';

const ScreenRecorderModule = NativeModules.ScreenRecorder
	? NativeModules.ScreenRecorder
	: new Proxy(
			{},
			{
				get() {
					throw new Error(LINKING_ERROR);
				},
			}
	  );

export interface ScreenRecorderInterface {
	/**
	 * Request necessary permissions for screen recording and audio
	 * @returns Promise<boolean> - true if all permissions granted
	 */
	requestPermissions(): Promise<boolean>;

	/**
	 * Start screen recording with optional cropping
	 * @param cropTopHeight - Height in pixels to crop from top (menu area)
	 * @param cropBottomHeight - Height in pixels to crop from bottom (controls area)
	 * @returns Promise<boolean> - true if recording started successfully
	 */
	startRecording(
		cropTopHeight: number,
		cropBottomHeight: number
	): Promise<boolean>;

	/**
	 * Stop the current recording
	 * @returns Promise<boolean> - true if recording stopped successfully
	 */
	stopRecording(): Promise<boolean>;

	/**
	 * Check if recording is currently active
	 * @returns Promise<boolean> - true if recording is active
	 */
	isRecordingActive(): Promise<boolean>;
}

const ScreenRecorder: ScreenRecorderInterface = {
	requestPermissions: () => ScreenRecorderModule.requestPermissions(),
	startRecording: (cropTopHeight: number, cropBottomHeight: number) =>
		ScreenRecorderModule.startRecording(cropTopHeight, cropBottomHeight),
	stopRecording: () => ScreenRecorderModule.stopRecording(),
	isRecordingActive: () => ScreenRecorderModule.isRecordingActive(),
};

export default ScreenRecorder;
