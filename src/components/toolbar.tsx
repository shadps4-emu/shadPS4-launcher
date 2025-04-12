import { TooltipTrigger } from "@radix-ui/react-tooltip";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { FolderCog, Gamepad2, Search, Settings } from "lucide-react";
import { type ComponentProps, useState } from "react";
import { openEmuConfigWindow } from "@/handlers/window";
import { atomFolderConfigModalIsOpen, oficialRepo } from "@/store/common";
import {
    atomInstalledVersions,
    atomModalVersionManagerIsOpen,
    atomSelectedVersion,
} from "@/store/version-manager";
import { cn } from "@/utils/ui";
import { RunningGameIcon } from "./running-game-icon";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import { Tooltip, TooltipContent } from "./ui/tooltip";

function VersionSelector() {
    const [isOpen, setIsOpen] = useState(false);
    const setVersionManagerModalOpen = useSetAtom(
        atomModalVersionManagerIsOpen,
    );
    const installedVersions = useAtomValue(atomInstalledVersions);
    const [selectVersion, setSelectedVersion] = useAtom(atomSelectedVersion);

    return (
        <Select
            onOpenChange={(e) => setIsOpen(e)}
            onValueChange={setSelectedVersion}
            open={isOpen}
            value={selectVersion?.path}
        >
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="No version selected">
                    {selectVersion &&
                        `${selectVersion.version} ${selectVersion.name} ${selectVersion.repo !== oficialRepo ? selectVersion.repo : ""}`}
                </SelectValue>
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>Emulator Version</SelectLabel>
                    {installedVersions.map((v) => (
                        <SelectItem key={v.path} value={v.path}>
                            {v.version} {v.name}{" "}
                            {v.repo !== oficialRepo && `(${v.repo})`}
                        </SelectItem>
                    ))}
                </SelectGroup>
                <SelectSeparator />
                <Button
                    onClick={() => {
                        setIsOpen(false);
                        setVersionManagerModalOpen(true);
                    }}
                    variant="ghost"
                >
                    Open Version Manager
                </Button>
            </SelectContent>
        </Select>
    );
}

function ToolbarButton({
    className,
    tooltip,
    ...props
}: ComponentProps<typeof Button> & { tooltip?: string }) {
    const content = (
        <button
            className={cn(
                "rounded-md p-2 *:size-6 focus-within:bg-muted hover:bg-muted",
                className,
            )}
            data-gamepad-selectable
            {...props}
        />
    );
    if (!tooltip) {
        return content;
    }
    return (
        <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>{content}</TooltipTrigger>
            <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
    );
}

export function Toolbar() {
    const setFolderConfigModalOpen = useSetAtom(atomFolderConfigModalIsOpen);

    return (
        <div className="sticky top-0 z-30 flex justify-between bg-secondary p-3">
            <div className="flex items-center gap-4">
                <div className="relative">
                    <Search className="absolute top-2.5 left-2 size-4 text-muted-foreground" />
                    <Input
                        className="w-full pl-8"
                        data-gamepad-selectable="CENTER_LEFT"
                        placeholder="Search..."
                        type="search"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <ToolbarButton
                        onClick={() => openEmuConfigWindow()}
                        tooltip="Emulator Settings"
                    >
                        <Settings />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => setFolderConfigModalOpen(true)}
                        tooltip="Folder Settings"
                    >
                        <FolderCog className="h-6 w-6" />
                    </ToolbarButton>
                    <ToolbarButton>
                        <Gamepad2 className="h-6 w-6" />
                    </ToolbarButton>
                </div>
            </div>
            <div className="flex-1" />
            <RunningGameIcon />
            <VersionSelector />
        </div>
    );
}
