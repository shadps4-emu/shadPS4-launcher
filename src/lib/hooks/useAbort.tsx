import { useEffect, useState } from "react";
import { createAbort } from "@/lib/utils/events";

export function useAbort(): [signal: AbortSignal, abort: () => void] {
    const [{ signal, abort }] = useState(() => createAbort());

    useEffect(() => {
        return () => abort();
    }, [abort]);

    return [signal, abort];
}
