import * as React from 'react';
import { Platform } from 'react-native';
import Svg, { Path, SvgProps } from 'react-native-svg';

const SIZE = Platform.OS === 'android' ? 28 : 34;

const SVGComponent = (props: SvgProps) => {
	const { color } = props;
	return (
		<Svg width={SIZE} height={SIZE} viewBox="0 0 24 25" fill="none" {...props}>
			<Path
				d="M12 2.79102C6.47715 2.79102 2 7.26817 2 12.791C2 18.3139 6.47715 22.791 12 22.791C17.5228 22.791 22 18.3139 22 12.791C22 7.26817 17.5228 2.79102 12 2.79102Z"
				stroke={color}
				strokeWidth={1.5}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<Path
				d="M8 21.9589V14.791L12 7.79102L16 14.791V21.9589"
				stroke={color}
				strokeWidth={1.5}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<Path
				d="M8 14.791C8 14.791 9.12676 15.791 10 15.791C10.8732 15.791 12 14.791 12 14.791C12 14.791 13.1268 15.791 14 15.791C14.8732 15.791 16 14.791 16 14.791"
				stroke={color}
				strokeWidth={1.5}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
};
export default SVGComponent;
