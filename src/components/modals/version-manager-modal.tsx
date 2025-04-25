import { format } from "date-fns";
import { useAtom, useAtomValue, useStore } from "jotai";
import { Check, CircleSlash, Plus } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import { atomEmuInstallsPath } from "@/store/paths";
import {
    atomAvailableVersions,
    atomInstalledVersions,
    atomModalVersionManagerIsOpen,
    type RemoteEmulatorVersion,
} from "@/store/version-manager";

function VersionTableRow({
    source,
    date,
    version,
    release,
    prePelease: preRelease,
    children,
}: {
    source: string;
    date: string;
    version: string;
    release?: string;
    prePelease?: boolean;
    children?: ReactNode;
}) {
    return (
        <TableRow>
            <TableCell>{source}</TableCell>
            <TableCell>{date}</TableCell>
            <TableCell>{version}</TableCell>
            <TableCell>
                {preRelease === true ? (
                    <Badge variant="destructive">Pre-release</Badge>
                ) : (
                    release
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
                    <Button
                        className="cursor-default hover:bg-inherit"
                        size="icon"
                        variant="ghost"
                    >
                        {" "}
                        <Check />
                    </Button>
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
                    <CircleSlash />
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <span>Not Supported In Your Platform</span>
            </TooltipContent>
        </Tooltip>;
    }

    return (
        <Button onClick={onClick} size="icon" variant="outline">
            <Plus />
        </Button>
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
        <DialogContent aria-describedby={undefined} className="min-w-[525px]">
            <DialogHeader>
                <DialogTitle>Add New Version</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">{content}</ScrollArea>
        </DialogContent>
    );
}

export function VersionManagerModal() {
    const [isOpen, setIsOpen] = useAtom(atomModalVersionManagerIsOpen);
    const [isNew, setIsNew] = useState(false);

    const installedVersions = useAtomValue(atomInstalledVersions);

    useEffect(() => {
        if (!isOpen) {
            setIsNew(false);
        }
    }, [isOpen]);

    return (
        <>
            <Dialog onOpenChange={setIsOpen} open={isOpen}>
                {isNew ? (
                    <AddNewVersion />
                ) : (
                    <DialogContent
                        aria-describedby={undefined}
                        className="min-w-[525px]"
                    >
                        <DialogHeader>
                            <DialogTitle>
                                <div className="flex items-center gap-4">
                                    <span>Version Manager</span>
                                    <Button
                                        onClick={() => setIsNew(true)}
                                        size="sm"
                                    >
                                        Add
                                    </Button>
                                </div>
                            </DialogTitle>
                        </DialogHeader>
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
                                                date={format(v.date, "PP")}
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
                    </DialogContent>
                )}
            </Dialog>
        </>
    );
}
