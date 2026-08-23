import * as SelectPrimitive from "@radix-ui/react-select";
import { TooltipTrigger } from "@radix-ui/react-tooltip";
import { useAtom, useAtomValue } from "jotai";
import {
    FolderCogIcon,
    Gamepad2Icon,
    SearchIcon,
    SettingsIcon,
    SortDescIcon,
} from "lucide-react";
import { useState } from "react";
import { ModalButton } from "@/components/modal-button";
import { GamepadNavField } from "@/lib/context/gamepad-nav-field";
import { useDebounceEffect } from "@/lib/hooks/useDebounceEffect";
import { oficialRepo } from "@/store/common";
import {
    atomGameLibraryIsIndexing,
    atomGameLibrarySorting,
    SortType,
} from "@/store/game-library";
import {
    atomInstalledVersions,
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
                            `${selectVersion.version ?? ""} ${selectVersion.name} ${selectVersion.repo !== oficialRepo ? selectVersion.repo : ""}`}
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
                                    {v.version ?? ""} {v.name}{" "}
                                    {v.repo !== oficialRepo && `(${v.repo})`}
                                </SelectItem>
                            </Navigable>
                        ))}
                    </SelectGroup>
                    <SelectSeparator />
                    <Navigable>
                        <ModalButton
                            modal="version-manager"
                            onClick={() => setIsOpen(false)}
                            variant="ghost"
                        >
                            Open Version Manager
                        </ModalButton>
                    </Navigable>
                </GamepadNavField>
            </SelectContent>
        </Select>
    );
}

type Props = {
    onSearch?: (v: string) => void;
};

export function Toolbar({ onSearch = () => void 0 }: Props) {
    const [sort, setSort] = useAtom(atomGameLibrarySorting);
    const [isSortOpen, setSortOpen] = useState(false);
    const indexing = useAtomValue(atomGameLibraryIsIndexing);

    const [search, setSearch] = useState("");
    useDebounceEffect(search, 200, onSearch);

    return (
        <div className="sticky top-0 z-30 flex justify-between border-b-2 p-3 px-10">
            <div className="flex items-center gap-4">
                <div className="relative flex">
                    <SearchIcon className="absolute top-2.5 left-2 size-4 text-muted-foreground" />
                    <Navigable anchor="CENTER_LEFT">
                        <Input
                            className="w-full rounded-r-none pl-8"
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search..."
                            type="search"
                            value={search}
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
                    <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                            <Navigable>
                                <ModalButton
                                    className="[&_svg]:size-6"
                                    modal="emu-config"
                                    size="icon"
                                    variant="ghost"
                                >
                                    <SettingsIcon />
                                </ModalButton>
                            </Navigable>
                        </TooltipTrigger>
                        <TooltipContent>Emulator Settings</TooltipContent>
                    </Tooltip>
                    <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                            <Navigable>
                                <ModalButton
                                    className="[&_svg]:size-6"
                                    modal="folder-config"
                                    size="icon"
                                    variant="ghost"
                                >
                                    <FolderCogIcon />
                                </ModalButton>
                            </Navigable>
                        </TooltipTrigger>
                        <TooltipContent>Folder Settings</TooltipContent>
                    </Tooltip>
                    <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                            <Navigable>
                                <ModalButton
                                    className="[&_svg]:size-6"
                                    modal="input-bindings"
                                    size="icon"
                                    variant="ghost"
                                >
                                    <Gamepad2Icon />
                                </ModalButton>
                            </Navigable>
                        </TooltipTrigger>
                        <TooltipContent>Input Bindings</TooltipContent>
                    </Tooltip>
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
