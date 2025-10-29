import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { useVideoPlayer, VideoView } from 'expo-video';
import { throttle } from 'lodash';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	Dimensions,
	PermissionsAndroid,
	Platform,
	Pressable,
	StyleSheet,
	Text,
	View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, {
	Circle,
	G,
	Line,
	Path,
	Rect,
	Text as SvgText,
} from 'react-native-svg';
import { captureRef } from 'react-native-view-shot';
import CamersFlipSvg from './assets/svgs/CamersFlipSvg';
import DrawAngleSvg from './assets/svgs/DrawAngleSvg';
import DrawArrowSvg from './assets/svgs/DrawArrowSvg';
import DrawCircleSvg from './assets/svgs/DrawCircleSvg';
import DrawFreeSvg from './assets/svgs/DrawFreeSvg';
import DrawLineSvg from './assets/svgs/DrawLineSvg';
import DrawRectangleSvg from './assets/svgs/DrawRectangleSvg';
import FlipSvg from './assets/svgs/FlipSvg';
import KebabSvg from './assets/svgs/KebabSvg';
import ReverseBtnSvg from './assets/svgs/ReverseBtnSvg';
import MenusControl from './components/MenusControl';
import VideoControl from './components/VideoControl';
import ScreenRecorder from './modules/screen-recorder';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CANVAS_HEIGHT = SCREEN_HEIGHT - 240;

const colorPalette = [
	'#FF0000', // Red
	'#00FF00', // Green
	'#0000FF', // Blue
	'#FFFF00', // Yellow
	'#FF00FF', // Magenta
	'#00FFFF', // Cyan
	'#FFA500', // Orange
	'#800080', // Purple
	'#000000', // Black
	'#FFFFFF', // White
	'#808080', // Gray
	'#A52A2A', // Brown
];

