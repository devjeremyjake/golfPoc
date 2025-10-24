import { NativeModule, requireNativeModule } from 'expo';

import { ScreenRecorderModuleEvents } from './ScreenRecorder.types';

declare class ScreenRecorderModule extends NativeModule<ScreenRecorderModuleEvents> {
	PI: number;
	hello(): string;
	setValueAsync(value: string): Promise<void>;
	startRecording: () => void;
	stopRecording: () => void;
	startStopRecording: () => void;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ScreenRecorderModule>('ScreenRecorder');
