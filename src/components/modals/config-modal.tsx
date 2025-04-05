import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { atomModalConfigIsOpen } from "@/store/common";
import { atomGamesPath } from "@/store/paths";
import { stringifyError } from "@/utils/error";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

function PathConfig() {
    const [gamePath, setGamePath] = useAtom(atomGamesPath);
    const [inputGamePath, setInputGamePath] = useState("");

    useEffect(() => {
        setInputGamePath(gamePath || "");
    }, [gamePath]);

    function askDir() {
        openDialog({
            directory: true,
        })
            .then((e) => {
                if (e) {
                    setGamePath(e);
                }
            })
            .catch((e) => {
                toast.error(stringifyError(e));
                console.error(e);
            });
    }

    return (
        <div className="flex w-full flex-col p-4">
            <div className="grid w-full max-w-sm grid-cols-4 items-center gap-1.5">
                <Label className="col-span-2" htmlFor="game_path">
                    Games installation
                </Label>
                <Input
                    className="col-span-3"
                    id="game_path"
                    onBlur={() => setGamePath(inputGamePath)}
                    onChange={(e) => setInputGamePath(e.target.value)}
                    placeholder="/game/path"
                    type="text"
                    value={inputGamePath}
                />
                <Button onClick={askDir}>Select</Button>
            </div>
        </div>
    );
}

export function ConfigModal() {
    const [isOpen, setIsOpen] = useAtom(atomModalConfigIsOpen);

    return (
        <>
            <Dialog onOpenChange={setIsOpen} open={isOpen}>
                <DialogTitle className="hidden">Configuration</DialogTitle>
                <DialogContent>
                    <Tabs defaultValue="general">
                        <TabsList>
                            <TabsTrigger value="general">General</TabsTrigger>
                            <TabsTrigger value="paths">Directories</TabsTrigger>
                            <TabsTrigger value="debug">Debug</TabsTrigger>
                        </TabsList>
                        <TabsContent value="general">GENERAL STUFF</TabsContent>
                        <TabsContent value="paths">
                            <PathConfig />
                        </TabsContent>
                        <TabsContent value="debug">Debug</TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>
        </>
    );
}
