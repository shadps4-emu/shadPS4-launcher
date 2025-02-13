import {
  Gamepad2,
  Pause,
  Play,
  RotateCcw,
  Search,
  Settings,
  Square,
} from "lucide-react";
import { Input } from "./ui/input";

export function Toolbar() {
  return (
    <div className="sticky top-0 z-30 flex justify-between bg-secondary p-3">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            className="rounded-md p-2 focus-within:bg-zinc-700 hover:bg-zinc-700"
            data-gamepad-selectable
          >
            <Play className="h-6 w-6" />
          </button>
          <div className="flex gap-1">
            <button
              className="rounded-md p-2 focus-within:bg-zinc-700 hover:bg-zinc-700"
              data-gamepad-selectable
            >
              <Pause className="h-6 w-6" />
            </button>
            <button
              className="rounded-md p-2 focus-within:bg-zinc-700 hover:bg-zinc-700"
              data-gamepad-selectable
            >
              <Square className="h-6 w-6" />
            </button>
          </div>
          <button
            className="rounded-md p-2 focus-within:bg-zinc-700 hover:bg-zinc-700"
            data-gamepad-selectable
          >
            <RotateCcw className="h-6 w-6" />
          </button>
          <button
            className="rounded-md p-2 focus-within:bg-zinc-700 hover:bg-zinc-700"
            data-gamepad-selectable
          >
            <Settings className="h-6 w-6" />
          </button>
          <button
            className="rounded-md p-2 focus-within:bg-zinc-700 hover:bg-zinc-700"
            data-gamepad-selectable
          >
            <Gamepad2 className="h-6 w-6" />
          </button>
        </div>
      </div>
      <div className="max-w-md flex-1">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-400" />
          <Input
            data-gamepad-selectable="CENTER_LEFT"
            type="search"
            placeholder="Search..."
            className="w-full border-zinc-700 bg-zinc-800 pl-8"
          />
        </div>
      </div>
    </div>
  );
}
