import * as React from 'react';
import { Platform } from 'react-native';
import Svg, { Path, SvgProps } from 'react-native-svg';

const WIDTH = Platform.OS === 'android' ? 21 : 25;
const HEIGHT = Platform.OS === 'android' ? 20 : 24;

const SVGComponent = (props: SvgProps) => (
	<Svg width={WIDTH} height={HEIGHT} viewBox="0 0 25 24" fill="none" {...props}>
		<Path
			d="M22.5 3L2.5 3"
			stroke="#F6F6F6"
			strokeWidth={1.5}
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
		<Path
			d="M22.5 21L2.5 21"
			stroke="#F6F6F6"
			strokeWidth={1.5}
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
		<Path
			d="M8.5 15V9C8.5 7.89543 9.39543 7 10.5 7H14.5C15.6046 7 16.5 7.89543 16.5 9V15C16.5 16.1046 15.6046 17 14.5 17H10.5C9.39543 17 8.5 16.1046 8.5 15Z"
			stroke="#F6F6F6"
			strokeWidth={1.5}
		/>
	</Svg>
);
export default SVGComponent;
