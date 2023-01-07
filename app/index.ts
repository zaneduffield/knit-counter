import document from "document";
import { display } from "display";
import * as messaging from "messaging";
import { readFileSync, writeFileSync, existsSync, unlinkSync } from "fs";

interface Project {
    name: string;
    globalCount: number;
    repeatLength: number | null;
}

interface Settings {
    selectedProjName: string;
    projects: Project[];
}

var settings: Settings = {
    selectedProjName: "my project",
    projects: [{ name: "my project", globalCount: 0, repeatLength: 5 }],
}

var project: Project;

const SETTINGS_FNAME = "settings.json"

var plusButton = document.getElementById("plus-button")
var subButton = document.getElementById("sub-button")

function saveSettings() {
    console.log("writing settings file")
    writeFileSync(SETTINGS_FNAME, settings, "json");
}

function loadSettings() {
    console.log("reading settings file")
    settings = readFileSync(SETTINGS_FNAME, "json")
    project = settings.projects.filter(p => p.name == settings.selectedProjName)[0]
}

function refresh() {
    loadSettings()
    updateDisplay()
}

function init() {
    console.log("initialising")

    if (existsSync(SETTINGS_FNAME)) {
        loadSettings()
    }
    updateDisplay()

    plusButton.onclick = (e) => {
        project.globalCount += 1
        updateDisplay()
    }

    subButton.onclick = (e) => {
        project.globalCount -= 1
        updateDisplay()
    }
}

var globalCounterElm = document.getElementById("global-count")
var repeatProgressElm = document.getElementById("repeat-progress-count")
var repeatCountElm = document.getElementById("repeat-count")

function updateDisplay() {
    console.log("updating display")
    globalCounterElm.text = project.globalCount.toString()
    if (project.repeatLength > 0) {
        repeatProgressElm.text = `${1 + (project.globalCount % project.repeatLength)}/${project.repeatLength}`
        repeatCountElm.text = Math.floor(project.globalCount / project.repeatLength).toString()
    } else {
        repeatProgressElm.text = "0"
        repeatCountElm.text = "0"
    }
}

init()

display.addEventListener("change", () => {
    if (display.on) {
        refresh()
    } else {
        saveSettings()
    }
});

messaging.peerSocket.addEventListener("message", (evt) => {
    if (evt && evt.data && evt.data.key === "...") {
        // background.style.fill = evt.data.value;
    }
});
