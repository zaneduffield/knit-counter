import document from "document";
import { display } from "display";
import * as messaging from "messaging";
import { readFileSync, writeFileSync, existsSync, unlinkSync } from "fs";
import {
  isProjectOperation,
  isSettingsMessage,
  Operation,
  ProjectOperation,
  SettingMessage,
} from "../common/messages";
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

function initProject(name: string): Project {
  return {
    name: name,
    repeatLength: 8,
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
  projIdx: number;
  selectedProjName: string;
  projects: Project[];
}

var settings: Settings = {
  projIdx: 0,
  selectedProjName: "my project",
  projects: [initProject("my project")],
};

var project: Project;

const SETTINGS_FNAME = "settings.json";

var background: Element;
var projectId: Element;

var plusButton: Element;
var subButton: Element;

var globalCounterElm: Element;
var repeatProgressElm: Element;
var repeatCountElm: Element;

var globalBubbleElm: Element;
var repeatProgressBubbleElm: Element;
var repeatCountBubbleElm: Element;

var globalOutlineElm: Element;
var repeatProgressOutlineElm: Element;
var repeatCountOutlineElm: Element;

function saveSettings() {
  console.log("writing settings file");
  writeFileSync(SETTINGS_FNAME, settings, "json");
}

function getProject(): Project {
  return settings.projects[settings.projIdx];
}

function loadSettings() {
  console.log("reading settings file");
  settings = readFileSync(SETTINGS_FNAME, "json");
  project = getProject();
}

function refresh() {
  loadSettings();
  redraw();
}

function setProjectIdx(i: number) {
  while (i >= settings.projects.length) {
    settings.projects.push(initProject(`Project ${i}`));
  }
  settings.projIdx = i;
  project = getProject();
}

var y = 0;
var x = 0;

function init() {
  console.log("initialising");

  appbit.appTimeoutEnabled = false;

  if (!existsSync(SETTINGS_FNAME)) {
    saveSettings();
  }
  loadSettings();
  loadProject(0);

  messaging.peerSocket.addEventListener("message", receiveMessage);

  display.addEventListener("change", () => {
    if (display.on) {
      refresh();
    } else {
      saveSettings();
    }
  });

  appbit.onunload = () => saveSettings();
}

async function loadProject(i: number) {
  await document.location.replace("./resources/index.view");
  setProjectIdx(i);

  background = document.getElementById("background");
  projectId = document.getElementById("project-id");

  plusButton = document.getElementById("plus-button");
  subButton = document.getElementById("sub-button");

  globalCounterElm = document.getElementById("global-count");
  repeatProgressElm = document.getElementById("repeat-progress-count");
  repeatCountElm = document.getElementById("repeat-count");

  globalBubbleElm = document.getElementById("global-bubble");
  repeatProgressBubbleElm = document.getElementById("repeat-progress-bubble");
  repeatCountBubbleElm = document.getElementById("repeat-bubble");

  globalOutlineElm = document.getElementById("outline-global-bubble");
  repeatProgressOutlineElm = document.getElementById(
    "outline-repeat-progress-bubble"
  );
  repeatCountOutlineElm = document.getElementById("outline-repeat-bubble");

  plusButton.onclick = incrementEvent(1);
  subButton.onclick = incrementEvent(-1);

  globalBubbleElm.onclick = () => selectBubble(Bubble.Global);
  repeatCountBubbleElm.onclick = () => selectBubble(Bubble.RepeatCount);
  repeatProgressBubbleElm.onclick = () => selectBubble(Bubble.RepeatProgress);

  background.onmousedown = (e) => {
    console.log("mouse down");
    x = e.screenX;
    y = e.screenY;
  };

  background.onmouseup = async (e) => {
    console.log("mouse up");
    let xMove = e.screenX - x;
    let yMove = e.screenY - y;

    if (yMove < -60) {
      /* swipe up */
      console.log("swipe up");
    } else if (yMove > 60) {
      /* swipe down */
      console.log("swipe down");
    } else if (xMove < -60) {
      /* swipe left */
      console.log("swipe left");
      await loadProjectSelectionView();
    } else if (xMove > 60) {
      /* swipe right */
      console.log("swipe right");
    }
  };

  redraw();
}

async function loadProjectSelectionView() {
  await document.location.replace("./resources/settings/settings.view");

  let list = document.getElementById("myList");
  let items = list.getElementsByClassName("list-item");

  items.forEach((element, index) => {
    let touch = element.getElementById("touch");
    touch.onclick = () => loadProject(index);
  });
}

function selectBubble(b: Bubble) {
  project.selectedBubble = b;
  redraw();
}

function incRepeatCount(i: number) {
  if (project.repeatLength > 0) {
    project.repeatCount = Math.max(project.repeatCount + i, 0);
  } else {
    project.repeatCount = 0;
  }
}

function incrementEvent(i: number): (e: MouseEvent) => void {
  return () => {
    if (project.selectedBubble === Bubble.Global) {
      project.globalCount = Math.max(project.globalCount + i, 0);
      incRepeatCount(i);
    } else if (project.selectedBubble === Bubble.RepeatProgress) {
      incRepeatCount(i);
    } else if (project.selectedBubble === Bubble.RepeatCount) {
      incRepeatCount(i * project.repeatLength);
    }
    redraw();
  };
}

function redraw() {
  console.log(
    `updating display with global count ${project.globalCount} and repeat length ${project.repeatLength}`
  );
  globalCounterElm.text = project.globalCount.toString();
  if (project.repeatLength > 0) {
    repeatProgressElm.text = `${project.repeatCount % project.repeatLength}/${
      project.repeatLength
    }`;
    repeatCountElm.text = Math.floor(
      project.repeatCount / project.repeatLength
    ).toString();
  } else {
    repeatProgressElm.text = "";
    repeatCountElm.text = "";
  }

  projectId.text = (1 + settings.projIdx).toString();

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

function receiveProjectOperation(op: ProjectOperation) {
  // var projName = op.project ?? project.name;
  // var proj = findProject(projName);
  // if (op.operation === Operation.Reset) {
  //   console.log(`resetting counters for project ${projName} to zero`);
  //   proj.globalCount = 0;
  //   proj.repeatCount = 0;
  // }
}

// need to generalise this to work with the entire settings object
function receiveMessageItem(o) {
  // if (isSettingsMessage(o)) {
  //   receiveSettingsMessage(o);
  // } else if (isProjectOperation(o)) {
  //   receiveProjectOperation(o);
  // }
}

function receiveMessage(evt: messaging.MessageEvent) {
  if (evt && evt.data) {
    if (evt.data instanceof Array) {
      evt.data.forEach(receiveMessageItem);
    } else if (evt.data instanceof Object) {
      receiveMessageItem(evt.data);
    }
    redraw();
    saveSettings();
  }
}

// export default () => {
// };

init();
