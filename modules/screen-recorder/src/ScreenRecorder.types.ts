import type { StyleProp, ViewStyle } from 'react-native';

export type OnLoadEventPayload = {
	url: string;
};

export type RecordingStatePayload = {
	isRecording: boolean;
};

export type ScreenRecorderModuleEvents = {
	onChange: (params: ChangeEventPayload) => void;
	onRecordingStateChange: (params: RecordingStatePayload) => void;
};

export type ChangeEventPayload = {
	value: string;
};

export type ScreenRecorderViewProps = {
	url: string;
	onLoad: (event: { nativeEvent: OnLoadEventPayload }) => void;
	style?: StyleProp<ViewStyle>;
};
