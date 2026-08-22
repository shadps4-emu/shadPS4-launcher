import type { ResolvedEmulatorConfig } from "@/lib/emulator-config";

export type ConfigUpdater = <S extends keyof ResolvedEmulatorConfig>(
    section: S,
    key: keyof ResolvedEmulatorConfig[S],
    value: ResolvedEmulatorConfig[S][keyof ResolvedEmulatorConfig[S]],
) => void;

export type CategoryId =
    | "general"
    | "paths"
    | "graphics"
    | "vulkan"
    | "audio"
    | "input"
    | "network"
    | "logging"
    | "debug"
    | "advanced";
