import document from "document";
import { display } from "display";
import * as messaging from "messaging";
import { readFileSync, writeFileSync, existsSync } from "fs";
import {
  isSettingsMessage,
  Operation,
  ProjectOperation,
  SOFT_RESYNC_SETTINGS_MESSAGE,
} from "../common/messages";
import {
  DEFAULT_IS_DARK_MODE,
  DEFAULT_TIME_FORMAT,
  INIT_PROJ_COLOUR,
  INIT_PROJ_ID,
  INIT_PROJ_NAME,
  INIT_REPEAT_LEN,
  ProjectConfig,
  TimeFormat,
} from "../common/settingsTypes";
import { me as appbit } from "appbit";
import { me as device } from "device";
import { vibration } from "haptics";
import clock from "clock";
import "./padStart";

interface Project {
  name: string;
  globalCount: number;
  repeatCount: number;
  repeatLength: number;
  repeatGoal?: number;
  colour: string;
  selectedBubble: Bubble;
}

function initProject(
  name: string,
  repeatLen: number,
  repeatGoal: number | undefined,
  colour: string
): Project {
  return {
    name: name,
    repeatLength: repeatLen,
    globalCount: 0,
    repeatCount: 0,
    repeatGoal: repeatGoal,
    colour: colour,
    selectedBubble: Bubble.Global,
  };
}

enum Bubble {
  Global,
  RepeatProgress,
  RepeatCount,
}

interface Settings {
  isDarkMode: boolean;
  timeFormat: TimeFormat;
  projId: number;
  // maps don't work properly on this device
  // most of the methods aren't even there
  projects: [number, Project][];
}

var settings: Settings = {
  isDarkMode: DEFAULT_IS_DARK_MODE,
  timeFormat: DEFAULT_TIME_FORMAT,
  projId: INIT_PROJ_ID,
  projects: [
    [
      INIT_PROJ_ID,
      initProject(INIT_PROJ_NAME, INIT_REPEAT_LEN, undefined, INIT_PROJ_COLOUR),
    ],
  ],
};

var project: Project;

const SETTINGS_FNAME = "settings.json";

var projectName: Element;

var lastSlidePos: number;
var slideGroup: GroupElement;

var plusButton: Element;
var subButton: Element;

var globalCounterElm: Element;
var repeatProgressElm: TextElement;
var repeatTargetElm: TextElement;
var repeatCountElm: Element;

var globalBubbleElm: CircleElement;

var repeatProgressBubbleElm: CircleElement;
var repeatProgressArc: ArcElement;

var repeatCountBubbleElm: CircleElement;
var repeatCountProgressArc: ArcElement;

var globalOutlineElm: Element;
var repeatProgressOutlineElm: Element;
var repeatCountOutlineElm: Element;

var applicationFillElms: Element[];
var backgroundFillElms: Element[];

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

function sendMessage(o: any) {
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    messaging.peerSocket.send(o);
  } else {
    console.error("No peerSocket connection");
  }
}

function requestSoftSync() {
  sendMessage(SOFT_RESYNC_SETTINGS_MESSAGE);
}

function init() {
  console.log("initialising");

  appbit.appTimeoutEnabled = false;

  if (!existsSync(SETTINGS_FNAME)) {
    saveSettings();
  }
  loadSettings();
  loadDocument();
  tryLoadProjectById(settings.projId);

  messaging.peerSocket.addEventListener("message", receiveMessage);
  messaging.peerSocket.addEventListener("open", requestSoftSync);

  display.addEventListener("change", () => {
    if (display.on) {
      refresh();
    } else {
      saveSettings();
    }
  });

  appbit.onunload = () => saveSettings();
}

