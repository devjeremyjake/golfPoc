package expo.modules.screenrecorder

import android.app.Activity.RESULT_OK
import android.content.Context
import android.content.Intent
import android.media.projection.MediaProjectionManager
import android.os.Build
import androidx.annotation.RequiresApi
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.screenrecorder.ScreenRecordService.Companion.EXTRA_SCREEN_RECORD_CONFIG
import expo.modules.screenrecorder.ScreenRecordService.Companion.START_RECORDING
import expo.modules.screenrecorder.ScreenRecordService.Companion.STOP_RECORDING
import expo.modules.screenrecorder.ScreenRecordService.Companion.isServiceRunning
import kotlinx.coroutines.launch
import java.net.URL

@RequiresApi(Build.VERSION_CODES.O)
class ScreenRecorderModule : Module() {

  private val context get() = requireNotNull(appContext.reactContext) 
  private val activity get() = requireNotNull(appContext.activityProvider?.currentActivity)
  private val REQUEST_CODE_SCREEN_CAPTURE = 1002

  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  override fun definition() = ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('ScreenRecorder')` in JavaScript.
    Name("ScreenRecorder")
    // Defines constant property on the module.
    Constant("PI") {
      Math.PI
    }

    // Defines event names that the module can send to JavaScript.
    Events("onChange", "onRecordingStateChange")

    // Defines a JavaScript synchronous function that runs the native code on the JavaScript thread.
    Function("hello") {
      "Hello world! 👋"
    }

    // Defines a JavaScript function that always returns a Promise and whose native code
    // is by default dispatched on the different thread than the JavaScript runtime runs on.
    AsyncFunction("setValueAsync") { value: String ->
      // Send an event to JavaScript.
      sendEvent("onChange", mapOf(
        "value" to value
      ))
    }

    // Enables the module to be used as a native view. Definition components that are accepted as part of
    // the view definition: Prop, Events.
    View(ScreenRecorderView::class) {
      // Defines a setter for the `url` prop.
      Prop("url") { view: ScreenRecorderView, url: URL ->
        view.webView.loadUrl(url.toString())
      }
      // Defines an event that the view can send to JavaScript.
      Events("onLoad")
    }

        // recording function here
    Function("startStopRecording") {
      if(isServiceRunning.value) {
        Intent(
          context, ScreenRecordService::class.java
        ).also {
          it.action = STOP_RECORDING
          activity.startForegroundService(it)
        }
      } else {
        startScreenCapture()
      }
    }

    OnActivityResult { activity, onActivityResultPayload -> 
      if(onActivityResultPayload.requestCode == REQUEST_CODE_SCREEN_CAPTURE && onActivityResultPayload.resultCode == RESULT_OK) {
        val config = ScreenRecordConfig(onActivityResultPayload.resultCode, onActivityResultPayload.data!!)
        startScreenRecordService(config)
      }
    }

    OnCreate {
      // Observe recording state changes
      if (activity is LifecycleOwner) {
        (activity as LifecycleOwner).lifecycleScope.launch {
          (activity as LifecycleOwner).repeatOnLifecycle(Lifecycle.State.STARTED) {
            isServiceRunning.collect { isRecording ->
              sendEvent("onRecordingStateChange", mapOf(
                "isRecording" to isRecording
              ))
            }
          }
        }
      }
    }
  }

  private fun startScreenCapture() {
    val mediaProjectionManager = context.getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
    val captureIntent = mediaProjectionManager.createScreenCaptureIntent()
    activity.startActivityForResult(captureIntent, REQUEST_CODE_SCREEN_CAPTURE)
  }

  private fun startScreenRecordService(config: ScreenRecordConfig) {
    val ServiceIntent = Intent(
      context, ScreenRecordService::class.java
    ).apply {
      action = START_RECORDING
      putExtra(EXTRA_SCREEN_RECORD_CONFIG, config)
    }
    activity.startForegroundService(ServiceIntent)
  }
}