import * as React from 'react';
import { Platform } from 'react-native';
import Svg, { Path, SvgProps } from 'react-native-svg';

const SIZE = Platform.OS === 'android' ? 28 : 35;

const SVGComponent = (props: SvgProps) => {
	const { color } = props;
	return (
		<Svg width={SIZE} height={SIZE} viewBox="0 0 25 25" fill="none" {...props}>
			<Path
				d="M21.5918 10.391V21.191C21.5918 21.5224 21.3232 21.791 20.9918 21.791H10.1918C9.86043 21.791 9.5918 21.5224 9.5918 21.191V10.391C9.5918 10.0596 9.86043 9.79102 10.1918 9.79102H20.9918C21.3232 9.79102 21.5918 10.0596 21.5918 10.391Z"
				stroke={color}
				strokeWidth={1.5}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<Path
				d="M15.5918 4.39102V15.191C15.5918 15.5224 15.3232 15.791 14.9918 15.791H4.1918C3.86043 15.791 3.5918 15.5224 3.5918 15.191V4.39102C3.5918 4.05964 3.86043 3.79102 4.1918 3.79102H14.9918C15.3232 3.79102 15.5918 4.05964 15.5918 4.39102Z"
				stroke={color}
				strokeWidth={1.5}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
};
export default SVGComponent;
