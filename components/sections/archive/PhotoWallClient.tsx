"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { PhotoWall as PhotoWallType } from "./PhotoWall";

const PhotoWall = dynamic(() => import("./PhotoWall").then((m) => m.PhotoWall), {
  ssr: false,
  loading: () => <div className="h-[100svh] w-full" aria-hidden />,
});

/**
 * Client boundary so the archive's WebGL wall (and with it three, R3F and drei) stays out of the
 * initial chunk and loads alongside the main scene instead of in front of it.
 */
export function PhotoWallClient(props: ComponentProps<typeof PhotoWallType>) {
  return <PhotoWall {...props} />;
}
