import { settingsStorage } from "settings";
import * as messaging from "messaging";
import { me as companion } from "companion";
import {
  HARD_RESYNC_SETTINGS_MESSAGE,
  SettingMessage,
  SOFT_RESYNC_SETTINGS_MESSAGE,
} from "../common/messages";

const NEEDS_SYNC_KEY: string = "needsSync";
const needsSync = () => settingsStorage.getItem(NEEDS_SYNC_KEY) !== null;
const setNeedsSync = (b: boolean) =>
  b
    ? settingsStorage.setItem(NEEDS_SYNC_KEY, "")
    : settingsStorage.removeItem(NEEDS_SYNC_KEY);

// Settings have been changed
settingsStorage.addEventListener("change", (evt) => {
  console.log(`key: ${evt.key}, value: ${evt.newValue}`);
  sendData(keyValuePair(evt.key, evt.newValue));
});

// Settings were changed while the companion was not running
if (companion.launchReasons.settingsChanged) {
  console.log("Launched because settings changed");
  syncAllSettings();
}

function syncAllSettings() {
  console.log("Syncing all settings.");
  for (var i = 0; i < settingsStorage.length; i++) {
    var key = settingsStorage.key(i);
    var value = settingsStorage.getItem(key);
    sendData(keyValuePair(key, value));
  }

  setNeedsSync(false);
}

function keyValuePair(key: string, val: string): SettingMessage {
  return {
    key: key,
    value: val,
  };
}

messaging.peerSocket.addEventListener("error", (err) => {
  console.error(`Connection error: ${err.code} - ${err.message}`);
});

messaging.peerSocket.addEventListener("message", (evt) => {
  console.log(`received message: ${JSON.stringify(evt.data)}`);
  if (
    evt.data === HARD_RESYNC_SETTINGS_MESSAGE ||
    (evt.data === SOFT_RESYNC_SETTINGS_MESSAGE && needsSync())
  ) {
    syncAllSettings();
  } else {
    console.log("Ignoring message.");
  }
});

function sendData(data: any) {
  // If we have a MessageSocket, send the data to the device
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    messaging.peerSocket.send(data);
  } else {
    console.error(
      "No peerSocket connection. Saving setting to indicate that a sync is required later."
    );
    setNeedsSync(true);
  }
}
