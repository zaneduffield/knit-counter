import { settingsStorage } from "settings";
import * as messaging from "messaging";
import { me as companion } from "companion";
import { Operation, SettingMessage } from "../common/messages";
import { ProjectSettings } from "../common/settingsTypes";

// Settings have been changed
// settingsStorage.addEventListener("change", (evt) => {
//   console.log(`key: ${evt.key}, value: ${evt.newValue}`);
//   var settings: ProjectSettings = {
//     nextId: undefined,
//     projects: undefined,
//   };
//   settings[evt.key] = evt.newValue;
//   sendData(settings);
// });

// // Settings were changed while the companion was not running
// if (companion.launchReasons.settingsChanged) {
//   // Send the value of the setting
//   var data: SettingMessage[] = [];
//   for (var i = 0; i < settingsStorage.length; i++) {
//     var key = settingsStorage.key(i);
//     var value = settingsStorage.getItem(key);
//     data.push(keyValuePair(key, value));
//   }

//   sendData(data);
// }

function keyValuePair(key: string, val: any): SettingMessage {
  return {
    key: key,
    value: JSON.parse(val),
  };
}

function sendData(data: any) {
  // If we have a MessageSocket, send the data to the device
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    messaging.peerSocket.send(data);
  } else {
    console.error("No peerSocket connection");
  }
}
