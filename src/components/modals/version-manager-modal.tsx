import { format } from "date-fns";
import { useAtomValue, useSetAtom, useStore } from "jotai";
import { CheckIcon, CircleSlashIcon, PlusIcon } from "lucide-react";
import { type ReactNode, useState } from "react";
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

function AddNewVersion() {
    const { data, isLoading, error } = useAtomValue(atomAvailableVersions);
    const rootInstallPath = useAtomValue(atomEmuInstallsPath);
    const store = useStore();

    const install = (v: RemoteEmulatorVersion) => {
        if (rootInstallPath) {
            void installNewVersion(v, rootInstallPath);
        }
        store.set(atomModalVersionManagerIsOpen, false);
    };

    let content = null;
    if (isLoading) {
        content = <Spinner />;
    } else if (error) {
        content = <span className="text-red-500">{error.message}</span>;
    } else {
        content = (
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

    return (
        <DrawerContent aria-describedby={undefined} className="min-w-[525px]">
            <DrawerHeader>
                <DrawerTitle>Add New Version</DrawerTitle>
            </DrawerHeader>
            <ScrollArea className="max-h-[60vh]">{content}</ScrollArea>
        </DrawerContent>
    );
}

function VersionManagerDialog() {
    const setIsOpen = useSetAtom(atomModalVersionManagerIsOpen);
    const [isNew, setIsNew] = useState(false);
    const installedVersions = useAtomValue(atomInstalledVersions);

    const onButtonPress = (btn: NavButton) => {
        if (btn === "back") {
            setIsOpen(false);
            return;
        }
    };

    return (
        <>
            <Drawer direction="right" onOpenChange={setIsOpen} open>
                <GamepadNavField
                    debugName="version-manager"
                    onButtonPress={onButtonPress}
                >
                    {isNew ? (
                        <AddNewVersion />
                    ) : (
                        <DrawerContent
                            aria-describedby={undefined}
                            className="min-w-[525px] p-4"
                        >
                            <DrawerHeader>
                                <DrawerTitle>
                                    <div className="flex items-center gap-4">
                                        Version Manager
                                    </div>
                                    <Navigable>
                                        <Button
                                            onClick={() => setIsNew(true)}
                                            size="sm"
                                        >
                                            Add
                                        </Button>
                                    </Navigable>
                                </DrawerTitle>
                            </DrawerHeader>
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
                                                <TableCell
                                                    className="text-center"
                                                    colSpan={4}
                                                >
                                                    No version installed
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            installedVersions.map((v) => (
                                                <VersionTableRow
                                                    date={
                                                        v.date
                                                            ? format(
                                                                  v.date,
                                                                  "PP",
                                                              )
                                                            : null
                                                    }
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
                        </DrawerContent>
                    )}
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
