import * as React from 'react';
import Svg, { ClipPath, Defs, G, Path, Rect, SvgProps } from 'react-native-svg';
const SVGComponent = (props: SvgProps) => {
	const { color } = props;
	return (
		<Svg width={55} height={55} viewBox="0 0 35 35" fill="none" {...props}>
			<G clipPath="url(#clip0_305_43071)">
				<Path
					d="M9.4657 13.7395C8.61585 13.034 8.49887 11.773 9.20443 10.9232C9.90999 10.0733 11.1709 9.95636 12.0208 10.6619C12.8706 11.3675 12.9876 12.6284 12.282 13.4783C11.5765 14.3281 10.3156 14.4451 9.4657 13.7395Z"
					stroke={color}
					strokeWidth={1.5}
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
				<Path
					d="M12.844 13.3113L22.8462 21.6152"
					stroke={color}
					strokeWidth={1.5}
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
				<Path
					d="M23.3827 24.6653C22.5328 23.9597 22.4159 22.6988 23.1214 21.849C23.827 20.9991 25.0879 20.8821 25.9378 21.5877C26.7876 22.2933 26.9046 23.5542 26.199 24.404C25.4935 25.2539 24.2326 25.3709 23.3827 24.6653Z"
					stroke={color}
					strokeWidth={1.5}
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</G>
			<Defs>
				<ClipPath id="clip0_305_43071">
					<Rect
						width={24.9123}
						height={24}
						fill={color}
						transform="translate(15.3306 0.412109) rotate(39.6998)"
					/>
				</ClipPath>
			</Defs>
		</Svg>
	);
};
export default SVGComponent;
