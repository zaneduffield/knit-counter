export interface ProjectConfig {
  id: number;
  name: string;
  repeatLength: number;
}

export enum SettingsPage {
  Main,
  Add,
  Edit,
  Delete,
  Reorder,
}

export interface SettingsState {
  currentPage: SettingsPage;

  mainPageState?: MainPageState;
  addPageState?: AddPageState;
  editPageState?: EditPageState;
  deletePageState?: DeletePageState;
  reorderPageState?: ReorderPageState;
}

export class SettingsPageState {}

export class MainPageState extends SettingsPageState {}

export class AddPageState extends SettingsPageState {
  projId: number;
  newProjectConfig: ProjectConfig;
}

export class EditPageState extends SettingsPageState {
  projId: number;
  newProjectConfig: ProjectConfig;
}

export class DeletePageState extends SettingsPageState {
  projId: number;
  needsConfirmation: boolean;
}

export class ReorderPageState extends SettingsPageState {
  // TODO
}

export function encodeInstance(s: any): string {
  return JSON.stringify(s);
}

export function decodeInstance<T>(o: any, c: new () => T): T {
  const object = new c();
  Object.entries(o).map(([key, value]) => (object[key] = value));
  return object;
}

export function encodeSettingsState(s: SettingsState): string {
  return encodeInstance(s);
}

export function decodeSettingsState(s: string): SettingsState {
  const state: SettingsState = JSON.parse(s);
  state.mainPageState = decodeInstance(state.mainPageState, MainPageState);
  state.addPageState = decodeInstance(state.addPageState, AddPageState);
  state.pageState = decodeInstance(state.pageState, EditPageState);
  state.pageState = decodeInstance(state.pageState, DeletePageState);
  state.pageState = decodeInstance(state.pageState, ReorderPageState);
  return state;
}

export interface ProjectSettings {
  settingsState: SettingsState;
  nextId: number;
  projects: ProjectConfig[];
}

export function isProjectSettings(o: any): boolean {
  return "nextId" in o && "projects" in o;
}

export function defaultProject(id: number): ProjectConfig {
  return { id: id, name: `Project ${id}`, repeatLength: 10 };
}
