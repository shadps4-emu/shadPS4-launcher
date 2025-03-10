import { atomModalConfigIsOpen, oficialRepo } from "@/store/common";
import { refreshGameLibrary } from "@/store/game-library";
import {
  atomInstalledVersions,
  atomModalVersionManagerIsOpen,
  atomSelectedVersion,
} from "@/store/version-manager";
import { cn } from "@/utils/ui";
import { TooltipTrigger } from "@radix-ui/react-tooltip";
import { useAtom, useAtomValue, useSetAtom, useStore } from "jotai";
import {
  Gamepad2,
  Pause,
  Play,
  RotateCcw,
  Search,
  Settings,
  Square,
} from "lucide-react";
import { type ComponentProps, useState } from "react";
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
import { Tooltip, TooltipContent } from "./ui/tooltip";

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

function ToolbarButton({
  className,
  tooltip,
  ...props
}: ComponentProps<typeof Button> & { tooltip?: string }) {
  const content = (
    <button
      className={cn(
        "rounded-md p-2 *:size-6 focus-within:bg-muted hover:bg-muted",
        className,
      )}
      data-gamepad-selectable
      {...props}
    />
  );
  if (!tooltip) {
    return content;
  }
  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

export function Toolbar() {
  const setConfigModalOpen = useSetAtom(atomModalConfigIsOpen);
  const store = useStore();

  return (
    <div className="sticky top-0 z-30 flex justify-between bg-secondary p-3">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <ToolbarButton>
            <Play className="h-6 w-6" />
          </ToolbarButton>
          <ToolbarButton>
            <Pause className="h-6 w-6" />
          </ToolbarButton>
          <ToolbarButton>
            <Square className="h-6 w-6" />
          </ToolbarButton>
          <ToolbarButton
            tooltip="Refresh Game Library"
            onClick={() => refreshGameLibrary(store)}
          >
            <RotateCcw className="h-6 w-6" />
          </ToolbarButton>
          <ToolbarButton
            tooltip="Settings"
            onClick={() => setConfigModalOpen(true)}
          >
            <Settings className="h-6 w-6" />
          </ToolbarButton>
          <ToolbarButton>
            <Gamepad2 className="h-6 w-6" />
          </ToolbarButton>
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
