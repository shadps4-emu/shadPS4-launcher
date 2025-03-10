import { cn } from "@/utils/ui";
import { Progress } from "./ui/progress";
import { Spinner } from "./ui/spinner";
import { useAtomValue } from "jotai";
import { atomDownloadingOverlay } from "@/store/common";

interface LoadingProps {
  message?: string;
  percent?: number;
  progress?: number;
  total?: number;
}

export function LoadingScreen({
  message,
  percent,
  progress,
  total,
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

  if (typeof progress !== "undefined") {
    if (typeof total !== "undefined") {
      subText = `${progress}/${total}`;
    } else {
      subText = `${progress}`;
    }
  } else if (typeof percent !== "undefined") {
    subText = `${percent}%`;
  }

  return (
    <>
      <div className="fixed inset-0 z-[70] overflow-hidden bg-secondary opacity-70"></div>
      <div className="fixed inset-0 z-[70] flex h-screen w-screen flex-col items-center justify-center overflow-hidden text-secondary-foreground">
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

  return <LoadingScreen message={value.message} {...props} />;
}
