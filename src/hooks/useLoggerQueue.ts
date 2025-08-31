"use client";

import { useCallback } from "react";
import { getOfflineQueue } from "@/lib/offlineQueue";

export function useLoggerQueue() {
  const enqueueLog = useCallback(async (payload: Record<string, any>) => {
    const queue = getOfflineQueue();
    queue.add({
      type: 'track_event',
      data: payload,
      timestamp: new Date().toISOString()
    });
  }, []);

  return { enqueueLog };
}