'use client';

import { useEffect, useRef, useState, useCallback, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ProgressiveSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  as?: keyof React.JSX.IntrinsicElements;
  id?: string;
}

/**
 * Progressive Section Animation Component
 *
 * Modern, performance-optimized scroll-triggered animation wrapper.
 * Uses Intersection Observer API for efficient scroll detection.
 *
 * Features:
 * - Progressive fade-in with slide-up animation
 * - Configurable delays for staggered effects
 * - Hardware-accelerated transforms
 * - Respects prefers-reduced-motion
 * - Memory-efficient with proper cleanup
 *
 * @example
 * <ProgressiveSection delay={100} duration={800}>
 *   <YourContent />
 * </ProgressiveSection>
 */
export function ProgressiveSection({
  children,
  className,
  delay = 0,
  duration = 800,
  threshold = 0.1,
  rootMargin = '0px 0px -10% 0px',
  triggerOnce = true,
  as: Component = 'section',
  id,
}: ProgressiveSectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;

      if (entry.isIntersecting && !hasAnimated) {
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
      // If triggerOnce is true and we've already animated, keep it visible
      // This prevents flicker when scrolling up and element re-enters viewport
      if (triggerOnce && hasAnimated && entry.isIntersecting) {
        setIsVisible(true);
      }
    },
    [hasAnimated, triggerOnce, delay]
  );

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsVisible(true);
      setHasAnimated(true);
      return;
    }

    // Create intersection observer
    observerRef.current = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin,
    });

    observerRef.current.observe(element);

    // Immediately check initial intersection state to prevent flicker
    // This handles cases where element is already visible on mount or when scrolling up
    const checkInitialIntersection = () => {
      if (!element || hasAnimated) return;

      // Use a synchronous check with getBoundingClientRect
      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      // Simple viewport intersection check (accounts for rootMargin being negative bottom)
      const isIntersecting =
        rect.top < viewportHeight && rect.bottom > 0 && rect.left < viewportWidth && rect.right > 0;

      if (isIntersecting) {
        // Element is already in viewport, make it visible immediately
        if (delay > 0) {
          setTimeout(() => {
            setIsVisible(true);
            setHasAnimated(true);
          }, delay);
        } else {
          setIsVisible(true);
          setHasAnimated(true);
        }
      }
    };

    // Check immediately and also after a frame to catch any edge cases
    checkInitialIntersection();
    requestAnimationFrame(checkInitialIntersection);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [handleIntersection, threshold, rootMargin, hasAnimated, delay]);

  const computedClassName = cn(
    'transition-all ease-out',
    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
    className
  );

  // Type assertion to avoid complex union type inference
  const ComponentWithRef = Component as any;

  return (
    <ComponentWithRef
      ref={elementRef}
      id={id}
      className={computedClassName}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: isVisible ? `${delay}ms` : '0ms',
        willChange: isVisible ? 'auto' : 'transform, opacity',
        transform: 'translateZ(0)', // Hardware acceleration
        backfaceVisibility: 'hidden',
      }}
    >
      {children}
    </ComponentWithRef>
  );
}

/**
 * Progressive Container for staggered child animations
 * Useful for grids, lists, and card layouts
 */
interface ProgressiveContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  threshold?: number;
  rootMargin?: string;
  as?: keyof React.JSX.IntrinsicElements;
}

export function ProgressiveContainer({
  children,
  className,
  staggerDelay = 100,
  threshold = 0.1,
  rootMargin = '0px 0px -10% 0px',
  as: Component = 'div',
}: ProgressiveContainerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
  const containerRef = useRef<HTMLElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const itemCount = Array.isArray(children) ? children.length : 1;

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;

      if (entry.isIntersecting && !isVisible) {
        setIsVisible(true);
        // Stagger the animation for each child
        for (let i = 0; i < itemCount; i++) {
          setTimeout(() => {
            setVisibleItems((prev) => new Set([...prev, i]));
          }, i * staggerDelay);
        }
      }
    },
    [isVisible, itemCount, staggerDelay]
  );

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsVisible(true);
      // Make all items visible immediately
      const allIndices = new Set(Array.from({ length: itemCount }, (_, i) => i));
      setVisibleItems(allIndices);
      return;
    }

    observerRef.current = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin,
    });

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [handleIntersection, threshold, rootMargin, itemCount]);

  // Type assertion to avoid complex union type inference
  const ComponentWithRef = Component as any;

  return (
    <ComponentWithRef
      ref={containerRef}
      className={className}
      style={{
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
      }}
    >
      {Array.isArray(children)
        ? children.map((child, index) => (
            <div
              key={index}
              className="transition-all ease-out"
              style={{
                opacity: visibleItems.has(index) ? 1 : 0,
                transform: visibleItems.has(index) ? 'translateY(0)' : 'translateY(20px)',
                transitionDuration: '600ms',
                transitionDelay: `${index * staggerDelay}ms`,
                willChange: visibleItems.has(index) ? 'auto' : 'transform, opacity',
              }}
            >
              {child}
            </div>
          ))
        : children}
    </ComponentWithRef>
  );
}
