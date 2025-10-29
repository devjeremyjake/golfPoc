package com.devjeremyjake.golfpoc.screenrecorder

import android.Manifest
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaCodec
import android.media.MediaCodecInfo
import android.media.MediaExtractor
import android.media.MediaFormat
import android.media.MediaMetadataRetriever
import android.media.MediaMuxer
import android.media.MediaRecorder
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.provider.MediaStore
import android.util.DisplayMetrics
import android.util.Log
import android.view.Surface
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import java.io.File
import java.io.FileOutputStream
import java.nio.ByteBuffer

class ScreenRecorderModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), ActivityEventListener {

    private val context: ReactApplicationContext = reactContext
    private var mediaProjection: MediaProjection? = null
    private var virtualDisplay: VirtualDisplay? = null
    private var mediaProjectionManager: MediaProjectionManager? = null
    private var videoCodec: MediaCodec? = null
    private var audioCodec: MediaCodec? = null
    private var mediaMuxer: MediaMuxer? = null
    private var recordingPromise: Promise? = null
    private var isRecording = false
    private var videoTrackIndex = -1
    private var audioTrackIndex = -1
    private var audioRecord: AudioRecord? = null
    private var audioThread: Thread? = null
    private var tempOutputFile: File? = null
    
    // Screen dimensions
    private var screenWidth = 0
    private var screenHeight = 0
    private var screenDensity = 0
    
    // Crop parameters (in pixels from edges)
    private var cropTop = 0
    private var cropBottom = 0
    
    private val REQUEST_MEDIA_PROJECTION = 1001

    companion object {
        private const val TAG = "ScreenRecorderModule"
        private const val VIDEO_MIME_TYPE = "video/avc"
        private const val AUDIO_MIME_TYPE = "audio/mp4a-latm"
        private const val VIDEO_BIT_RATE = 6000000
        private const val AUDIO_BIT_RATE = 128000
        private const val FRAME_RATE = 30
        private const val I_FRAME_INTERVAL = 1
        private const val AUDIO_SAMPLE_RATE = 44100
    }

    init {
        reactContext.addActivityEventListener(this)
    }

    override fun getName(): String = "ScreenRecorder"

