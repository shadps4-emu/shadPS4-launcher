import { TooltipTrigger } from "@radix-ui/react-tooltip";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
    FolderCogIcon,
    Gamepad2Icon,
    SearchIcon,
    SettingsIcon,
} from "lucide-react";
import { type ComponentProps, useState } from "react";
import { openEmuConfigWindow } from "@/handlers/window";
import { GamepadNavField } from "@/lib/context/gamepad-nav-field";
import { cn } from "@/lib/utils/ui";
import { atomFolderConfigModalIsOpen, oficialRepo } from "@/store/common";
import {
    atomInstalledVersions,
    atomModalVersionManagerIsOpen,
    atomSelectedVersion,
} from "@/store/version-manager";
import { RunningGameIcons } from "./running-game-icons";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Navigable } from "./ui/navigable";
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
                <Navigable defaultMouse>
                    <SelectValue placeholder="No version selected">
                        {selectVersion &&
                            `${selectVersion.version} ${selectVersion.name} ${selectVersion.repo !== oficialRepo ? selectVersion.repo : ""}`}
                    </SelectValue>
                </Navigable>
            </SelectTrigger>
            <SelectContent>
                {isOpen && (
                    <GamepadNavField debugName="version-selector">
                        <SelectGroup>
                            <SelectLabel>Emulator Version</SelectLabel>
                            {installedVersions.map((v) => (
                                <Navigable defaultMouse key={v.path}>
                                    <SelectItem value={v.path}>
                                        {v.version} {v.name}{" "}
                                        {v.repo !== oficialRepo &&
                                            `(${v.repo})`}
                                    </SelectItem>
                                </Navigable>
                            ))}
                        </SelectGroup>
                        <SelectSeparator />
                        <Navigable defaultMouse>
                            <Button
                                onClick={() => {
                                    setIsOpen(false);
                                    setVersionManagerModalOpen(true);
                                }}
                                variant="ghost"
                            >
                                Open Version Manager
                            </Button>
                        </Navigable>
                    </GamepadNavField>
                )}
            </SelectContent>
        </Select>
    );
}

function ToolbarButton({
    tooltip,
    className,
    ...props
}: ComponentProps<typeof Button> & { tooltip?: string }) {
    const content = (
        <Navigable defaultMouse>
            <Button
                className={cn("[&_svg]:size-6", className)}
                size="icon"
                variant="ghost"
                {...props}
            />
        </Navigable>
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
        <div className="sticky top-0 z-30 flex justify-between border-b-2 p-3 px-10">
            <div className="flex items-center gap-4">
                <div className="relative">
                    <SearchIcon className="absolute top-2.5 left-2 size-4 text-muted-foreground" />
                    <Navigable anchor="CENTER_LEFT">
                        <Input
                            className="w-full pl-8"
                            placeholder="Search..."
                            type="search"
                        />
                    </Navigable>
                </div>
                <div className="flex items-center gap-2">
                    <ToolbarButton
                        onClick={() => openEmuConfigWindow()}
                        tooltip="Emulator Settings"
                    >
                        <SettingsIcon />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => setFolderConfigModalOpen(true)}
                        tooltip="Folder Settings"
                    >
                        <FolderCogIcon />
                    </ToolbarButton>
                    <ToolbarButton>
                        <Gamepad2Icon />
                    </ToolbarButton>
                </div>
            </div>
            <div className="flex-1" />
            <RunningGameIcons />
            <VersionSelector />
        </div>
    );
}
