"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { errorMessage } from "./api";

interface State<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/** Tiny data hook: runs the loader, exposes data/loading/error and a reload(). */
export function useFetch<T>(loader: () => Promise<T>, deps: unknown[] = []) {
  const [state, setState] = useState<State<T>>({ data: null, loading: true, error: null });
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const run = useCallback(async (silent = false) => {
    if (!silent) setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await loaderRef.current();
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState((s) => ({ data: s.data, loading: false, error: errorMessage(err) }));
    }
  }, []);

  useEffect(() => {
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ...state, reload: () => run(true), setData: (data: T) => setState({ data, loading: false, error: null }) };
}
