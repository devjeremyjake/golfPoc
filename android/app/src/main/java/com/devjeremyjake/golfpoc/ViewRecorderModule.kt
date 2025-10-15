package com.devjeremyjake.golfpoc

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.PixelFormat
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.MediaCodec
import android.media.MediaCodecInfo
import android.media.MediaFormat
import android.media.MediaMuxer
import android.media.MediaRecorder
import android.media.AudioRecord
import android.media.AudioFormat
import android.media.projection.MediaProjection
import android.os.Handler
import android.os.HandlerThread
import android.os.Looper
import android.util.DisplayMetrics
import android.util.Log
import android.view.Surface
import android.view.View
import android.view.WindowManager
import com.facebook.react.bridge.*
import com.facebook.react.uimanager.NativeViewHierarchyManager
import com.facebook.react.uimanager.UIBlock
import com.facebook.react.uimanager.UIManagerModule
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.common.UIManagerType
import java.io.File
import java.nio.ByteBuffer
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

class ViewRecorderModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

  private var videoCodec: MediaCodec? = null
  private var audioCodec: MediaCodec? = null
  private var mediaMuxer: MediaMuxer? = null
  private var audioRecord: AudioRecord? = null
  private var encoderThread: Thread? = null
  private var audioThread: Thread? = null
  private var isRecording = AtomicBoolean(false)
  private var videoTrackIndex = -1
  private var audioTrackIndex = -1
  private var outputFile: File? = null
  private var muxerStarted = AtomicBoolean(false)
  private var targetView: View? = null
  private var inputSurface: Surface? = null
  private var encoderHandler: Handler? = null
  private var encoderHandlerThread: HandlerThread? = null
  
  private var viewWidth = 0
  private var viewHeight = 0
  
  // Track actual recording start time for accurate duration
  private var recordingStartTimeNanos: Long = 0
  private var audioRecordingStartTimeNanos: Long = 0
  
  private val BIT_RATE = 6000000
  private val FRAME_RATE = 30
  private val I_FRAME_INTERVAL = 1
  
  private val SAMPLE_RATE = 44100
  private val CHANNEL_CONFIG = AudioFormat.CHANNEL_IN_MONO
  private val AUDIO_FORMAT = AudioFormat.ENCODING_PCM_16BIT

  override fun getName() = "ViewRecorderModule"

  @ReactMethod
  fun startRecording(viewTag: Int, promise: Promise) {
    Log.d("ViewRecorder", "startRecording called with viewTag: $viewTag")
    
    if (isRecording.get()) {
      promise.reject("ALREADY_RECORDING", "Recording is already in progress")
      return
    }
    
    try {
      // Support both Fabric (new architecture) and Paper (old architecture)
      val uiManager = UIManagerHelper.getUIManager(reactApplicationContext, UIManagerType.FABRIC)
        ?: UIManagerHelper.getUIManager(reactApplicationContext, UIManagerType.DEFAULT)
      
      if (uiManager == null) {
        Log.e("ViewRecorder", "UIManager not available")
        promise.reject("UI_MANAGER_NULL", "UIManager is not available")
        return
      }
      
      Log.d("ViewRecorder", "UIManager found: ${uiManager.javaClass.simpleName}")
      
      // Try to resolve view - support both old and new architecture
      val resolveViewRunnable = Runnable {
        try {
          // Method 1: Try direct resolution via UIManager
          var view: View? = null
          
          try {
            view = uiManager.resolveView(viewTag)
          } catch (e: Exception) {
            Log.w("ViewRecorder", "Direct resolveView failed, trying UIBlock: ${e.message}")
          }
          
          // Method 2: If direct resolution failed, try UIBlock (for old architecture)
          if (view == null && uiManager is UIManagerModule) {
            val latch = CountDownLatch(1)
            uiManager.addUIBlock(object : UIBlock {
              override fun execute(nativeViewHierarchyManager: NativeViewHierarchyManager) {
                try {
                  view = nativeViewHierarchyManager.resolveView(viewTag)
                } catch (e: Exception) {
                  Log.e("ViewRecorder", "Error in UIBlock", e)
                } finally {
                  latch.countDown()
                }
              }
            })
            latch.await(2, TimeUnit.SECONDS)
          }
          
          if (view == null) {
            Log.e("ViewRecorder", "Could not resolve view with tag: $viewTag")
            promise.reject("VIEW_NOT_FOUND", "Could not find view with tag $viewTag")
            return@Runnable
          }
          
          Log.d("ViewRecorder", "View found: $view")
          targetView = view
          
          // Wait a frame to ensure view is laid out
          view!!.post {
            try {
              // Get actual view dimensions
              viewWidth = view.width
              viewHeight = view.height
                
                Log.d("ViewRecorder", "View dimensions: ${viewWidth}x${viewHeight}")
                
                if (viewWidth <= 0 || viewHeight <= 0) {
                  promise.reject("INVALID_DIMENSIONS", "View has invalid dimensions: ${viewWidth}x${viewHeight}")
                  return@post
                }
              
                Log.d("ViewRecorder", "Starting recording for view: ${viewWidth}x${viewHeight}")
                
                // Setup output file
                val timestamp = System.currentTimeMillis()
                val moviesDir = reactApplicationContext.getExternalFilesDir(android.os.Environment.DIRECTORY_MOVIES)
                if (moviesDir != null && !moviesDir.exists()) {
                  moviesDir.mkdirs()
                }
                outputFile = File(moviesDir, "recording_$timestamp.mp4")
                
                // Initialize encoder handler thread
                encoderHandlerThread = HandlerThread("EncoderThread")
                encoderHandlerThread?.start()
                encoderHandler = Handler(encoderHandlerThread!!.looper)
                
                // Setup MediaMuxer
                mediaMuxer = MediaMuxer(outputFile!!.absolutePath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)
                
                // Setup Video Encoder
                setupVideoEncoder(viewWidth, viewHeight)
                
                // Setup Audio Encoder
                setupAudioEncoder()
                
                // Start recording - capture start time for accurate duration
                recordingStartTimeNanos = System.nanoTime()
                audioRecordingStartTimeNanos = System.nanoTime()
                isRecording.set(true)
                startVideoEncoding()
                startAudioRecording()
                
                val result = Arguments.createMap()
                result.putBoolean("success", true)
                result.putString("videoPath", outputFile!!.absolutePath)
                promise.resolve(result)
              } catch (e: Exception) {
                Log.e("ViewRecorder", "Error in view.post", e)
                cleanupResources()
                promise.reject("POST_ERROR", e.message, e)
              }
            }
        } catch (e: Exception) {
          Log.e("ViewRecorder", "Error resolving view", e)
          promise.reject("RESOLVE_ERROR", e.message, e)
        }
      }
      
      // Execute on UI thread
      Handler(Looper.getMainLooper()).post(resolveViewRunnable)
    } catch (e: Exception) {
      Log.e("ViewRecorder", "Error starting recording", e)
      promise.reject("START_ERROR", e.message, e)
    }
  }

  private fun setupVideoEncoder(width: Int, height: Int) {
    try {
      // Ensure dimensions are even (required for most codecs)
      val encoderWidth = if (width % 2 == 0) width else width + 1
      val encoderHeight = if (height % 2 == 0) height else height + 1
      
      val format = MediaFormat.createVideoFormat(MediaFormat.MIMETYPE_VIDEO_AVC, encoderWidth, encoderHeight)
      format.setInteger(MediaFormat.KEY_COLOR_FORMAT, MediaCodecInfo.CodecCapabilities.COLOR_FormatYUV420Flexible)
      format.setInteger(MediaFormat.KEY_BIT_RATE, BIT_RATE)
      format.setInteger(MediaFormat.KEY_FRAME_RATE, FRAME_RATE)
      format.setInteger(MediaFormat.KEY_I_FRAME_INTERVAL, I_FRAME_INTERVAL)
      
      videoCodec = MediaCodec.createEncoderByType(MediaFormat.MIMETYPE_VIDEO_AVC)
      videoCodec!!.configure(format, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)
      videoCodec!!.start()
      
      Log.d("ViewRecorder", "Video encoder configured: ${encoderWidth}x${encoderHeight}, bitrate: $BIT_RATE, fps: $FRAME_RATE")
    } catch (e: Exception) {
      Log.e("ViewRecorder", "Error setting up video encoder", e)
      throw e
    }
  }

  private fun setupAudioEncoder() {
    try {
      val format = MediaFormat.createAudioFormat(MediaFormat.MIMETYPE_AUDIO_AAC, SAMPLE_RATE, 1)
      format.setInteger(MediaFormat.KEY_AAC_PROFILE, MediaCodecInfo.CodecProfileLevel.AACObjectLC)
      format.setInteger(MediaFormat.KEY_BIT_RATE, 128000)
      format.setInteger(MediaFormat.KEY_MAX_INPUT_SIZE, 16384)
      
      audioCodec = MediaCodec.createEncoderByType(MediaFormat.MIMETYPE_AUDIO_AAC)
      audioCodec!!.configure(format, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)
      audioCodec!!.start()
      
      val minBufferSize = AudioRecord.getMinBufferSize(SAMPLE_RATE, CHANNEL_CONFIG, AUDIO_FORMAT)
      if (minBufferSize == AudioRecord.ERROR || minBufferSize == AudioRecord.ERROR_BAD_VALUE) {
        throw IllegalStateException("Failed to get valid audio buffer size")
      }
      
      audioRecord = AudioRecord(
        MediaRecorder.AudioSource.MIC,
        SAMPLE_RATE,
        CHANNEL_CONFIG,
        AUDIO_FORMAT,
        minBufferSize * 4
      )
      
      if (audioRecord!!.state != AudioRecord.STATE_INITIALIZED) {
        throw IllegalStateException("AudioRecord failed to initialize")
      }
      
      audioRecord!!.startRecording()
      Log.d("ViewRecorder", "Audio encoder configured: $SAMPLE_RATE Hz, buffer: ${minBufferSize * 4}")
    } catch (e: Exception) {
      Log.e("ViewRecorder", "Error setting up audio encoder", e)
      throw e
    }
  }

  private fun startVideoEncoding() {
    encoderThread = Thread {
      android.os.Process.setThreadPriority(android.os.Process.THREAD_PRIORITY_URGENT_DISPLAY)
      
      var frameCount = 0L
      val frameIntervalNs = 1000000000L / FRAME_RATE
      var nextFrameTime = System.nanoTime()
      
      Log.d("ViewRecorder", "Video encoding thread started")
      
      while (isRecording.get()) {
        try {
          val currentTime = System.nanoTime()
          
          if (currentTime >= nextFrameTime) {
            // Capture and encode frame
            val latch = CountDownLatch(1)
            var bitmap: Bitmap? = null
            
            Handler(Looper.getMainLooper()).post {
              try {
                bitmap = captureViewBitmap()
              } catch (e: Exception) {
                Log.e("ViewRecorder", "Error capturing bitmap", e)
              } finally {
                latch.countDown()
              }
            }
            
            // Wait for bitmap capture with timeout
            if (latch.await(100, TimeUnit.MILLISECONDS) && bitmap != null) {
              // Calculate presentation time based on actual elapsed time from recording start
              val elapsedTimeNanos = System.nanoTime() - recordingStartTimeNanos
              val presentationTimeUs = elapsedTimeNanos / 1000 // Convert nanos to micros
              
              encodeFrame(bitmap!!, presentationTimeUs)
              bitmap!!.recycle()
              frameCount++
            }
            
            nextFrameTime += frameIntervalNs
          }
          
          // Drain encoder buffer
          drainEncoder(videoCodec, videoTrackIndex, false)
          
          // Small sleep to prevent busy-waiting
          Thread.sleep(5)
        } catch (e: InterruptedException) {
          Log.w("ViewRecorder", "Video encoding thread interrupted")
          break
        } catch (e: Exception) {
          Log.e("ViewRecorder", "Error in video encoding thread", e)
        }
      }
      
      // Final drain with end-of-stream flag
      try {
        signalEndOfStream()
        drainEncoder(videoCodec, videoTrackIndex, true)
      } catch (e: Exception) {
        Log.e("ViewRecorder", "Error draining video encoder", e)
      }
      
      Log.d("ViewRecorder", "Video encoding thread finished, frames encoded: $frameCount")
    }
    encoderThread!!.start()
  }
  
  private fun signalEndOfStream() {
    try {
      val inputBufferIndex = videoCodec?.dequeueInputBuffer(10000) ?: return
      if (inputBufferIndex >= 0) {
        videoCodec?.queueInputBuffer(
          inputBufferIndex, 
          0, 
          0, 
          System.nanoTime() / 1000, 
          MediaCodec.BUFFER_FLAG_END_OF_STREAM
        )
      }
    } catch (e: Exception) {
      Log.e("ViewRecorder", "Error signaling end of stream", e)
    }
  }

  private fun startAudioRecording() {
    audioThread = Thread {
      val bufferInfo = MediaCodec.BufferInfo()
      val audioBuffer = ByteArray(4096)
      
      while (isRecording.get()) {
        try {
          val readBytes = audioRecord?.read(audioBuffer, 0, audioBuffer.size) ?: 0
          if (readBytes > 0) {
            val inputBufferIndex = audioCodec?.dequeueInputBuffer(10000) ?: -1
            if (inputBufferIndex >= 0) {
              val inputBuffer = audioCodec?.getInputBuffer(inputBufferIndex)
              inputBuffer?.clear()
              inputBuffer?.put(audioBuffer, 0, readBytes)
              
              // Calculate presentation time based on actual elapsed time from recording start
              val elapsedTimeNanos = System.nanoTime() - audioRecordingStartTimeNanos
              val presentationTimeUs = elapsedTimeNanos / 1000 // Convert nanos to micros
              
              audioCodec?.queueInputBuffer(inputBufferIndex, 0, readBytes, presentationTimeUs, 0)
            }
            
            drainEncoder(audioCodec, audioTrackIndex, false)
          }
        } catch (e: Exception) {
          Log.e("ViewRecorder", "Error in audio recording thread", e)
        }
      }
      
      drainEncoder(audioCodec, audioTrackIndex, true)
    }
    audioThread!!.start()
  }

  private fun captureViewBitmap(): Bitmap? {
    return try {
      val view = targetView ?: return null
      
      if (view.width <= 0 || view.height <= 0) {
        Log.w("ViewRecorder", "View has invalid dimensions")
        return null
      }
      
      val bitmap = Bitmap.createBitmap(view.width, view.height, Bitmap.Config.ARGB_8888)
      val canvas = Canvas(bitmap)
      
      // Draw view on canvas (this must be called on the thread that created the view)
      view.draw(canvas)
      
      bitmap
    } catch (e: Exception) {
      Log.e("ViewRecorder", "Error capturing view bitmap", e)
      null
    }
  }

  private fun encodeFrame(bitmap: Bitmap, presentationTimeUs: Long) {
    try {
      val inputBufferIndex = videoCodec?.dequeueInputBuffer(10000)
      if (inputBufferIndex == null || inputBufferIndex < 0) {
        Log.w("ViewRecorder", "No input buffer available for encoding")
        return
      }
      
      val inputBuffer = videoCodec?.getInputBuffer(inputBufferIndex) ?: return
      inputBuffer.clear()
      
      // Convert bitmap to YUV format (I420/YUV420P)
      val yuv = convertBitmapToYUV420(bitmap)
      
      if (yuv.size > inputBuffer.remaining()) {
        Log.e("ViewRecorder", "Buffer too small for YUV data: ${inputBuffer.remaining()} < ${yuv.size}")
        return
      }
      
      inputBuffer.put(yuv)
      
      videoCodec?.queueInputBuffer(inputBufferIndex, 0, yuv.size, presentationTimeUs, 0)
    } catch (e: Exception) {
      Log.e("ViewRecorder", "Error encoding frame", e)
    }
  }

  private fun convertBitmapToYUV420(bitmap: Bitmap): ByteArray {
    val width = bitmap.width
    val height = bitmap.height
    
    // Ensure dimensions are even
    val adjustedWidth = if (width % 2 == 0) width else width + 1
    val adjustedHeight = if (height % 2 == 0) height else height + 1
    
    val frameSize = adjustedWidth * adjustedHeight
    val yuv = ByteArray(frameSize * 3 / 2)
    
    val argb = IntArray(width * height)
    bitmap.getPixels(argb, 0, width, 0, 0, width, height)
    
    // Y plane
    var yIndex = 0
    for (j in 0 until height) {
      for (i in 0 until width) {
        val pixel = argb[j * width + i]
        val R = (pixel shr 16) and 0xff
        val G = (pixel shr 8) and 0xff
        val B = pixel and 0xff
        
        // ITU-R BT.601 conversion
        val Y = ((66 * R + 129 * G + 25 * B + 128) shr 8) + 16
        yuv[yIndex++] = Y.coerceIn(0, 255).toByte()
      }
      // Pad row if width was odd
      if (width != adjustedWidth) {
        yuv[yIndex++] = yuv[yIndex - 1]
      }
    }
    // Pad rows if height was odd
    if (height != adjustedHeight) {
      System.arraycopy(yuv, (height - 1) * adjustedWidth, yuv, height * adjustedWidth, adjustedWidth)
    }
    
    // U and V planes (subsampled 4:2:0)
    var uIndex = frameSize
    var vIndex = frameSize + frameSize / 4
    
    for (j in 0 until height step 2) {
      for (i in 0 until width step 2) {
        val pixel = argb[j * width + i]
        val R = (pixel shr 16) and 0xff
        val G = (pixel shr 8) and 0xff
        val B = pixel and 0xff
        
        val U = ((-38 * R - 74 * G + 112 * B + 128) shr 8) + 128
        val V = ((112 * R - 94 * G - 18 * B + 128) shr 8) + 128
        
        yuv[uIndex++] = U.coerceIn(0, 255).toByte()
        yuv[vIndex++] = V.coerceIn(0, 255).toByte()
      }
    }
    
    return yuv
  }

  private fun drainEncoder(codec: MediaCodec?, trackIndex: Int, endOfStream: Boolean) {
    if (codec == null) return
    
    val bufferInfo = MediaCodec.BufferInfo()
    val timeoutUs = if (endOfStream) 10000L else 0L
    
    while (true) {
      val outputBufferIndex = codec.dequeueOutputBuffer(bufferInfo, timeoutUs)
      
      when {
        outputBufferIndex == MediaCodec.INFO_TRY_AGAIN_LATER -> {
          if (!endOfStream) {
            break // No output available yet
          }
          // For end of stream, keep trying
        }
        outputBufferIndex == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> {
          synchronized(this) {
            val newFormat = codec.outputFormat
            val mimeType = newFormat.getString(MediaFormat.KEY_MIME)
            val isVideo = mimeType?.startsWith("video/") == true
            
            Log.d("ViewRecorder", "Output format changed: $mimeType")
            
            if (isVideo && videoTrackIndex == -1) {
              videoTrackIndex = mediaMuxer!!.addTrack(newFormat)
              Log.d("ViewRecorder", "Added video track: $videoTrackIndex")
            } else if (!isVideo && audioTrackIndex == -1) {
              audioTrackIndex = mediaMuxer!!.addTrack(newFormat)
              Log.d("ViewRecorder", "Added audio track: $audioTrackIndex")
            }
            
            // Start muxer when both tracks are added
            if (videoTrackIndex != -1 && audioTrackIndex != -1 && !muxerStarted.get()) {
              mediaMuxer!!.start()
              muxerStarted.set(true)
              Log.d("ViewRecorder", "Muxer started with video track $videoTrackIndex and audio track $audioTrackIndex")
            }
          }
        }
        outputBufferIndex >= 0 -> {
          val outputBuffer = codec.getOutputBuffer(outputBufferIndex)
          
          if (outputBuffer != null && bufferInfo.size > 0) {
            // Adjust buffer position
            outputBuffer.position(bufferInfo.offset)
            outputBuffer.limit(bufferInfo.offset + bufferInfo.size)
            
            if (muxerStarted.get() && trackIndex >= 0) {
              synchronized(this) {
                try {
                  mediaMuxer?.writeSampleData(trackIndex, outputBuffer, bufferInfo)
                } catch (e: Exception) {
                  Log.e("ViewRecorder", "Error writing sample data", e)
                }
              }
            } else {
              Log.w("ViewRecorder", "Muxer not started or invalid track index: $trackIndex")
            }
          }
          
          codec.releaseOutputBuffer(outputBufferIndex, false)
          
          if ((bufferInfo.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0) {
            Log.d("ViewRecorder", "End of stream reached for track $trackIndex")
            break
          }
        }
        else -> {
          Log.w("ViewRecorder", "Unexpected output buffer index: $outputBufferIndex")
          break
        }
      }
    }
  }

  @ReactMethod
  fun stopRecording(promise: Promise) {
    if (!isRecording.get()) {
      promise.reject("NOT_RECORDING", "No recording in progress")
      return
    }
    
    try {
      Log.d("ViewRecorder", "Stopping recording...")
      isRecording.set(false)
      
      // Wait for threads to finish with timeout
      encoderThread?.join(5000)
      audioThread?.join(5000)
      
      // Signal end of audio stream
      try {
        val inputBufferIndex = audioCodec?.dequeueInputBuffer(10000)
        if (inputBufferIndex != null && inputBufferIndex >= 0) {
          audioCodec?.queueInputBuffer(
            inputBufferIndex,
            0,
            0,
            System.nanoTime() / 1000,
            MediaCodec.BUFFER_FLAG_END_OF_STREAM
          )
        }
        drainEncoder(audioCodec, audioTrackIndex, true)
      } catch (e: Exception) {
        Log.e("ViewRecorder", "Error finishing audio encoding", e)
      }
      
      // Cleanup resources
      cleanupResources()
      
      val videoPath = outputFile?.absolutePath ?: ""
      
      // Verify file was created
      val fileExists = outputFile?.exists() == true
      val fileSize = outputFile?.length() ?: 0
      
      Log.d("ViewRecorder", "Recording stopped. File: $videoPath, exists: $fileExists, size: $fileSize bytes")
      
      val result = Arguments.createMap()
      result.putBoolean("success", fileExists && fileSize > 0)
      result.putString("videoPath", videoPath)
      promise.resolve(result)
      
    } catch (e: Exception) {
      Log.e("ViewRecorder", "Error stopping recording", e)
      cleanupResources()
      promise.reject("STOP_ERROR", e.message, e)
    }
  }
  
  private fun cleanupResources() {
    Log.d("ViewRecorder", "Cleaning up resources...")
    
    // Stop and release audio
    try {
      audioRecord?.stop()
      audioRecord?.release()
      audioRecord = null
    } catch (e: Exception) {
      Log.w("ViewRecorder", "Error stopping audio", e)
    }
    
    // Stop and release codecs
    try {
      videoCodec?.stop()
      videoCodec?.release()
      videoCodec = null
    } catch (e: Exception) {
      Log.w("ViewRecorder", "Error stopping video codec", e)
    }
    
    try {
      audioCodec?.stop()
      audioCodec?.release()
      audioCodec = null
    } catch (e: Exception) {
      Log.w("ViewRecorder", "Error stopping audio codec", e)
    }
    
    // Stop and release muxer
    try {
      if (muxerStarted.get()) {
        mediaMuxer?.stop()
      }
      mediaMuxer?.release()
      mediaMuxer = null
    } catch (e: Exception) {
      Log.w("ViewRecorder", "Error stopping muxer", e)
    }
    
    // Release input surface
    try {
      inputSurface?.release()
      inputSurface = null
    } catch (e: Exception) {
      Log.w("ViewRecorder", "Error releasing input surface", e)
    }
    
    // Stop encoder handler thread
    try {
      encoderHandlerThread?.quitSafely()
      encoderHandlerThread?.join(1000)
      encoderHandlerThread = null
      encoderHandler = null
    } catch (e: Exception) {
      Log.w("ViewRecorder", "Error stopping encoder handler thread", e)
    }
    
    // Reset state
    videoTrackIndex = -1
    audioTrackIndex = -1
    muxerStarted.set(false)
    targetView = null
    isRecording.set(false)
    recordingStartTimeNanos = 0
    audioRecordingStartTimeNanos = 0
    
    Log.d("ViewRecorder", "Resources cleaned up")
  }
}
