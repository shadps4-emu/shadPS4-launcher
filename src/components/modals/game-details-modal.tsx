import { useAtom } from "jotai";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    GamepadNavField,
    type NavButton,
} from "@/lib/context/gamepad-nav-field";
import type { PSFEntry } from "@/lib/native/psf";
import { atomShowingGameDetails } from "@/store/common";
import type { GameRow } from "@/store/db";
import { GameBoxCover } from "../game-cover";

function Entry({ value }: { value: PSFEntry }) {
    if (value === null || value === undefined) {
        return <span className="text-muted-foreground italic">N/A</span>;
    }
    if (value.Text !== undefined) {
        return <>{value.Text}</>;
    }
    if (value.Integer !== undefined) {
        return <>{value.Integer.toString()}</>;
    }
    if (value.Binary !== undefined) {
        return (
            <span className="text-muted-foreground italic">
                [Binary Data ({value.Binary.length} bytes)]
            </span>
        );
    }
    return <span className="text-red-500 italic">[Unknown Format]</span>;
}

type Props = {
    gameData: GameRow;
    onClose: () => void;
};

function GameDetailsDialog({ gameData, onClose }: Props) {
    const sfo = gameData.sfo;

    const onButtonPress = (btn: NavButton) => {
        if (btn === "back") {
            onClose();
            return;
        }
    };

    return (
        <GamepadNavField
            debugName="game-details-modal"
            onButtonPress={onButtonPress}
            zIndex={100}
        >
            <Dialog onOpenChange={() => onClose()} open>
                <DialogContent
                    aria-describedby={undefined}
                    className="flex max-h-[90vh] max-w-xl flex-col md:max-w-4xl"
                >
                    <DialogHeader className="flex-shrink-0">
                        <DialogTitle className="text-2xl">
                            {gameData.title}
                        </DialogTitle>
                        <DialogDescription id="game-details-description">
                            {gameData.cusa}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-grow overflow-y-auto">
                        <div className="grid grid-cols-1 gap-6 py-4 sm:grid-cols-3">
                            <div className="flex flex-col items-center pt-2 md:col-span-1">
                                <GameBoxCover game={gameData} />
                            </div>

                            <div className="space-y-4 md:col-span-2">
                                <div className="space-y-1">
                                    <h3 className="font-medium text-muted-foreground text-sm">
                                        Version
                                    </h3>
                                    <p className="font-semibold text-lg">
                                        {gameData.version}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-medium text-muted-foreground text-sm">
                                        Firmware
                                    </h3>
                                    <Badge variant="outline">
                                        {gameData.fw_version}
                                    </Badge>
                                </div>

                                {sfo?.entries && (
                                    <>
                                        {sfo.entries.CATEGORY && (
                                            <div className="space-y-1">
                                                <h3 className="font-medium text-muted-foreground text-sm">
                                                    Category
                                                </h3>
                                                <p>
                                                    <Entry
                                                        value={
                                                            sfo.entries.CATEGORY
                                                        }
                                                    />
                                                </p>
                                            </div>
                                        )}
                                        {sfo.entries.CONTENT_ID && (
                                            <div className="space-y-1">
                                                <h3 className="font-medium text-muted-foreground text-sm">
                                                    Content ID
                                                </h3>
                                                <p className="break-all">
                                                    <Entry
                                                        value={
                                                            sfo.entries
                                                                .CONTENT_ID
                                                        }
                                                    />
                                                </p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {sfo?.entries && (
                            <div className="mt-4 border-t pt-4">
                                <h3 className="mb-2 font-semibold text-lg">
                                    SFO Details
                                </h3>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[280px]">
                                                Key
                                            </TableHead>
                                            <TableHead>Value</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {Object.entries(sfo.entries)
                                            .filter(
                                                ([key]) =>
                                                    ![
                                                        "TITLE",
                                                        "TITLE_ID",
                                                        "APP_VER",
                                                        "SYSTEM_VER",
                                                        "CATEGORY",
                                                        "CONTENT_ID",
                                                    ].includes(key),
                                            )
                                            .sort(([keyA], [keyB]) =>
                                                keyA.localeCompare(keyB),
                                            )
                                            .map(([key, value]) => (
                                                <TableRow key={key}>
                                                    <TableCell className="break-all py-1.5 font-medium">
                                                        {key}
                                                    </TableCell>
                                                    <TableCell className="break-all py-1.5">
                                                        <Entry value={value} />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </GamepadNavField>
    );
}

export function GameDetailsModal() {
    const [showingGame, setShowingGame] = useAtom(atomShowingGameDetails);

    if (!showingGame) {
        return <></>;
    }

    return (
        <GameDetailsDialog
            gameData={showingGame}
            onClose={() => setShowingGame(null)}
        />
    );
}
