import * as React from 'react';
import Svg, { Path, SvgProps } from 'react-native-svg';
const SVGComponent = (props: SvgProps) => (
	<Svg width={36} height={36} viewBox="0 0 36 36" fill="none" {...props}>
		<Path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M9 9.375C8.37868 9.375 7.875 9.87868 7.875 10.5V25.5C7.875 26.1213 8.37868 26.625 9 26.625C9.62132 26.625 10.125 26.1213 10.125 25.5V10.5C10.125 9.87868 9.62132 9.375 9 9.375Z"
			fill="#F6F6F6"
		/>
		<Path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M28.125 8.6069C28.125 6.915 26.1732 5.96913 24.8452 7.01752L12.9477 16.4103C11.9207 17.2211 11.9207 18.7783 12.9477 19.5891L24.8452 28.9819C26.1732 30.0303 28.125 29.0844 28.125 27.3925V8.6069Z"
			fill="#F6F6F6"
		/>
	</Svg>
);
export default SVGComponent;
