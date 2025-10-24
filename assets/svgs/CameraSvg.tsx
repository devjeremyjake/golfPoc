import * as React from 'react';
import { Platform } from 'react-native';
import Svg, { Path, SvgProps } from 'react-native-svg';

const WIDTH = Platform.OS === 'android' ? 21 : 25;
const HEIGHT = Platform.OS === 'android' ? 20 : 24;

const SVGComponent = (props: SvgProps) => {
	const { color } = props;
	return (
		<Svg
			width={WIDTH}
			height={HEIGHT}
			viewBox="0 0 25 24"
			fill="none"
			{...props}
		>
			<Path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M9.375 3.75L7.2 6.65C6.68065 7.34247 5.86558 7.75 5 7.75H4.5C3.80964 7.75 3.25 8.30964 3.25 9V19C3.25 19.6904 3.80964 20.25 4.5 20.25H20.5C21.1904 20.25 21.75 19.6904 21.75 19V9C21.75 8.30964 21.1904 7.75 20.5 7.75H20C19.1344 7.75 18.3193 7.34247 17.8 6.65L15.625 3.75H9.375ZM8.22 2.79C8.47495 2.45006 8.87508 2.25 9.3 2.25H15.7C16.1249 2.25 16.525 2.45006 16.78 2.79L19 5.75C19.2361 6.06476 19.6066 6.25 20 6.25H20.5C22.0188 6.25 23.25 7.48122 23.25 9V19C23.25 20.5188 22.0188 21.75 20.5 21.75H4.5C2.98122 21.75 1.75 20.5188 1.75 19V9C1.75 7.48122 2.98122 6.25 4.5 6.25H5C5.39345 6.25 5.76393 6.06476 6 5.75L8.22 2.79Z"
				fill={color}
			/>
			<Path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M12.5 9.75C10.7051 9.75 9.25 11.2051 9.25 13C9.25 14.7949 10.7051 16.25 12.5 16.25C14.2949 16.25 15.75 14.7949 15.75 13C15.75 11.2051 14.2949 9.75 12.5 9.75ZM7.75 13C7.75 10.3766 9.87665 8.25 12.5 8.25C15.1234 8.25 17.25 10.3766 17.25 13C17.25 15.6234 15.1234 17.75 12.5 17.75C9.87665 17.75 7.75 15.6234 7.75 13Z"
				fill={color}
			/>
		</Svg>
	);
};
export default SVGComponent;
