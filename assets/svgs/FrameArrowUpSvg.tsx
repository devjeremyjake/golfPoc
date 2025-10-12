import * as React from 'react';
import Svg, { Path, SvgProps } from 'react-native-svg';
const SVGComponent = (props: SvgProps) => {
	const { color } = props;
	return (
		<Svg width={28} height={16} viewBox="0 0 28 16" fill="none" {...props}>
			<Path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M0.614225 14.824C0.846396 15.3845 1.39335 15.75 2.00004 15.75L26 15.75C26.6067 15.75 27.1537 15.3845 27.3859 14.824C27.618 14.2635 27.4897 13.6183 27.0607 13.1893L15.0607 1.18934C14.4749 0.603553 13.5252 0.603553 12.9394 1.18934L0.939384 13.1893C0.510387 13.6183 0.382053 14.2635 0.614225 14.824Z"
				fill={color}
			/>
		</Svg>
	);
};
export default SVGComponent;
