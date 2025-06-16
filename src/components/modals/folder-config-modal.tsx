import { appDataDir, join } from "@tauri-apps/api/path";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { stringifyError } from "@/lib/utils/error";
import { atomFolderConfigModalIsOpen } from "@/store/common";
import { atomEmuUserPath, atomGamesPath } from "@/store/paths";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

function PathConfig() {
    const [gamePath, setGamePath] = useAtom(atomGamesPath);
    const [userPath, setUserPath] = useAtom(atomEmuUserPath);

    const [inputGamePath, setInputGamePath] = useState("");
    const [inputUserPath, setInputUserPath] = useState("");

    useEffect(() => {
        setInputGamePath(gamePath || "");
    }, [gamePath]);

    useEffect(() => {
        setInputUserPath((typeof userPath === "string" && userPath) || "");
    }, [userPath]);

    const askGamePathDir = () => {
        openDialog({
            directory: true,
        })
            .then((e) => {
                if (e) {
                    setInputGamePath(e);
                    setGamePath(e);
                }
            })
            .catch((e) => {
                toast.error(stringifyError(e));
                console.error(e);
            });
    };

    const askUserPathDir = () => {
        openDialog({
            directory: true,
        })
            .then((e) => {
                if (e) {
                    setUserPath(e);
                    setInputUserPath(e);
                }
            })
            .catch((e) => {
                toast.error(stringifyError(e));
                console.error(e);
            });
    };

    const restoreUserPathToDefault = async () => {
        setUserPath(await join(await appDataDir(), "emu_data"));
    };

    if (gamePath === null || userPath === null) {
        return <p>Loading...</p>;
    }

    return (
        <div className="flex w-full flex-col gap-6 p-4">
            <div className="grid w-full max-w-sm grid-cols-4 items-center">
                <Label className="col-span-2 mb-2" htmlFor="game_path">
                    Games installation
                </Label>
                <Input
                    className="col-span-3 rounded-r-none"
                    id="game_path"
                    onBlur={() => setGamePath(inputGamePath)}
                    onChange={(e) => setInputGamePath(e.target.value)}
                    placeholder="/game/path"
                    type="text"
                    value={inputGamePath}
                />
                <Button className="rounded-l-none" onClick={askGamePathDir}>
                    Browse
                </Button>
            </div>
            <div className="grid w-full max-w-sm grid-cols-4 items-center">
                <Label className="col-span-2 mb-2" htmlFor="game_path">
                    User folder location
                </Label>
                <Tooltip delayDuration={1}>
                    <TooltipTrigger asChild>
                        <Label className="col-span-2 mb-2 flex justify-end gap-2">
                            <Checkbox
                                checked={userPath === true}
                                onCheckedChange={(e) => {
                                    if (e === true) {
                                        setUserPath(true);
                                    } else {
                                        restoreUserPathToDefault();
                                    }
                                }}
                            />
                            Emulator binary path
                        </Label>
                    </TooltipTrigger>
                    <TooltipContent>
                        The user directory (Saves, sys_modules, etc) will put
                        besides the emulator binary.
                    </TooltipContent>
                </Tooltip>
                <Input
                    className="col-span-3 rounded-r-none"
                    disabled={userPath === true}
                    id="game_path"
                    onBlur={() => inputUserPath && setUserPath(inputUserPath)}
                    onChange={(e) => setInputUserPath(e.target.value)}
                    placeholder={
                        userPath === true
                            ? "Using the emulator path"
                            : "/emu/user"
                    }
                    type="text"
                    value={inputUserPath}
                />
                <Button className="rounded-l-none" onClick={askUserPathDir}>
                    Browse
                </Button>
            </div>
        </div>
    );
}

export function FolderConfigModal() {
    const [isOpen, setIsOpen] = useAtom(atomFolderConfigModalIsOpen);

    return (
        <>
            <Dialog onOpenChange={setIsOpen} open={isOpen}>
                <DialogTitle className="hidden">Configuration</DialogTitle>
                <DialogContent aria-describedby={undefined}>
                    <PathConfig />
                </DialogContent>
            </Dialog>
        </>
    );
}
