import * as SelectPrimitive from "@radix-ui/react-select";
import { TooltipTrigger } from "@radix-ui/react-tooltip";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
    FolderCogIcon,
    Gamepad2Icon,
    SearchIcon,
    SettingsIcon,
    SortDescIcon,
} from "lucide-react";
import { type ComponentProps, useState } from "react";
import { openEmuConfigWindow } from "@/handlers/window";
import { GamepadNavField } from "@/lib/context/gamepad-nav-field";
import { cn } from "@/lib/utils/ui";
import { atomFolderConfigModalIsOpen, oficialRepo } from "@/store/common";
import {
    atomGameLibrary,
    atomGameLibrarySorting,
    SortType,
} from "@/store/game-library";
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
import { Spinner } from "./ui/spinner";
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
                <Navigable>
                    <SelectValue placeholder="No version selected">
                        {selectVersion &&
                            `${selectVersion.version} ${selectVersion.name} ${selectVersion.repo !== oficialRepo ? selectVersion.repo : ""}`}
                    </SelectValue>
                </Navigable>
            </SelectTrigger>
            <SelectContent>
                <GamepadNavField debugName="version-selector" enabled={isOpen}>
                    <SelectGroup>
                        <SelectLabel>Emulator Version</SelectLabel>
                        {installedVersions.map((v) => (
                            <Navigable key={v.path}>
                                <SelectItem value={v.path}>
                                    {v.version} {v.name}{" "}
                                    {v.repo !== oficialRepo && `(${v.repo})`}
                                </SelectItem>
                            </Navigable>
                        ))}
                    </SelectGroup>
                    <SelectSeparator />
                    <Navigable>
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
        <Navigable>
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
    const [sort, setSort] = useAtom(atomGameLibrarySorting);
    const [isSortOpen, setSortOpen] = useState(false);
    const { indexing } = useAtomValue(atomGameLibrary);

    return (
        <div className="sticky top-0 z-30 flex justify-between border-b-2 p-3 px-10">
            <div className="flex items-center gap-4">
                <div className="relative flex">
                    <SearchIcon className="absolute top-2.5 left-2 size-4 text-muted-foreground" />
                    <Navigable anchor="CENTER_LEFT">
                        <Input
                            className="w-full rounded-r-none pl-8"
                            placeholder="Search..."
                            type="search"
                        />
                    </Navigable>
                    <Select
                        onOpenChange={(e) => setSortOpen(e)}
                        onValueChange={(e) => setSort(e as SortType)}
                        open={isSortOpen}
                        value={sort}
                    >
                        <SelectPrimitive.Trigger asChild>
                            <Navigable>
                                <Button
                                    className="rounded-l-none border-1 border-l-0"
                                    size="icon"
                                    variant="link"
                                >
                                    <SortDescIcon />
                                </Button>
                            </Navigable>
                        </SelectPrimitive.Trigger>
                        <SelectContent>
                            <GamepadNavField
                                debugName="sort-selection"
                                enabled={isSortOpen}
                            >
                                <Navigable>
                                    <SelectItem value={SortType.NONE}>
                                        None
                                    </SelectItem>
                                </Navigable>
                                <Navigable>
                                    <SelectItem value={SortType.TITLE}>
                                        Title
                                    </SelectItem>
                                </Navigable>
                                <Navigable>
                                    <SelectItem value={SortType.CUSA}>
                                        CUSA
                                    </SelectItem>
                                </Navigable>
                            </GamepadNavField>
                        </SelectContent>
                    </Select>
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
                    {indexing && (
                        <div className="flex gap-2 [&_svg]:size-6">
                            <Spinner />
                            Indexing library...
                        </div>
                    )}
                </div>
            </div>
            <div className="flex-1" />
            <RunningGameIcons />
            <VersionSelector />
        </div>
    );
}
