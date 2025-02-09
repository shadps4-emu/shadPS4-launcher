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
    <div className="flex justify-between bg-secondary/40 p-3">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button className="rounded-md p-2 hover:bg-zinc-700">
            <Play className="h-6 w-6" />
          </button>
          <div className="flex gap-1">
            <button className="rounded-md p-2 hover:bg-zinc-700">
              <Pause className="h-6 w-6" />
            </button>
            <button className="rounded-md p-2 hover:bg-zinc-700">
              <Square className="h-6 w-6" />
            </button>
          </div>
          <button className="rounded-md p-2 hover:bg-zinc-700">
            <RotateCcw className="h-6 w-6" />
          </button>
          <button className="rounded-md p-2 hover:bg-zinc-700">
            <Settings className="h-6 w-6" />
          </button>
          <button className="rounded-md p-2 hover:bg-zinc-700">
            <Gamepad2 className="h-6 w-6" />
          </button>
        </div>
      </div>
      <div className="max-w-md flex-1">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-400" />
          <Input
            type="search"
            placeholder="Search..."
            className="w-full border-zinc-700 bg-zinc-800 pl-8"
          />
        </div>
      </div>
    </div>
  );
}
