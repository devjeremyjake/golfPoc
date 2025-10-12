declare module 'react-native-record-screen' {
	export interface RecordingOptions {
		/**
		 * Enable microphone audio recording
		 * @default false
		 */
		mic?: boolean;

		/**
		 * Frames per second for recording
		 * @default 30
		 */
		fps?: number;

		/**
		 * Video bitrate (higher = better quality)
		 * @default 5000000
		 */
		bitrate?: number;

		/**
		 * Video output path (optional)
		 */
		outputPath?: string;
	}

	/**
	 * Start screen recording
	 * @param options Recording configuration options
	 * @returns Promise that resolves when recording starts
	 */
	export function startRecording(options?: RecordingOptions): Promise<void>;

	/**
	 * Stop screen recording
	 * @returns Promise that resolves with the video file URI
	 */
	export function stopRecording(): Promise<string>;

	/**
	 * Clean up recording resources
	 * @returns Promise that resolves when cleanup is complete
	 */
	export function clean(): Promise<void>;

	const RecordScreen: {
		startRecording: typeof startRecording;
		stopRecording: typeof stopRecording;
		clean: typeof clean;
	};

	export default RecordScreen;
}
