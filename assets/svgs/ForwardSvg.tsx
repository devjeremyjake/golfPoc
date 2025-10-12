import * as React from 'react';
import Svg, { Path, SvgProps } from 'react-native-svg';
const SVGComponent = (props: SvgProps) => (
	<Svg width={36} height={36} viewBox="0 0 36 36" fill="none" {...props}>
		<Path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M27 9.375C27.6213 9.375 28.125 9.87868 28.125 10.5V25.5C28.125 26.1213 27.6213 26.625 27 26.625C26.3787 26.625 25.875 26.1213 25.875 25.5V10.5C25.875 9.87868 26.3787 9.375 27 9.375Z"
			fill="#F6F6F6"
		/>
		<Path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M7.875 8.6069C7.875 6.915 9.82683 5.96913 11.1548 7.01752L23.0523 16.4103C24.0793 17.2211 24.0793 18.7783 23.0523 19.5891L11.1548 28.9819C9.82683 30.0303 7.875 29.0844 7.875 27.3925V8.6069Z"
			fill="#F6F6F6"
		/>
	</Svg>
);
export default SVGComponent;
