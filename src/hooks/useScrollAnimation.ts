'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface UseScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  delay?: number;
  duration?: number;
}

interface ScrollAnimationState {
  isVisible: boolean;
  hasAnimated: boolean;
  elementRef: React.RefObject<HTMLElement>;
}

/**
 * Performance-optimized scroll animation hook using Intersection Observer
 * Features:
 * - Lazy loading with intersection observer
 * - Throttled scroll events for performance
 * - Memory cleanup
 * - Configurable animation options
 */
export function useScrollAnimation(options: UseScrollAnimationOptions = {}): ScrollAnimationState {
  const {
    threshold = 0.1,
    rootMargin = '0px 0px -50px 0px',
    triggerOnce = true,
    delay = 0,
    duration = 600,
  } = options;

  const elementRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;

      if (entry.isIntersecting && !hasAnimated) {
        // Apply delay if specified
        if (delay > 0) {
          setTimeout(() => {
            setIsVisible(true);
            setHasAnimated(true);
          }, delay);
        } else {
          setIsVisible(true);
          setHasAnimated(true);
        }
      } else if (!triggerOnce && !entry.isIntersecting) {
        setIsVisible(false);
      }
    },
    [hasAnimated, triggerOnce, delay]
  );

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Create intersection observer with performance optimizations
    observerRef.current = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin,
      // Use passive: true for better performance
    });

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [handleIntersection, threshold, rootMargin]);

  return {
    isVisible,
    hasAnimated,
    elementRef: elementRef as React.RefObject<HTMLElement>,
  } as ScrollAnimationState;
}

/**
 * Hook for staggered animations (useful for lists/grids)
 */
export function useStaggeredAnimation(
  itemCount: number,
  staggerDelay: number = 100,
  options: UseScrollAnimationOptions = {}
) {
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
  const containerRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  const { isVisible, hasAnimated, elementRef } = useScrollAnimation(options);

  useEffect(() => {
    if (isVisible && !hasAnimated) {
      // Stagger the animation for each item
      for (let i = 0; i < itemCount; i++) {
        setTimeout(() => {
          setVisibleItems((prev) => new Set([...prev, i]));
        }, i * staggerDelay);
      }
    }
  }, [isVisible, hasAnimated, itemCount, staggerDelay]);

  const setItemRef = useCallback(
    (index: number) => (el: HTMLElement | null) => {
      itemRefs.current[index] = el;
    },
    []
  );

  return {
    containerRef: elementRef,
    isVisible,
    hasAnimated,
    visibleItems,
    setItemRef,
  };
}

/**
 * Performance-optimized scroll position hook
 * Uses throttling to prevent excessive re-renders
 */
export function useScrollPosition(throttleMs: number = 100) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('down');
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  const updateScrollPosition = useCallback(() => {
    const currentScrollY = window.scrollY;

    setScrollPosition(currentScrollY);
    setScrollDirection(currentScrollY > lastScrollY.current ? 'down' : 'up');
    lastScrollY.current = currentScrollY;
    ticking.current = false;
  }, []);

  const handleScroll = useCallback(() => {
    if (!ticking.current) {
      requestAnimationFrame(updateScrollPosition);
      ticking.current = true;
    }
  }, [updateScrollPosition]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  return { scrollPosition, scrollDirection };
}
