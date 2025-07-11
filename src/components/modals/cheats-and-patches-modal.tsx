import { join } from "@tauri-apps/api/path";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useAtom, useAtomValue, useStore } from "jotai";
import {
    AlertTriangleIcon,
    DownloadIcon,
    ExternalLinkIcon,
    Trash2Icon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
    downloadPatches,
    PatchFile,
    type PatchLine,
} from "@/handlers/cheats-and-patches";
import {
    GamepadNavField,
    type NavButton,
} from "@/lib/context/gamepad-nav-field";
import {
    atomAvailablePatches,
    atomPatchRepoEnabledByGame,
    atomShowingGameCheatAndPatch,
    patchRepositories,
} from "@/store/cheats-and-patches";
import type { GameRow } from "@/store/db";
import { atomPatchPath } from "@/store/paths";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "../animate-ui/radix/tabs";
import { GameBoxCover } from "../game-cover";
import { Checkbox } from "../ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Label } from "../ui/label";
import { ScrollArea } from "../ui/scroll-area";
import { Toggle } from "../ui/toggle";

function PatchPanel({ gameData }: { gameData: GameRow }) {
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
            const file = await PatchFile.parsePatchFile(path);
            if (c.signal.aborted) {
                return;
            }
            setPatchFile(file);
            setPatchLines(file.getPatchLines());
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
                toast.error("Failed to save patch file. " + e.message);
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
                            <Button size="sm" variant="destructive">
                                <Trash2Icon className="h-4 w-4" />
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CheatsAndPatchesDialog({
    gameData,
    onClose,
}: {
    gameData: GameRow;
    onClose: () => void;
}) {
    const onButtonPress = (btn: NavButton) => {
        if (btn === "back") {
            onClose();
            return;
        }
    };

    return (
        <GamepadNavField
            debugName="cheats-and-patches-modal"
            onButtonPress={onButtonPress}
            zIndex={100}
        >
            <Dialog onOpenChange={() => onClose()} open>
                <DialogContent
                    aria-describedby={undefined}
                    className="flex h-full max-w-full flex-col gap-0 p-0 sm:max-w-4xl md:max-h-[90vh] lg:max-w-5xl"
                >
                    <DialogHeader className="border-b px-6 py-4">
                        <DialogTitle className="text-2xl">
                            Cheats / Patches
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex flex-1">
                        <div className="hidden border-r bg-muted/30 p-6 md:block">
                            <div className="flex h-full max-h-full w-70 flex-col space-y-4 overflow-hidden">
                                <div className="flex gap-4">
                                    <div className="flex rounded-lg border bg-background shadow-lg">
                                        <GameBoxCover
                                            className="aspect-squared object-contain"
                                            game={gameData}
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <h3 className="wrap-anywhere font-bold text-lg leading-tight">
                                                {gameData.title}
                                            </h3>
                                        </div>

                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between gap-4">
                                                <span className="text-muted-foreground">
                                                    Serial:
                                                </span>
                                                <span className="font-medium">
                                                    {gameData.cusa}
                                                </span>
                                            </div>
                                            <div className="flex justify-between gap-4">
                                                <span className="text-muted-foreground">
                                                    Version:
                                                </span>
                                                <span className="font-medium">
                                                    {gameData.version}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                <Alert className="" variant="warn">
                                    <AlertTriangleIcon />
                                    <AlertTitle className="wrap-break-word">
                                        Cheats/Patches are experimental.
                                    </AlertTitle>
                                    <AlertDescription>
                                        Use with caution.
                                    </AlertDescription>
                                </Alert>

                                <div className="shrink-0 space-y-3 text-muted-foreground text-xs">
                                    <div className="pt-2">
                                        <p className="font-medium">
                                            Created a new cheat? Visit:
                                        </p>
                                        <Button
                                            className="h-auto p-0 text-blue-600 text-xs hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                            onClick={() =>
                                                openUrl(
                                                    "https://github.com/shadps4-emu/ps4_cheats",
                                                )
                                            }
                                            variant="link"
                                        >
                                            <ExternalLinkIcon className="h-3 w-3" />
                                            https://github.com/shadps4-emu/ps4_cheats
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Tabs
                            className="flex flex-1 flex-col"
                            defaultValue="patch"
                        >
                            <TabsList
                                activeClassName="rounded-none border-primary border-b-2 bg-primary/5"
                                className="w-full justify-start rounded-none p-0 *:basis-0"
                            >
                                <TabsTrigger className="p-4" value="patch">
                                    Patches
                                </TabsTrigger>
                                <TabsTrigger className="p-4" value="cheat">
                                    Cheats
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="patch">
                                <PatchPanel gameData={gameData} />
                            </TabsContent>
                            <TabsContent value="cheat"></TabsContent>
                        </Tabs>
                    </div>
                </DialogContent>
            </Dialog>
        </GamepadNavField>
    );
}

export function CheatAndPatchesModal() {
    const [showingGame, setShowingGame] = useAtom(atomShowingGameCheatAndPatch);

    if (!showingGame) {
        return <></>;
    }

    return (
        <CheatsAndPatchesDialog
            gameData={showingGame}
            onClose={() => setShowingGame(null)}
        />
    );
}
