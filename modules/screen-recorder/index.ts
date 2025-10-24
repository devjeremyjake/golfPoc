// Reexport the native module. On web, it will be resolved to ScreenRecorderModule.web.ts
// and on native platforms to ScreenRecorderModule.ts
export { default } from './src/ScreenRecorderModule';
export { default as ScreenRecorderView } from './src/ScreenRecorderView';
export * from  './src/ScreenRecorder.types';
