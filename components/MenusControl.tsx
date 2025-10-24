import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import AlignVerticalSvg from '../assets/svgs/AlignVerticalSvg';
import CameraSvg from '../assets/svgs/CameraSvg';
import PlusSignSvg from '../assets/svgs/PlusSignSvg';
import RecordingSvg from '../assets/svgs/RecordingSvg';
import ViewGridSvg from '../assets/svgs/ViewGridSvg';
import { scaleModerate } from '../libs/responsive';

interface MenuProps {
	handlePlusClick: () => void;
	setToolsTrayState: () => void;
	toolsTrayOpen: boolean;
	openCamera: boolean;
	setCameraState: () => void;
	takeSnapShot: () => void;
	isRecording: boolean;
	toggleRecording: () => void;
	disabled: boolean;
}

const MenusControl = ({
	handlePlusClick,
	setToolsTrayState,
	toolsTrayOpen,
	openCamera,
	setCameraState,
	takeSnapShot,
	isRecording,
	toggleRecording,
	disabled,
}: MenuProps) => {
	return (
		<View style={styles.container}>
			<Pressable onPress={handlePlusClick}>
				<PlusSignSvg />
			</Pressable>
			<Pressable onPress={takeSnapShot}>
				<AlignVerticalSvg />
			</Pressable>
			<Pressable onPress={setCameraState}>
				<CameraSvg color={openCamera ? '#FF5E5C' : '#FFFFFF'} />
			</Pressable>
			<Pressable disabled={disabled} onPress={toggleRecording}>
				<RecordingSvg color={isRecording ? '#FF5E5C' : '#FFFFFF'} />
			</Pressable>
			<Pressable onPress={setToolsTrayState}>
				<ViewGridSvg color={toolsTrayOpen ? '#FF5E5C' : '#FFFFFF'} />
			</Pressable>
		</View>
	);
};

export default MenusControl;

const styles = StyleSheet.create({
	container: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		flexDirection: 'row',
		gap: scaleModerate(40),
	},
});
