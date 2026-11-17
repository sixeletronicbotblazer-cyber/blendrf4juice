"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Adds the `is-visible` class to the element when it scrolls into view,
 * mirroring the IntersectionObserver behaviour from the original site.js.
 * Respects prefers-reduced-motion by revealing immediately.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      // reveal immediately for reduced motion / no IO support
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px 110px 0px", threshold: 0.04 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

/**
 * Counts a number up from 0 to its final value once the element enters view.
 * Mirrors the animateCount + countObserver logic from site.js.
 * Returns a callback ref so it can attach cleanly to any element.
 */
export function useCountUp(target: number, finalLabel: string) {
  const [display, setDisplay] = useState("0");
  const started = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const setRef = useCallback(
    (el: HTMLElement | null) => {
      // tear down any previous observer
      observerRef.current?.disconnect();
      observerRef.current = null;
      if (!el) return;
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      if (reduce || !("IntersectionObserver" in window)) {
        setDisplay(finalLabel);
        return;
      }
      const formatter = new Intl.NumberFormat("en-US");
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !started.current) {
              started.current = true;
              const duration = 1400;
              let startTime: number | null = null;
              const frame = (now: number) => {
                startTime ??= now;
                const progress = Math.max(
                  0,
                  Math.min((now - startTime) / duration, 1)
                );
                const eased = 1 - Math.pow(1 - progress, 3);
                setDisplay(
                  progress === 1
                    ? finalLabel
                    : formatter.format(Math.floor(target * eased))
                );
                if (progress < 1) requestAnimationFrame(frame);
              };
              requestAnimationFrame(frame);
              observer.disconnect();
            }
          });
        },
        { threshold: 0.35 }
      );
      observer.observe(el);
      observerRef.current = observer;
    },
    [target, finalLabel]
  );

  useEffect(() => () => observerRef.current?.disconnect(), []);

  return [setRef, display] as const;
}
