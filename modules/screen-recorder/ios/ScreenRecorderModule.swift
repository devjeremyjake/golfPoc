import ExpoModulesCore
import ReplayKit
import AVKit

class PreviewControllerDelegate: NSObject, RPPreviewViewControllerDelegate {
  func previewControllerDidFinish(_ previewController: RPPreviewViewController) {
    previewController.dismiss(animated: true)
  }
}

public class ScreenRecorderModule: Module {
  private let screenRecorder = RPScreenRecorder.shared()
  private var myUrl: URL?
  private let previewDelegate = PreviewControllerDelegate()
  private var isCurrentlyRecording = false
  
  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  public func definition() -> ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('ScreenRecorder')` in JavaScript.
    Name("ScreenRecorder")

    // Defines constant property on the module.
    Constant("PI") {
      Double.pi
    }

    // Defines event names that the module can send to JavaScript.
    Events("onChange", "onRecordingStateChange")

    // Defines a JavaScript synchronous function that runs the native code on the JavaScript thread.
    Function("hello") {
      return "Hello world! 👋"
    }

    // Functions to handle screen recording and stop recording
    Function("startRecording") {
      if let documentDirectory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first {
        let uniqueFileName = "screen_recording_\(UUID().uuidString).mp4"
        let destinationUrl = documentDirectory.appendingPathComponent(uniqueFileName)
        myUrl = destinationUrl
        debugPrint("Recording will be saved to: \(destinationUrl)")
        screenRecorder.startRecording { error in
          if let error = error {
            debugPrint("Error starting recording: \(error.localizedDescription)")
            self.sendEvent("onRecordingStateChange", [
              "isRecording": false
            ])
          } else {
            debugPrint("Started recording successfully.")
            self.isCurrentlyRecording = true
            self.sendEvent("onRecordingStateChange", [
              "isRecording": true
            ])
          }
        }
      }
    }

    Function("stopRecording") {
     screenRecorder.stopRecording { previewViewController, error in
       if let error = error {
         debugPrint("Error stopping recording: \(error.localizedDescription)")
         self.sendEvent("onRecordingStateChange", [
           "isRecording": false
         ])
         return
       }
       
       self.isCurrentlyRecording = false
       self.sendEvent("onRecordingStateChange", [
         "isRecording": false
       ])
       
       DispatchQueue.main.async {
         guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
         let window = windowScene.windows.first,
         let rootViewController = window.rootViewController else {
           debugPrint("Unable to get the current window scene.")
           return
         }
         
         if let previewViewController = previewViewController {
           previewViewController.previewControllerDelegate = self.previewDelegate
           rootViewController.present(previewViewController, animated: true)
         }
       }
     }
    }

    Function("startStopRecording") {
      if isCurrentlyRecording {
        // Stop recording
        screenRecorder.stopRecording { previewViewController, error in
          if let error = error {
            debugPrint("Error stopping recording: \(error.localizedDescription)")
            self.sendEvent("onRecordingStateChange", [
              "isRecording": false
            ])
            return
          }
          
          self.isCurrentlyRecording = false
          self.sendEvent("onRecordingStateChange", [
            "isRecording": false
          ])
          
          DispatchQueue.main.async {
            guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
            let window = windowScene.windows.first,
            let rootViewController = window.rootViewController else {
              debugPrint("Unable to get the current window scene.")
              return
            }
            
            if let previewViewController = previewViewController {
              previewViewController.previewControllerDelegate = self.previewDelegate
              rootViewController.present(previewViewController, animated: true)
            }
          }
        }
      } else {
        // Start recording
        if let documentDirectory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first {
          let uniqueFileName = "screen_recording_\(UUID().uuidString).mp4"
          let destinationUrl = documentDirectory.appendingPathComponent(uniqueFileName)
          myUrl = destinationUrl
          debugPrint("Recording will be saved to: \(destinationUrl)")
          screenRecorder.startRecording { error in
            if let error = error {
              debugPrint("Error starting recording: \(error.localizedDescription)")
              self.sendEvent("onRecordingStateChange", [
                "isRecording": false
              ])
            } else {
              debugPrint("Started recording successfully.")
              self.isCurrentlyRecording = true
              self.sendEvent("onRecordingStateChange", [
                "isRecording": true
              ])
            }
          }
        }
      }
    }

    // Defines a JavaScript function that always returns a Promise and whose native code
    // is by default dispatched on the different thread than the JavaScript runtime runs on.
    AsyncFunction("setValueAsync") { (value: String) in
      // Send an event to JavaScript.
      self.sendEvent("onChange", [
        "value": value
      ])
    }

    // Enables the module to be used as a native view. Definition components that are accepted as part of the
    // view definition: Prop, Events.
    View(ScreenRecorderView.self) {
      // Defines a setter for the `url` prop.
      Prop("url") { (view: ScreenRecorderView, url: URL) in
        if view.webView.url != url {
          view.webView.load(URLRequest(url: url))
        }
      }

      Events("onLoad")
    }
  }
}
