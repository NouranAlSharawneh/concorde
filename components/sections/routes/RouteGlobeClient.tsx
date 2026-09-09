"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

const RouteGlobe = dynamic(() => import("./RouteGlobe"), { ssr: false, loading: () => <div className="sticky top-0 h-[100svh] w-full" aria-hidden /> });

/** Client boundary so the WebGL globe is never server-rendered. */
export function RouteGlobeClient({ children }: { children?: ReactNode }) {
  return <RouteGlobe>{children}</RouteGlobe>;
}
