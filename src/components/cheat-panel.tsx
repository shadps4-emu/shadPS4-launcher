import { join } from "@tauri-apps/api/path";
import { exists, readTextFile } from "@tauri-apps/plugin-fs";
import { useAtom, useAtomValue, useStore } from "jotai";
import { DownloadIcon } from "lucide-react";
import { Fragment, useEffect, useReducer, useState } from "react";
import { downloadCheats } from "@/handlers/cheats-and-patches";
import { createAbort } from "@/lib/utils/events";
import {
    atomCheatsEnabled,
    type CheatFileFormat,
    type CheatRepository,
    cheatRepositories,
} from "@/store/cheats-and-patches";
import type { CUSAVersion } from "@/store/common";
import type { GameEntry } from "@/store/db";
import { atomCheatPath } from "@/store/paths";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";

export function CheatPanel({ gameData }: { gameData: GameEntry }) {
    const store = useStore();

    const cheatKey: CUSAVersion = `${gameData.cusa}_${gameData.version}`;

    const cheatFolderPath = useAtomValue(atomCheatPath);
    const [availableCheats, setAvailableCheats] = useState<
        Partial<Record<CheatRepository, string[]>>
    >({});
    const [allActiveCheats, setAllActiveCheats] = useAtom(atomCheatsEnabled);
    const activeCheats = allActiveCheats[cheatKey] || {};

    const [_cheatList, refreshCheatList] = useReducer(() => ({}), {});

    useEffect(() => {
        _cheatList;
        setAvailableCheats({});
        const { abort, signal } = createAbort();
        cheatRepositories.forEach(async (repo) => {
            const cheatFile = await join(
                cheatFolderPath,
                repo,
                `${cheatKey}.json`,
            );
            if (!(await exists(cheatFile))) {
                return;
            }
            if (signal.aborted) {
                return;
            }
            const { mods } = JSON.parse(
                await readTextFile(cheatFile),
            ) as CheatFileFormat;
            const modNames = mods.map((e) => e.name);
            setAvailableCheats((prev) => ({ ...prev, [repo]: modNames }));
        });
        return abort;
    }, [cheatKey, cheatFolderPath, _cheatList]);

    const toggleModActive = (
        repo: CheatRepository,
        modName: string,
        enable: boolean,
    ) => {
        setAllActiveCheats((prev) => ({
            ...prev,
            [cheatKey]: {
                ...prev[cheatKey],
                [repo]: enable
                    ? [...(prev[cheatKey]?.[repo] || []), modName]
                    : prev[cheatKey]?.[repo]?.filter((e) => e !== modName),
            },
        }));
    };

    return (
        <div className="flex h-full flex-col">
            <div className="relative h-full flex-1 overflow-auto p-6">
                <div className="absolute inset-0">
                    <ScrollArea className="h-full">
                        {Object.keys(availableCheats).length === 0 ? (
                            <div className="flex h-full items-center justify-center">
                                <div className="text-center text-muted-foreground">
                                    <div className="mb-4 text-6xl opacity-20">
                                        🎯
                                    </div>
                                    <p className="font-medium text-lg">
                                        No Cheats available
                                    </p>
                                    <p className="text-sm">
                                        Download more cheats!
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-y-2 px-2">
                                {(
                                    Object.entries(availableCheats) as [
                                        CheatRepository,
                                        string[],
                                    ][]
                                ).map(([repo, mods]) => (
                                    <Fragment key={repo}>
                                        <span className="font-medium text-muted-foreground text-xs">
                                            {repo}
                                        </span>
                                        {mods.map((modName) => (
                                            <div
                                                className="flex gap-2 hover:bg-muted/50"
                                                key={modName}
                                            >
                                                <Checkbox
                                                    checked={activeCheats[
                                                        repo as CheatRepository
                                                    ]?.includes(modName)}
                                                    id={`mod_${repo}_${modName}`}
                                                    onCheckedChange={(v) => {
                                                        toggleModActive(
                                                            repo,
                                                            modName,
                                                            v === true,
                                                        );
                                                    }}
                                                />
                                                <Label
                                                    className="flex items-center gap-4"
                                                    htmlFor={`mod_${repo}_${modName}`}
                                                >
                                                    <span>{modName}</span>
                                                </Label>
                                            </div>
                                        ))}
                                    </Fragment>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </div>
            <div className="border-t bg-muted/30 p-4">
                <div className="space-y-4">
                    <div className="flex items-center justify-end gap-4">
                        <div className="flex gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        className="bg-green-600 hover:bg-green-700"
                                        size="sm"
                                        variant="default"
                                    >
                                        <DownloadIcon className="h-4 w-4" />
                                        Download
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    {cheatRepositories.map((repo) => (
                                        <DropdownMenuItem
                                            key={repo}
                                            onClick={() =>
                                                downloadCheats(
                                                    repo,
                                                    store,
                                                ).andTee(() =>
                                                    refreshCheatList(),
                                                )
                                            }
                                        >
                                            {repo}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
