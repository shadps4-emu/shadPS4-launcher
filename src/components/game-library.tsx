import CN from "@/assets/flags/cn.svg";
import EU from "@/assets/flags/eu.svg";
import JP from "@/assets/flags/jp.svg";
import US from "@/assets/flags/us.svg";
import { startGame } from "@/handlers/run_emu";
import { type GameEntry, atomGameLibrary } from "@/store/game-library";
import { gamepadActiveAtom } from "@/store/gamepad";
import { atomGamesPath } from "@/store/paths";
import { atomSelectedVersion } from "@/store/version-manager";
import { exists, mkdir } from "@tauri-apps/plugin-fs";
import { openPath } from "@tauri-apps/plugin-opener";
import { useAtom, useStore } from "jotai";
import { CircleHelp, Globe, ImageOff, Play } from "lucide-react";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import GamepadIcon from "./gamepad-icon";
import { ScrollArea } from "./ui/scroll-area";
import { Skeleton } from "./ui/skeleton";

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

function GameBox({ game, isFirst }: { game: GameEntry; isFirst?: boolean }) {
  const isGamepad = useAtom(gamepadActiveAtom);
  const store = useStore();

  const [clickCount, setClickCount] = useState<number>(0);

  const openGame = useCallback(
    () =>
      void (async () => {
        setClickCount(0);
        const selectEmu = store.get(atomSelectedVersion);
        if (!selectEmu) {
          toast.warning("No emulator selected");
          return;
        }
        await startGame(selectEmu, game.path);
        toast.success("Game started");
      })(),
    [game, store],
  );

  const onClick = () => {
    setClickCount((prev) => prev + 1);
  };

  const onBlur = () => {
    setClickCount(0);
  };

  useEffect(() => {
    if (clickCount >= 3) {
      setClickCount(0);
      toast.info("Do a double click to start the game");
    }
  }, [clickCount]);

  return (
    <div
      key={game.id}
      className="group aspect-square h-auto w-full max-w-[200px] cursor-pointer overflow-hidden rounded-lg bg-zinc-800 transition-transform stack focus-within:scale-110 hover:scale-110"
      onDoubleClick={openGame}
      onClick={onClick}
      onBlur={onBlur}
      data-gamepad-selectable
      tabIndex={0}
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
        <span className="col-span-full row-start-1 row-end-2 truncate px-3 py-2 text-center text-lg font-semibold">
          {/* TODO: scroll text on overflow */}
          {game.title}
        </span>

        <div className="col-start-3 col-end-4 row-start-3 row-end-4 m-2 size-6 place-self-end">
          <Flag sfo={game.sfo} className="rounded-full" />
        </div>

        <button
          className="col-span-full row-span-full grid size-16 place-items-center place-self-center rounded-full bg-black/75"
          data-play-game={""}
          data-initial-focus={isFirst ? "" : undefined}
        >
          <Play className="size-10" fill="currentColor" />
        </button>

        <button className="col-span-full row-start-3 row-end-4 flex flex-row items-center justify-center gap-x-2 self-end py-2 transition-colors hover:bg-secondary/75 focus:bg-secondary/75">
          {isGamepad && <GamepadIcon icon="options" className="size-6" />}
          View More
          {isGamepad && <div className="size-6" />}
        </button>
      </div>
    </div>
  );
}

function Grid() {
  const [games] = useAtom(atomGameLibrary);
  const store = useStore();

  if (games.length === 0) {
    async function openGameFolder() {
      const path = store.get(atomGamesPath);
      if (path) {
        if (!(await exists(path))) {
          await mkdir(path, { recursive: true });
        }
        await openPath(path);
      }
    }
    return (
      <div className="flex h-full items-center justify-center">
        <div
          className="flex h-[150px] w-[300px] cursor-pointer flex-col items-center justify-center rounded-md border border-dashed text-sm"
          onClick={() => void openGameFolder()}
        >
          <span>No game found :(</span>
          <span>Click here to open game folder</span>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea type="scroll" className="z-20 flex-1">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 p-8">
        {games.map((game, index) => (
          <GameBox key={game.path} game={game} isFirst={index === 0} />
        ))}
      </div>
    </ScrollArea>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 overflow-hidden p-8">
      {Array(50)
        .fill(0)
        .map((_, i) => (
          <Skeleton
            key={i}
            className="relative aspect-square rounded-md bg-zinc-800"
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
