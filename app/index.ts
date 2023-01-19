import document from "document";
import { display } from "display";
import * as messaging from "messaging";
import { readFileSync, writeFileSync, existsSync } from "fs";
import {
  isProjectOperation,
  isSettingsMessage,
  Operation,
  ProjectOperation,
  SettingMessage,
} from "../common/messages";
import {
  DEFAULT_TIME_FORMAT,
  INIT_PROJ_ID,
  INIT_PROJ_NAME,
  INIT_REPEAT_LEN,
  ProjectConfig,
  TimeFormat,
} from "../common/settingsTypes";
import { me as appbit } from "appbit";
import clock from "clock";
import "./padStart";

interface Project {
  name: string;
  globalCount: number;
  repeatCount: number;
  repeatLength: number;
  repeatGoal?: number;
  selectedBubble: Bubble;

  circleColour?: string;
  textColour?: string;
  buttonMainColour?: string;
  buttonSecondaryColour?: string;
}

function initProject(
  name: string,
  repeatLen: number,
  repeatGoal: number | undefined
): Project {
  return {
    name: name,
    repeatLength: repeatLen,
    globalCount: 0,
    repeatCount: 0,
    repeatGoal: repeatGoal,
    selectedBubble: Bubble.Global,
  };
}

enum Bubble {
  Global,
  RepeatProgress,
  RepeatCount,
}

interface Settings {
  timeFormat: TimeFormat;
  projId: number;
  // maps don't work properly on this device
  // most of the methods aren't even there
  projects: [number, Project][];
}

var settings: Settings = {
  timeFormat: DEFAULT_TIME_FORMAT,
  projId: INIT_PROJ_ID,
  projects: [
    [INIT_PROJ_ID, initProject(INIT_PROJ_NAME, INIT_REPEAT_LEN, undefined)],
  ],
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
var repeatProgressArc: ArcElement;

var repeatCountBubbleElm: Element;
var repeatCountProgressArc: ArcElement;

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
  for (let i = settings.projects.length; i--; ) {
    let proj = settings.projects[i];
    if (proj[0] === id) {
      return proj[1];
    }
  }
  return undefined;
}

function loadSettings() {
  console.log("reading settings file");
  settings = parseSettings(readFileSync(SETTINGS_FNAME, "utf-8"));
  project = getCurProject();
}

