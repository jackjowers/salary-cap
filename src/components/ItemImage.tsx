"use client";

import { useEffect, useRef, useState } from "react";

function initials(name: string) {
  return name
    .replace(/[^A-Za-z0-9 ]/g, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default function ItemImage({ name, src }: { name: string; src?: string }) {
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, [src, failed]);

  if (!src || failed) {
    return (
      <span className="tile-fallback" aria-hidden="true">
        {initials(name)}
      </span>
    );
  }
  return <img ref={imgRef} className="tile-img" src={src} alt="" onError={() => setFailed(true)} />;
}
