import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to animate numbers from 0 to target value when visible in viewport.
 * Handles strings like "38,500+", "650+", "34+", "28+" gracefully.
 */
export function useCountUp(targetString, duration = 1800) {
  const [displayValue, setDisplayValue] = useState('0');
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setDisplayValue(targetString);
      return;
    }

    // Extract numeric part and affixes (e.g., "38,500+" -> number: 38500, suffix: "+")
    const match = String(targetString).match(/([0-9,.]+)/);
    if (!match) {
      setDisplayValue(targetString);
      return;
    }

    const rawNumStr = match[1].replace(/,/g, '');
    const targetNum = parseFloat(rawNumStr);
    if (isNaN(targetNum)) {
      setDisplayValue(targetString);
      return;
    }

    const prefix = targetString.slice(0, match.index);
    const suffix = targetString.slice(match.index + match[1].length);

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const startTime = performance.now();

          const updateCounter = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic curve: 1 - Math.pow(1 - progress, 3)
            const easeOutProgress = 1 - Math.pow(1 - progress, 3);
            const currentNum = Math.floor(easeOutProgress * targetNum);

            // Format with commas if target had commas
            const formattedNum = match[1].includes(',')
              ? currentNum.toLocaleString('en-IN')
              : currentNum.toString();

            setDisplayValue(`${prefix}${formattedNum}${suffix}`);

            if (progress < 1) {
              requestAnimationFrame(updateCounter);
            } else {
              setDisplayValue(targetString);
            }
          };

          requestAnimationFrame(updateCounter);
        }
      },
      { threshold: 0.2 }
    );

    const currentEl = elementRef.current;
    if (currentEl) {
      observer.observe(currentEl);
    }

    return () => {
      if (currentEl) {
        observer.unobserve(currentEl);
      }
    };
  }, [targetString, duration, hasAnimated]);

  return { elementRef, displayValue };
}
