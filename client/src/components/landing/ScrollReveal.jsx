import React, { useEffect, useRef, useState } from 'react';

/**
 * ScrollReveal component using Intersection Observer for lightweight,
 * hardware-accelerated scroll animations without heavy external libraries.
 * Fully supports prefers-reduced-motion for accessibility.
 */
export function ScrollReveal({
  children,
  animation = 'fade-up', // 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'fade' | 'scale'
  delay = 0,
  duration = 600,
  threshold = 0.15,
  once = true,
  className = '',
  style = {}
}) {
  const elementRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check user preference for reduced motion
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motionQuery.matches) {
      setPrefersReducedMotion(true);
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once && elementRef.current) {
            observer.unobserve(elementRef.current);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -40px 0px'
      }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [threshold, once]);

  if (prefersReducedMotion) {
    return (
      <div ref={elementRef} className={className} style={style}>
        {children}
      </div>
    );
  }

  // Calculate transform according to animation preset
  const getInitialTransform = () => {
    switch (animation) {
      case 'fade-up':
        return 'translateY(24px)';
      case 'fade-down':
        return 'translateY(-24px)';
      case 'fade-left':
        return 'translateX(24px)';
      case 'fade-right':
        return 'translateX(-24px)';
      case 'scale':
        return 'scale(0.96)';
      case 'fade':
      default:
        return 'none';
    }
  };

  const animationStyle = {
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'none' : getInitialTransform(),
    transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
    willChange: isVisible ? 'auto' : 'opacity, transform',
    ...style
  };

  return (
    <div ref={elementRef} className={className} style={animationStyle}>
      {children}
    </div>
  );
}
