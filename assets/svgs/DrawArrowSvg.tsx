import * as React from 'react';
import { Platform } from 'react-native';
import Svg, { ClipPath, Defs, G, Path, Rect, SvgProps } from 'react-native-svg';

const WIDTH = Platform.OS === 'android' ? 35 : 44;
const HEIGHT = Platform.OS === 'android' ? 36 : 45;

const SVGComponent = (props: SvgProps) => {
	const { color } = props;
	return (
		<Svg
			width={WIDTH}
			height={HEIGHT}
			viewBox="0 0 34 35"
			fill="none"
			{...props}
		>
			<G clipPath="url(#clip0_305_43073)">
				<Path
					d="M9.54334 14.0305C8.69348 13.325 8.57651 12.0641 9.28207 11.2142C9.98763 10.3644 11.2485 10.2474 12.0984 10.9529C12.9483 11.6585 13.0652 12.9194 12.3597 13.7693C11.6541 14.6191 10.3932 14.7361 9.54334 14.0305Z"
					stroke={color}
					strokeWidth={1.5}
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
				<Path
					d="M14.668 15.6847L24.6702 23.9887M24.6702 23.9887L24.2783 19.7642M24.6702 23.9887L20.4457 24.3806"
					stroke={color}
					strokeWidth={1.5}
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</G>
			<Defs>
				<ClipPath id="clip0_305_43073">
					<Rect
						width={24}
						height={24}
						fill={color}
						transform="translate(15.4087 0.703125) rotate(39.6998)"
					/>
				</ClipPath>
			</Defs>
		</Svg>
	);
};
export default SVGComponent;
