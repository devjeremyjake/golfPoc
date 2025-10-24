import { requireNativeView } from 'expo';
import * as React from 'react';

import { ScreenRecorderViewProps } from './ScreenRecorder.types';

const NativeView: React.ComponentType<ScreenRecorderViewProps> =
  requireNativeView('ScreenRecorder');

export default function ScreenRecorderView(props: ScreenRecorderViewProps) {
  return <NativeView {...props} />;
}
