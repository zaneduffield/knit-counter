export interface ProjectConfig {
    needsReset: boolean,
    repeatLength: number,
}

export interface ProjectSettings {
  numProjects: number;
  projects: ProjectConfig[];
}

export function defaultProject(): ProjectConfig {
  return { needsReset: false, repeatLength: 10}
}