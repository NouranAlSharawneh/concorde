"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const TweakPanel = dynamic(() => import("./TweakPanel"), { ssr: false });

/** Mounts the tweak panel only while the URL hash is `#tweaks` (code-split, zero cost otherwise). */
export function TweakGate() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const check = () => setOpen(window.location.hash === "#tweaks");
    check();
    window.addEventListener("hashchange", check);
    return () => window.removeEventListener("hashchange", check);
  }, []);
  return open ? <TweakPanel /> : null;
}