const Entry = () => {
	const translateX = useSharedValue(SCREEN_WIDTH - 230); // Position on right side with margin
	const translateY = useSharedValue(SCREEN_HEIGHT / 2 - 85); // Center vertically
	const offsetX = useSharedValue(SCREEN_WIDTH - 230);
	const offsetY = useSharedValue(SCREEN_HEIGHT / 2 - 85);

	// Camers shsredValue
	const cameraTranslateX = useSharedValue(20);
	const cameraTranslateY = useSharedValue(SCREEN_HEIGHT / 2 - 85);
	const cameraOffsetX = useSharedValue(20);
	const cameraOffsetY = useSharedValue(SCREEN_HEIGHT / 2 - 85);

	// Drawing state
	const [paths, setPaths] = useState([]);
	const [circles, setCircles] = useState([]);
	const [lines, setLines] = useState([]);
	const [arrows, setArrows] = useState([]);
	const [angles, setAngles] = useState([]);
	const [rectangles, setRectangles] = useState([]);
	const [currentPath, setCurrentPath] = useState('');
	const [currentTool, setCurrentTool] = useState('freedraw');
	const [drawingHistory, setDrawingHistory] = useState([]);
	const [kebabOpen, setKebab] = useState<boolean>(false);

	const imageRef = useRef(null);

	// Shape drawing states
	const [isDrawingCircle, setIsDrawingCircle] = useState(false);
	const [isDrawingLine, setIsDrawingLine] = useState(false);
	const [isDrawingArrow, setIsDrawingArrow] = useState(false);
	const [isDrawingAngle, setIsDrawingAngle] = useState(false);
	const [isDrawingRectangle, setIsDrawingRectangle] = useState(false);
	const [circleStart, setCircleStart] = useState({ x: 0, y: 0 });
	const [lineStart, setLineStart] = useState({ x: 0, y: 0 });
	const [arrowStart, setArrowStart] = useState({ x: 0, y: 0 });
	const [angleStart, setAngleStart] = useState({ x: 0, y: 0 });
	const [rectangleStart, setRectangleStart] = useState({ x: 0, y: 0 });
	const [tempCircle, setTempCircle] = useState(null);
	const [tempLine, setTempLine] = useState(null);
	const [tempArrow, setTempArrow] = useState(null);
	const [tempAngle, setTempAngle] = useState(null);
	const [tempRectangle, setTempRectangle] = useState(null);

	// Selection and editing states
	const [selectedItem, setSelectedItem] = useState(null);
	const [isResizing, setIsResizing] = useState(false);
	const [resizeHandle, setResizeHandle] = useState('');
	const [isMoving, setIsMoving] = useState(false);
	const [moveOffset, setMoveOffset] = useState({ x: 0, y: 0 });

	// Color states
	const [currentColor, setCurrentColor] = useState('#FF5E5C');
	// const [showColorPicker, setShowColorPicker] = useState(false);

	// Recording state
	const [isRecording, setIsRecording] = useState(false);
	const [isProcessingVideo, setIsProcessingVideo] = useState(false);

	//   Video states
	const [videos, setVideos] = useState<{ uri: string | null }[]>([
		{ uri: null }, // left video
		{ uri: null }, // right video
	]);

	const [activeFrame, setActiveFrame] = useState<number>(0);
	const [videoMirrored, setVideoMirrored] = useState<boolean>(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [isPlaying, setIsPlaying] = useState(false);
	const [duration, setDuration] = useState(0);
	const [duration1, setDuration1] = useState(0); // Duration for player 1
	const [duration2, setDuration2] = useState(0); // Duration for player 2
	const [toolsTrayOpen, setToolsTray] = useState<boolean>(false);
	const [openCamera, setCamera] = useState<boolean>(false);
	const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();
	const [facing, setFacing] = useState<CameraType>('back');
	const [cameraPermission, requestCameraPermission] = useCameraPermissions();

	// Get the current video URI
	const currentVideoUri = videos?.[0]?.uri;
	const currentScreenTwo = videos?.[1]?.uri;

	// Create the video source object
	const videoSource = currentVideoUri ? { uri: currentVideoUri } : null;
	const videoSourceTwo = currentScreenTwo ? { uri: currentScreenTwo } : null;

	// Create the player with the video source
	const player = useVideoPlayer(videoSource, (player) => {
		if (player && currentVideoUri) {
			player.loop = false;

			// Listen for playback status changes
			player.addListener('statusChange', () => {
				if (activeFrame === 0 || activeFrame === 2) {
					setIsPlaying(player.playing);
				}
			});

			// Listen for time updates
			player.addListener('timeUpdate', ({ currentTime }) => {
				if (activeFrame === 0 || activeFrame === 2) {
					setCurrentTime(currentTime);
				}
			});

			// Listen for source changes to get duration
			player.addListener('sourceChange', (source) => {
				// Always set duration1 when player 1 source changes
				if (source && player.duration) {
					setDuration1(player.duration);
				}
			});
		}
	});

	const playerTwo = useVideoPlayer(videoSourceTwo, (playerTwo) => {
		if (playerTwo && currentScreenTwo) {
			playerTwo.loop = false;

			// Listen for playback status changes
			playerTwo.addListener('statusChange', () => {
				if (activeFrame === 1 || activeFrame === 2) {
					setIsPlaying(playerTwo.playing);
				}
			});

			// Listen for time updates
			playerTwo.addListener('timeUpdate', ({ currentTime }) => {
				if (activeFrame === 1 || activeFrame === 2) {
					setCurrentTime(currentTime);
				}
			});

			// Listen for source changes to get duration
			playerTwo.addListener('sourceChange', (source) => {
				// Always set duration2 when player 2 source changes
				if (source && playerTwo.duration) {
					setDuration2(playerTwo.duration);
				}
			});
		}
	});

	// Helper function to create arrow path
	const createArrowPath = (x1, y1, x2, y2, arrowSize = 8) => {
		const angle = Math.atan2(y2 - y1, x2 - x1);

		// Arrow head points
		const arrowX1 = x2 - arrowSize * Math.cos(angle - Math.PI / 6);
		const arrowY1 = y2 - arrowSize * Math.sin(angle - Math.PI / 6);
		const arrowX2 = x2 - arrowSize * Math.cos(angle + Math.PI / 6);
		const arrowY2 = y2 - arrowSize * Math.sin(angle + Math.PI / 6);

		return `M ${x1} ${y1} L ${x2} ${y2} M ${x2} ${y2} L ${arrowX1} ${arrowY1} M ${x2} ${y2} L ${arrowX2} ${arrowY2}`;
	};

	// Helper function to calculate angle between two lines
	function calculateAngle(vertex, p1, p2) {
		const v1 = { x: p1.x - vertex.x, y: p1.y - vertex.y };
		const v2 = { x: p2.x - vertex.x, y: p2.y - vertex.y };

		const dot = v1.x * v2.x + v1.y * v2.y;
		const mag1 = Math.sqrt(v1.x ** 2 + v1.y ** 2);
		const mag2 = Math.sqrt(v2.x ** 2 + v2.y ** 2);

		const cosTheta = dot / (mag1 * mag2);
		return (Math.acos(cosTheta) * 180) / Math.PI; // angle in degrees
	}

	const renderAngle = (
		angle,
		color = 'orange',
		dashed = false,
		isSelected = false
	) => {
		const angleValue = calculateAngle(angle.vertex, angle.point1, angle.point2);

		const radius = 30;
		const startAngle = Math.atan2(
			angle.point1.y - angle.vertex.y,
			angle.point1.x - angle.vertex.x
		);
		const endAngle = Math.atan2(
			angle.point2.y - angle.vertex.y,
			angle.point2.x - angle.vertex.x
		);

		const arcStartX = angle.vertex.x + radius * Math.cos(startAngle);
		const arcStartY = angle.vertex.y + radius * Math.sin(startAngle);
		const arcEndX = angle.vertex.x + radius * Math.cos(endAngle);
		const arcEndY = angle.vertex.y + radius * Math.sin(endAngle);

		const largeArcFlag = 0;
		const sweepFlag = endAngle > startAngle ? 1 : 0;

		return (
			<G>
				{/* First arm */}
				<Line
					x1={angle.vertex.x}
					y1={angle.vertex.y}
					x2={angle.point1.x}
					y2={angle.point1.y}
					stroke={color}
					strokeWidth={isSelected ? 3 : 2}
					strokeDasharray={dashed ? '5,5' : undefined}
					strokeLinecap="round"
				/>
				{/* Second arm */}
				<Line
					x1={angle.vertex.x}
					y1={angle.vertex.y}
					x2={angle.point2.x}
					y2={angle.point2.y}
					stroke={color}
					strokeWidth={isSelected ? 3 : 2}
					strokeDasharray={dashed ? '5,5' : undefined}
					strokeLinecap="round"
				/>
				{/* Vertex */}
				<Circle
					cx={angle.vertex.x}
					cy={angle.vertex.y}
					r="3"
					fill={isSelected ? '#4CAF50' : color}
				/>
				{/* Arc */}
				<Path
					d={`M ${arcStartX} ${arcStartY} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${arcEndX} ${arcEndY}`}
					stroke={color}
					strokeWidth="2"
					fill="none"
				/>
				{/* Label */}
				<SvgText
					x={
						angle.vertex.x +
						(radius + 30) * Math.cos((startAngle + endAngle) / 2) // was +15
					}
					y={
						angle.vertex.y +
						(radius + 30) * Math.sin((startAngle + endAngle) / 2) // was +15
					}
					fontSize="12"
					fill={color}
					fontWeight="bold"
					textAnchor="middle"
				>
					{angleValue?.toFixed(1)}°
				</SvgText>
			</G>
		);
	};

	const onTouchStart = (event) => {
		const locationX = event.nativeEvent.locationX;
		const locationY = event.nativeEvent.locationY;

		// Check if touching a resize handle first
		if (selectedItem && !isResizing && !isMoving) {
			const handleTouched = checkResizeHandle(locationX, locationY);
			if (handleTouched) {
				setIsResizing(true);
				setResizeHandle(handleTouched);
				return;
			}
		}

		// Check if selecting an existing shape (works for all tools)
		const selectedShape = findShapeAtPosition(locationX, locationY);
		if (selectedShape) {
			setSelectedItem(selectedShape);

			// If we're clicking on the same selected shape (not on resize handle), start moving
			if (
				selectedItem &&
				selectedItem.type === selectedShape.type &&
				selectedItem.index === selectedShape.index
			) {
				setIsMoving(true);
				// Calculate offset from shape center to touch point
				if (selectedShape.type === 'circle') {
					setMoveOffset({
						x: locationX - selectedShape.data.cx,
						y: locationY - selectedShape.data.cy,
					});
				} else if (
					selectedShape.type === 'line' ||
					selectedShape.type === 'arrow'
				) {
					// Use midpoint of line/arrow as reference
					const midX = (selectedShape.data.x1 + selectedShape.data.x2) / 2;
					const midY = (selectedShape.data.y1 + selectedShape.data.y2) / 2;
					setMoveOffset({
						x: locationX - midX,
						y: locationY - midY,
					});
				} else if (selectedShape.type === 'angle') {
					setMoveOffset({
						x: locationX - selectedShape.data.vertex.x,
						y: locationY - selectedShape.data.vertex.y,
					});
				} else if (selectedShape.type === 'rectangle') {
					setMoveOffset({
						x: locationX - selectedShape.data.x,
						y: locationY - selectedShape.data.y,
					});
				}
			}
			// Don't start drawing if we selected a shape
			return;
		}

		// Clear selection if we didn't select a shape
		setSelectedItem(null);

		// Handle drawing tools
		if (currentTool === 'circle') {
			setIsDrawingCircle(true);
			setCircleStart({ x: locationX, y: locationY });
			setTempCircle({ cx: locationX, cy: locationY, r: 0 });
		} else if (currentTool === 'line') {
			setIsDrawingLine(true);
			setLineStart({ x: locationX, y: locationY });
			setTempLine({
				x1: locationX,
				y1: locationY,
				x2: locationX,
				y2: locationY,
			});
		} else if (currentTool === 'arrow') {
			setIsDrawingArrow(true);
			setArrowStart({ x: locationX, y: locationY });
			setTempArrow({
				x1: locationX,
				y1: locationY,
				x2: locationX,
				y2: locationY,
			});
		} else if (currentTool === 'angle') {
			setIsDrawingAngle(true);
			setAngleStart({ x: locationX, y: locationY });
			setTempAngle(null);
		} else if (currentTool === 'rectangle') {
			setIsDrawingRectangle(true);
			setRectangleStart({ x: locationX, y: locationY });
			setTempRectangle({
				x: locationX,
				y: locationY,
				width: 0,
				height: 0,
			});
		}
	};

	const onTouchEnd = () => {
		// Handle resizing end
		if (isResizing) {
			setIsResizing(false);
			setResizeHandle('');
			return;
		}

		// Handle moving end
		if (isMoving) {
			setIsMoving(false);
			setMoveOffset({ x: 0, y: 0 });
			return;
		}

		// Handle drawing completion
		if (currentTool === 'freedraw' && currentPath.length > 0) {
			setPaths((prevPaths) => [...prevPaths, currentPath]);
			setDrawingHistory((prevHistory) => [
				...prevHistory,
				{ type: 'path', index: paths.length },
			]);
			setCurrentPath('');
		} else if (
			currentTool === 'circle' &&
			isDrawingCircle &&
			tempCircle &&
			tempCircle.r > 5
		) {
			setCircles((prevCircles) => [...prevCircles, tempCircle]);
			setDrawingHistory((prevHistory) => [
				...prevHistory,
				{ type: 'circle', index: circles.length },
			]);
		} else if (currentTool === 'line' && isDrawingLine && tempLine) {
			// Only add line if it has some length
			const length = Math.sqrt(
				Math.pow(tempLine.x2 - tempLine.x1, 2) +
					Math.pow(tempLine.y2 - tempLine.y1, 2)
			);
			if (length > 5) {
				setLines((prevLines) => [...prevLines, tempLine]);
				setDrawingHistory((prevHistory) => [
					...prevHistory,
					{ type: 'line', index: lines.length },
				]);
			}
		} else if (currentTool === 'arrow' && isDrawingArrow && tempArrow) {
			// Only add arrow if it has some length
			const length = Math.sqrt(
				Math.pow(tempArrow.x2 - tempArrow.x1, 2) +
					Math.pow(tempArrow.y2 - tempArrow.y1, 2)
			);
			if (length > 5) {
				setArrows((prevArrows) => [...prevArrows, tempArrow]);
				setDrawingHistory((prevHistory) => [
					...prevHistory,
					{ type: 'arrow', index: arrows.length },
				]);
			}
		} else if (currentTool === 'angle' && isDrawingAngle && tempAngle) {
			setAngles((prevAngles) => [...prevAngles, tempAngle]);
			setDrawingHistory((prevHistory) => [
				...prevHistory,
				{ type: 'angle', index: angles.length },
			]);
		} else if (
			currentTool === 'rectangle' &&
			isDrawingRectangle &&
			tempRectangle
		) {
			// Only add rectangle if it has some size
			if (
				Math.abs(tempRectangle.width) > 5 &&
				Math.abs(tempRectangle.height) > 5
			) {
				// Normalize rectangle coordinates
				const normalizedRect = {
					x: Math.min(rectangleStart.x, rectangleStart.x + tempRectangle.width),
					y: Math.min(
						rectangleStart.y,
						rectangleStart.y + tempRectangle.height
					),
					width: Math.abs(tempRectangle.width),
					height: Math.abs(tempRectangle.height),
				};
				setRectangles((prevRectangles) => [...prevRectangles, normalizedRect]);
				setDrawingHistory((prevHistory) => [
					...prevHistory,
					{ type: 'rectangle', index: rectangles.length },
				]);
			}
		}

		// Reset drawing states
		setIsDrawingCircle(false);
		setIsDrawingLine(false);
		setIsDrawingArrow(false);
		setIsDrawingAngle(false);
		setIsDrawingRectangle(false);
		setTempCircle(null);
		setTempLine(null);
		setTempArrow(null);
		setTempAngle(null);
		setTempRectangle(null);
	};

	const onTouchMove = (event) => {
		const locationX = event.nativeEvent.locationX;
		const locationY = event.nativeEvent.locationY;

		if (!locationX || !locationY) return;

		// Handle resizing
		if (isResizing && selectedItem) {
			handleResize(locationX, locationY);
			return;
		}

		// Handle moving
		if (isMoving && selectedItem) {
			if (selectedItem.type === 'circle') {
				const circle = selectedItem.data;
				const newCircle = {
					...circle,
					cx: locationX - moveOffset.x,
					cy: locationY - moveOffset.y,
				};
				setCircles((prev) =>
					prev.map((c, i) => (i === selectedItem.index ? newCircle : c))
				);
				setSelectedItem({ ...selectedItem, data: newCircle });
			} else if (selectedItem.type === 'line') {
				const line = selectedItem.data;
				const midX = (line.x1 + line.x2) / 2;
				const midY = (line.y1 + line.y2) / 2;

				const dx = locationX - moveOffset.x - midX;
				const dy = locationY - moveOffset.y - midY;

				const newLine = {
					...line,
					x1: line.x1 + dx,
					y1: line.y1 + dy,
					x2: line.x2 + dx,
					y2: line.y2 + dy,
				};

				setLines((prev) =>
					prev.map((l, i) => (i === selectedItem.index ? newLine : l))
				);
				setSelectedItem({ ...selectedItem, data: newLine });
			} else if (selectedItem.type === 'arrow') {
				const arrow = selectedItem.data;
				const midX = (arrow.x1 + arrow.x2) / 2;
				const midY = (arrow.y1 + arrow.y2) / 2;

				const dx = locationX - moveOffset.x - midX;
				const dy = locationY - moveOffset.y - midY;

				const newArrow = {
					...arrow,
					x1: arrow.x1 + dx,
					y1: arrow.y1 + dy,
					x2: arrow.x2 + dx,
					y2: arrow.y2 + dy,
				};

				setArrows((prev) =>
					prev.map((a, i) => (i === selectedItem.index ? newArrow : a))
				);
				setSelectedItem({ ...selectedItem, data: newArrow });
			} else if (selectedItem.type === 'angle') {
				const angle = selectedItem.data;
				const dx = locationX - moveOffset.x - angle.vertex.x;
				const dy = locationY - moveOffset.y - angle.vertex.y;

				const newAngle = {
					vertex: { x: angle.vertex.x + dx, y: angle.vertex.y + dy },
					point1: { x: angle.point1.x + dx, y: angle.point1.y + dy },
					point2: { x: angle.point2.x + dx, y: angle.point2.y + dy },
				};

				setAngles((prev) =>
					prev.map((a, i) => (i === selectedItem.index ? newAngle : a))
				);
				setSelectedItem({ ...selectedItem, data: newAngle });
			} else if (selectedItem.type === 'rectangle') {
				const rect = selectedItem.data;
				const newRect = {
					...rect,
					x: locationX - moveOffset.x,
					y: locationY - moveOffset.y,
				};

				setRectangles((prev) =>
					prev.map((r, i) => (i === selectedItem.index ? newRect : r))
				);
				setSelectedItem({ ...selectedItem, data: newRect });
			}
			return;
		}

		// Handle drawing
		if (currentTool === 'freedraw') {
			const command = currentPath.trim() === '' ? 'M' : 'L';
			const newPoint = `${command}${locationX.toFixed(0)},${locationY.toFixed(
				0
			)} `;
			setCurrentPath((prevPath) => prevPath + newPoint);
		} else if (currentTool === 'circle' && isDrawingCircle) {
			const deltaX = locationX - circleStart.x;
			const deltaY = locationY - circleStart.y;
			const radius = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

			setTempCircle({
				cx: circleStart.x,
				cy: circleStart.y,
				r: radius,
			});
		} else if (currentTool === 'line' && isDrawingLine) {
			setTempLine({
				x1: lineStart.x,
				y1: lineStart.y,
				x2: locationX,
				y2: locationY,
			});
		} else if (currentTool === 'arrow' && isDrawingArrow) {
			setTempArrow({
				x1: arrowStart.x,
				y1: arrowStart.y,
				x2: locationX,
				y2: locationY,
			});
		} else if (currentTool === 'angle' && isDrawingAngle && angleStart) {
			const length = 60; // baseline length

			// vertex stays fixed at start
			const vertex = angleStart;

			// baseline: horizontal right
			const point1 = { x: vertex.x + length, y: vertex.y };

			// second arm follows finger
			const point2 = { x: locationX, y: locationY };

			setTempAngle({ vertex, point1, point2 });
		} else if (currentTool === 'rectangle' && isDrawingRectangle) {
			setTempRectangle({
				x: rectangleStart.x,
				y: rectangleStart.y,
				width: locationX - rectangleStart.x,
				height: locationY - rectangleStart.y,
			});
		}
	};

	const findShapeAtPosition = (x, y) => {
		// Check rectangles
		for (let i = rectangles.length - 1; i >= 0; i--) {
			const rect = rectangles[i];
			if (
				x >= rect.x &&
				x <= rect.x + rect.width &&
				y >= rect.y &&
				y <= rect.y + rect.height
			) {
				return { type: 'rectangle', index: i, data: rect };
			}
		}

		// Check angles
		for (let i = angles.length - 1; i >= 0; i--) {
			const angle = angles[i];
			// Check if near vertex
			const distanceToVertex = Math.sqrt(
				(x - angle.vertex.x) ** 2 + (y - angle.vertex.y) ** 2
			);
			if (distanceToVertex < 15) {
				return { type: 'angle', index: i, data: angle };
			}
			// Check if near either arm
			const distanceToArm1 = distanceFromPointToLine(
				x,
				y,
				angle.vertex.x,
				angle.vertex.y,
				angle.point1.x,
				angle.point1.y
			);
			const distanceToArm2 = distanceFromPointToLine(
				x,
				y,
				angle.vertex.x,
				angle.vertex.y,
				angle.point2.x,
				angle.point2.y
			);
			if (distanceToArm1 < 10 || distanceToArm2 < 10) {
				return { type: 'angle', index: i, data: angle };
			}
		}

		// Check circles
		for (let i = circles.length - 1; i >= 0; i--) {
			const circle = circles[i];
			const distance = Math.sqrt((x - circle.cx) ** 2 + (y - circle.cy) ** 2);
			if (Math.abs(distance - circle.r) < 10) {
				return { type: 'circle', index: i, data: circle };
			}
		}

		// Check lines
		for (let i = lines.length - 1; i >= 0; i--) {
			const line = lines[i];
			const distanceToLine = distanceFromPointToLine(
				x,
				y,
				line.x1,
				line.y1,
				line.x2,
				line.y2
			);
			if (distanceToLine < 10) {
				return { type: 'line', index: i, data: line };
			}
		}

		// Check arrows
		for (let i = arrows.length - 1; i >= 0; i--) {
			const arrow = arrows[i];
			const distanceToArrow = distanceFromPointToLine(
				x,
				y,
				arrow.x1,
				arrow.y1,
				arrow.x2,
				arrow.y2
			);
			if (distanceToArrow < 10) {
				return { type: 'arrow', index: i, data: arrow };
			}
		}

		return null;
	};

	const distanceFromPointToLine = (px, py, x1, y1, x2, y2) => {
		const A = px - x1;
		const B = py - y1;
		const C = x2 - x1;
		const D = y2 - y1;

		const dot = A * C + B * D;
		const lenSq = C * C + D * D;
		let param = -1;
		if (lenSq !== 0) param = dot / lenSq;

		let xx, yy;
		if (param < 0) {
			xx = x1;
			yy = y1;
		} else if (param > 1) {
			xx = x2;
			yy = y2;
		} else {
			xx = x1 + param * C;
			yy = y1 + param * D;
		}

		const dx = px - xx;
		const dy = py - yy;
		return Math.sqrt(dx * dx + dy * dy);
	};

	const checkResizeHandle = (x, y) => {
		if (!selectedItem) return null;

		if (selectedItem.type === 'circle') {
			const circle = selectedItem.data;
			// Check if touching the resize handle (right edge of circle)
			const handleX = circle.cx + circle.r;
			const handleY = circle.cy;
			const distance = Math.sqrt((x - handleX) ** 2 + (y - handleY) ** 2);
			if (distance < 15) return 'radius';
		} else if (selectedItem.type === 'line') {
			const line = selectedItem.data;
			// Check start handle
			const startDistance = Math.sqrt((x - line.x1) ** 2 + (y - line.y1) ** 2);
			if (startDistance < 15) return 'start';

			// Check end handle
			const endDistance = Math.sqrt((x - line.x2) ** 2 + (y - line.y2) ** 2);
			if (endDistance < 15) return 'end';
		} else if (selectedItem.type === 'arrow') {
			const arrow = selectedItem.data;
			// Check start handle
			const startDistance = Math.sqrt(
				(x - arrow.x1) ** 2 + (y - arrow.y1) ** 2
			);
			if (startDistance < 15) return 'start';

			// Check end handle
			const endDistance = Math.sqrt((x - arrow.x2) ** 2 + (y - arrow.y2) ** 2);
			if (endDistance < 15) return 'end';
		} else if (selectedItem.type === 'angle') {
			const angle = selectedItem.data;
			// Check if touching point1 handle
			const distance1 = Math.sqrt(
				(x - angle.point1.x) ** 2 + (y - angle.point1.y) ** 2
			);
			if (distance1 < 15) return 'point1';

			// Check if touching point2 handle
			const distance2 = Math.sqrt(
				(x - angle.point2.x) ** 2 + (y - angle.point2.y) ** 2
			);
			if (distance2 < 15) return 'point2';

			// Check if touching vertex handle
			const vertexDistance = Math.sqrt(
				(x - angle.vertex.x) ** 2 + (y - angle.vertex.y) ** 2
			);
			if (vertexDistance < 15) return 'vertex';
		} else if (selectedItem.type === 'rectangle') {
			const rect = selectedItem.data;
			// Check corner handles
			const corners = [
				{ x: rect.x, y: rect.y, handle: 'topLeft' },
				{ x: rect.x + rect.width, y: rect.y, handle: 'topRight' },
				{ x: rect.x, y: rect.y + rect.height, handle: 'bottomLeft' },
				{
					x: rect.x + rect.width,
					y: rect.y + rect.height,
					handle: 'bottomRight',
				},
			];

			for (const corner of corners) {
				const distance = Math.sqrt((x - corner.x) ** 2 + (y - corner.y) ** 2);
				if (distance < 15) return corner.handle;
			}

			// Check edge handles
			const edges = [
				{ x: rect.x + rect.width / 2, y: rect.y, handle: 'top' },
				{
					x: rect.x + rect.width / 2,
					y: rect.y + rect.height,
					handle: 'bottom',
				},
				{ x: rect.x, y: rect.y + rect.height / 2, handle: 'left' },
				{
					x: rect.x + rect.width,
					y: rect.y + rect.height / 2,
					handle: 'right',
				},
			];

			for (const edge of edges) {
				const distance = Math.sqrt((x - edge.x) ** 2 + (y - edge.y) ** 2);
				if (distance < 15) return edge.handle;
			}
		}

		return null;
	};

	const handleResize = (x, y) => {
		if (!selectedItem) return;

		if (selectedItem.type === 'circle' && resizeHandle === 'radius') {
			const circle = selectedItem.data;
			const newRadius = Math.sqrt((x - circle.cx) ** 2 + (y - circle.cy) ** 2);
			const updatedCircle = { ...circle, r: Math.max(newRadius, 5) };

			setCircles((prevCircles) =>
				prevCircles.map((c, i) =>
					i === selectedItem.index ? updatedCircle : c
				)
			);
			setSelectedItem({ ...selectedItem, data: updatedCircle });
		} else if (selectedItem.type === 'line') {
			const line = selectedItem.data;
			let updatedLine;

			if (resizeHandle === 'start') {
				updatedLine = { ...line, x1: x, y1: y };
			} else if (resizeHandle === 'end') {
				updatedLine = { ...line, x2: x, y2: y };
			}

			if (updatedLine) {
				setLines((prevLines) =>
					prevLines.map((l, i) => (i === selectedItem.index ? updatedLine : l))
				);
				setSelectedItem({ ...selectedItem, data: updatedLine });
			}
		} else if (selectedItem.type === 'arrow') {
			const arrow = selectedItem.data;
			let updatedArrow;

			if (resizeHandle === 'start') {
				updatedArrow = { ...arrow, x1: x, y1: y };
			} else if (resizeHandle === 'end') {
				updatedArrow = { ...arrow, x2: x, y2: y };
			}

			if (updatedArrow) {
				setArrows((prevArrows) =>
					prevArrows.map((a, i) =>
						i === selectedItem.index ? updatedArrow : a
					)
				);
				setSelectedItem({ ...selectedItem, data: updatedArrow });
			}
		} else if (selectedItem.type === 'angle') {
			const angle = selectedItem.data;
			let updatedAngle;

			if (resizeHandle === 'point1') {
				updatedAngle = { ...angle, point1: { x, y } };
			} else if (resizeHandle === 'point2') {
				updatedAngle = { ...angle, point2: { x, y } };
			} else if (resizeHandle === 'vertex') {
				const dx = x - angle.vertex.x;
				const dy = y - angle.vertex.y;
				updatedAngle = {
					vertex: { x, y },
					point1: { x: angle.point1.x + dx, y: angle.point1.y + dy },
					point2: { x: angle.point2.x + dx, y: angle.point2.y + dy },
				};
			}

			if (updatedAngle) {
				setAngles((prevAngles) =>
					prevAngles.map((a, i) =>
						i === selectedItem.index ? updatedAngle : a
					)
				);
				setSelectedItem({ ...selectedItem, data: updatedAngle });
			}
		} else if (selectedItem.type === 'rectangle') {
			const rect = selectedItem.data;
			let updatedRect = { ...rect };

			switch (resizeHandle) {
				case 'topLeft':
					updatedRect = {
						x: x,
						y: y,
						width: rect.x + rect.width - x,
						height: rect.y + rect.height - y,
					};
					break;
				case 'topRight':
					updatedRect = {
						...rect,
						y: y,
						width: x - rect.x,
						height: rect.y + rect.height - y,
					};
					break;
				case 'bottomLeft':
					updatedRect = {
						...rect,
						x: x,
						width: rect.x + rect.width - x,
						height: y - rect.y,
					};
					break;
				case 'bottomRight':
					updatedRect = {
						...rect,
						width: x - rect.x,
						height: y - rect.y,
					};
					break;
				case 'top':
					updatedRect = {
						...rect,
						y: y,
						height: rect.y + rect.height - y,
					};
					break;
				case 'bottom':
					updatedRect = {
						...rect,
						height: y - rect.y,
					};
					break;
				case 'left':
					updatedRect = {
						...rect,
						x: x,
						width: rect.x + rect.width - x,
					};
					break;
				case 'right':
					updatedRect = {
						...rect,
						width: x - rect.x,
					};
					break;
			}

			// Ensure minimum size and correct negative dimensions
			if (updatedRect.width < 0) {
				updatedRect.x = updatedRect.x + updatedRect.width;
				updatedRect.width = Math.abs(updatedRect.width);
			}
			if (updatedRect.height < 0) {
				updatedRect.y = updatedRect.y + updatedRect.height;
				updatedRect.height = Math.abs(updatedRect.height);
			}
			updatedRect.width = Math.max(updatedRect.width, 10);
			updatedRect.height = Math.max(updatedRect.height, 10);

			setRectangles((prevRectangles) =>
				prevRectangles.map((r, i) =>
					i === selectedItem.index ? updatedRect : r
				)
			);
			setSelectedItem({ ...selectedItem, data: updatedRect });
		}
	};

	// Tray drag gesture
	const panGesture = Gesture.Pan()
		.minDistance(1)
		.onUpdate((event) => {
			translateX.value = offsetX.value + event.translationX;
			translateY.value = offsetY.value + event.translationY;
		})
		.onEnd(() => {
			offsetX.value = translateX.value;
			offsetY.value = translateY.value;

			const minX = 0;
			const maxX = SCREEN_WIDTH - 160; // Correct tray width (160px)
			const minY = 0;
			const maxY = SCREEN_HEIGHT - 170; // Correct tray height (170px)

			translateX.value = withSpring(
				Math.min(Math.max(translateX.value, minX), maxX),
				{ damping: 20, stiffness: 200 }
			);
			translateY.value = withSpring(
				Math.min(Math.max(translateY.value, minY), maxY),
				{ damping: 20, stiffness: 200 }
			);

			offsetX.value = translateX.value;
			offsetY.value = translateY.value;
		});

	// Camera drag gesture
	const panCameraGesture = Gesture.Pan()
		.minDistance(1)
		.onUpdate((event) => {
			cameraTranslateX.value = cameraOffsetX.value + event.translationX;
			cameraTranslateY.value = cameraOffsetY.value + event.translationY;
		})
		.onEnd(() => {
			cameraOffsetX.value = cameraTranslateX.value;
			cameraOffsetY.value = cameraTranslateY.value;

			const minX = 0;
			const maxX = SCREEN_WIDTH - 160; // Correct tray width (160px)
			const minY = 0;
			const maxY = SCREEN_HEIGHT - 270; // Correct tray height (270px)

			cameraTranslateX.value = withSpring(
				Math.min(Math.max(cameraTranslateX.value, minX), maxX),
				{ damping: 20, stiffness: 200 }
			);
			cameraTranslateY.value = withSpring(
				Math.min(Math.max(cameraTranslateY.value, minY), maxY),
				{ damping: 20, stiffness: 200 }
			);

			cameraOffsetX.value = cameraTranslateX.value;
			cameraOffsetY.value = cameraTranslateY.value;
		});

	const animatedStyles = useAnimatedStyle(() => {
		'worklet';
		return {
			transform: [
				{ translateX: translateX.value },
				{ translateY: translateY.value },
			],
		} as any;
	});

	const cameraAnimatedStyles = useAnimatedStyle(() => {
		'worklet';
		return {
			transform: [
				{ translateX: cameraTranslateX.value },
				{ translateY: cameraTranslateY.value },
			],
		} as any;
	});

	const clearCanvas = () => {
		setPaths([]);
		setCircles([]);
		setLines([]);
		setArrows([]);
		setAngles([]);
		setRectangles([]);
		setCurrentPath('');
		setTempCircle(null);
		setTempLine(null);
		setTempArrow(null);
		setTempAngle(null);
		setTempRectangle(null);
		setDrawingHistory([]);
		setSelectedItem(null);
	};

	const undoLast = () => {
		if (drawingHistory.length === 0) return;

		const lastDrawing = drawingHistory[drawingHistory.length - 1];

		if (lastDrawing.type === 'path') {
			setPaths((prevPaths) => prevPaths.slice(0, -1));
		} else if (lastDrawing.type === 'circle') {
			setCircles((prevCircles) => prevCircles.slice(0, -1));
		} else if (lastDrawing.type === 'line') {
			setLines((prevLines) => prevLines.slice(0, -1));
		} else if (lastDrawing.type === 'arrow') {
			setArrows((prevArrows) => prevArrows.slice(0, -1));
		} else if (lastDrawing.type === 'angle') {
			setAngles((prevAngles) => prevAngles.slice(0, -1));
		} else if (lastDrawing.type === 'rectangle') {
			setRectangles((prevRectangles) => prevRectangles.slice(0, -1));
		}

		setDrawingHistory((prevHistory) => prevHistory.slice(0, -1));
		setSelectedItem(null);
	};

	const renderResizeHandles = () => {
		if (!selectedItem) return null;

		if (selectedItem.type === 'circle') {
			const circle = selectedItem.data;
			return (
				<Circle
					cx={circle.cx + circle.r}
					cy={circle.cy}
					r="6"
					fill="#4CAF50"
					stroke="#fff"
					strokeWidth="2"
				/>
			);
		} else if (selectedItem.type === 'line') {
			const line = selectedItem.data;
			return (
				<>
					<Circle
						cx={line.x1}
						cy={line.y1}
						r="6"
						fill="#4CAF50"
						stroke="#fff"
						strokeWidth="2"
					/>
					<Circle
						cx={line.x2}
						cy={line.y2}
						r="6"
						fill="#4CAF50"
						stroke="#fff"
						strokeWidth="2"
					/>
				</>
			);
		} else if (selectedItem.type === 'arrow') {
			const arrow = selectedItem.data;
			return (
				<>
					<Circle
						cx={arrow.x1}
						cy={arrow.y1}
						r="6"
						fill="#4CAF50"
						stroke="#fff"
						strokeWidth="2"
					/>
					<Circle
						cx={arrow.x2}
						cy={arrow.y2}
						r="6"
						fill="#4CAF50"
						stroke="#fff"
						strokeWidth="2"
					/>
				</>
			);
		} else if (selectedItem.type === 'angle') {
			const angle = selectedItem.data;
			return (
				<>
					<Circle
						cx={angle.vertex.x}
						cy={angle.vertex.y}
						r="8"
						fill="#4CAF50"
						stroke="#fff"
						strokeWidth="2"
					/>
					<Circle
						cx={angle.point1.x}
						cy={angle.point1.y}
						r="6"
						fill="#4CAF50"
						stroke="#fff"
						strokeWidth="2"
					/>
					<Circle
						cx={angle.point2.x}
						cy={angle.point2.y}
						r="6"
						fill="#4CAF50"
						stroke="#fff"
						strokeWidth="2"
					/>
				</>
			);
		} else if (selectedItem.type === 'rectangle') {
			const rect = selectedItem.data;
			return (
				<>
					{/* Corner handles */}
					<Circle
						cx={rect.x}
						cy={rect.y}
						r="6"
						fill="#4CAF50"
						stroke="#fff"
						strokeWidth="2"
					/>
					<Circle
						cx={rect.x + rect.width}
						cy={rect.y}
						r="6"
						fill="#4CAF50"
						stroke="#fff"
						strokeWidth="2"
					/>
					<Circle
						cx={rect.x}
						cy={rect.y + rect.height}
						r="6"
						fill="#4CAF50"
						stroke="#fff"
						strokeWidth="2"
					/>
					<Circle
						cx={rect.x + rect.width}
						cy={rect.y + rect.height}
						r="6"
						fill="#4CAF50"
						stroke="#fff"
						strokeWidth="2"
					/>
					{/* Edge handles */}
					<Circle
						cx={rect.x + rect.width / 2}
						cy={rect.y}
						r="4"
						fill="#4CAF50"
						stroke="#fff"
						strokeWidth="1"
					/>
					<Circle
						cx={rect.x + rect.width / 2}
						cy={rect.y + rect.height}
						r="4"
						fill="#4CAF50"
						stroke="#fff"
						strokeWidth="1"
					/>
					<Circle
						cx={rect.x}
						cy={rect.y + rect.height / 2}
						r="4"
						fill="#4CAF50"
						stroke="#fff"
						strokeWidth="1"
					/>
					<Circle
						cx={rect.x + rect.width}
						cy={rect.y + rect.height / 2}
						r="4"
						fill="#4CAF50"
						stroke="#fff"
						strokeWidth="1"
					/>
				</>
			);
		}
	};

	// Video picker
	const handlePlusClick = async () => {
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ['videos'],
			allowsEditing: false,
			videoQuality: 1,
		});

		if (!result.canceled) {
			const newVideos = [...videos];
			const selectedUri = result?.assets[0]?.uri;

			// ✅ Condition 1: First slot empty → fill slot 0
			if (!newVideos[0]?.uri) {
				newVideos[0] = { uri: selectedUri };
				setActiveFrame(0);

				// ✅ Condition 2: First slot filled but second empty → fill slot 1
			} else if (!newVideos[1]?.uri) {
				newVideos[1] = { uri: selectedUri };
				setActiveFrame(1);

				// ✅ Condition 3: Both filled → replace active frame
			} else {
				newVideos[activeFrame] = { uri: selectedUri };
			}

			setVideos(newVideos);
		}
	};

	// Control functions
	const handlePlayPause = () => {
		try {
			if (activeFrame === 2) {
				// Control both players
				if (isPlaying) {
					if (player && typeof player.pause === 'function') player.pause();
					if (playerTwo && typeof playerTwo.pause === 'function')
						playerTwo.pause();
				} else {
					if (player && typeof player.play === 'function') player.play();
					if (playerTwo && typeof playerTwo.play === 'function')
						playerTwo.play();
				}
			} else {
				// Control only the active frame
				const activePlayer = activeFrame === 0 ? player : playerTwo;
				if (activePlayer) {
					if (isPlaying && typeof activePlayer.pause === 'function') {
						activePlayer.pause();
					} else if (!isPlaying && typeof activePlayer.play === 'function') {
						activePlayer.play();
					}
				}
			}
			setIsPlaying(!isPlaying);
		} catch (error) {
			console.warn('Play/Pause operation failed:', error);
			// Still toggle the UI state for user feedback
			setIsPlaying(!isPlaying);
		}
	};

	const handleSeek = (time: number) => {
		try {
			if (activeFrame === 2) {
				// Seek both players with null checks and error handling
				if (player && typeof player.currentTime !== 'undefined') {
					player.currentTime = time;
				}
				if (playerTwo && typeof playerTwo.currentTime !== 'undefined') {
					playerTwo.currentTime = time;
				}
			} else {
				// Seek only the active frame
				const activePlayer = activeFrame === 0 ? player : playerTwo;
				if (activePlayer && typeof activePlayer.currentTime !== 'undefined') {
					activePlayer.currentTime = time;
				}
			}
			setCurrentTime(time);
		} catch (error) {
			console.warn('Seek operation failed:', error);
			// Fallback: just update the UI state
			setCurrentTime(time);
		}
	};

	const toggleVideoMirror = () => {
		// Only allow mirroring for activeFrame 0 or 1
		if (activeFrame === 0 || activeFrame === 1) {
			setVideoMirrored(!videoMirrored);
		}
	};

	const handleSkipBack = (seconds: number = 10) => {
		const newTime = Math.max(0, currentTime - seconds);
		handleSeek(newTime);
	};

	const handleSkipForward = (seconds: number = 10) => {
		const newTime = Math.min(duration, currentTime + seconds);
		handleSeek(newTime);
	};

	// Throuth
	const throttledSeek = useCallback(
		throttle((time: number) => {
			handleSeek(time);
		}, 100), // Update every 100ms during drag
		[handleSeek]
	);

	// Save screenshot
	const onSaveImageAsync = async () => {
		try {
			if (!imageRef.current) {
				console.log('View ref is not available');
				return;
			}

			const localUri = await captureRef(imageRef, {
				height: CANVAS_HEIGHT,
				quality: 1,
				format: 'png',
			});

			await MediaLibrary.saveToLibraryAsync(localUri);
			if (localUri) {
				alert('Saved!');
			}
		} catch (e) {
			console.error('Error saving image:', e);
			alert('Failed to save image: ' + e.message);
		}
	};

	useEffect(() => {
		if (!permissionResponse?.granted) {
			requestPermission();
		}
		if (!cameraPermission?.granted) {
			requestCameraPermission();
		}
	}, []);

	// Reset mirror state when activeFrame changes to 2
	useEffect(() => {
		if (activeFrame === 2) {
			setVideoMirrored(false);
		}
	}, [activeFrame]);

	// Sync currentTime when activeFrame changes
	useEffect(() => {
		if (activeFrame === 0 && player && player.currentTime !== undefined) {
			setCurrentTime(player.currentTime);
		} else if (
			activeFrame === 1 &&
			playerTwo &&
			playerTwo.currentTime !== undefined
		) {
			setCurrentTime(playerTwo.currentTime);
		} else if (activeFrame === 2) {
			// For both frames, use the current time of the first available player
			if (player && player.currentTime !== undefined) {
				setCurrentTime(player.currentTime);
			} else if (playerTwo && playerTwo.currentTime !== undefined) {
				setCurrentTime(playerTwo.currentTime);
			}
		}
	}, [activeFrame, player, playerTwo]);

	// Android permission handling for the native file integration
	const requestPermissions = async () => {
		try {
			if (Platform.OS !== 'android') {
				return true;
			}

			// Request audio permission
			const audioPermission = await PermissionsAndroid.request(
				PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
				{
					title: 'Audio Recording Permission',
					message: 'This app needs access to your microphone to record audio.',
					buttonNeutral: 'Ask Me Later',
					buttonNegative: 'Cancel',
					buttonPositive: 'OK',
				}
			);

			if (audioPermission !== PermissionsAndroid.RESULTS.GRANTED) {
				console.log('Audio permission denied');
				return false;
			}

			// For Android 13+ (API 33+), we don't need WRITE_EXTERNAL_STORAGE
			// For Android 12 and below, request storage permission
			const androidVersion = Platform.Version;
			if (androidVersion < 33) {
				const storagePermission = await PermissionsAndroid.request(
					PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
					{
						title: 'Storage Permission',
						message: 'This app needs access to your storage to save videos.',
						buttonNeutral: 'Ask Me Later',
						buttonNegative: 'Cancel',
						buttonPositive: 'OK',
					}
				);

				if (storagePermission !== PermissionsAndroid.RESULTS.GRANTED) {
					console.log('Storage permission denied');
					return false;
				}
			}

			console.log('All permissions granted');
			return true;
		} catch (err) {
			console.error('Error requesting permissions:', err);
			return false;
		}
	};

	useEffect(() => {
		if (Platform.OS === 'android') {
			requestPermissions();
		}
		// Request screen recording permissions
		ScreenRecorder.requestPermissions().catch((err) => {
			console.error('Failed to request screen recording permissions:', err);
		});
	}, []);

	// Handle recording start
	const handleStart = async () => {
		// Show instructions for Android users
		if (Platform.OS === 'android') {
			Alert.alert(
				'Screen Recording Instructions',
				'When prompted:\n\n1. Tap "Start now"\n2. Select "Entire screen"\n3. Recording will begin automatically',
				[
					{
						text: 'Cancel',
						style: 'cancel',
					},
					{
						text: 'Continue',
						onPress: async () => {
							await startRecordingProcess();
						},
					},
				]
			);
		} else {
			await startRecordingProcess();
		}
	};

	const startRecordingProcess = async () => {
		try {
			console.log('Starting screen recording...');

			// Calculate crop areas
			// Top area: header menu (approximately 60-80 pixels)
			const cropTop = 80;
			// Bottom area: video controls and menu (approximately 180-200 pixels)
			const cropBottom = 180;

			await ScreenRecorder.startRecording(cropTop, cropBottom);
			setIsRecording(true);
			console.log('Screen recording started successfully');
		} catch (error: any) {
			console.error('Failed to start recording:', error);

			// Provide helpful error message
			let errorMessage = 'Failed to start recording';
			if (
				error?.message?.includes('cancelled') ||
				error?.message?.includes('Entire screen')
			) {
				errorMessage =
					'Recording cancelled. Please select "Entire screen" option when you try again.';
			} else if (error?.message) {
				errorMessage = error.message;
			}

			Alert.alert('Recording Error', errorMessage);
		}
	};

	// Handle stop recording
	const handleStop = async () => {
		try {
			console.log('Stopping screen recording...');
			setIsProcessingVideo(true);
			await ScreenRecorder.stopRecording();
			setIsRecording(false);
			setIsProcessingVideo(false);
			console.log('Screen recording stopped successfully');
			Alert.alert('Success', 'Recording saved to gallery');
		} catch (error) {
			console.error('Failed to stop recording:', error);
			setIsProcessingVideo(false);
			Alert.alert('Error', 'Failed to stop recording: ' + error);
		}
	};

	return (
		<SafeAreaView
			style={{ flex: 1, backgroundColor: '#000' }}
			edges={['top', 'bottom']}
		>
			{/* Header section */}
			<View style={styles.headerMenuContainer}>
				<Pressable
					disabled={drawingHistory.length === 0}
					onPress={undoLast}
					style={styles.reverseBtnContainer}
				>
					<ReverseBtnSvg
						color={drawingHistory.length === 0 ? '#959494ff' : '#fff'}
					/>
				</Pressable>

				<View style={styles.headerRightContainer}>
					<Pressable disabled={drawingHistory.length === 0} onPress={undoLast}>
						<Text
							style={[
								styles.headerRightMenu,
								{ color: drawingHistory.length === 0 ? '#959494ff' : '#fff' },
							]}
						>
							Revert
						</Text>
					</Pressable>
					<Pressable
						onPress={clearCanvas}
						disabled={drawingHistory.length === 0}
					>
						<Text
							style={[
								styles.headerRightMenu,
								{ color: drawingHistory.length === 0 ? '#959494ff' : '#fff' },
							]}
						>
							Delete
						</Text>
					</Pressable>
					<Pressable onPress={() => setKebab((previous) => !previous)}>
						<KebabSvg />
					</Pressable>
				</View>
			</View>
			{/* Video & Canvas section */}
			<View style={{ flex: 1 }}>
				<View style={{ flex: 1 }} ref={imageRef} collapsable={false}>
					{/* Video section */}
					<View style={styles.videoColumn}>
						{/* Frame 1 */}
						<View style={styles.videoFrame}>
							{videos[0]?.uri ? (
								<VideoView
									player={player}
									style={
										videoMirrored && activeFrame === 0
											? styles.videoMirrored
											: styles.video
									}
									contentFit="contain"
									nativeControls={false}
								/>
							) : (
								<View style={styles.emptyFrame} />
							)}
						</View>
						{/* Frame 2 */}
						<View style={styles.videoFrame}>
							{videos[1]?.uri ? (
								<VideoView
									player={playerTwo}
									style={
										videoMirrored && activeFrame === 1
											? styles.videoMirrored
											: styles.video
									}
									contentFit="contain"
									nativeControls={false}
								/>
							) : (
								<View style={styles.emptyFrame} />
							)}
						</View>
					</View>
					{/* Canvas section for drawing - handles touch events */}
					<View
						style={styles.canvasOverlay}
						onTouchMove={onTouchMove}
						onTouchEnd={onTouchEnd}
						onTouchStart={onTouchStart}
					>
						<Svg
							width={SCREEN_WIDTH}
							height={CANVAS_HEIGHT}
							style={{ backgroundColor: 'transparent' }}
						>
							{/* Render completed paths */}
							{paths.map((pathData, index) => (
								<Path
									key={`completed-path-${index}`}
									d={pathData}
									stroke={currentColor}
									fill="transparent"
									strokeWidth={2}
									strokeLinejoin="round"
									strokeLinecap="round"
								/>
							))}

							{/* Render completed circles */}
							{circles.map((circle, index) => (
								<Circle
									key={`completed-circle-${index}`}
									cx={circle.cx}
									cy={circle.cy}
									r={circle.r}
									stroke={currentColor}
									fill="transparent"
									strokeWidth={
										selectedItem?.type === 'circle' &&
										selectedItem?.index === index
											? 3
											: 2
									}
								/>
							))}

							{/* Render completed lines */}
							{lines.map((line, index) => (
								<Line
									key={`completed-line-${index}`}
									x1={line.x1}
									y1={line.y1}
									x2={line.x2}
									y2={line.y2}
									stroke={currentColor}
									strokeWidth={
										selectedItem?.type === 'line' &&
										selectedItem?.index === index
											? 3
											: 2
									}
									strokeLinecap="round"
								/>
							))}

							{/* Render completed arrows */}
							{arrows.map((arrow, index) => (
								<Path
									key={`completed-arrow-${index}`}
									d={createArrowPath(arrow.x1, arrow.y1, arrow.x2, arrow.y2)}
									stroke={currentColor}
									fill="transparent"
									strokeWidth={
										selectedItem?.type === 'arrow' &&
										selectedItem?.index === index
											? 3
											: 2
									}
									strokeLinejoin="round"
									strokeLinecap="round"
								/>
							))}

							{/* Render completed angles */}
							{angles.map((angle, index) => {
								const isSelected =
									selectedItem?.type === 'angle' &&
									selectedItem?.index === index;
								return (
									<G key={`completed-angle-${index}`}>
										{renderAngle(angle, currentColor, false, isSelected)}
									</G>
								);
							})}

							{/* Render completed rectangles */}
							{rectangles.map((rect, index) => (
								<Rect
									key={`completed-rectangle-${index}`}
									x={rect.x}
									y={rect.y}
									width={rect.width}
									height={rect.height}
									stroke={currentColor}
									fill="transparent"
									strokeWidth={
										selectedItem?.type === 'rectangle' &&
										selectedItem?.index === index
											? 3
											: 2
									}
								/>
							))}

							{/* Render current path being drawn */}
							{currentTool === 'freedraw' && currentPath.length > 0 && (
								<Path
									d={currentPath}
									stroke={currentColor}
									fill="transparent"
									strokeWidth={2}
									strokeLinejoin="round"
									strokeLinecap="round"
								/>
							)}

							{/* Render temporary circle being drawn */}
							{currentTool === 'circle' && tempCircle && tempCircle.r > 0 && (
								<Circle
									cx={tempCircle.cx}
									cy={tempCircle.cy}
									r={tempCircle.r}
									stroke={currentColor}
									fill="transparent"
									strokeWidth={2}
									strokeDasharray="5,5"
								/>
							)}

							{/* Render temporary line being drawn */}
							{currentTool === 'line' && tempLine && (
								<Line
									x1={tempLine.x1}
									y1={tempLine.y1}
									x2={tempLine.x2}
									y2={tempLine.y2}
									stroke={currentColor}
									strokeWidth={2}
									strokeDasharray="5,5"
									strokeLinecap="round"
								/>
							)}

							{/* Render temporary arrow being drawn */}
							{currentTool === 'arrow' && tempArrow && (
								<Path
									d={createArrowPath(
										tempArrow.x1,
										tempArrow.y1,
										tempArrow.x2,
										tempArrow.y2
									)}
									stroke={currentColor}
									fill="transparent"
									strokeWidth={2}
									strokeDasharray="5,5"
									strokeLinejoin="round"
									strokeLinecap="round"
								/>
							)}

							{/* Temporary angle (while drawing) */}
							{currentTool === 'angle' && tempAngle && (
								<G>{renderAngle(tempAngle, currentColor, true)}</G>
							)}

							{/* Render temporary rectangle being drawn */}
							{currentTool === 'rectangle' && tempRectangle && (
								<Rect
									x={Math.min(
										rectangleStart.x,
										rectangleStart.x + tempRectangle.width
									)}
									y={Math.min(
										rectangleStart.y,
										rectangleStart.y + tempRectangle.height
									)}
									width={Math.abs(tempRectangle.width)}
									height={Math.abs(tempRectangle.height)}
									stroke={currentColor}
									fill="transparent"
									strokeWidth={2}
									strokeDasharray="5,5"
								/>
							)}

							{/* Render resize handles */}
							{renderResizeHandles()}
						</Svg>
					</View>
					{/* Camera tray */}
					{openCamera && (
						<GestureDetector gesture={panCameraGesture}>
							<Animated.View
								style={[cameraAnimatedStyles, styles.cameraTrayContainer]}
							>
								<CameraView style={styles.camera} facing={facing} />
								<Pressable
									onPress={() =>
										setFacing((current) =>
											current === 'back' ? 'front' : 'back'
										)
									}
									style={styles.flipCameraBtn}
								>
									<CamersFlipSvg />
								</Pressable>
							</Animated.View>
						</GestureDetector>
					)}
				</View>
			</View>
			{/* Tool Tray */}
			{toolsTrayOpen && (
				<GestureDetector gesture={panGesture}>
					<Animated.View style={[animatedStyles, styles.trayContainer]}>
						<View style={styles.toolRow}>
							{/* Line tool */}
							<Pressable
								onPress={() => {
									setCurrentTool('line');
									setSelectedItem(null);
								}}
							>
								<DrawLineSvg
									color={currentTool === 'line' ? currentColor : '#FFF'}
								/>
							</Pressable>
							{/* Arrow line tool */}
							<Pressable
								onPress={() => {
									setCurrentTool('arrow');
									setSelectedItem(null);
								}}
							>
								<DrawArrowSvg
									color={currentTool === 'arrow' ? currentColor : '#FFF'}
								/>
							</Pressable>
							{/* Circle tool */}
							<Pressable
								onPress={() => {
									setCurrentTool('circle');
									setSelectedItem(null);
								}}
							>
								<DrawCircleSvg
									color={currentTool === 'circle' ? currentColor : '#FFF'}
								/>
							</Pressable>
							{/* Free draw */}
							<Pressable
								onPress={() => {
									setCurrentTool('freedraw');
									setSelectedItem(null);
								}}
							>
								<DrawFreeSvg
									color={currentTool === 'freedraw' ? currentColor : '#FFF'}
								/>
							</Pressable>
							{/* Angle draw */}
							<Pressable
								onPress={() => {
									setCurrentTool('angle');
									setSelectedItem(null);
								}}
							>
								<DrawAngleSvg
									color={currentTool === 'angle' ? currentColor : '#FFF'}
								/>
							</Pressable>
							{/* rectangle draw */}
							<Pressable
								onPress={() => {
									setCurrentTool('rectangle');
									setSelectedItem(null);
								}}
							>
								<DrawRectangleSvg
									color={currentTool === 'rectangle' ? currentColor : '#FFF'}
								/>
							</Pressable>
							{/* Mirror video icon - only active for frame 1 or 2 */}
							<Pressable
								onPress={toggleVideoMirror}
								style={{
									opacity: activeFrame === 0 || activeFrame === 1 ? 1 : 0.3,
								}}
							>
								<FlipSvg />
							</Pressable>
						</View>
					</Animated.View>
				</GestureDetector>
			)}
			{/* controls section */}
			<View style={styles.videoContainerWrapper}>
				<MenusControl
					handlePlusClick={handlePlusClick}
					setToolsTrayState={() => setToolsTray((prev) => !prev)}
					toolsTrayOpen={toolsTrayOpen}
					openCamera={openCamera}
					setCameraState={() => setCamera((prev) => !prev)}
					takeSnapShot={onSaveImageAsync}
					isRecording={isRecording}
					toggleRecording={isRecording ? handleStop : handleStart}
					disabled={isProcessingVideo}
				/>
				<VideoControl
					handleSeek={handleSeek}
					handleSkipBack={handleSkipBack}
					handleSkipForward={handleSkipForward}
					handlePlayPause={handlePlayPause}
					activeFrame={activeFrame}
					setActiveFrame={setActiveFrame}
					duration={
						activeFrame === 0
							? duration1
							: activeFrame === 1
							? duration2
							: Math.max(duration1, duration2)
					}
					currentTime={currentTime}
					isPlaying={isPlaying}
				/>
			</View>
			{/* Kebab section */}
			{kebabOpen && (
				<View style={styles.kebabMenuContainer}>
					<Pressable onPress={() => null}>
						<Text style={styles.kebabMenuText}>Delete Video</Text>
					</Pressable>
					<Pressable onPress={() => null}>
						<Text style={styles.kebabMenuText}>Share Video</Text>
					</Pressable>
				</View>
			)}
			{/* Processing overlay */}
			{isProcessingVideo && (
				<View style={styles.processingOverlay}>
					<View style={styles.processingContainer}>
						<ActivityIndicator size="large" color="#FF5E5C" />
						<Text style={styles.processingText}>Processing Video...</Text>
						<Text style={styles.processingSubtext}>
							Cropping and saving to gallery
						</Text>
					</View>
				</View>
			)}
		</SafeAreaView>
	);
};

