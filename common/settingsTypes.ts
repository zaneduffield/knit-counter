export interface ProjectConfig {
  id: number;
  name: string;
  repeatLength: number;
}

// export enum SettingsPage {
//   Main,
//   Add,
//   Edit,
//   Delete,
//   Reorder,
// }

export class PageState {}

export class MainPageState extends PageState {}

export class AddPageState extends PageState {
  projId: number;
  newProjectConfig: ProjectConfig;
}

export class EditPageState extends PageState {
  projId: number;
  newProjectConfig: ProjectConfig;
}

export class DeletePageState extends PageState {
  projId: number;
  needsConfirmation: boolean;
}

export class ReorderPageState extends PageState {
  // TODO
}

export interface SettingsState {
  pageState: PageState;
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
