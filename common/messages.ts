export interface SettingMessage {
    key: string;
    value: any;
}

export function isSettingsMessage(o: any): boolean {
    return "key" in o && "value" in o
}