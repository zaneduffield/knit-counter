import document from "document";
import { display } from "display";
import * as messaging from "messaging";
import { readFileSync, writeFileSync, existsSync } from "fs";
import {
  isProjectOperation,
  isSettingsMessage,
  ProjectOperation,
  SettingMessage,
} from "../common/messages";
import {
  INIT_PROJ_ID,
  INIT_PROJ_NAME,
  INIT_REPEAT_LEN,
  ProjectConfig,
} from "../common/settingsTypes";
import { me as appbit } from "appbit";
import clock from "clock";

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

function initProject(name: string, repeatLen: number): Project {
  return {
    name: name,
    repeatLength: INIT_REPEAT_LEN,
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
  projId: number;
  // maps don't work properly on this device
  // most of the methods aren't even there
  projects: [number, Project][];
}

var settings: Settings = {
  projId: INIT_PROJ_ID,
  projects: [[INIT_PROJ_ID, initProject(INIT_PROJ_NAME, INIT_REPEAT_LEN)]],
};

var project: Project;

const SETTINGS_FNAME = "settings.json";

var background: Element;
var projectName: Element;

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

function stringifySettings(settings: Settings): string {
  return JSON.stringify(settings);
}

function parseSettings(s: string): Settings {
  return JSON.parse(s);
}

function saveSettings() {
  console.log("writing settings file");
  writeFileSync(SETTINGS_FNAME, stringifySettings(settings), "utf-8");
}

function getCurProject(): Project | undefined {
  return getProject(settings.projId);
}

function getProject(id: number): Project | undefined {
  // jerryscript doesn't have 'array.find'
  return settings.projects.filter(([n, _]) => n === id)[0]?.[1];
}

function loadSettings() {
  console.log("reading settings file");
  settings = parseSettings(readFileSync(SETTINGS_FNAME, "utf-8"));
  project = getCurProject();
}

function refresh() {
  loadSettings();
  redraw();
}

function setCurProject(p: Project) {}

function setCurProjectId(i: number) {
  const proj = getProject(i);
  if (proj !== undefined) {
    settings.projId = i;
    project = proj;
  } else {
    project = undefined;
    console.error(`unknown project ID: ${i}`);
    console.error(
      `known project IDs: ${JSON.stringify(
        settings.projects.map(([id, _]) => id)
      )}`
    );
  }
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
  tryLoadProjectById(settings.projId);

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

async function tryLoadProjectById(i: number) {
  const proj = getProject(i);
  if (proj === undefined) {
    await loadProjectSelectionView();
  } else {
    await loadProject([i, proj]);
  }
}

function updateTime(date: Date) {
  const elm = document.getElementById("time");
  if (elm) {
    const timeStr = `${date.getHours()}:${date.getMinutes()}`;
    elm.text = timeStr;

    console.log(new Date().toLocaleTimeString());
    console.log(date.toTimeString());
  }
}

async function loadProject([id, proj]: [number, Project]) {
  settings.projId = id;
  project = proj;

  await document.location.replace("./resources/index.view");

  background = document.getElementById("background");
  projectName = document.getElementById("project-name");

  clock.granularity = "minutes";
  updateTime(new Date());
  clock.ontick = (e) => updateTime(e.date);

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
  redrawSettings();
}

function redrawSettings() {
  let list = document.getElementById("myList");
  let help = document.getElementById("no-project-help");
  if (settings.projects.length === 0) {
    help.style.display = "inline";
    list.style.display = "none";
    return;
  }

  help.style.display = "none";
  list.style.display = "inline";

  // @ts-ignore
  list.delegate = {
    getTileInfo: (index: number) => {
      return {
        type: "list-pool",
        value: "Item",
        index: index,
      };
    },
    configureTile: (tile, info) => {
      const index: number = info.index;
      console.log(`Item: ${info.index}`);
      if (info.type == "list-pool") {
        tile.getElementById("text").text = settings.projects[index]?.[1].name;
        let touch = tile.getElementById("touch");
        touch.onclick = () => loadProject(settings.projects[index]);
      }
    },
  };

  // length must be set AFTER delegate
  // @ts-ignore
  list.length = settings.projects.length;
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
  console.log(`current view: ${document.location.pathname}`);
  if (document.location.pathname === "./resources/settings/settings.view") {
    redrawSettings();
  } else {
    redrawProject();
  }
}

function redrawProject() {
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

  projectName.text = project.name;

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

async function receiveSettingsMessage(obj: SettingMessage) {
  var key = obj.key;
  var value = obj.value;
  console.log(`recieved data over socket: key='${key}', value='${value}'`);

  if (key === "projects") {
    var projectSettings: [number, ProjectConfig][] = JSON.parse(value);
    projectSettings.forEach(([id, incomingProject]) => {
      var proj = getProject(id);
      if (proj !== undefined) {
        proj.name = incomingProject.name;
        proj.repeatLength = incomingProject.repeatLength;
      } else {
        var proj = initProject(incomingProject.name, incomingProject.repeatLength);
        settings.projects.push([id, proj]);
      }
    });

    settings.projects = settings.projects.filter(
      ([id, _]) => projectSettings.filter(([id2, _]) => id2 === id).length > 0
    );

    if (getCurProject() === undefined) {
      await loadProjectSelectionView();
    } else {
      redraw();
    }
  } else {
    console.warn(`ignoring settings message with key ${key}`);
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
async function receiveMessageItem(o) {
  if (isSettingsMessage(o)) {
    await receiveSettingsMessage(o);
  } else if (isProjectOperation(o)) {
    receiveProjectOperation(o);
  }
}

async function receiveMessage(evt: messaging.MessageEvent) {
  if (evt && evt.data) {
    if (evt.data instanceof Array) {
      for (const elm in evt.data) {
        await receiveMessageItem(elm);
      }
    } else if (evt.data instanceof Object) {
      await receiveMessageItem(evt.data);
    }
    redraw();
    saveSettings();
  }
}

// export default () => {
// };

init();
