import { atomModalConfigIsOpen } from "@/store/common";
import { useAtom } from "jotai";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

export function ConfigModal() {
  const [isOpen, setIsOpen] = useAtom(atomModalConfigIsOpen);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Config</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="general">
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="debug">Debug</TabsTrigger>
            </TabsList>
            <TabsContent value="general">GENERAL STUFF</TabsContent>
            <TabsContent value="debug">Debug</TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
