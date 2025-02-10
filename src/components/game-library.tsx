import { type GameEntry, gameLibrary } from "@/store/game-library";
import { pathPreferences } from "@/store/paths";
import { defaultStore } from "@/store/store";
import { appDataDir, join } from "@tauri-apps/api/path";
import { copyFile, exists } from "@tauri-apps/plugin-fs";
import { Command } from "@tauri-apps/plugin-shell";
import { useAtom } from "jotai";
import { CircleHelp, Globe, ImageOff, Play } from "lucide-react";
import { Suspense, useCallback, useMemo } from "react";
import { Skeleton } from "./ui/skeleton";

import CN from "@/assets/flags/cn.svg";
import EU from "@/assets/flags/eu.svg";
import JP from "@/assets/flags/jp.svg";
import US from "@/assets/flags/us.svg";

function Flag({
  sfo,
  className,
}: Pick<GameEntry, "sfo"> & { className?: string }) {
  const region = useMemo(() => {
    const { CONTENT_ID } = sfo?.entries ?? {};
    return CONTENT_ID?.Text?.[0] ?? undefined;
  }, [sfo]);

  switch (region) {
    case "U":
      return <img className={className} src={US} alt="US" />;
    case "E":
      return <img className={className} src={EU} alt="EU" />;
    case "J":
      return <img className={className} src={JP} alt="JP" />;
    case "H":
      return <img className={className} src={CN} alt="CN" />;
    case "I":
      return <Globe className={className} />;
    default:
      return <CircleHelp className={className} />;
  }
}

function GameBox({ game }: { game: GameEntry }) {
  const openGame = useCallback(
    () =>
      void (async () => {
        const runTarget = await join(await appDataDir(), "shadps4-emu.exe");

        if (!(await exists(runTarget))) {
          const emuPath = defaultStore.get(pathPreferences.emulatorPath);
          await copyFile(emuPath, runTarget);
        }

        const elfPath = await join(game.path, "eboot.bin");

        void Command.create("shadps4-emu", ["-g", elfPath], {
          cwd: await appDataDir(),
        }).execute();
      })(),
    [game],
  );

  return (
    <button
      key={game.id}
      className="group aspect-square h-auto w-full cursor-pointer overflow-hidden rounded-lg bg-zinc-800 transition-transform stack focus-within:scale-110 hover:scale-110"
      onDoubleClick={openGame}
    >
      {game.cover ? (
        <img
          src={game.cover}
          alt={game.title}
          className="col-span-full row-span-full object-cover"
        />
      ) : (
        <ImageOff className="col-span-full row-span-full h-8 w-full self-center" />
      )}

      <div className="grid grid-cols-3 grid-rows-3 bg-black/50 opacity-0 backdrop-blur-[2px] transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
        <span className="col-span-full row-start-1 row-end-2 truncate px-3 py-2 text-lg font-semibold">
          {/* TODO: scroll text on overflow */}
          {game.title}
        </span>

        <div className="col-start-3 col-end-4 row-start-3 row-end-4 m-2 size-6 place-self-end">
          <Flag sfo={game.sfo} className="rounded-full" />
        </div>

        <button className="col-span-full row-start-3 row-end-4 self-end py-2 transition-colors hover:bg-secondary/75 focus:bg-secondary/75">
          View More
        </button>

        <div className="col-span-full row-span-full grid size-16 place-items-center place-self-center rounded-full bg-black/75">
          <Play className="size-10" fill="currentColor" />
        </div>
      </div>
    </button>
  );
}

function Grid() {
  const [games] = useAtom(gameLibrary);

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 p-8">
      {games.map((game) => (
        <GameBox key={game.path} game={game} />
      ))}
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-10">
      {Array(50)
        .fill(0)
        .map((_, i) => (
          <Skeleton
            key={i}
            className="relative aspect-square overflow-hidden rounded-md bg-zinc-800"
          />
        ))}
    </div>
  );
}

export function GameLibrary() {
  return (
    <Suspense fallback={<GridSkeleton />}>
      <Grid />
    </Suspense>
  );
}
