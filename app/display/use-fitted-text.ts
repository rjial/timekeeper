"use client";

import { useLayoutEffect, useRef, useState } from "react";

/**
 * Sizes text to the box it lives in by measuring a hidden probe set in the same
 * face. The probe carries the widest string the slot can ever hold, so the
 * result is stable for the whole session instead of jumping per frame.
 */
export function useFittedText(sample: string, fill = 1, capRatio = 0.73) {
  const boxRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLSpanElement>(null);
  const [size, setSize] = useState(0);

  useLayoutEffect(() => {
    const box = boxRef.current;
    const probe = probeRef.current;
    if (!box || !probe) return;

    let frame = 0;
    const measure = () => {
      const probeWidth = probe.getBoundingClientRect().width;
      const style = getComputedStyle(box);
      const boxWidth =
        box.clientWidth -
        parseFloat(style.paddingLeft) -
        parseFloat(style.paddingRight);
      const boxHeight =
        box.clientHeight -
        parseFloat(style.paddingTop) -
        parseFloat(style.paddingBottom);
      if (!probeWidth || !boxWidth || !boxHeight) return;
      const byWidth = (boxWidth / probeWidth) * 100;
      const byHeight = (boxHeight * fill) / capRatio;
      setSize(Math.max(12, Math.floor(Math.min(byWidth, byHeight))));
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    const observer = new ResizeObserver(schedule);
    observer.observe(box);
    schedule();
    document.fonts?.ready.then(schedule).catch(() => {});

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [sample, fill, capRatio]);

  return { boxRef, probeRef, size };
}
