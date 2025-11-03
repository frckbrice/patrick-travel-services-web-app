'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Performance optimization component for scroll animations
 * Implements various performance optimizations:
 * - Reduced motion support
 * - GPU acceleration hints
 * - Memory cleanup
 * - Throttled scroll events
 */
export function ScrollOptimizer() {
  const cleanupRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      // Disable animations for users who prefer reduced motion
      document.documentElement.style.setProperty('--animation-duration', '0ms');
      document.documentElement.style.setProperty('--animation-delay', '0ms');
    }

    // Add performance hints to CSS
    const style = document.createElement('style');
    style.textContent = `
      /* Performance optimizations for scroll animations */
      .will-change-transform {
        will-change: transform, opacity;
      }
      
      .will-change-auto {
        will-change: auto;
      }
      
      /* GPU acceleration for smooth animations */
      .gpu-accelerated {
        transform: translateZ(0);
        backface-visibility: hidden;
        perspective: 1000px;
      }

      /* Optimize for mobile devices */
      @media (max-width: 768px) {
        .scroll-animation {
          transition-duration: 0.3s !important;
        }
      }

      /* Reduce animations on low-end devices */
      @media (prefers-reduced-motion: reduce) {
        .scroll-animation {
          transition: none !important;
          animation: none !important;
        }
      }
    `;

    document.head.appendChild(style);
    cleanupRef.current.push(() => document.head.removeChild(style));

    // Throttle scroll events for better performance
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          // Update scroll-based animations here if needed
          ticking = false;
        });
        ticking = true;
      }
    };

    // Use passive event listeners for better performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    cleanupRef.current.push(() => window.removeEventListener('scroll', handleScroll));

    // Cleanup function
    return () => {
      cleanupRef.current.forEach((cleanup) => cleanup());
    };
  }, []);

  return null;
}

/**
 * Hook for managing animation performance
 */
export function useAnimationPerformance() {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementsRef = useRef<Set<Element>>(new Set());

  const observeElement = (element: Element) => {
    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              // Add GPU acceleration when element is visible
              entry.target.classList.add('gpu-accelerated');
            } else {
              // Remove GPU acceleration when element is not visible
              entry.target.classList.remove('gpu-accelerated');
            }
          });
        },
        {
          threshold: 0.1,
          rootMargin: '0px 0px -50px 0px',
        }
      );
    }

    observerRef.current.observe(element);
    elementsRef.current.add(element);
  };

  const unobserveElement = (element: Element) => {
    if (observerRef.current) {
      observerRef.current.unobserve(element);
      elementsRef.current.delete(element);
    }
  };

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return { observeElement, unobserveElement };
}

/**
 * Component for lazy loading images with scroll animations
 */
interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

export function LazyImage({ src, alt, className, sizes, priority = false }: LazyImageProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(img);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
      }
    );

    observer.observe(img);

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!isLoaded && <div className="absolute inset-0 bg-muted animate-pulse" />}
      <img
        ref={imgRef}
        src={isInView || priority ? src : undefined}
        alt={alt}
        sizes={sizes}
        onLoad={handleLoad}
        className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        loading={priority ? 'eager' : 'lazy'}
      />
    </div>
  );
}
