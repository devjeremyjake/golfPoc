import Foundation
import ReplayKit
import AVFoundation
import Photos
import UIKit

@objc(ScreenRecorder)
class ScreenRecorder: NSObject {
    
    private var screenRecorder: RPScreenRecorder?
    private var videoWriter: AVAssetWriter?
    private var videoWriterInput: AVAssetWriterInput?
    private var audioWriterInput: AVAssetWriterInput?
    private var isRecording = false
    private var outputURL: URL?
    private var tempOutputURL: URL?
    private var cropTopHeight: CGFloat = 0
    private var cropBottomHeight: CGFloat = 0
    private var startTime: CMTime?
    
    override init() {
        super.init()
        screenRecorder = RPScreenRecorder.shared()
    }
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    @objc
    func requestPermissions(_ resolve: @escaping RCTPromiseResolveBlock,
                           rejecter reject: @escaping RCTPromiseRejectBlock) {
        // Check microphone permission
        let audioStatus = AVCaptureDevice.authorizationStatus(for: .audio)
        
        if audioStatus == .authorized {
            resolve(true)
            return
        }
        
        if audioStatus == .notDetermined {
            AVCaptureDevice.requestAccess(for: .audio) { granted in
                resolve(granted)
            }
        } else {
            resolve(false)
        }
    }
    
    @objc
    func startRecording(_ cropTop: NSInteger,
                       cropBottomHeight cropBottom: NSInteger,
                       resolver resolve: @escaping RCTPromiseResolveBlock,
                       rejecter reject: @escaping RCTPromiseRejectBlock) {
        
        guard !isRecording else {
            reject("ERROR", "Already recording", nil)
            return
        }
        
        guard let screenRecorder = screenRecorder else {
            reject("ERROR", "Screen recorder not available", nil)
            return
        }
        
        if !screenRecorder.isAvailable {
            reject("ERROR", "Screen recording is not available on this device", nil)
            return
        }
        
        // Store crop parameters
        self.cropTopHeight = CGFloat(cropTop)
        self.cropBottomHeight = CGFloat(cropBottom)
        
        // Create temporary output file URL
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        tempOutputURL = documentsPath.appendingPathComponent("screen_recording_temp_\(Int(Date().timeIntervalSince1970)).mp4")
        
        // Delete file if it exists
        if FileManager.default.fileExists(atPath: tempOutputURL!.path) {
            try? FileManager.default.removeItem(at: tempOutputURL!)
        }
        
        // Get screen dimensions - record at full resolution first
        let screenSize = UIScreen.main.bounds.size
        let screenScale = UIScreen.main.scale
        let width = screenSize.width * screenScale
        let height = screenSize.height * screenScale
        
        print("ScreenRecorder: Starting recording at full dimensions: \(width)x\(height)")
        print("ScreenRecorder: Will crop - Top: \(cropTop), Bottom: \(cropBottom)")
        
        do {
            // Create AVAssetWriter for temporary file
            videoWriter = try AVAssetWriter(outputURL: tempOutputURL!, fileType: .mp4)
            
            // Video settings at full resolution
            let videoSettings: [String: Any] = [
                AVVideoCodecKey: AVVideoCodecType.h264,
                AVVideoWidthKey: width,
                AVVideoHeightKey: height,
                AVVideoCompressionPropertiesKey: [
                    AVVideoAverageBitRateKey: 6000000,
                    AVVideoExpectedSourceFrameRateKey: 30,
                    AVVideoMaxKeyFrameIntervalKey: 30,
                    AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel
                ]
            ]
            
            videoWriterInput = AVAssetWriterInput(mediaType: .video, outputSettings: videoSettings)
            videoWriterInput?.expectsMediaDataInRealTime = true
            
            // Audio settings
            let audioSettings: [String: Any] = [
                AVFormatIDKey: kAudioFormatMPEG4AAC,
                AVSampleRateKey: 44100,
                AVNumberOfChannelsKey: 1,
                AVEncoderBitRateKey: 128000
            ]
            
            audioWriterInput = AVAssetWriterInput(mediaType: .audio, outputSettings: audioSettings)
            audioWriterInput?.expectsMediaDataInRealTime = true
            
            if let videoWriter = videoWriter,
               let videoWriterInput = videoWriterInput,
               let audioWriterInput = audioWriterInput {
                
                if videoWriter.canAdd(videoWriterInput) {
                    videoWriter.add(videoWriterInput)
                }
                
                if videoWriter.canAdd(audioWriterInput) {
                    videoWriter.add(audioWriterInput)
                }
                
                videoWriter.startWriting()
            }
            
            // Enable microphone
            screenRecorder.isMicrophoneEnabled = true
            
            // Start capture
            screenRecorder.startCapture(handler: { [weak self] (sampleBuffer, bufferType, error) in
                guard let self = self else { return }
                
                if let error = error {
                    print("ScreenRecorder: Capture error: \(error.localizedDescription)")
                    return
                }
                
                guard self.isRecording else { return }
                
                guard let videoWriter = self.videoWriter else { return }
                
                if videoWriter.status == .unknown {
                    let timestamp = CMSampleBufferGetPresentationTimeStamp(sampleBuffer)
                    videoWriter.startSession(atSourceTime: timestamp)
                    self.startTime = timestamp
                }
                
                if videoWriter.status == .failed {
                    print("ScreenRecorder: Writer failed: \(String(describing: videoWriter.error))")
                    return
                }
                
                switch bufferType {
                case .video:
                    if let videoInput = self.videoWriterInput,
                       videoInput.isReadyForMoreMediaData {
                        
                        // Process the buffer to apply cropping
                        if let croppedBuffer = self.cropSampleBuffer(sampleBuffer) {
                            videoInput.append(croppedBuffer)
                        } else {
                            videoInput.append(sampleBuffer)
                        }
                    }
                    
                case .audioMic:
                    if let audioInput = self.audioWriterInput,
                       audioInput.isReadyForMoreMediaData {
                        audioInput.append(sampleBuffer)
                    }
                    
                default:
                    break
                }
                
            }) { [weak self] error in
                if let error = error {
                    print("ScreenRecorder: Failed to start capture: \(error.localizedDescription)")
                    reject("ERROR", "Failed to start recording: \(error.localizedDescription)", error)
                } else {
                    print("ScreenRecorder: Recording started successfully")
                    self?.isRecording = true
                    resolve(true)
                }
            }
            
        } catch {
            print("ScreenRecorder: Setup error: \(error.localizedDescription)")
            reject("ERROR", "Failed to setup recording: \(error.localizedDescription)", error)
        }
    }
    
