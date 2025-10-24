import Slider from '@react-native-community/slider';
import React, { useMemo, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import ForwardSvg from '../assets/svgs/ForwardSvg';
import FrameArrowDownSvg from '../assets/svgs/FrameArrowDownSvg';
import FrameArrowUpSvg from '../assets/svgs/FrameArrowUpSvg';
import PauseSvg from '../assets/svgs/PauseSvg';
import PlayBtnSvg from '../assets/svgs/PlayBtnSvg';
import RewindSvg from '../assets/svgs/RewindSvg';
import { debounce } from '../libs/debounce';
import { scaleModerate } from '../libs/responsive';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const VideoControl = ({
	handleSeek,
	handleSkipBack,
	handleSkipForward,
	handlePlayPause,
	activeFrame,
	setActiveFrame,
	duration,
	currentTime,
	isPlaying,
}: {
	handleSeek: (time: number) => void;
	handleSkipBack: (time: number) => void;
	handleSkipForward: (time: number) => void;
	handlePlayPause: () => void;
	activeFrame: number;
	setActiveFrame: (index: number) => void;
	duration: number;
	currentTime: number;
	isPlaying: boolean;
}) => {
	const [isSeeking, setIsSeeking] = useState(false);
	const [seekingValue, setSeekingValue] = useState(0);

	const sliderValue = isSeeking ? seekingValue : currentTime;

	// Create debounced seek function for real-time preview
	const debouncedSeek = useMemo(
		() =>
			debounce((value: number) => {
				if (handleSeek) handleSeek(value);
			}, 100), // Reduced to 100ms for more responsive real-time seeking
		[handleSeek]
	);

	const handleSliderStart = () => {
		setIsSeeking(true);
		setSeekingValue(currentTime);
	};

	const handleSliderChange = (value: number) => {
		setSeekingValue(value);
		// Enable real-time preview with debouncing
		debouncedSeek(value);
	};

	const handleSliderComplete = (value: number) => {
		setIsSeeking(false);
		// Always seek when user releases the slider
		if (handleSeek) {
			handleSeek(value);
		}
	};

	return (
		<View style={styles.container}>
			{/* Frame changer container*/}
			<View style={styles.frameControlContainer}>
				<Pressable onPress={() => setActiveFrame(0)}>
					<FrameArrowUpSvg color={activeFrame === 0 ? '#FF5E5C' : '#A4A4A4'} />
				</Pressable>
				<Pressable onPress={() => setActiveFrame(1)}>
					<FrameArrowDownSvg
						color={activeFrame === 1 ? '#FF5E5C' : '#A4A4A4'}
					/>
				</Pressable>
			</View>
			{/* Play button */}
			<Pressable style={styles.playContainer} onPress={handlePlayPause}>
				{isPlaying ? <PauseSvg /> : <PlayBtnSvg />}
			</Pressable>
			{/* Slider */}
			<View style={styles.sliderContainer}>
				<Pressable onPress={() => handleSkipBack(5)}>
					<RewindSvg />
				</Pressable>
				<Slider
					style={{ height: 40, width: SCREEN_WIDTH - scaleModerate(300) }}
					minimumValue={0}
					maximumValue={duration > 0 ? duration : 100}
					value={sliderValue}
					minimumTrackTintColor="#FFFFFF"
					maximumTrackTintColor="rgba(255,255,255,0.3)"
					thumbTintColor="#fff"
					onSlidingStart={handleSliderStart}
					onValueChange={handleSliderChange}
					onSlidingComplete={handleSliderComplete}
					disabled={duration <= 0}
					step={0.01}
				/>
				<Pressable onPress={() => handleSkipForward(5)}>
					<ForwardSvg />
				</Pressable>
			</View>
			{/* Set select all frame */}
			<Pressable onPress={() => setActiveFrame(2)}>
				<View
					style={[
						styles.roundedContainer,
						{ backgroundColor: activeFrame === 2 ? '#FF5E5C' : '#F6F6F6' },
					]}
				/>
			</Pressable>
		</View>
	);
};

export default VideoControl;

const styles = StyleSheet.create({
	container: {
		width: '97%',
		marginHorizontal: scaleModerate(20),
		display: 'flex',
		flexDirection: 'row',
		gap: scaleModerate(20),
	},
	frameControlContainer: {
		display: 'flex',
		alignItems: 'center',
		gap: scaleModerate(10),
	},
	playContainer: {
		width: scaleModerate(46),
		height: scaleModerate(46),
		backgroundColor: '#F6F6F6',
		borderRadius: scaleModerate(23),
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
	},
	sliderContainer: {
		display: 'flex',
		alignItems: 'center',
		flexDirection: 'row',
		gap: scaleModerate(20),
	},
	roundedContainer: {
		width: scaleModerate(36),
		height: scaleModerate(36),
		borderRadius: scaleModerate(18),
	},
});
