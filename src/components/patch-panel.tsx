import { join } from "@tauri-apps/api/path";
import { useAtom, useAtomValue, useStore } from "jotai";
import { DownloadIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
    downloadPatches,
    PatchFile,
    type PatchLine,
} from "@/handlers/cheats-and-patches";
import { stringifyError } from "@/lib/utils/error";
import {
    atomAvailablePatches,
    atomPatchRepoEnabledByGame,
    patchRepositories,
} from "@/store/cheats-and-patches";
import type { GameEntry } from "@/store/db";
import { atomPatchPath } from "@/store/paths";
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
import { Toggle } from "./ui/toggle";

export function PatchPanel({ gameData }: { gameData: GameEntry }) {
    const store = useStore();

    const patchFolderPath = useAtomValue(atomPatchPath);
    const availablePatchesFull = useAtomValue(atomAvailablePatches);
    const availablePatches = useMemo(
        () =>
            Object.entries(availablePatchesFull).filter(
                (e) => gameData.cusa in e[1],
            ),
        [availablePatchesFull, gameData.cusa],
    );
    const [enabledPatch, setEnabledPatch] = useAtom(atomPatchRepoEnabledByGame);

    const enabledRepo = enabledPatch[gameData.cusa];
    const repositoryList = patchRepositories;

    const [patchFile, setPatchFile] = useState<PatchFile | null>(null);
    const [patchLines, setPatchLines] = useState<PatchLine[]>([]);

    const patchPath = useMemo(() => {
        if (!enabledRepo) {
            return;
        }
        const patches = availablePatches.find((e) => e[0] === enabledRepo)?.[1];
        if (!patches) {
            return;
        }
        const patchName = patches[gameData.cusa];
        if (!patchName) {
            return;
        }
        return join(patchFolderPath, enabledRepo, patchName);
    }, [patchFolderPath, enabledRepo, gameData, availablePatches]);

    useEffect(() => {
        const c = new AbortController();
        (async () => {
            const path = await patchPath;
            if (!path) {
                setPatchFile(null);
                return;
            }
            try {
                const file = await PatchFile.parsePatchFile(path);
                if (c.signal.aborted) {
                    return;
                }
                setPatchFile(file);
                setPatchLines(file.getPatchLines());
            } catch (e) {
                console.error("Failed to parse patch file", e);
                toast.error(`Failed to parse patch file. ${stringifyError(e)}`);
                setPatchFile(null);
                setPatchLines([]);
            }
        })();
        return () => c.abort();
    }, [patchPath]);

    const save = useCallback(() => {
        patchFile
            ?.save()
            .then((saved) => {
                if (saved) {
                    toast.success("Patch file saved");
                }
            })
            .catch((e) => {
                console.error("Failed to save patch file", e);
                toast.error(`Failed to save patch file. ${e.message}`);
            });
    }, [patchFile]);

    useEffect(() => {
        // Save on close
        return () => save();
    }, [save]);

    const savingRef = useRef<ReturnType<typeof setTimeout>>(null);
    const saveDelayed = () => {
        if (savingRef.current) {
            clearTimeout(savingRef.current);
        }
        const f = patchFile;
        if (!f) {
            return;
        }
        savingRef.current = setTimeout(() => {
            save();
        }, 5000);
    };

    const selectRepo = (repo: string) => {
        setEnabledPatch((prev) => ({
            ...prev,
            [gameData.cusa]: repo,
        }));
    };

    const setPatchState = (patchLine: PatchLine, enabled: boolean) => {
        const updatedLine = patchFile?.setPatchLineEnabled(patchLine, enabled);
        if (!updatedLine) {
            return;
        }
        saveDelayed();
        setPatchLines((prev) =>
            prev.map((line) =>
                line.idx === updatedLine.idx ? updatedLine : line,
            ),
        );
    };

    return (
        <div className="flex h-full flex-col">
            <div className="relative h-full flex-1 overflow-auto p-6">
                <div className="absolute inset-0">
                    <ScrollArea className="h-full">
                        {patchLines.length === 0 ? (
                            <div className="flex h-full items-center justify-center">
                                <div className="text-center text-muted-foreground">
                                    <div className="mb-4 text-6xl opacity-20">
                                        🔧
                                    </div>
                                    <p className="font-medium text-lg">
                                        No Patches available
                                    </p>
                                    <p className="text-sm">
                                        No patches found for this game
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-y-2 px-2">
                                {patchLines
                                    .filter(
                                        (e) =>
                                            e.gameVersion === gameData.version,
                                    )
                                    .map((patch) => (
                                        <div
                                            className="flex gap-2 hover:bg-muted/50"
                                            key={patch.idx}
                                        >
                                            <Checkbox
                                                checked={patch.isEnabled}
                                                id={`patch_${patch.idx}`}
                                                onCheckedChange={(v) =>
                                                    setPatchState(
                                                        patch,
                                                        v === true,
                                                    )
                                                }
                                            />
                                            <Label
                                                className="flex items-center gap-4"
                                                htmlFor={`patch_${patch.idx}`}
                                            >
                                                <span>{patch.name}</span>
                                                <span>by {patch.author}</span>
                                            </Label>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </div>
            <div className="border-t bg-muted/30 p-4">
                <div className="space-y-4">
                    <div>
                        <label
                            className="font-medium text-muted-foreground text-sm"
                            htmlFor="cheat-file-display"
                        >
                            Select Patch File:
                        </label>
                        <div
                            className="mt-2 flex h-20 flex-col rounded-md border bg-background p-3"
                            id="cheat-file-display"
                        >
                            <ScrollArea>
                                {availablePatches.length === 0 ? (
                                    <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                                        No file available
                                    </div>
                                ) : (
                                    <div className="flex flex-col">
                                        {availablePatches.map(([repo]) => (
                                            <Toggle
                                                className="h-6 rounded-sm"
                                                key={repo}
                                                onPressedChange={(v) => {
                                                    if (v) {
                                                        selectRepo(repo);
                                                    }
                                                }}
                                                pressed={repo === enabledRepo}
                                            >
                                                <div className="w-full text-left">
                                                    {repo}
                                                </div>
                                            </Toggle>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </div>
                    </div>

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
                                    {repositoryList.map((repo) => (
                                        <DropdownMenuItem
                                            key={repo}
                                            onClick={() =>
                                                downloadPatches(repo, store)
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
