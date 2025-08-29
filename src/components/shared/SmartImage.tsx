"use client";
import React from "react";
import { useSettings } from "./SettingsContext";

interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  qualityParam?: string; // e.g. "q" or "quality"
}

function withQuality(src: string | Blob, qualityParam: string, q: number): string | Blob {
  if (typeof src !== "string") return src;
  try {
    const url = new URL(src, typeof window !== "undefined" ? window.location.origin : "http://localhost");
    url.searchParams.set(qualityParam, String(q));
    return url.pathname + url.search;
  } catch {
    // If not a valid URL, fallback: append query if possible
    if (src.includes("?")) return `${src}&${qualityParam}=${q}`;
    return `${src}?${qualityParam}=${q}`;
  }
}

export default function SmartImage({ qualityParam = "q", src = "", alt = "", loading = "lazy", decoding = "async", fetchPriority, ...rest }: SmartImageProps) {
  const { dataSaver } = useSettings();

  const finalSrc = React.useMemo<string | Blob>(() => {
    if (!dataSaver || !src) return src;
    return withQuality(src, qualityParam, 50);
  }, [dataSaver, src, qualityParam]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={finalSrc as any}
      alt={alt}
      loading={loading}
      decoding={decoding}
      fetchPriority={dataSaver ? "low" : fetchPriority}
      {...rest}
    />
  );
}
