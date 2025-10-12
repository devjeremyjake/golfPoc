import * as React from 'react';
import Svg, { Path, SvgProps } from 'react-native-svg';
const SVGComponent = (props: SvgProps) => {
	const { color } = props;
	return (
		<Svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" {...props}>
			<Path
				d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z"
				fill={color}
			/>
		</Svg>
	);
};
export default SVGComponent;
