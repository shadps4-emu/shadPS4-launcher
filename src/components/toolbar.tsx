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
    <div className="flex justify-between p-3 bg-secondary/40">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-zinc-700 rounded-md">
            <Play className="w-6 h-6" />
          </button>
          <div className="flex gap-1">
            <button className="p-2 hover:bg-zinc-700 rounded-md">
              <Pause className="w-6 h-6" />
            </button>
            <button className="p-2 hover:bg-zinc-700 rounded-md">
              <Square className="w-6 h-6" />
            </button>
          </div>
          <button className="p-2 hover:bg-zinc-700 rounded-md">
            <RotateCcw className="w-6 h-6" />
          </button>
          <button className="p-2 hover:bg-zinc-700 rounded-md">
            <Settings className="w-6 h-6" />
          </button>
          <button className="p-2 hover:bg-zinc-700 rounded-md">
            <Gamepad2 className="w-6 h-6" />
          </button>
        </div>
      </div>
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-400" />
          <Input
            type="search"
            placeholder="Search..."
            className="w-full bg-zinc-800 border-zinc-700 pl-8"
          />
        </div>
      </div>
    </div>
  );
}
