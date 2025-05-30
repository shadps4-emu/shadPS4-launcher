import { format } from "date-fns";
import { useAtomValue, useSetAtom, useStore } from "jotai";
import { CheckIcon, CircleSlashIcon, PlusIcon } from "lucide-react";
import type { ReactNode } from "react";
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
import { atomEmuInstallsPath } from "@/store/paths";
import {
    atomAvailableVersions,
    atomInstalledVersions,
    atomModalVersionManagerIsOpen,
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
import { Navigable } from "../ui/navigable";

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
            <TableCell>{source || "Unknown"}</TableCell>
            <TableCell>{date || "Unknown"}</TableCell>
            <TableCell>{version || "Unknown"}</TableCell>
            <TableCell>
                {preRelease === true ? (
                    <Badge variant="destructive">Pre-release</Badge>
                ) : (
                    release || "Unknown"
                )}
            </TableCell>
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
                        <TableHead>Source</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Version</TableHead>
                        <TableHead>Release</TableHead>
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

function VersionManagerDialog() {
    const setIsOpen = useSetAtom(atomModalVersionManagerIsOpen);

    const onButtonPress = (btn: NavButton) => {
        if (btn === "back") {
            setIsOpen(false);
            return;
        }
    };

    return (
        <>
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
                        <Tabs className="min-h-0" defaultValue="installed">
                            <TabsList className="w-full">
                                <TabsTrigger value="installed">
                                    Installed
                                </TabsTrigger>
                                <TabsTrigger value="available">
                                    Download New
                                </TabsTrigger>
                            </TabsList>
                            <ScrollArea>
                                <div className="min-h-0">
                                    <TabsContents>
                                        <TabsContent value="installed">
                                            <TabListInstalled />
                                        </TabsContent>
                                        <TabsContent value="available">
                                            <TabAvailableVersion />
                                        </TabsContent>
                                    </TabsContents>
                                </div>
                            </ScrollArea>
                        </Tabs>
                    </DrawerContent>
                </GamepadNavField>
            </Drawer>
        </>
    );
}

export function VersionManagerModal() {
    const isOpen = useAtomValue(atomModalVersionManagerIsOpen);

    if (!isOpen) {
        return <></>;
    }

    return <VersionManagerDialog />;
}
