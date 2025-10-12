import * as React from 'react';
import Svg, { Path, SvgProps } from 'react-native-svg';
const SVGComponent = (props: SvgProps) => {
	const { color } = props;
	return (
		<Svg width={25} height={24} viewBox="0 0 25 24" fill="none" {...props}>
			<Path
				d="M14.5 20.4V14.6C14.5 14.2686 14.7686 14 15.1 14H20.9C21.2314 14 21.5 14.2686 21.5 14.6V20.4C21.5 20.7314 21.2314 21 20.9 21H15.1C14.7686 21 14.5 20.7314 14.5 20.4Z"
				stroke={color}
				strokeWidth={1.5}
			/>
			<Path
				d="M3.5 20.4V14.6C3.5 14.2686 3.76863 14 4.1 14H9.9C10.2314 14 10.5 14.2686 10.5 14.6V20.4C10.5 20.7314 10.2314 21 9.9 21H4.1C3.76863 21 3.5 20.7314 3.5 20.4Z"
				stroke={color}
				strokeWidth={1.5}
			/>
			<Path
				d="M14.5 9.4V3.6C14.5 3.26863 14.7686 3 15.1 3H20.9C21.2314 3 21.5 3.26863 21.5 3.6V9.4C21.5 9.73137 21.2314 10 20.9 10H15.1C14.7686 10 14.5 9.73137 14.5 9.4Z"
				stroke={color}
				strokeWidth={1.5}
			/>
			<Path
				d="M3.5 9.4V3.6C3.5 3.26863 3.76863 3 4.1 3H9.9C10.2314 3 10.5 3.26863 10.5 3.6V9.4C10.5 9.73137 10.2314 10 9.9 10H4.1C3.76863 10 3.5 9.73137 3.5 9.4Z"
				stroke={color}
				strokeWidth={1.5}
			/>
		</Svg>
	);
};
export default SVGComponent;
