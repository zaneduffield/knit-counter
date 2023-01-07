import document from "document";
import { display } from "display";
import * as messaging from "messaging";
import { readFileSync, writeFileSync, existsSync, unlinkSync } from "fs";
import { isSettingsMessage, SettingMessage } from "../common/messages";
import { me as appbit } from "appbit";

interface Project {
  name: string;
  globalCount: number;
  repeatCount: number;
  repeatLength: number | null;
  selectedBubble: Bubble;

  circleColour?: string;
  textColour?: string;
  buttonMainColour?: string;
  buttonSecondaryColour?: string;
}

function zeroProject(name: string): Project {
  return {
    name: "my project",
    repeatLength: 0,
    globalCount: 0,
    repeatCount: 0,
    selectedBubble: Bubble.Global,
  };
}

enum Bubble {
  Global,
  RepeatProgress,
  RepeatCount,
}

interface Settings {
  selectedProjName: string;
  projects: Project[];
}

var settings: Settings = {
  selectedProjName: "my project",
  projects: [zeroProject("my project")],
};

var project: Project;

const SETTINGS_FNAME = "settings.json";

var plusButton = document.getElementById("plus-button");
var subButton = document.getElementById("sub-button");

var globalCounterElm = document.getElementById("global-count");
var repeatProgressElm = document.getElementById("repeat-progress-count");
var repeatCountElm = document.getElementById("repeat-count");

var globalBubbleElm = document.getElementById("global-bubble");
var repeatProgressBubbleElm = document.getElementById("repeat-progress-bubble");
var repeatCountBubbleElm = document.getElementById("repeat-bubble");

var globalOutlineElm = document.getElementById("outline-global-bubble");
var repeatProgressOutlineElm = document.getElementById(
  "outline-repeat-progress-bubble"
);
var repeatCountOutlineElm = document.getElementById("outline-repeat-bubble");

function saveSettings() {
  console.log("writing settings file");
  writeFileSync(SETTINGS_FNAME, settings, "json");
}

function loadSettings() {
  console.log("reading settings file");
  settings = readFileSync(SETTINGS_FNAME, "json");
  project = settings.projects.filter(
    (p) => p.name == settings.selectedProjName
  )[0];
}

function refresh() {
  loadSettings();
  updateDisplay();
}

function init() {
  console.log("initialising");

  appbit.appTimeoutEnabled = false;

  if (!existsSync(SETTINGS_FNAME)) {
    saveSettings();
  }
  refresh();

  plusButton.onclick = increment(1);
  subButton.onclick = increment(-1);

  globalBubbleElm.onclick = (e) => {
    project.selectedBubble = Bubble.Global;
    updateDisplay();
  };

  repeatCountBubbleElm.onclick = (e) => {
    project.selectedBubble = Bubble.RepeatCount;
    updateDisplay();
  };

  repeatProgressBubbleElm.onclick = (e) => {
    project.selectedBubble = Bubble.RepeatProgress;
    updateDisplay();
  };

  messaging.peerSocket.addEventListener("message", receiveMessage);

  display.addEventListener("change", () => {
    if (display.on) {
      refresh();
    } else {
      saveSettings();
    }
  });

  appbit.onunload = (e) => {
    saveSettings();
  };
}

function incRepeatCount(i: number) {
  if (project.repeatLength > 0) {
    project.repeatCount = Math.max(project.repeatCount + i, 0);
  } else {
    project.repeatCount = 0;
  }
}

function increment(i: number): (e: MouseEvent) => void {
  return (e) => {
    if (project.selectedBubble === Bubble.Global) {
      project.globalCount = Math.max(project.globalCount + i, 0);
      incRepeatCount(i);
    } else if (project.selectedBubble === Bubble.RepeatProgress) {
      incRepeatCount(i);
    } else if (project.selectedBubble === Bubble.RepeatCount) {
      incRepeatCount(i * project.repeatLength);
    }
    updateDisplay();
  };
}

function updateDisplay() {
  console.log(
    `updating display with global count ${project.globalCount} and repeat length ${project.repeatLength}`
  );
  globalCounterElm.text = (1 + project.globalCount).toString();
  if (project.repeatLength > 0) {
    repeatProgressElm.text = `${
      1 + (project.repeatCount % project.repeatLength)
    }/${project.repeatLength}`;
    repeatCountElm.text = Math.floor(
      project.repeatCount / project.repeatLength
    ).toString();
  } else {
    repeatProgressElm.text = "";
    repeatCountElm.text = "";
  }

  globalOutlineElm.style.visibility = "hidden";
  repeatCountOutlineElm.style.visibility = "hidden";
  repeatProgressOutlineElm.style.visibility = "hidden";

  if (
    project.selectedBubble === Bubble.Global ||
    project.selectedBubble === undefined
  ) {
    globalOutlineElm.style.visibility = "visible";
  } else if (project.selectedBubble === Bubble.RepeatCount) {
    repeatCountOutlineElm.style.visibility = "visible";
  } else if (project.selectedBubble === Bubble.RepeatProgress) {
    repeatProgressOutlineElm.style.visibility = "visible";
  }
}

function receiveSettingsMessage(obj: SettingMessage) {
  var key = obj.key;
  var value = obj.value;
  console.log(
    `recieved data over socket: key='${key}', value='${JSON.stringify(value)}'`
  );

  if (key === "repeatLength") {
    console.log(`repeat length updated to ${value.name}`);
    project.repeatLength = value.name;
  } else if (key === "textColour") {
    project.textColour = value;
  } else if (key === "circleColour") {
    project.circleColour = value;
  } else if (key === "buttonMainColour") {
    project.buttonMainColour = value;
  } else if (key === "buttonSecondaryColour") {
    project.buttonSecondaryColour = value;
  }
}

function receiveMessageItem(o) {
  if (isSettingsMessage(o)) {
    receiveSettingsMessage(o);
  }
}

function receiveMessage(evt: messaging.MessageEvent) {
  if (evt && evt.data) {
    if (evt.data instanceof Array) {
      evt.data.forEach(receiveMessageItem);
    } else if (evt.data instanceof Object) {
      receiveMessageItem(evt.data);
    }
    updateDisplay();
    saveSettings();
  }
}

init();