async function refresh() {
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
function pad2dig(n: number) {
  return n.toString().padStart(2, "0");
}

function getTimeElement(): Element {
  return document.getElementById("time");
}

function updateTime(date: Date) {
  console.log("updating time");
  const elm = getTimeElement();
  if (elm) {
    elm.style.display = "inline";
    const timeFormat = settings.timeFormat ?? DEFAULT_TIME_FORMAT;
    const mins = pad2dig(date.getMinutes());
    const hours = timeFormat.is24hourTime
      ? pad2dig(date.getHours())
      : 1 + ((date.getHours() - 1) % 12);
    const suffix = timeFormat.is24hourTime
      ? ""
      : date.getHours() < 12
      ? " AM"
      : " PM";

    const secs = timeFormat.showSeconds ? ":" + pad2dig(date.getSeconds()) : "";
    const timeStr = `${hours}:${mins}${secs}${suffix}`;
    elm.text = timeStr;

    console.log(new Date().toLocaleTimeString());
    console.log(date.toTimeString());
  }
}

function setupClock() {
  console.log("configuring clock");

  const elm = getTimeElement();
  if (settings.timeFormat.showTime) {
    clock.granularity = settings.timeFormat.showSeconds ? "seconds" : "minutes";
    updateTime(new Date());
    clock.ontick = (e) => updateTime(e.date);
  } else {
    elm.style.display = "none";
    clock.ontick = undefined;
  }
}

async function loadProject([id, proj]: [number, Project]) {
  console.log("loading project");
  settings.projId = id;
  project = proj;

  await document.location.replace("./resources/index.view");
  console.log("loaded index.view");

  background = document.getElementById("background");
  projectName = document.getElementById("project-name");

  setupClock();

  plusButton = document.getElementById("plus-button");
  subButton = document.getElementById("sub-button");

  globalCounterElm = document.getElementById("global-count");
  repeatProgressElm = document.getElementById("repeat-progress-count");
  repeatCountElm = document.getElementById("repeat-count");

  globalBubbleElm = document.getElementById("global-bubble");
  repeatProgressBubbleElm = document.getElementById("repeat-progress-bubble");
  repeatCountBubbleElm = document.getElementById("repeat-bubble");

  var arcs = document.getElementsByTagName("arc");
  // TODO don't use the 'functional' JS on a low-powered device
  repeatCountProgressArc = arcs.filter((a) => a.id === "arc-count")[0];
  repeatProgressArc = arcs.filter((a) => a.id === "arc-progress")[0];

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
  console.log("loading project selection view");
  await document.location.replace("./resources/settings/settings.view");

  let list = document.getElementById("myList");

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
  console.log("starting redraw");
  console.log(`current view: ${document.location.pathname}`);
  if (document.location.pathname === "./resources/settings/settings.view") {
    redrawSettings();
  } else {
    redrawProject();
  }
}

function redrawProject() {
  console.log(
    `redrawing project with global count ${project.globalCount} and repeat length ${project.repeatLength}`
  );
  globalCounterElm.text = project.globalCount.toString();
  if (project.repeatLength > 0) {
    var repeatPos = project.repeatCount % project.repeatLength;
    var numRepeats = Math.floor(project.repeatCount / project.repeatLength);

    repeatProgressElm.text = `${repeatPos}/${project.repeatLength}`;
    repeatCountElm.text = numRepeats.toString();
    repeatProgressArc.sweepAngle = (repeatPos / project.repeatLength) * 360;
    // TODO make the 'goal' number of repeats configurable!
    repeatCountProgressArc.sweepAngle = project.repeatGoal
      ? (numRepeats / project.repeatGoal) * 360
      : 0;
  } else {
    repeatProgressElm.text = "";
    repeatCountElm.text = "";

    repeatCountProgressArc.sweepAngle = 0;
    repeatProgressArc.sweepAngle = 0;
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

function receiveProjectOperation(op: ProjectOperation) {
  if (op.operation === Operation.ResetCounters) {
    console.log(`resetting counters for project id ${op.projId} to zero`);
    var proj = getProject(op.projId);
    proj.globalCount = 0;
    proj.repeatCount = 0;
  } else {
    console.warn(`ignoring unknown project operation: ${op.operation}`);
  }
}

async function receiveMessageItem(obj) {
  if (isSettingsMessage(obj)) {
    // having this in a function was causing stack overflows, so I've inline-ed it.
    var key = obj.key;
    var value = obj.value;
    console.log(`recieved data over socket: key='${key}', value='${value}'`);

    if (key === "projects") {
      var projectSettings: [number, ProjectConfig][] = JSON.parse(value);
      for (let i = projectSettings.length; i--; ) {
        let [id, incomingProject] = projectSettings[i];
        var proj = getProject(id);
        if (proj !== undefined) {
          proj.name = incomingProject.name;
          proj.repeatLength = incomingProject.repeatLength;
          proj.repeatGoal = incomingProject.repeatGoal;
        } else {
          var proj = initProject(
            incomingProject.name,
            incomingProject.repeatLength,
            incomingProject.repeatGoal
          );
          settings.projects.push([id, proj]);
        }
      }
      console.log("finished adding/editing projects");

      var removed = 0;
      for (let i = settings.projects.length; i--; ) {
        var found = false;
        for (let j = projectSettings.length; j--; ) {
          if (projectSettings[j][0] === settings.projects[i][0]) {
            found = true;
            break;
          }
        }

        if (!found) {
          // swap remove with last elm
          var lastIdx = settings.projects.length - 1 - removed;
          var tmp = settings.projects[i];
          // could also try destructured assignment
          settings.projects[i] = settings.projects[lastIdx];
          settings.projects[lastIdx] = tmp;
          removed++;
        }
      }
      settings.projects.length -= removed;
      console.log("finished deleting projects");

      if (getCurProject() === undefined) {
        await loadProjectSelectionView();
      } else {
        redraw();
      }
    } else if (key === "timeFormat") {
      settings.timeFormat = JSON.parse(value);
      setupClock();
    } else if (key === "projectOperation") {
      receiveProjectOperation(JSON.parse(value));
    } else {
      console.warn(`ignoring unknown settings message with key ${key}`);
    }
  } else if (obj.projectOperation) {
    receiveProjectOperation(obj.projectOperation);
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

init();
