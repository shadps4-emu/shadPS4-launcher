import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { exists } from "@tauri-apps/plugin-fs";
import { platform } from "@tauri-apps/plugin-os";
import { format } from "date-fns";
import { useAtomValue, useSetAtom, useStore } from "jotai";
import { CheckIcon, CircleSlashIcon, PlusIcon } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { installNewVersion } from "@/handlers/version-manager";
import {
    GamepadNavField,
    type NavButton,
} from "@/lib/context/gamepad-nav-field";
import { stringifyError } from "@/lib/utils/error";
import type { Callback } from "@/lib/utils/types";
import { atomEmuInstallsPath } from "@/store/paths";
import {
    atomAvailableVersions,
    atomInstalledVersions,
    atomModalVersionManagerIsOpen,
    type EmulatorVersion,
    type RemoteEmulatorVersion,
} from "@/store/version-manager";
import {
    Tabs,
    TabsContent,
    TabsContents,
    TabsList,
    TabsTrigger,
} from "../animate-ui/radix/tabs";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "../ui/drawer";
import { Input } from "../ui/input";
import { Navigable } from "../ui/navigable";

enum TabName {
    installed = "installed",
    available = "available",
    advanced = "advanced",
}

function VersionTableRow({
    source,
    date,
    version,
    release,
    prePelease: preRelease,
    children,
}: {
    source?: string;
    date: string | null;
    version?: string;
    release?: string;
    prePelease?: boolean;
    children?: ReactNode;
}) {
    return (
        <TableRow>
            <TableCell>
                {preRelease === true ? (
                    <Badge variant="destructive">Pre-release</Badge>
                ) : (
                    release || "Unknown"
                )}
            </TableCell>
            <TableCell>{version || "Unknown"}</TableCell>
            <TableCell>{source || "Unknown"}</TableCell>
            <TableCell>{date || "Unknown"}</TableCell>
            {children}
        </TableRow>
    );
}

function DownloadButton({
    version: v,
    onClick,
}: {
    version: RemoteEmulatorVersion;
    onClick: () => void;
}) {
    const installedVersions = useAtomValue(atomInstalledVersions);

    const alreadyInstalled = installedVersions.some(
        (e) => e.repo === v.repo && e.version === v.version,
    );

    if (alreadyInstalled) {
        return (
            <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                    <Navigable>
                        <Button
                            className="cursor-default hover:bg-inherit"
                            size="icon"
                            variant="ghost"
                        >
                            {" "}
                            <CheckIcon />
                        </Button>
                    </Navigable>
                </TooltipTrigger>
                <TooltipContent>
                    <span>Already Installed</span>
                </TooltipContent>
            </Tooltip>
        );
    }

    if (v.notSupported) {
        <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
                <Button disabled size="icon" variant="outline">
                    <CircleSlashIcon />
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <span>Not Supported In Your Platform</span>
            </TooltipContent>
        </Tooltip>;
    }

    return (
        <Navigable>
            <Button onClick={onClick} size="icon" variant="outline">
                <PlusIcon />
            </Button>
        </Navigable>
    );
}

function TabAvailableVersion() {
    const { data, isLoading, error } = useAtomValue(atomAvailableVersions);
    const rootInstallPath = useAtomValue(atomEmuInstallsPath);
    const store = useStore();

    const install = (v: RemoteEmulatorVersion) => {
        if (rootInstallPath) {
            void installNewVersion(v, rootInstallPath);
        }
        store.set(atomModalVersionManagerIsOpen, false);
    };

    if (isLoading) {
        return <Spinner />;
    }

    if (error) {
        return <span className="text-red-500">{error.message}</span>;
    }

    return (
        <Table className="gap-4">
            <TableHeader>
                <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Release</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data?.map((v) => (
                    <VersionTableRow
                        date={format(v.date, "PP")}
                        key={JSON.stringify(v)}
                        prePelease={v.prerelease}
                        release={v.name}
                        source={v.repo}
                        version={v.version}
                    >
                        <TableCell>
                            <DownloadButton
                                onClick={() => install(v)}
                                version={v}
                            />
                        </TableCell>
                    </VersionTableRow>
                ))}
            </TableBody>
        </Table>
    );
}

