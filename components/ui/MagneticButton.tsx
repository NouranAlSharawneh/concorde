"use client";

import { useRef, type ReactNode, type MouseEvent } from "react";
import { gsap } from "@/lib/gsap";

interface Props {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  strength?: number;
  ariaLabel?: string;
}

/** Button that leans toward the cursor (GSAP quickTo). Renders an <a> when href is given. */
export function MagneticButton({ children, href, onClick, className = "btn", strength = 0.35, ariaLabel }: Props) {
  const ref = useRef<HTMLElement>(null);
  const inner = useRef<HTMLSpanElement>(null);

  const move = (e: MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) * strength;
    const y = (e.clientY - (r.top + r.height / 2)) * strength;
    gsap.to(el, { x, y, duration: 0.6, ease: "power3.out" });
    gsap.to(inner.current, { x: x * 0.4, y: y * 0.4, duration: 0.6, ease: "power3.out" });
  };
  const leave = () => {
    gsap.to([ref.current, inner.current], { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.4)" });
  };

  const content = (
    <span ref={inner} className="inline-flex items-center gap-3 will-change-transform">
      {children}
    </span>
  );

  if (href) {
    return (
      <a ref={ref as React.RefObject<HTMLAnchorElement>} href={href} className={className} onMouseMove={move} onMouseLeave={leave} aria-label={ariaLabel} data-cursor="hover">
        {content}
      </a>
    );
  }
  return (
    <button ref={ref as React.RefObject<HTMLButtonElement>} type="button" className={className} onClick={onClick} onMouseMove={move} onMouseLeave={leave} aria-label={ariaLabel} data-cursor="hover">
      {content}
    </button>
  );
}