export default Entry;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		position: 'relative',
	},
	headerMenuContainer: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		flexDirection: 'row',
		paddingHorizontal: 20,
		marginVertical: 10,
		backgroundColor: '#000',
	},
	headerRightContainer: {
		display: 'flex',
		alignItems: 'center',
		flexDirection: 'row',
		gap: 40,
	},
	headerRightMenu: {
		fontSize: 16,
		fontWeight: 500,
		color: '#FFFFFF',
	},
	reverseBtnContainer: {
		backgroundColor: '#2D2C2C',
		width: 36,
		height: 36,
		borderRadius: 18,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
	},
	kebabMenuContainer: {
		position: 'absolute',
		top: 50,
		right: 40,
		backgroundColor: '#2D2C2C',
		width: 176,
		paddingHorizontal: 20,
		paddingVertical: 20,
		display: 'flex',
		gap: 20,
		borderRadius: 8,
		zIndex: 20,
	},
	kebabMenuText: {
		fontSize: 12,
		fontWeight: 400,
		color: '#F6F6F6',
	},
	video: {
		width: '100%',
		height: '100%',
	},
	videoMirrored: {
		width: '100%',
		height: '100%',
		transform: [{ scaleX: -1 }],
	},
	emptyFrame: {
		width: '100%',
		height: '100%',
	},
	videoColumn: {
		flexDirection: 'column',
		alignItems: 'center',
		height: SCREEN_HEIGHT - 240,
		width: SCREEN_WIDTH,
	},
	videoFrame: {
		width: SCREEN_WIDTH,
		height: '50%',
	},
	videoContainerWrapper: {
		display: 'flex',
		alignItems: 'center',
		gap: 30,
		marginBottom: 15,
		backgroundColor: '#000',
	},
	trayContainer: {
		position: 'absolute',
		top: 0,
		left: 0,
		width: 200,
		height: 190,
		backgroundColor: '#2D2C2C',
		borderRadius: 16,
		paddingHorizontal: 10,
		paddingVertical: 10,
		shadowColor: '#000',
		shadowOpacity: 0.25,
		shadowOffset: { width: 0, height: 2 },
		shadowRadius: 6,
		elevation: 10,
		zIndex: 30,
	},
	toolRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 13,
		flexWrap: 'wrap',
		width: '100%',
		paddingHorizontal: 8,
	},

	// Svg styling
	canvasOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		height: SCREEN_HEIGHT - 240,
		width: SCREEN_WIDTH,
		backgroundColor: 'transparent',
	},

	// Camera tray
	cameraTrayContainer: {
		position: 'absolute',
		top: 0,
		left: 0,
		width: 320,
		height: 270,
		backgroundColor: '#2D2C2C',
		borderRadius: 16,
		shadowColor: '#000',
		shadowOpacity: 0.25,
		shadowOffset: { width: 0, height: 2 },
		shadowRadius: 6,
		elevation: 10,
		zIndex: 30,
	},
	camera: {
		flex: 1,
		borderRadius: 16,
		width: 320,
		height: 270,
	},
	flipCameraBtn: {
		position: 'absolute',
		top: 20,
		right: 20,
	},

	// Processing overlay
	processingOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: 'rgba(0, 0, 0, 0.85)',
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 1000,
	},
	processingContainer: {
		backgroundColor: '#2D2C2C',
		borderRadius: 16,
		padding: 30,
		alignItems: 'center',
		shadowColor: '#000',
		shadowOpacity: 0.5,
		shadowOffset: { width: 0, height: 4 },
		shadowRadius: 10,
		elevation: 20,
	},
	processingText: {
		color: '#FFFFFF',
		fontSize: 20,
		fontWeight: '600',
		marginTop: 20,
		marginBottom: 10,
	},
	processingSubtext: {
		color: '#AAAAAA',
		fontSize: 14,
		fontWeight: '400',
		textAlign: 'center',
	},
});
