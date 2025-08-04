import { openUrl } from "@tauri-apps/plugin-opener";
import { useAtom } from "jotai";
import { AlertTriangleIcon, ExternalLinkIcon } from "lucide-react";
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
    GamepadNavField,
    type NavButton,
} from "@/lib/context/gamepad-nav-field";
import { atomShowingGameCheatAndPatch } from "@/store/cheats-and-patches";
import type { GameEntry } from "@/store/db";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "../animate-ui/radix/tabs";
import { CheatPanel } from "../cheat-panel";
import { GameBoxCover } from "../game-cover";
import { PatchPanel } from "../patch-panel";

function CheatsAndPatchesDialog({
    gameData,
    onClose,
}: {
    gameData: GameEntry;
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
                            <TabsContent value="cheat">
                                <CheatPanel gameData={gameData} />
                            </TabsContent>
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
