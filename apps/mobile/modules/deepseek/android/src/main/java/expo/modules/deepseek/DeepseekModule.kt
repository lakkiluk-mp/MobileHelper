package expo.modules.deepseek

import android.content.ActivityNotFoundException
import android.content.Intent
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class DeepseekModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("Deepseek")

    Function("send") { packageName: String, text: String ->
      val activity = appContext.currentActivity ?: return@Function "missing"
      val share = Intent(Intent.ACTION_SEND)
        .setPackage(packageName)
        .setType("text/plain")
        .putExtra(Intent.EXTRA_TEXT, text)
      try {
        activity.startActivity(share)
        return@Function "sent"
      } catch (_: ActivityNotFoundException) {
      }
      val launch = activity.packageManager.getLaunchIntentForPackage(packageName)
        ?: return@Function "missing"
      activity.startActivity(launch)
      "opened"
    }
  }
}