function TabListInstalled() {
    const installedVersions = useAtomValue(atomInstalledVersions);

    return (
        <div className="flex">
            <Table className="gap-4">
                <TableHeader>
                    <TableRow>
                        <TableHead>Release</TableHead>
                        <TableHead>Version</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Date</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {installedVersions.length === 0 ? (
                        <TableRow>
                            <TableCell className="text-center" colSpan={4}>
                                No version installed
                            </TableCell>
                        </TableRow>
                    ) : (
                        installedVersions.map((v) => (
                            <VersionTableRow
                                date={v.date ? format(v.date, "PP") : null}
                                key={JSON.stringify(v)}
                                prePelease={v.prerelease}
                                release={v.name}
                                source={v.repo}
                                version={v.version}
                            />
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

function AddCustom({ reset }: { reset: Callback }) {
    const setInstalledVersions = useSetAtom(atomInstalledVersions);

    const [binaryPath, setBinaryPath] = useState("");
    const [name, setName] = useState("");
    const [errMsg, setErrMsg] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            if (!binaryPath) {
                setErrMsg("Missing binary");
                return;
            }
            if (!(await exists(binaryPath))) {
                setErrMsg("Binary file not exists");
                return;
            }
            if (!name) {
                setErrMsg("Fill the name");
                return;
            }
            setErrMsg(null);
        })().catch((e) => {
            console.error(e);
            setErrMsg(stringifyError(e));
        });
    }, [binaryPath, name]);

    const selectBinary = () => {
        const p = platform();
        const extensions: string[] = [];
        if (p === "windows") {
            extensions.push("exe");
        } else if (p === "linux") {
            extensions.push("AppImage");
        }
        openDialog({
            title: "ShadPS4 emulator binary",
            filters:
                extensions.length > 0
                    ? [
                          {
                              name: "ShadPS4 binary",
                              extensions,
                          },
                      ]
                    : [],
        }).then((e) => e && setBinaryPath(e));
    };

    const save = () => {
        if (errMsg) {
            return;
        }
        const data: EmulatorVersion = {
            path: binaryPath,
            name,
            repo: "Local",
            date: new Date().getTime(),
        };
        setInstalledVersions((prev) => [...prev, data]);
        reset();
    };

    return (
        <div className="grid grid-cols-[1fr_auto] justify-stretch gap-y-4 rounded-lg p-4 ring-1 ring-accent">
            <p className="col-span-2 font-semibold text-lg">
                Add Custom Emulator
            </p>
            <Input
                className="rounded-r-none"
                onChange={(e) => setBinaryPath(e.target.value.trim())}
                placeholder="Binary path"
                type="text"
                value={binaryPath}
            />
            <Button
                className="rounded-l-none"
                onClick={selectBinary}
                variant="secondary"
            >
                Select
            </Button>
            <Input
                className="max-w-48"
                onChange={(e) => setName(e.target.value.trim())}
                placeholder="Name"
                type="text"
                value={name}
            />
            <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                    <Button disabled={errMsg !== null} onClick={save}>
                        Add
                    </Button>
                </TooltipTrigger>
                <TooltipContent asChild>
                    <span className="text-red-700">{errMsg}</span>
                </TooltipContent>
            </Tooltip>
        </div>
    );
}

function TabAdvanced({ reset }: { reset: Callback }) {
    return (
        <div className="flex flex-col p-2">
            <AddCustom reset={reset} />
        </div>
    );
}

function VersionManagerDialog() {
    const setIsOpen = useSetAtom(atomModalVersionManagerIsOpen);
    const [tab, setName] = useState(TabName.installed);

    const reset = () => {
        setName(TabName.installed);
    };

    const onButtonPress = (btn: NavButton) => {
        if (btn === "back") {
            setIsOpen(false);
            return;
        }
    };

    return (
        <Drawer direction="right" dismissible onOpenChange={setIsOpen} open>
            <GamepadNavField
                debugName="version-manager"
                onButtonPress={onButtonPress}
            >
                <DrawerContent
                    aria-describedby={undefined}
                    className="min-w-[525px] p-4"
                >
                    <DrawerHeader>
                        <DrawerTitle>Version Manager</DrawerTitle>
                    </DrawerHeader>
                    <Tabs
                        className="min-h-0"
                        onValueChange={(e) => setName(e as TabName)}
                        value={tab}
                    >
                        <TabsList className="w-full">
                            <TabsTrigger value={TabName.installed}>
                                Installed
                            </TabsTrigger>
                            <TabsTrigger value={TabName.available}>
                                Download New
                            </TabsTrigger>
                            <TabsTrigger value={TabName.advanced}>
                                Advanced
                            </TabsTrigger>
                        </TabsList>
                        <ScrollArea>
                            <div className="min-h-0">
                                <TabsContents>
                                    <TabsContent value={TabName.installed}>
                                        <TabListInstalled />
                                    </TabsContent>
                                    <TabsContent value={TabName.available}>
                                        <TabAvailableVersion />
                                    </TabsContent>
                                    <TabsContent value={TabName.advanced}>
                                        <TabAdvanced reset={reset} />
                                    </TabsContent>
                                </TabsContents>
                            </div>
                        </ScrollArea>
                    </Tabs>
                </DrawerContent>
            </GamepadNavField>
        </Drawer>
    );
}

export function VersionManagerModal() {
    const isOpen = useAtomValue(atomModalVersionManagerIsOpen);

    if (!isOpen) {
        return <></>;
    }

    return <VersionManagerDialog />;
}
