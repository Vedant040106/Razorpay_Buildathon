import React, { useEffect, useRef, useState } from 'react';

/**
 * AnimatedCounter counts smoothly from 0 to a target number when scrolled into view.
 * Respects prefers-reduced-motion and avoids layout thrashing.
 */
export function AnimatedCounter({
  target,
  duration = 1200,
  prefix = '',
  suffix = '',
  decimals = 0
}) {
  const [current, setCurrent] = useState(0);
  const elementRef = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    // Immediate fallback if user prefers reduced motion
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motionQuery.matches) {
      setCurrent(target);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const startTime = performance.now();

          const updateCounter = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease-out cubic curve: 1 - (1 - t)^3
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const value = easeOut * target;

            setCurrent(value);

            if (progress < 1) {
              requestAnimationFrame(updateCounter);
            } else {
              setCurrent(target);
            }
          };

          requestAnimationFrame(updateCounter);
          if (elementRef.current) observer.unobserve(elementRef.current);
        }
      },
      { threshold: 0.2 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [target, duration]);

  const formatted = decimals > 0 
    ? current.toFixed(decimals) 
    : Math.floor(current).toLocaleString('en-IN');

  return (
    <span ref={elementRef} className="tabular-nums">
      {prefix}{formatted}{suffix}
    </span>
  );
}
