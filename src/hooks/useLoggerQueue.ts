"use client";

import { useCallback } from "react";
import { queueEvent } from "@/lib/offlineQueue";

export function useLoggerQueue() {
  const enqueueLog = useCallback(async (payload: Record<string, any>) => {
    await queueEvent(payload);
  }, []);

  return { enqueueLog };
}
