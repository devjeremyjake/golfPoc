package expo.modules.screenrecorder

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.content.getSystemService


object NotificationHelper {
    private const val CHANNEL_ID = "screen_recording_channel"
    fun createNotification(context: Context): Notification {
        val intent = Intent(Intent.ACTION_MAIN).apply {
            setPackage("com.devjeremyjake.golfpoc")
            addCategory(Intent.CATEGORY_LAUNCHER)
        }
        val pendingIntent = PendingIntent.getActivity(
            context, 0, intent, PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(context, CHANNEL_ID)
        .setContentTitle("Screen recording")
        .setContentText("Recording in progress")
        .setSmallIcon(android.R.drawable.ic_menu_camera)
        .setContentIntent(pendingIntent)
        .build()
    }
    fun createNotificationChannel(context: Context) {
        val serviceChannel = NotificationChannel(
            CHANNEL_ID,
            "Screen Recording Service Channel",
            NotificationManager.IMPORTANCE_DEFAULT
        )
        val manager = context.getSystemService<NotificationManager>()
        manager?.createNotificationChannel(serviceChannel)
    }
}