function tryLoadProjectById(i: number) {
  const proj = getProject(i);
  loadProject([i, proj]);
  if (project === undefined) {
    slideToProjectSelection();
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

function findElementById<TagName extends keyof ElementSearchMap>(
  elms: Array<ElementSearchMap[TagName]>,
  id: string
): ElementSearchMap[TagName] {
  for (var i = elms.length; i--; ) {
    var elm = elms[i];
    if (elm.id === id) {
      return elm;
    }
  }
  return undefined;
}

function loadDocument() {
  console.log("loading document");

  projectName = document.getElementById("project-name");

  setupClock();

  plusButton = document.getElementById("plus-button");
  subButton = document.getElementById("sub-button");

  globalCounterElm = document.getElementById("global-count");
  repeatCountElm = document.getElementById("repeat-count");

  var textElms = document.getElementsByTagName("text");
  repeatTargetElm = findElementById<"text">(textElms, "repeat-progress-target");
  repeatProgressElm = findElementById<"text">(
    textElms,
    "repeat-progress-count"
  );

  var circles = document.getElementsByTagName("circle");
  globalBubbleElm = findElementById<"circle">(circles, "global-bubble");
  repeatProgressBubbleElm = findElementById<"circle">(
    circles,
    "repeat-progress-bubble"
  );
  repeatCountBubbleElm = findElementById<"circle">(circles, "repeat-bubble");

  var arcs = document.getElementsByTagName("arc");
  // TODO don't use the 'functional' JS on a low-powered device
  repeatCountProgressArc = arcs.filter((a) => a.id === "arc-count")[0];
  repeatProgressArc = arcs.filter((a) => a.id === "arc-progress")[0];

  globalOutlineElm = document.getElementById("outline-global-bubble");
  repeatProgressOutlineElm = document.getElementById(
    "outline-repeat-progress-bubble"
  );
  repeatCountOutlineElm = document.getElementById("outline-repeat-bubble");

  applicationFillElms = document.getElementsByClassName("application-fill");

  backgroundFillElms = document.getElementsByClassName("my-background-fill");
  backgroundFillElms.push(
    ...plusButton.getElementsByClassName("background-fill")
  );

  var groups = document.getElementsByTagName("g");
  slideGroup = findElementById<"g">(groups, "slide");

  plusButton.onclick = incrementEvent(1);
  subButton.onclick = incrementEvent(-1);

  globalBubbleElm.onclick = () => selectBubble(Bubble.Global);
  repeatCountBubbleElm.onclick = () => selectBubble(Bubble.RepeatCount);
  repeatProgressBubbleElm.onclick = () => selectBubble(Bubble.RepeatProgress);

  var mouseDownX: number = undefined;
  const onmousedownEvent = (e: MouseEvent) => {
    console.log("mouse down");
    mouseDownX = e.screenX;
  };

  let slideThreshold = -device.screen.width * 0.4;
  const onmouseupEvent = (e: MouseEvent) => {
    console.log("mouse up");
    if (mouseDownX === undefined) {
      return;
    }
    let xMove = e.screenX - mouseDownX;
    mouseDownX = undefined;

    if (xMove < slideThreshold) {
      /* swipe left */
      console.log("swipe left");
      slideToProjectSelection();
      return;
    }

    slideToProject();
  };

  const onmousemoveEvent = (e: MouseEvent) => {
    if (mouseDownX === undefined) {
      return;
    }
    let xMove = e.screenX - mouseDownX;
    let d = Math.min(xMove, 0);
    setProjectSlide(d);
  };

  var elms = document.getElementsByClassName("clickable");
  for (var i = elms.length; i--; ) {
    var elm = elms[i];
    elm.onmousedown = onmousedownEvent;
  }

  var elms = document.getElementsByClassName("mouse-movable");
  for (var i = elms.length; i--; ) {
    var elm = elms[i];
    elm.onmouseup = onmouseupEvent;
    elm.onmousemove = onmousemoveEvent;
  }
}

function loadProject([id, proj]: [number, Project]) {
  console.log("loading project");
  if (proj !== undefined) {
    settings.projId = id;
    project = proj;
  } else {
    project = undefined;
  }
  redraw();
}

function slideToProject() {
  slideToOffset(lastSlidePos, 0);
}

function slideToProjectSelection() {
  console.log("sliding to project selection");
  slideToOffset(lastSlidePos, -device.screen.width);
}

function slideToOffset(current_x_offset: number, target_x_offset: number) {
  current_x_offset = current_x_offset ?? 0;
  var dist = current_x_offset - target_x_offset;
  var sign = target_x_offset - current_x_offset >= 0 ? 1 : -1;

  const start_timestamp = Date.now();
  var last_timestamp = start_timestamp;

  const partialSlideToProjectSelect = (timestamp: number) => {
    if (dist * sign >= 0) {
      return;
    }

    // make sure we travel at least 1 unit to avoid getting stuck as we exponentially approach zero
    var velocity = sign * Math.max(1, Math.abs(dist) / 100);
    var travel = velocity * (timestamp - last_timestamp);
    last_timestamp = timestamp;
    dist += travel;
    setProjectSlide(dist + target_x_offset);
    requestAnimationFrame(partialSlideToProjectSelect);
  };

  requestAnimationFrame(partialSlideToProjectSelect);
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(Math.min(n, max), min);
}

function setProjectSlide(d: number) {
  d = clamp(d, -device.screen.width, 0);
  lastSlidePos = d;
  slideGroup.groupTransform.translate.x = d;
}

interface ProjectListItem extends VirtualTileListItemInfo {
  value: string;
  index: number;
}

function redrawProjectSelectionView() {
  console.log("redrawing project selection");

  // @ts-ignore
  let projectSelectionList: VirtualTileList<ProjectListItem> =
    document.getElementById("myList");

  projectSelectionList.delegate = {
    getTileInfo: (index: number) => {
      return {
        type: "list-pool",
        value: "Item",
        index: index,
      };
    },
    configureTile: (tile, info) => {
      const index: number = info.index;
      if (info.type == "list-pool") {
        tile.getElementById("text").text = settings.projects[index]?.[1].name;

        let circle = tile.getElementsByTagName("circle")[0];
        if (circle) {
          circle.style.fill = settings.projects[index]?.[1].colour;
        }
        let touch = tile.getElementById("touch");
        touch.onclick = () => {
          loadProject(settings.projects[index]);
          slideGroup.animate("enable");
          lastSlidePos = 0;
        };
      }
    },
  };

  let help = document.getElementById("no-project-help");
  if (settings.projects.length === 0) {
    help.style.display = "inline";
    projectSelectionList.style.display = "none";
    return;
  }

  help.style.display = "none";
  projectSelectionList.style.display = "inline";

  const darkBgCol = "#000000";
  const lightBgCol = "#ffffff";

  const darkTileCol = "#222222";
  const lightTileCol = "#eeeeee";

  const secondaryDarkTileCol = "#111111";
  const secondaryLightTileCol = "#dddddd";

  const bgCol = settings.isDarkMode ? darkBgCol : lightBgCol;
  const tileCol = settings.isDarkMode ? darkTileCol : lightTileCol;
  const secondaryTileCol = settings.isDarkMode
    ? secondaryDarkTileCol
    : secondaryLightTileCol;
  const textCol = settings.isDarkMode ? lightTileCol : darkTileCol;

  var elms: Element[];

  elms = document.getElementsByClassName("my-background-fill");
  for (let i = elms.length; i--; ) {
    elms[i].style.fill = bgCol;
  }

  elms = document.getElementsByClassName("tile-fill");
  for (let i = elms.length; i--; ) {
    elms[i].style.fill = tileCol;
  }

  elms = document.getElementsByClassName("secondary-tile-fill");
  for (let i = elms.length; i--; ) {
    elms[i].style.fill = secondaryTileCol;
  }

  elms = document.getElementsByClassName("text-fill");
  for (let i = elms.length; i--; ) {
    elms[i].style.fill = textCol;
  }

  // length must be set AFTER delegate
  projectSelectionList.length = settings.projects.length;
}

function selectBubble(b: Bubble) {
  project.selectedBubble = b;
  redrawProject();

  getBubbleGroup(project.selectedBubble).animate("enable");
  vibration.start("confirmation");
}

function getBubbleGroup(b: Bubble): Element | undefined {
  var group: Element | undefined = undefined;
  if (b === Bubble.Global) {
    group = document.getElementById("global-group");
  } else if (b === Bubble.RepeatProgress) {
    group = document.getElementById("repeat-progress-group");
  } else if (b === Bubble.RepeatCount) {
    group = document.getElementById("repeat-group");
  }
  return group;
}

function alertTargetReached(group: Element) {
  const buzz = () => {
    group.animate("enable");
    vibration.start("ping");
  };
  setTimeout(buzz, 0);
  setTimeout(buzz, 500);
  setTimeout(buzz, 1000);
}

function incRepeatCount(i: number) {
  if (project.repeatLength > 0) {
    project.repeatCount = Math.max(project.repeatCount + i, 0);
    if (
      project.repeatGoal &&
      i > 0 &&
      getRepeatPos(project) === 0 &&
      getNumRepeats(project) === project.repeatGoal
    ) {
      alertTargetReached(getBubbleGroup(Bubble.RepeatCount));
    }
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
    redrawProject();
  };
}

function redraw() {
  console.log("starting redraw");
  redrawProjectSelectionView();
  redrawProject();
}

function getRepeatPos(p: Project): number {
  return p.repeatCount % p.repeatLength;
}

function getNumRepeats(p: Project): number {
  return Math.floor(p.repeatCount / p.repeatLength);
}

function redrawProject() {
  if (project === undefined) {
    console.warn("not drawing project because it is undefined");
    return;
  }

  console.log(
    `redrawing project with global count ${project.globalCount} and repeat length ${project.repeatLength}`
  );
  globalCounterElm.text = project.globalCount.toString();
  if (project.repeatLength > 0) {
    var repeatPos = getRepeatPos(project);
    var numRepeats = getNumRepeats(project);

    repeatProgressElm.text = `${repeatPos}`;
    repeatTargetElm.text = `${project.repeatLength}`;
    repeatCountElm.text = numRepeats.toString();
    repeatProgressArc.sweepAngle = (repeatPos / project.repeatLength) * 360;
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

  applicationFillElms.forEach((e) => (e.style.fill = project.colour));
  const backgroundFill = settings.isDarkMode ? "fb-black" : "fb-white";
  backgroundFillElms.forEach((e) => (e.style.fill = backgroundFill));
}

function receiveProjectOperation(op: ProjectOperation) {
  if (op && op.operation === Operation.ResetCounters) {
    var val: number = op.data;
    console.log(`resetting counters for project id ${op.projId} to ${val}`);
    var proj = getProject(op.projId);
    proj.globalCount = val;
    proj.repeatCount = val;
    redrawProject();
  } else if (op) {
    console.warn(`ignoring unknown project operation: ${op.operation}`);
  }
}

function receiveMessageItem(obj) {
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
          proj.colour = incomingProject.colour;
        } else {
          var proj = initProject(
            incomingProject.name,
            incomingProject.repeatLength,
            incomingProject.repeatGoal,
            incomingProject.colour
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
      console.log("finished receiving project settings");
      saveSettings();

      redraw();
      if (getCurProject() === undefined) {
        slideToProjectSelection();
      }
    } else if (key === "timeFormat") {
      settings.timeFormat = JSON.parse(value);
      setupClock();
    } else if (key === "isDarkMode") {
      settings.isDarkMode = JSON.parse(value);
      redraw();
    } else if (key === "projectOperation") {
      receiveProjectOperation(JSON.parse(value));
    } else {
      console.warn(`ignoring unknown settings message with key ${key}`);
    }
  } else {
    console.warn(`Unknown message received: ${JSON.stringify(obj)}`);
  }
}

function receiveMessage(evt: messaging.MessageEvent) {
  if (evt && evt.data) {
    receiveMessageItem(evt.data);
  }
}

init();
