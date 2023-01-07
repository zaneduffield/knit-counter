import document from "document";
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

function init() {
    console.log("in init")

    // TODO save settings on display sleep and remove the unlink on startup
    unlinkSync(SETTINGS_FNAME)

    if (existsSync(SETTINGS_FNAME)) {
        console.log("reading settings file")
        settings = readFileSync(SETTINGS_FNAME, "json")
    } else {
        console.log("writing settings file")
        writeFileSync(SETTINGS_FNAME, JSON.stringify(settings), "json");
    }

    project = settings.projects.filter(p => p.name == settings.selectedProjName)[0]

    plusButton.onclick = (e) => {
        project.globalCount += 1
        display()
    }

    subButton.onclick = (e) => {
        project.globalCount -= 1
        display()
    }

    display()
}

var globalCounterElm = document.getElementById("global-count")
var repeatProgressElm = document.getElementById("repeat-progress-count")
var repeatCountElm = document.getElementById("repeat-count")

function display() {
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

messaging.peerSocket.addEventListener("message", (evt) => {
    if (evt && evt.data && evt.data.key === "...") {
        // background.style.fill = evt.data.value;
    }
});