    @objc
    func stopRecording(_ resolve: @escaping RCTPromiseResolveBlock,
                      rejecter reject: @escaping RCTPromiseRejectBlock) {
        
        guard isRecording else {
            reject("ERROR", "Not currently recording", nil)
            return
        }
        
        guard let screenRecorder = screenRecorder else {
            reject("ERROR", "Screen recorder not available", nil)
            return
        }
        
        isRecording = false
        
        screenRecorder.stopCapture { [weak self] error in
            guard let self = self else { return }
            
            if let error = error {
                print("ScreenRecorder: Stop capture error: \(error.localizedDescription)")
                reject("ERROR", "Failed to stop recording: \(error.localizedDescription)", error)
                return
            }
            
            // Finish writing temporary file
            self.videoWriterInput?.markAsFinished()
            self.audioWriterInput?.markAsFinished()
            
            self.videoWriter?.finishWriting { [weak self] in
                guard let self = self else { return }
                
                if let error = self.videoWriter?.error {
                    print("ScreenRecorder: Finish writing error: \(error.localizedDescription)")
                    reject("ERROR", "Failed to finalize recording: \(error.localizedDescription)", error)
                    return
                }
                
                // Now crop the video if needed
                if self.cropTopHeight > 0 || self.cropBottomHeight > 0 {
                    print("ScreenRecorder: Starting crop process")
                    self.cropAndSaveVideo(resolve: resolve, reject: reject)
                } else {
                    // No cropping needed, just save directly
                    if let tempURL = self.tempOutputURL {
                        self.saveToPhotosLibrary(videoURL: tempURL, resolve: resolve, reject: reject)
                    } else {
                        reject("ERROR", "Output URL is nil", nil)
                    }
                }
                
                // Cleanup writer
                self.videoWriter = nil
                self.videoWriterInput = nil
                self.audioWriterInput = nil
                self.startTime = nil
            }
        }
    }
    
