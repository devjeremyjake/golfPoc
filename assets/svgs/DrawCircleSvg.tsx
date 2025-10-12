import * as React from 'react';
import Svg, { Path, SvgProps } from 'react-native-svg';
const SVGComponent = (props: SvgProps) => {
	const { color } = props;
	return (
		<Svg width={45} height={45} viewBox="0 0 25 25" fill="none" {...props}>
			<Path
				d="M9.87402 22.7031C13.74 22.7031 16.874 19.5691 16.874 15.7031C16.874 11.8371 13.74 8.70312 9.87402 8.70312C6.00803 8.70312 2.87402 11.8371 2.87402 15.7031C2.87402 19.5691 6.00803 22.7031 9.87402 22.7031Z"
				stroke={color}
				strokeWidth={1.5}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<Path
				d="M15.874 16.7031C19.74 16.7031 22.874 13.5691 22.874 9.70312C22.874 5.83713 19.74 2.70312 15.874 2.70312C12.008 2.70312 8.87402 5.83713 8.87402 9.70312C8.87402 13.5691 12.008 16.7031 15.874 16.7031Z"
				stroke={color}
				strokeWidth={1.5}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
};
export default SVGComponent;
