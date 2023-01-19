export const HARD_RESYNC_SETTINGS_MESSAGE = "hard_resync";
export const SOFT_RESYNC_SETTINGS_MESSAGE = "soft_resync";

export interface SettingMessage {
  key: string;
  value: string;
}

export function isSettingsMessage(o: any): boolean {
  return "key" in o && "value" in o;
}

export enum Operation {
  ResetCounters,
}

export interface ProjectOperation {
  projId: number;
  operation: Operation;
}

export function isProjectOperation(o: any): boolean {
  return "projId" in o && "operation" in o;
}
