import { gameLibrary } from "@/store/game-library";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useAtom } from "jotai";

export function GameLibrary() {
  const [games] = useAtom(gameLibrary);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-10 gap-4">
      {games.map((game) => (
        <div key={game.id} className="space-y-2">
          <div className="aspect-square relative overflow-hidden rounded-md bg-zinc-800">
            {(game.cover && (
              <img
                src={convertFileSrc(game.cover)}
                alt={game.title}
                className="object-cover"
              />
            )) || (
              <div className="center">
                <span className="text-red-500">No cover</span>
              </div>
            )}
          </div>
          <div className="text-xs text-zinc-400">{game.id}</div>
        </div>
      ))}
    </div>
  );
}
