import * as React from 'react';
import Svg, { Path, SvgProps } from 'react-native-svg';
const SVGComponent = (props: SvgProps) => (
	<Svg width={23} height={26} viewBox="0 0 13 16" fill="none" {...props}>
		<Path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M0.214355 2.04563C0.214355 1.14901 1.19006 0.593051 1.96141 1.05015L12.0098 7.00473C12.7661 7.45291 12.7661 8.54751 12.0098 8.99569L1.96141 14.9503C1.19006 15.4074 0.214355 14.8514 0.214355 13.9548V2.04563Z"
			fill="black"
		/>
	</Svg>
);
export default SVGComponent;
