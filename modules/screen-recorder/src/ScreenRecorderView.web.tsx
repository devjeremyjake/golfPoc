import * as React from 'react';

import { ScreenRecorderViewProps } from './ScreenRecorder.types';

export default function ScreenRecorderView(props: ScreenRecorderViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
