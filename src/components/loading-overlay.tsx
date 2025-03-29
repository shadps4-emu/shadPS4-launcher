import { atomDownloadingOverlay } from "@/store/common";
import { cn } from "@/utils/ui";
import { useAtomValue } from "jotai";
import { Progress } from "./ui/progress";
import { Spinner } from "./ui/spinner";

interface LoadingProps {
  message?: string;
  percent?: number;
  progress?: number;
  total?: number;
  format?: keyof typeof progressFormats;
}

const progressFormats = {
  data: (v: number) => {
    if (v > 1024 * 1024 * 1024) {
      return `${(v / (1024 * 1024 * 1024)).toFixed(2)}GB`;
    }
    if (v > 1024 * 1024) {
      return `${(v / (1024 * 1024)).toFixed(2)}MB`;
    }
    if (v > 1024) {
      return `${(v / 1024).toFixed(2)}KB`;
    }
    return `${v}B`;
  },
  "": (v: number) => v.toString(),
} as const;

export function LoadingScreen({
  message,
  percent,
  progress,
  total,
  format,
}: LoadingProps) {
  let indicator;
  let subText;
  let center = false;

  if (typeof percent === "number") {
    indicator = <Progress value={percent} />;
  } else if (typeof progress === "number" && typeof total === "number") {
    indicator = <Progress value={(progress / total) * 100} />;
  } else {
    center = true;
    indicator = <Spinner size="large" />;
  }

  const fmt = progressFormats[format || ""];

  if (typeof progress !== "undefined") {
    if (typeof total !== "undefined") {
      subText = `${fmt(progress)}/${fmt(total)}`;
    } else {
      subText = `${fmt(progress)}`;
    }
  } else if (typeof percent !== "undefined") {
    subText = `${percent}%`;
  }

  return (
    <>
      <div className="fixed inset-0 z-70 overflow-hidden bg-secondary opacity-70"></div>
      <div className="fixed inset-0 z-70 flex h-screen w-screen flex-col items-center justify-center overflow-hidden text-secondary-foreground">
        {message && <span className="text-xl">{message}</span>}
        <div
          className={cn("mt-2 flex h-12 flex-col", {
            "items-center": center,
            "w-2/3": !center,
          })}
        >
          {indicator}
          {subText && <span>{subText}</span>}
        </div>
      </div>
    </>
  );
}

export function LoadingOverlay() {
  const value = useAtomValue(atomDownloadingOverlay);

  if (!value) {
    return <></>;
  }

  const props: LoadingProps = {};

  if ("percent" in value) {
    props.percent = value.percent;
  }
  if ("progress" in value && value.progress !== "infinity") {
    props.progress = value.progress;
  }
  if ("total" in value) {
    props.total = value.total;
  }
  if ("format" in value) {
    props.format = value.format;
  }

  return <LoadingScreen message={value.message} {...props} />;
}
