import { ProjectOperation } from "./messages";

export const INIT_PROJ_ID = 0;
export const INIT_PROJ_NAME = "My Project";
export const INIT_REPEAT_LEN = 10;
export const DEFAULT_TIME_FORMAT: TimeFormat = {
  showTime: true,
  showSeconds: false,
  is24hourTime: false,
};

export interface ProjectConfig {
  id: number;
  name: string;
  repeatLength: number;
  repeatGoal?: number;
}

export interface TimeFormat {
  showTime: boolean;
  showSeconds: boolean;
  is24hourTime: boolean;
}

export enum SettingsPage {
  Main,
  Add,
  Edit,
  Reset,
  Delete,
}

export interface SettingsState {
  currentPage: SettingsPage;

  mainPageState?: MainPageState;
  projectDetailsState?: ProjectDetailsPageState;
  deletePageState?: DeletePageState;
  resetPageState?: ResetPageState;
  reorderPageState?: ReorderPageState;
}

export class SettingsPageState {}

export class MainPageState extends SettingsPageState {}

export class ProjectDetailsPageState extends SettingsPageState {
  projId: number;
  newProjectConfig: ProjectConfig;
}

export class DeletePageState extends SettingsPageState {
  projId: number;
}

export class ResetPageState extends SettingsPageState {
  projId: number;
}

export class ReorderPageState extends SettingsPageState {
  // TODO
}

export function encodeInstance(s: any): string {
  return JSON.stringify(s);
}

export function decodeInstance<T>(o: any, c: new () => T): T {
  if (o === undefined) {
    return undefined;
  }
  const object = new c();
  Object.entries(o).map(([key, value]) => (object[key] = value));
  return object;
}

export function defaultSettingsState(): SettingsState {
  return {
    currentPage: SettingsPage.Main,
    mainPageState: new MainPageState(),
  };
}

export function encodeSettingsState(s: SettingsState | unknown): string {
  if (s === undefined) {
    s = defaultSettingsState();
  }
  return encodeInstance(s);
}

export function decodeSettingsState(s: string | undefined): SettingsState {
  if (s === undefined) {
    return defaultSettingsState();
  }

  console.log("decoding settings state");
  const state: SettingsState = JSON.parse(s);
  state.mainPageState = decodeInstance(state.mainPageState, MainPageState);
  state.resetPageState = decodeInstance(state.resetPageState, ResetPageState);
  state.projectDetailsState = decodeInstance(
    state.projectDetailsState,
    ProjectDetailsPageState
  );
  state.deletePageState = decodeInstance(
    state.deletePageState,
    DeletePageState
  );
  state.reorderPageState = decodeInstance(
    state.reorderPageState,
    ReorderPageState
  );
  console.log("finished decoding settings state");
  return state;
}

type Projects = Map<number, ProjectConfig>;

export function encodeProjectSettings(projects: Projects): string {
  return JSON.stringify(Array(...projects.entries()));
}

export function decodeProjectSettings(s: string | undefined): Projects {
  return new Map(
    s === undefined
      ? [[INIT_PROJ_ID, defaultProject(INIT_PROJ_ID, INIT_PROJ_NAME)]]
      : JSON.parse(s)
  );
}

export interface Settings {
  settingsState: SettingsState;
  timeFormat: TimeFormat;
  nextId: number;
  projects: Map<number, ProjectConfig>;
  projectOperation?: ProjectOperation;
}

export function isProjectSettings(o: any): boolean {
  return "nextId" in o && "projects" in o;
}

export function defaultProject(id: number, name: string): ProjectConfig {
  return { id: id, name: name, repeatLength: 10 };
}
