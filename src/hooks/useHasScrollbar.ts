import { useState, useEffect } from "react";

export function useHasScrollbar() {
  const [hasScrollbar, setHasScrollbar] = useState(false);

  useEffect(() => {
    const getTarget = (): HTMLElement =>
      (document.querySelector("main") as HTMLElement) ?? document.documentElement;

    let rafId: number;

    const check = () => {
      const target = getTarget();
      setHasScrollbar(target.scrollHeight > target.clientHeight);
    };

    const scheduleCheck = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(check);
    };

    scheduleCheck();

    const observer = new ResizeObserver(scheduleCheck);
    const target = getTarget();
    if (target) observer.observe(target);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, []);

  return hasScrollbar;
}
