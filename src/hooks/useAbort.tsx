import { createAbort } from "@/utils/events";
import { useEffect, useState } from "react";

export function useAbort(): [signal: AbortSignal, abort: () => void] {
  const [{ signal, abort }] = useState(() => createAbort());

  useEffect(() => {
    return () => abort();
  }, []);

  return [signal, abort];
}
