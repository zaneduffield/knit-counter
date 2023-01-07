export interface ProjectConfig {
    needsReset: boolean,
    repeatLength: number,
}

export interface ProjectSettings {
  projectsByName: Map<String, ProjectConfig>;
}