    @ReactMethod
    fun requestPermissions(promise: Promise) {
        val activity = currentActivity
        if (activity == null) {
            promise.reject("ERROR", "Activity not available")
            return
        }

        val permissionsNeeded = mutableListOf<String>()
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(activity, Manifest.permission.RECORD_AUDIO) 
                != PackageManager.PERMISSION_GRANTED) {
                permissionsNeeded.add(Manifest.permission.RECORD_AUDIO)
            }
            if (ContextCompat.checkSelfPermission(activity, Manifest.permission.READ_MEDIA_VIDEO)
                != PackageManager.PERMISSION_GRANTED) {
                permissionsNeeded.add(Manifest.permission.READ_MEDIA_VIDEO)
            }
        } else {
            if (ContextCompat.checkSelfPermission(activity, Manifest.permission.RECORD_AUDIO)
                != PackageManager.PERMISSION_GRANTED) {
                permissionsNeeded.add(Manifest.permission.RECORD_AUDIO)
            }
            if (ContextCompat.checkSelfPermission(activity, Manifest.permission.WRITE_EXTERNAL_STORAGE)
                != PackageManager.PERMISSION_GRANTED) {
                permissionsNeeded.add(Manifest.permission.WRITE_EXTERNAL_STORAGE)
            }
        }

        if (permissionsNeeded.isEmpty()) {
            promise.resolve(true)
        } else {
            ActivityCompat.requestPermissions(
                activity,
                permissionsNeeded.toTypedArray(),
                100
            )
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun startRecording(cropTopHeight: Int, cropBottomHeight: Int, promise: Promise) {
        Log.d(TAG, "startRecording called")
        
        if (isRecording) {
            promise.reject("ERROR", "Already recording")
            return
        }

        val activity = currentActivity
        if (activity == null) {
            promise.reject("ERROR", "Activity not available")
            return
        }

        // Store crop parameters
        cropTop = cropTopHeight
        cropBottom = cropBottomHeight
        
        // Get screen dimensions
        val metrics = DisplayMetrics()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            activity.display?.getRealMetrics(metrics)
        } else {
            @Suppress("DEPRECATION")
            activity.windowManager.defaultDisplay.getRealMetrics(metrics)
        }
        
        screenWidth = metrics.widthPixels
        screenHeight = metrics.heightPixels
        screenDensity = metrics.densityDpi

        Log.d(TAG, "Screen dimensions: ${screenWidth}x${screenHeight}, density: $screenDensity")
        Log.d(TAG, "Crop - Top: $cropTop, Bottom: $cropBottom")

        // Initialize MediaProjectionManager
        mediaProjectionManager = activity.getSystemService(Context.MEDIA_PROJECTION_SERVICE) 
            as MediaProjectionManager

        recordingPromise = promise

        // Start the foreground service BEFORE requesting MediaProjection permission
        val serviceIntent = Intent(activity, ScreenRecorderService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            activity.startForegroundService(serviceIntent)
        } else {
            activity.startService(serviceIntent)
        }
        
        // Give the service a moment to start before requesting permission
        android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
            // Start capture intent
            val captureIntent = mediaProjectionManager?.createScreenCaptureIntent()
            activity.startActivityForResult(captureIntent, REQUEST_MEDIA_PROJECTION)
        }, 100)
    }

    @ReactMethod
    fun stopRecording(promise: Promise) {
        Log.d(TAG, "stopRecording called")
        
        if (!isRecording) {
            promise.reject("ERROR", "Not currently recording")
            return
        }

        try {
            stopRecordingInternal()
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping recording", e)
            promise.reject("ERROR", "Failed to stop recording: ${e.message}")
        }
    }

    @ReactMethod
    fun isRecordingActive(promise: Promise) {
        promise.resolve(isRecording)
    }

    override fun onActivityResult(
        activity: Activity?,
        requestCode: Int,
        resultCode: Int,
        data: Intent?
    ) {
        if (requestCode == REQUEST_MEDIA_PROJECTION) {
            if (resultCode == Activity.RESULT_OK && data != null) {
                Log.d(TAG, "MediaProjection permission granted")
                try {
                    startRecordingInternal(resultCode, data)
                    recordingPromise?.resolve(true)
                } catch (e: Exception) {
                    Log.e(TAG, "Error starting recording", e)
                    recordingPromise?.reject("ERROR", "Failed to start recording: ${e.message}")
                }
            } else {
                Log.d(TAG, "MediaProjection permission denied or cancelled. ResultCode: $resultCode")
                val errorMessage = if (resultCode == Activity.RESULT_CANCELED) {
                    "Screen recording cancelled. Please select 'Start now' and choose 'Entire screen' option to record."
                } else {
                    "Screen capture permission denied. Please grant permission to record screen."
                }
                recordingPromise?.reject("PERMISSION_DENIED", errorMessage)
            }
            recordingPromise = null
        }
    }

    override fun onNewIntent(intent: Intent?) {}

    private fun startRecordingInternal(resultCode: Int, data: Intent) {
        // Record at full screen dimensions first
        Log.d(TAG, "Recording at full screen dimensions: ${screenWidth}x${screenHeight}")

        // Create temporary output file
        val outputDir = context.getExternalFilesDir(null)
        tempOutputFile = File(outputDir, "screen_recording_temp_${System.currentTimeMillis()}.mp4")
        
        Log.d(TAG, "Temp output file: ${tempOutputFile?.absolutePath}")

        // Initialize MediaMuxer for temporary file
        mediaMuxer = MediaMuxer(tempOutputFile!!.absolutePath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)

        // Setup video encoder at full screen dimensions
        setupVideoEncoder(screenWidth, screenHeight)

        // Setup audio encoder
        setupAudioEncoder()

        // Get MediaProjection and register callback
        mediaProjection = mediaProjectionManager?.getMediaProjection(resultCode, data)
        
        // Register callback for MediaProjection (required on Android 14+)
        mediaProjection?.registerCallback(object : MediaProjection.Callback() {
            override fun onStop() {
                Log.d(TAG, "MediaProjection stopped")
                if (isRecording) {
                    stopRecordingInternal()
                }
            }
        }, null)

        // Create virtual display for screen capture
        val surface = videoCodec?.createInputSurface()
        virtualDisplay = mediaProjection?.createVirtualDisplay(
            "ScreenRecorder",
            screenWidth,
            screenHeight,
            screenDensity,
            DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
            surface,
            null,
            null
        )

        isRecording = true
        
        // Start encoding threads
        startVideoEncoding()
        startAudioRecording()
    }

    private fun setupVideoEncoder(width: Int, height: Int) {
        val format = MediaFormat.createVideoFormat(VIDEO_MIME_TYPE, width, height)
        format.setInteger(MediaFormat.KEY_COLOR_FORMAT, MediaCodecInfo.CodecCapabilities.COLOR_FormatSurface)
        format.setInteger(MediaFormat.KEY_BIT_RATE, VIDEO_BIT_RATE)
        format.setInteger(MediaFormat.KEY_FRAME_RATE, FRAME_RATE)
        format.setInteger(MediaFormat.KEY_I_FRAME_INTERVAL, I_FRAME_INTERVAL)

        videoCodec = MediaCodec.createEncoderByType(VIDEO_MIME_TYPE)
        videoCodec?.configure(format, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)
    }

    private fun setupAudioEncoder() {
        val format = MediaFormat.createAudioFormat(AUDIO_MIME_TYPE, AUDIO_SAMPLE_RATE, 1)
        format.setInteger(MediaFormat.KEY_AAC_PROFILE, MediaCodecInfo.CodecProfileLevel.AACObjectLC)
        format.setInteger(MediaFormat.KEY_BIT_RATE, AUDIO_BIT_RATE)
        format.setInteger(MediaFormat.KEY_MAX_INPUT_SIZE, 16384)

        audioCodec = MediaCodec.createEncoderByType(AUDIO_MIME_TYPE)
        audioCodec?.configure(format, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)
    }

    private fun startVideoEncoding() {
        Thread {
            try {
                videoCodec?.start()
                
                val bufferInfo = MediaCodec.BufferInfo()
                var videoTrackAdded = false

                while (isRecording) {
                    val outputBufferIndex = videoCodec?.dequeueOutputBuffer(bufferInfo, 10000) ?: -1

                    when (outputBufferIndex) {
                        MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> {
                            if (!videoTrackAdded) {
                                val format = videoCodec?.outputFormat
                                videoTrackIndex = mediaMuxer?.addTrack(format!!) ?: -1
                                videoTrackAdded = true
                                
                                if (videoTrackIndex != -1 && audioTrackIndex != -1) {
                                    mediaMuxer?.start()
                                }
                            }
                        }
                        MediaCodec.INFO_TRY_AGAIN_LATER -> {
                            // No output available yet
                        }
                        else -> {
                            if (outputBufferIndex >= 0) {
                                val outputBuffer = videoCodec?.getOutputBuffer(outputBufferIndex)
                                
                                if (outputBuffer != null && bufferInfo.size > 0) {
                                    if (bufferInfo.flags and MediaCodec.BUFFER_FLAG_CODEC_CONFIG == 0) {
                                        // Adjust presentation time for cropping if needed
                                        mediaMuxer?.writeSampleData(videoTrackIndex, outputBuffer, bufferInfo)
                                    }
                                }
                                
                                videoCodec?.releaseOutputBuffer(outputBufferIndex, false)
                            }
                        }
                    }

                    if (bufferInfo.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM != 0) {
                        break
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Video encoding error", e)
            }
        }.start()
    }

    private fun startAudioRecording() {
        val bufferSize = AudioRecord.getMinBufferSize(
            AUDIO_SAMPLE_RATE,
            AudioFormat.CHANNEL_IN_MONO,
            AudioFormat.ENCODING_PCM_16BIT
        )

        if (ActivityCompat.checkSelfPermission(
                context,
                Manifest.permission.RECORD_AUDIO
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            Log.e(TAG, "Audio permission not granted")
            return
        }

        audioRecord = AudioRecord(
            MediaRecorder.AudioSource.MIC,
            AUDIO_SAMPLE_RATE,
            AudioFormat.CHANNEL_IN_MONO,
            AudioFormat.ENCODING_PCM_16BIT,
            bufferSize
        )

        audioThread = Thread {
            try {
                audioCodec?.start()
                audioRecord?.startRecording()
                
                val bufferInfo = MediaCodec.BufferInfo()
                val audioBuffer = ByteArray(bufferSize)
                var audioTrackAdded = false

                while (isRecording) {
                    // Read audio data
                    val readBytes = audioRecord?.read(audioBuffer, 0, bufferSize) ?: 0
                    
                    if (readBytes > 0) {
                        val inputBufferIndex = audioCodec?.dequeueInputBuffer(10000) ?: -1
                        
                        if (inputBufferIndex >= 0) {
                            val inputBuffer = audioCodec?.getInputBuffer(inputBufferIndex)
                            inputBuffer?.clear()
                            inputBuffer?.put(audioBuffer, 0, readBytes)
                            
                            audioCodec?.queueInputBuffer(
                                inputBufferIndex,
                                0,
                                readBytes,
                                System.nanoTime() / 1000,
                                0
                            )
                        }
                    }

                    // Get encoded audio data
                    val outputBufferIndex = audioCodec?.dequeueOutputBuffer(bufferInfo, 10000) ?: -1

                    when (outputBufferIndex) {
                        MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> {
                            if (!audioTrackAdded) {
                                val format = audioCodec?.outputFormat
                                audioTrackIndex = mediaMuxer?.addTrack(format!!) ?: -1
                                audioTrackAdded = true
                                
                                if (videoTrackIndex != -1 && audioTrackIndex != -1) {
                                    mediaMuxer?.start()
                                }
                            }
                        }
                        MediaCodec.INFO_TRY_AGAIN_LATER -> {
                            // No output available yet
                        }
                        else -> {
                            if (outputBufferIndex >= 0) {
                                val outputBuffer = audioCodec?.getOutputBuffer(outputBufferIndex)
                                
                                if (outputBuffer != null && bufferInfo.size > 0) {
                                    if (bufferInfo.flags and MediaCodec.BUFFER_FLAG_CODEC_CONFIG == 0) {
                                        mediaMuxer?.writeSampleData(audioTrackIndex, outputBuffer, bufferInfo)
                                    }
                                }
                                
                                audioCodec?.releaseOutputBuffer(outputBufferIndex, false)
                            }
                        }
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Audio recording error", e)
            }
        }
        audioThread?.start()
    }

    private fun stopRecordingInternal() {
        isRecording = false

        // Stop audio recording
        audioRecord?.stop()
        audioRecord?.release()
        audioRecord = null

        // Wait for audio thread to finish
        audioThread?.join(1000)
        audioThread = null

        // Stop audio codec
        try {
            audioCodec?.stop()
            audioCodec?.release()
            audioCodec = null
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping audio codec", e)
        }

        // Stop video codec
        try {
            videoCodec?.signalEndOfInputStream()
            Thread.sleep(100) // Give encoder time to finish
            videoCodec?.stop()
            videoCodec?.release()
            videoCodec = null
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping video codec", e)
        }

        // Stop muxer
        try {
            mediaMuxer?.stop()
            mediaMuxer?.release()
            mediaMuxer = null
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping muxer", e)
        }

        // Release virtual display
        virtualDisplay?.release()
        virtualDisplay = null

        // Stop media projection
        mediaProjection?.stop()
        mediaProjection = null

        videoTrackIndex = -1
        audioTrackIndex = -1

        // Stop the foreground service
        currentActivity?.let { activity ->
            val serviceIntent = Intent(activity, ScreenRecorderService::class.java)
            activity.stopService(serviceIntent)
        }

        Log.d(TAG, "Recording stopped successfully")
        
        // Process and save the video
        Thread {
            try {
                if (cropTop > 0 || cropBottom > 0) {
                    cropAndSaveVideo()
                } else {
                    // No cropping needed, save directly
                    val inputFile = tempOutputFile
                    if (inputFile != null && inputFile.exists()) {
                        addVideoToGallery(inputFile)
                    } else {
                        Log.e(TAG, "Temp file does not exist")
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error saving video", e)
                e.printStackTrace()
            }
        }.start()
    }
    
    private fun cropAndSaveVideo() {
        val inputFile = tempOutputFile ?: return
        if (!inputFile.exists()) {
            Log.e(TAG, "Temp file does not exist")
            return
        }

        Log.d(TAG, "Starting video crop process")
        
        val outputDir = context.getExternalFilesDir(null)
        val outputFile = File(outputDir, "screen_recording_${System.currentTimeMillis()}.mp4")
        
        try {
            // Extract video and audio from the temp file and re-encode with cropping
            val extractor = MediaExtractor()
            extractor.setDataSource(inputFile.absolutePath)
            
            var videoTrackIdx = -1
            var audioTrackIdx = -1
            var videoFormat: MediaFormat? = null
            var audioFormat: MediaFormat? = null
            
            // Find video and audio tracks
            for (i in 0 until extractor.trackCount) {
                val format = extractor.getTrackFormat(i)
                val mime = format.getString(MediaFormat.KEY_MIME) ?: ""
                
                if (mime.startsWith("video/") && videoTrackIdx == -1) {
                    videoTrackIdx = i
                    videoFormat = format
                    Log.d(TAG, "Found video track at index $i")
                } else if (mime.startsWith("audio/") && audioTrackIdx == -1) {
                    audioTrackIdx = i
                    audioFormat = format
                    Log.d(TAG, "Found audio track at index $i")
                }
            }
            
            if (videoFormat == null) {
                Log.e(TAG, "No video track found")
                return
            }
            
            // Get original video dimensions
            val origWidth = videoFormat.getInteger(MediaFormat.KEY_WIDTH)
            val origHeight = videoFormat.getInteger(MediaFormat.KEY_HEIGHT)
            
            // Calculate new dimensions after cropping
            val newHeight = origHeight - cropTop - cropBottom
            val newWidth = origWidth
            
            Log.d(TAG, "Original: ${origWidth}x${origHeight}, Cropped: ${newWidth}x${newHeight}")
            
            // Create decoder for video
            val videoDecoder = MediaCodec.createDecoderByType(VIDEO_MIME_TYPE)
            videoDecoder.configure(videoFormat, null, null, 0)
            videoDecoder.start()
            
            // Create encoder for cropped video
            val encoderFormat = MediaFormat.createVideoFormat(VIDEO_MIME_TYPE, newWidth, newHeight)
            encoderFormat.setInteger(MediaFormat.KEY_COLOR_FORMAT, MediaCodecInfo.CodecCapabilities.COLOR_FormatSurface)
            encoderFormat.setInteger(MediaFormat.KEY_BIT_RATE, VIDEO_BIT_RATE)
            encoderFormat.setInteger(MediaFormat.KEY_FRAME_RATE, FRAME_RATE)
            encoderFormat.setInteger(MediaFormat.KEY_I_FRAME_INTERVAL, I_FRAME_INTERVAL)
            
            val videoEncoder = MediaCodec.createEncoderByType(VIDEO_MIME_TYPE)
            videoEncoder.configure(encoderFormat, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)
            val encoderSurface = videoEncoder.createInputSurface()
            videoEncoder.start()
            
            // Create muxer for output
            val muxer = MediaMuxer(outputFile.absolutePath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)
            
            var muxerVideoTrack = -1
            var muxerAudioTrack = -1
            var muxerStarted = false
            
            // Process video track
            extractor.selectTrack(videoTrackIdx)
            
            val videoBufferInfo = MediaCodec.BufferInfo()
            var inputDone = false
            var outputDone = false
            
            while (!outputDone) {
                // Feed input to decoder
                if (!inputDone) {
                    val inputBufferIndex = videoDecoder.dequeueInputBuffer(10000)
                    if (inputBufferIndex >= 0) {
                        val inputBuffer = videoDecoder.getInputBuffer(inputBufferIndex)
                        val sampleSize = extractor.readSampleData(inputBuffer!!, 0)
                        
                        if (sampleSize < 0) {
                            videoDecoder.queueInputBuffer(inputBufferIndex, 0, 0, 0, MediaCodec.BUFFER_FLAG_END_OF_STREAM)
                            inputDone = true
                        } else {
                            val presentationTime = extractor.sampleTime
                            videoDecoder.queueInputBuffer(inputBufferIndex, 0, sampleSize, presentationTime, 0)
                            extractor.advance()
                        }
                    }
                }
                
                // Get output from encoder
                val outputBufferIndex = videoEncoder.dequeueOutputBuffer(videoBufferInfo, 10000)
                
                when (outputBufferIndex) {
                    MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> {
                        if (!muxerStarted) {
                            val newFormat = videoEncoder.outputFormat
                            muxerVideoTrack = muxer.addTrack(newFormat)
                            
                            // Add audio track if exists
                            if (audioFormat != null) {
                                muxerAudioTrack = muxer.addTrack(audioFormat)
                            }
                            
                            muxer.start()
                            muxerStarted = true
                            Log.d(TAG, "Muxer started")
                        }
                    }
                    MediaCodec.INFO_TRY_AGAIN_LATER -> {
                        // No output available yet
                    }
                    else -> {
                        if (outputBufferIndex >= 0) {
                            val outputBuffer = videoEncoder.getOutputBuffer(outputBufferIndex)
                            
                            if (videoBufferInfo.size > 0 && muxerStarted) {
                                if (videoBufferInfo.flags and MediaCodec.BUFFER_FLAG_CODEC_CONFIG == 0) {
                                    muxer.writeSampleData(muxerVideoTrack, outputBuffer!!, videoBufferInfo)
                                }
                            }
                            
                            videoEncoder.releaseOutputBuffer(outputBufferIndex, false)
                            
                            if (videoBufferInfo.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM != 0) {
                                outputDone = true
                            }
                        }
                    }
                }
            }
            
            // Copy audio track if it exists
            if (audioTrackIdx != -1 && audioFormat != null && muxerStarted) {
                Log.d(TAG, "Copying audio track")
                extractor.unselectTrack(videoTrackIdx)
                extractor.selectTrack(audioTrackIdx)
                extractor.seekTo(0, MediaExtractor.SEEK_TO_CLOSEST_SYNC)
                
                val audioBuffer = ByteBuffer.allocate(512 * 1024)
                val audioBufferInfo = MediaCodec.BufferInfo()
                
                while (true) {
                    audioBufferInfo.offset = 0
                    audioBufferInfo.size = extractor.readSampleData(audioBuffer, 0)
                    
                    if (audioBufferInfo.size < 0) {
                        break
                    }
                    
                    audioBufferInfo.presentationTimeUs = extractor.sampleTime
                    audioBufferInfo.flags = extractor.sampleFlags
                    
                    muxer.writeSampleData(muxerAudioTrack, audioBuffer, audioBufferInfo)
                    extractor.advance()
                }
            }
            
            // Cleanup
            videoDecoder.stop()
            videoDecoder.release()
            videoEncoder.stop()
            videoEncoder.release()
            encoderSurface.release()
            muxer.stop()
            muxer.release()
            extractor.release()
            
            // Delete temp file
            if (inputFile.delete()) {
                Log.d(TAG, "Temp file deleted")
            }
            
            // Add to MediaStore so it appears in gallery
            addVideoToGallery(outputFile)
            
            Log.d(TAG, "Video cropped and saved successfully: ${outputFile.absolutePath}")
            
        } catch (e: Exception) {
            Log.e(TAG, "Error during crop process", e)
            e.printStackTrace()
        }
    }
    
    private fun addVideoToGallery(videoFile: File) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                // For Android 10 and above, use MediaStore API properly
                val resolver = context.contentResolver
                val videoCollection = MediaStore.Video.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
                
                val videoDetails = android.content.ContentValues().apply {
                    put(MediaStore.Video.Media.DISPLAY_NAME, videoFile.name)
                    put(MediaStore.Video.Media.MIME_TYPE, "video/mp4")
                    put(MediaStore.Video.Media.DATE_ADDED, System.currentTimeMillis() / 1000)
                    put(MediaStore.Video.Media.DATE_TAKEN, System.currentTimeMillis())
                    put(MediaStore.Video.Media.RELATIVE_PATH, "DCIM/GolfPOC")
                    put(MediaStore.Video.Media.IS_PENDING, 1)
                }
                
                val videoUri = resolver.insert(videoCollection, videoDetails)
                
                if (videoUri != null) {
                    resolver.openOutputStream(videoUri)?.use { outputStream ->
                        videoFile.inputStream().use { inputStream ->
                            inputStream.copyTo(outputStream)
                        }
                    }
                    
                    // Mark as not pending anymore
                    videoDetails.clear()
                    videoDetails.put(MediaStore.Video.Media.IS_PENDING, 0)
                    resolver.update(videoUri, videoDetails, null, null)
                    
                    Log.d(TAG, "Video added to gallery: $videoUri")
                    
                    // Delete the temporary file from app directory
                    videoFile.delete()
                } else {
                    Log.e(TAG, "Failed to create MediaStore entry")
                }
            } else {
                // For Android 9 and below
                val values = android.content.ContentValues().apply {
                    put(MediaStore.Video.Media.DATA, videoFile.absolutePath)
                    put(MediaStore.Video.Media.MIME_TYPE, "video/mp4")
                    put(MediaStore.Video.Media.DATE_ADDED, System.currentTimeMillis() / 1000)
                }
                
                context.contentResolver.insert(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, values)
                Log.d(TAG, "Video added to gallery")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error adding video to gallery", e)
            e.printStackTrace()
        }
    }

    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        if (isRecording) {
            stopRecordingInternal()
        }
    }
}
