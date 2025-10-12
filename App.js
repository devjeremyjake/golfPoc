import { StatusBar } from 'expo-status-bar';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import DrawingApp from './Entry';

export default function App() {
	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<DrawingApp />
			<StatusBar style="auto" />
		</GestureHandlerRootView>
	);
}
