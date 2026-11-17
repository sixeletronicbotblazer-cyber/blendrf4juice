"use client";

import { createElement, type ElementType, type ReactNode } from "react";
import { useReveal } from "./use-reveal";

type RevealProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  id?: string;
  "aria-labelledby"?: string;
  style?: React.CSSProperties;
};

/**
 * Wraps content so it fades + lifts in on scroll, matching the
 * `.js .reveal` / `.is-visible` pattern from the original site.css.
 */
export function Reveal({
  children,
  as,
  className = "",
  ...rest
}: RevealProps) {
  const Tag = (as ?? "div") as ElementType;
  const { ref, visible } = useReveal<HTMLElement>();
  return createElement(
    Tag,
    {
      ref,
      className: `reveal ${visible ? "is-visible" : ""} ${className}`.trim(),
      ...rest,
    },
    children
  );
}
