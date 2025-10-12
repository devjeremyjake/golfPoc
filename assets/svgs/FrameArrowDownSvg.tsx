import * as React from 'react';
import Svg, { Path, SvgProps } from 'react-native-svg';
const SVGComponent = (props: SvgProps) => {
	const { color } = props;
	return (
		<Svg width={28} height={16} viewBox="0 0 28 16" fill="none" {...props}>
			<Path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M0.614225 1.42597C0.846396 0.865463 1.39335 0.5 2.00004 0.5L26 0.5C26.6067 0.5 27.1537 0.865463 27.3859 1.42597C27.618 1.98649 27.4897 2.63166 27.0607 3.06066L15.0607 15.0607C14.4749 15.6464 13.5252 15.6464 12.9394 15.0607L0.939384 3.06066C0.510387 2.63166 0.382053 1.98649 0.614225 1.42597Z"
				fill={color}
			/>
		</Svg>
	);
};
export default SVGComponent;
