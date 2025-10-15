import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import DrawingApp from './Entry';

export default function App() {
	return (
		<SafeAreaProvider>
			<GestureHandlerRootView style={{ flex: 1 }}>
				<DrawingApp />
				<StatusBar style="auto" />
			</GestureHandlerRootView>
		</SafeAreaProvider>
	);
}
