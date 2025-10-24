import Foundation
import ReplayKit
import Photos
import UIKit

public enum WlylerError: Error {
    case photoLibraryAccessNotGranted
}

final public class ScreenRecorder {
    private var videoOutputURL: URL?
    private var videoWriter: AVAssetWriter?
    private var videoWriterInput: AVAssetWriterInput?
    private var micAudioWriterInput: AVAssetWriterInput?
    private var appAudioWriterInput: AVAssetWriterInput?
    private var saveToCameraRoll = false
    let recorder = RPScreenRecorder.shared()
    
    public init() {
        recorder.isMicrophoneEnabled = true
    }
    
    public func startRecording(to outputURL: URL? = nil, size:CGSize? = nil, saveToCameraRoll: Bool = false, errorHandler: @escaping (Error) -> Void) {
        createVideoWriter(in: outputURL, error: errorHandler)
        addVideoWriterInput(size: size)
        self.micAudioWriterInput = createAndAddAudioInput()
        self.appAudioWriterInput = createAndAddAudioInput()
        startCapture(error: errorHandler)
    }
    
    private func checkPhotoLibraryAuthorizationStatus() {
        let status = PHPhotoLibrary.authorizationStatus()
        if status == .notDetermined{
            PHPhotoLibrary.requestAuthorization({ _ in })
        }
    }
    
    private func createVideoWriter (in outputURL: URL? = nil, error: (Error) -> Void) {
        let newVideoOutputURL: URL
        
        if let passedVideoOutput = outputURL {
            self.videoOutputURL = passedVideoOutput
            newVideoOutputURL = passedVideoOutput
        } else {
            let documentsPath = NSSearchPathForDirectoriesInDomains(.documentDirectory,.userDomainMask,true)[0] as NSString
            newVideoOutputURL = URL(fileURLWithPath: documentsPath.appendingPathComponent("WylerNewVideo.mp4"))
            self.videoOutputURL = newVideoOutputURL
        }
        
        do {
            try FileManager.default.removeItem(at: newVideoOutputURL)
        } catch {}
        
        do {
            try videoWriter = AVAssetWriter(outputURL: newVideoOutputURL, fileType: AVFileType.mp4)
        } catch let writerError as NSError {
            error(writerError)
            videoWriter = nil
            return
        }
    }
    
    private func addVideoWriterInput (size:CGSize?) {
        let passingSize:CGSize = size ?? UIScreen.main.bounds.size
        let videoSettings:[String: Any] = [AVVideoCodecKey: AVVideoCodecType.h264, AVVideoWidthKey: passingSize.width, AVVideoHeightKey: passingSize.height]
        
        let newVideoWriterInput = AVAssetWriterInput(mediaType: AVMediaType.video, outputSettings: videoSettings)
        
        self.videoWriterInput = newVideoWriterInput
        newVideoWriterInput.expectsMediaDataInRealTime = true
        videoWriter?.add(newVideoWriterInput)
    }
    
    private func createAndAddAudioInput() -> AVAssetWriterInput {
        let settings = [
            AVFormatIDKey:Int(kAudioFormatMPEG4AAC),
            AVSampleRateKey: 1200,
            AVNumberOfChannelsKey: 1,
            AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue
        ]
        
        let audioInput = AVAssetWriterInput(mediaType: .audio, outputSettings: settings)
        audioInput.expectsMediaDataInRealTime = true
        videoWriter?.add(audioInput)
        
        return audioInput
    }
    
    private func startCapture(error: @escaping(Error) -> Void) {
        recorder.startCapture(handler: {(sampleBuffer, sampleType, passedError) in if let passedError = passedError {
            error(passedError)
            return
        }
        
            switch sampleType {
            case .video:
                self.handleSampleBuffer(sampleBuffer: sampleBuffer)
            case .audioApp:
                self.add(sample: sampleBuffer, to: self.appAudioWriterInput)
            case .audioMic:
                self.add(sample: sampleBuffer, to: self.micAudioWriterInput)
            default:
                break
            }
        })
    }
    
    private func handleSampleBuffer(sampleBuffer: CMSampleBuffer) {
        if self.videoWriter?.status == AVAssetWriter.Status.unknown {
            self.videoWriter?.startWriting()
            self.videoWriter?.startSession(atSourceTime: CMSampleBufferGetPresentationTimeStamp(sampleBuffer))
        } else if self.videoWriter?.status == AVAssetWriter.Status.writing && self.videoWriterInput?.isReadyForMoreMediaData == true {
            self.videoWriterInput?.append(sampleBuffer)
        }
    }
    
    private func add(sample: CMSampleBuffer, to writerInput: AVAssetWriterInput?) {
        if writerInput?.isReadyForMoreMediaData ?? false {
            writerInput?.append(sample)
        }
    }
    
   //stop recording the content of the application screen
    public func stopRecording(errorHandler: @escaping (Error) -> Void) {
        RPScreenRecorder.shared().stopCapture(handler: {error in if let error  = error{
            errorHandler(error)
        }})
        self.videoWriterInput?.markAsFinished()
        self.micAudioWriterInput?.markAsFinished()
        self.appAudioWriterInput?.markAsFinished()
        self.videoWriter?.finishWriting {
            self.saveToCameraRollAfterAuthorized(errorHandler: errorHandler)
        }
    }
    
    private func saveToCameraRollAfterAuthorized(errorHandler: @escaping (Error) -> Void) {
        if PHPhotoLibrary.authorizationStatus() == .authorized {
            self.saveVideoToCameraRoll(errorHandler: errorHandler)
        } else {
            PHPhotoLibrary.requestAuthorization({(status) in
                if status == .authorized{
                    self.saveVideoToCameraRoll(errorHandler: errorHandler)
                } else {
                    errorHandler(WlylerError.photoLibraryAccessNotGranted)
                }
            })
        }
    }
    
    private func saveVideoToCameraRoll(errorHandler: @escaping (Error) -> Void) {
        guard let videoOutputURL = self.videoOutputURL else {
            return
        }
        
        PHPhotoLibrary.shared().performChanges({
            PHAssetChangeRequest.creationRequestForAssetFromVideo(atFileURL: videoOutputURL)
        }, completionHandler: {_, error in
            if let error = error {
                errorHandler(error)
            }
        })
    }
 }
