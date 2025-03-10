import { atomModalConfigIsOpen, oficialRepo } from "@/store/common";
import {
  atomInstalledVersions,
  atomModalVersionManagerIsOpen,
  atomSelectedVersion,
} from "@/store/version-manager";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  Gamepad2,
  Pause,
  Play,
  RotateCcw,
  Search,
  Settings,
  Square,
} from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
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

function VersionSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const setVersionManagerModalOpen = useSetAtom(atomModalVersionManagerIsOpen);
  const installedVersions = useAtomValue(atomInstalledVersions);
  const [selectVersion, setSelectedVersion] = useAtom(atomSelectedVersion);

  return (
    <Select
      open={isOpen}
      onOpenChange={(e) => setIsOpen(e)}
      value={selectVersion?.path}
      onValueChange={setSelectedVersion}
    >
      <SelectTrigger className="w-[180px] border-secondary-foreground">
        <SelectValue placeholder="No version selected" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Emulator Version</SelectLabel>
          {installedVersions.map((v) => (
            <SelectItem key={v.path} value={v.path}>
              {v.version} {v.repo != oficialRepo && `(${v.repo})`}
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectSeparator />
        <Button
          variant="ghost"
          onClick={() => {
            setIsOpen(false);
            setVersionManagerModalOpen(true);
          }}
        >
          Open Version Manager
        </Button>
      </SelectContent>
    </Select>
  );
}

export function Toolbar() {
  const setConfigModalOpen = useSetAtom(atomModalConfigIsOpen);

  return (
    <div className="sticky top-0 z-30 flex justify-between bg-secondary p-3">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            className="rounded-md p-2 focus-within:bg-muted hover:bg-muted"
            data-gamepad-selectable
          >
            <Play className="h-6 w-6" />
          </button>
          <div className="flex gap-1">
            <button
              className="rounded-md p-2 focus-within:bg-muted hover:bg-muted"
              data-gamepad-selectable
            >
              <Pause className="h-6 w-6" />
            </button>
            <button
              className="rounded-md p-2 focus-within:bg-muted hover:bg-muted"
              data-gamepad-selectable
            >
              <Square className="h-6 w-6" />
            </button>
          </div>
          <button
            className="rounded-md p-2 focus-within:bg-muted hover:bg-muted"
            data-gamepad-selectable
          >
            <RotateCcw className="h-6 w-6" />
          </button>
          <button
            className="rounded-md p-2 focus-within:bg-muted hover:bg-muted"
            data-gamepad-selectable
            onClick={() => setConfigModalOpen(true)}
          >
            <Settings className="h-6 w-6" />
          </button>
          <button
            className="rounded-md p-2 focus-within:bg-muted hover:bg-muted"
            data-gamepad-selectable
          >
            <Gamepad2 className="h-6 w-6" />
          </button>
          <VersionSelector />
        </div>
      </div>
      <div className="max-w-md flex-1">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            data-gamepad-selectable="CENTER_LEFT"
            type="search"
            placeholder="Search..."
            className="w-full border-muted bg-muted pl-8"
          />
        </div>
      </div>
    </div>
  );
}
