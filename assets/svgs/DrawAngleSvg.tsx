import * as React from 'react';
import Svg, { Path, SvgProps } from 'react-native-svg';
const SVGComponent = (props: SvgProps) => {
	const { color } = props;
	return (
		<Svg width={35} height={35} viewBox="0 0 25 25" fill="none" {...props}>
			<Path
				d="M20.7959 22.791H16.7959C9.06391 22.791 2.7959 16.523 2.7959 8.79102V4.79102"
				stroke={color}
				strokeWidth={1.5}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<Path
				d="M21.635 3.95136V7.48689M21.635 3.95136H18.0994M21.635 3.95136L18.7962 6.79016"
				stroke={color}
				strokeWidth={1.5}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<Path
				d="M9.7959 15.791L16.7959 8.79102"
				stroke={color}
				strokeWidth={1.5}
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeDasharray="2 3"
			/>
		</Svg>
	);
};
export default SVGComponent;