    private func cropAndSaveVideo(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        guard let inputURL = tempOutputURL else {
            reject("ERROR", "Temp output URL is nil", nil)
            return
        }
        
        let asset = AVURLAsset(url: inputURL)
        
        guard let videoTrack = asset.tracks(withMediaType: .video).first else {
            reject("ERROR", "No video track found", nil)
            return
        }
        
        // Get original dimensions
        let originalSize = videoTrack.naturalSize
        let originalTransform = videoTrack.preferredTransform
        
        // Calculate cropped dimensions
        let scale = UIScreen.main.scale
        let cropTopScaled = cropTopHeight * scale
        let cropBottomScaled = cropBottomHeight * scale
        
        let croppedHeight = originalSize.height - cropTopScaled - cropBottomScaled
        let croppedSize = CGSize(width: originalSize.width, height: croppedHeight)
        
        print("ScreenRecorder: Original size: \(originalSize), Cropped size: \(croppedSize)")
        
        // Create output URL
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        let finalOutputURL = documentsPath.appendingPathComponent("screen_recording_\(Int(Date().timeIntervalSince1970)).mp4")
        
        // Remove if exists
        try? FileManager.default.removeItem(at: finalOutputURL)
        
        do {
            // Create composition
            let composition = AVMutableComposition()
            
            // Add video track
            guard let compositionVideoTrack = composition.addMutableTrack(
                withMediaType: .video,
                preferredTrackID: kCMPersistentTrackID_Invalid
            ) else {
                reject("ERROR", "Failed to create composition video track", nil)
                return
            }
            
            let timeRange = CMTimeRange(start: .zero, duration: asset.duration)
            try compositionVideoTrack.insertTimeRange(timeRange, of: videoTrack, at: .zero)
            
            // Add audio track if exists
            if let audioTrack = asset.tracks(withMediaType: .audio).first {
                if let compositionAudioTrack = composition.addMutableTrack(
                    withMediaType: .audio,
                    preferredTrackID: kCMPersistentTrackID_Invalid
                ) {
                    try compositionAudioTrack.insertTimeRange(timeRange, of: audioTrack, at: .zero)
                }
            }
            
            // Create video composition for cropping
            let videoComposition = AVMutableVideoComposition()
            videoComposition.renderSize = croppedSize
            videoComposition.frameDuration = CMTime(value: 1, timescale: 30)
            
            let instruction = AVMutableVideoCompositionInstruction()
            instruction.timeRange = timeRange
            
            let layerInstruction = AVMutableVideoCompositionLayerInstruction(assetTrack: compositionVideoTrack)
            
            // Apply transform to crop from top
            var transform = originalTransform
            transform = transform.translatedBy(x: 0, y: -cropTopScaled)
            
            layerInstruction.setTransform(transform, at: .zero)
            instruction.layerInstructions = [layerInstruction]
            videoComposition.instructions = [instruction]
            
            // Create export session
            guard let exportSession = AVAssetExportSession(
                asset: composition,
                presetName: AVAssetExportPresetHighestQuality
            ) else {
                reject("ERROR", "Failed to create export session", nil)
                return
            }
            
            exportSession.outputURL = finalOutputURL
            exportSession.outputFileType = .mp4
            exportSession.videoComposition = videoComposition
            
            // Export the video
            exportSession.exportAsynchronously { [weak self] in
                guard let self = self else { return }
                
                switch exportSession.status {
                case .completed:
                    print("ScreenRecorder: Video cropped successfully")
                    
                    // Delete temp file
                    try? FileManager.default.removeItem(at: inputURL)
                    self.tempOutputURL = nil
                    
                    // Save to Photos library
                    self.saveToPhotosLibrary(videoURL: finalOutputURL, resolve: resolve, reject: reject)
                    
                case .failed:
                    print("ScreenRecorder: Export failed: \(String(describing: exportSession.error))")
                    reject("ERROR", "Failed to export cropped video: \(String(describing: exportSession.error))", exportSession.error)
                    
                case .cancelled:
                    reject("ERROR", "Export was cancelled", nil)
                    
                default:
                    reject("ERROR", "Export in unknown state", nil)
                }
            }
            
        } catch {
            print("ScreenRecorder: Crop error: \(error.localizedDescription)")
            reject("ERROR", "Failed to crop video: \(error.localizedDescription)", error)
        }
    }
    
    private func saveToPhotosLibrary(videoURL: URL, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        print("ScreenRecorder: Saving to Photos library: \(videoURL.path)")
        
        PHPhotoLibrary.requestAuthorization { status in
            if status == .authorized {
                PHPhotoLibrary.shared().performChanges({
                    PHAssetChangeRequest.creationRequestForAssetFromVideo(atFileURL: videoURL)
                }) { saved, error in
                    if saved {
                        print("ScreenRecorder: Video saved to photo library")
                        resolve(true)
                    } else {
                        print("ScreenRecorder: Failed to save to photo library: \(String(describing: error))")
                        reject("ERROR", "Failed to save to photo library", error)
                    }
                }
            } else {
                // Still resolve as the file is saved locally
                print("ScreenRecorder: Photos permission not granted, file saved locally")
                resolve(true)
            }
        }
    }
    
    @objc
    func isRecordingActive(_ resolve: @escaping RCTPromiseResolveBlock,
                          rejecter reject: @escaping RCTPromiseRejectBlock) {
        resolve(isRecording)
    }
}
