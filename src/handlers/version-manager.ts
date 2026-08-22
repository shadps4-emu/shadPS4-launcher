import { installVersion } from "@/lib/version-catalog";
import { defaultStore } from "@/store";
import type { RemoteEmulatorVersion } from "@/store/version-manager";

export function installNewVersion(
    version: RemoteEmulatorVersion,
    rootInstallPath: string,
) {
    return installVersion(version, rootInstallPath, defaultStore);
}
