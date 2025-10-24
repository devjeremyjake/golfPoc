import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Base width for iPhone 14 Pro (as reference)
const BASE_WIDTH = 393;

// Scale function to normalize sizes across platforms
export const scale = (size: number): number => {
	const ratio = SCREEN_WIDTH / BASE_WIDTH;
	// On Android, apply a reduction factor to compensate for higher DPI
	const platformFactor = Platform.OS === 'android' ? 0.85 : 1;
	return Math.round(
		PixelRatio.roundToNearestPixel(size * ratio * platformFactor)
	);
};

// Scale for font sizes specifically
export const scaleFont = (size: number): number => {
	return scale(size);
};

// Scale for moderate elements (buttons, icons)
export const scaleModerate = (size: number, factor: number = 0.5): number => {
	const platformFactor = Platform.OS === 'android' ? 0.85 : 1;
	return Math.round(size + (scale(size) - size) * factor * platformFactor);
};
