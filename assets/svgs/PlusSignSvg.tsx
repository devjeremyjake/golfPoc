import * as React from 'react';
import Svg, { Path, SvgProps } from 'react-native-svg';
const SVGComponent = (props: SvgProps) => (
	<Svg width={25} height={24} viewBox="0 0 15 14" fill="none" {...props}>
		<Path
			d="M1.5 7H7.5M13.5 7H7.5M7.5 7V1M7.5 7V13"
			stroke="#F6F6F6"
			strokeWidth={1.5}
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</Svg>
);
export default SVGComponent;
