export interface SettingMessage {
    key: string;
    value: any;
}

export function isSettingsMessage(o: any): boolean {
    return "key" in o && "value" in o
}

export enum Operation {
    Reset, Delete, Create
}

export interface ProjectOperation {
    project: string | null;
    operation: Operation
}

export function isProjectOperation(o: any): boolean {
    return "project" in o && "operation" in o
}