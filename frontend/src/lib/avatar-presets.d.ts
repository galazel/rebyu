export type AvatarPreset = { id: string; src: string }
export const AVATAR_PRESETS: AvatarPreset[]
export function defaultAvatarFor(seed: unknown): string
export function presetToPngFile(preset: AvatarPreset, size?: number): Promise<File>
export function presetBackground(index: number): string
