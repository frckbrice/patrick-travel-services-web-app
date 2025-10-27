'use client';

import React, { ReactNode, forwardRef } from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { cn } from '@/lib/utils';

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  animationType?: 'fadeIn' | 'slideUp' | 'slideLeft' | 'slideRight' | 'scaleIn' | 'stagger';
  delay?: number;
  duration?: number;
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  staggerDelay?: number;
  as?: 'section' | 'div' | 'article' | 'main' | 'aside' | 'header' | 'footer';
  id?: string;
}

/**
 * Performance-optimized animated section component
 * Uses intersection observer for efficient scroll-based animations
 */
export const AnimatedSection = forwardRef<any, AnimatedSectionProps>(
  (
    {
      children,
      className,
      animationType = 'fadeIn',
      delay = 0,
      duration = 600,
      threshold = 0.1,
      rootMargin = '0px 0px -50px 0px',
      triggerOnce = true,
      staggerDelay = 100,
      as: Component = 'section',
      id,
    },
    ref
  ) => {
    const { isVisible, hasAnimated, elementRef } = useScrollAnimation({
      threshold,
      rootMargin,
      triggerOnce,
      delay,
      duration,
    });

    const animationClasses = {
      fadeIn: 'opacity-0 translate-y-4',
      slideUp: 'opacity-0 translate-y-8',
      slideLeft: 'opacity-0 translate-x-8',
      slideRight: 'opacity-0 -translate-x-8',
      scaleIn: 'opacity-0 scale-95',
      stagger: 'opacity-0 translate-y-4',
    };

    const visibleClasses = {
      fadeIn: 'opacity-100 translate-y-0',
      slideUp: 'opacity-100 translate-y-0',
      slideLeft: 'opacity-100 translate-x-0',
      slideRight: 'opacity-100 translate-x-0',
      scaleIn: 'opacity-100 scale-100',
      stagger: 'opacity-100 translate-y-0',
    };

    return (
      <Component
        ref={ref || elementRef}
        id={id}
        className={cn(
          'transition-all ease-out will-change-transform',
          animationClasses[animationType],
          isVisible && visibleClasses[animationType],
          className
        )}
        style={{
          transitionDuration: `${duration}ms`,
          transitionDelay: isVisible ? `${delay}ms` : '0ms',
        }}
      >
        {children}
      </Component>
    );
  }
);

AnimatedSection.displayName = 'AnimatedSection';

/**
 * Staggered animation container for lists/grids
 */
interface StaggeredContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  itemCount?: number;
  threshold?: number;
  rootMargin?: string;
  as?: 'section' | 'div' | 'article' | 'main' | 'aside' | 'header' | 'footer';
}

export const StaggeredContainer = forwardRef<any, StaggeredContainerProps>(
  (
    {
      children,
      className,
      staggerDelay = 100,
      itemCount,
      threshold = 0.1,
      rootMargin = '0px 0px -50px 0px',
      as: Component = 'div',
    },
    ref
  ) => {
    const { isVisible, hasAnimated, elementRef } = useScrollAnimation({
      threshold,
      rootMargin,
      triggerOnce: true,
    });

    return (
      <Component
        ref={ref || elementRef}
        className={cn(
          'transition-all duration-500 ease-out will-change-transform',
          !isVisible && 'opacity-0 translate-y-4',
          isVisible && 'opacity-100 translate-y-0',
          className
        )}
        style={{
          transitionDelay: isVisible ? '0ms' : '0ms',
        }}
      >
        {children}
      </Component>
    );
  }
);

StaggeredContainer.displayName = 'StaggeredContainer';

/**
 * Animated item for staggered containers
 */
interface AnimatedItemProps {
  children: ReactNode;
  index: number;
  className?: string;
  staggerDelay?: number;
  isVisible?: boolean;
  as?: 'section' | 'div' | 'article' | 'main' | 'aside' | 'header' | 'footer';
}

export const AnimatedItem = forwardRef<any, AnimatedItemProps>(
  (
    { children, index, className, staggerDelay = 100, isVisible = false, as: Component = 'div' },
    ref
  ) => {
    const delay = index * staggerDelay;

    return (
      <Component
        ref={ref}
        className={cn(
          'transition-all duration-500 ease-out will-change-transform',
          !isVisible && 'opacity-0 translate-y-4',
          isVisible && 'opacity-100 translate-y-0',
          className
        )}
        style={{
          transitionDelay: isVisible ? `${delay}ms` : '0ms',
        }}
      >
        {children}
      </Component>
    );
  }
);

AnimatedItem.displayName = 'AnimatedItem';
