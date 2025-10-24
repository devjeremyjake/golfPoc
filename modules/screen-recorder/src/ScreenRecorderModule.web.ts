import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload } from './ScreenRecorder.types';

type ScreenRecorderModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
}

class ScreenRecorderModule extends NativeModule<ScreenRecorderModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
};

export default registerWebModule(ScreenRecorderModule, 'ScreenRecorderModule');
