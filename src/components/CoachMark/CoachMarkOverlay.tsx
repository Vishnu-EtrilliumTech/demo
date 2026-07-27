'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CoachMarkStep } from '@/contexts/CoachMarkContext';
import styles from './CoachMark.module.css';

interface CoachMarkOverlayProps {
  step: CoachMarkStep;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const CoachMarkOverlay: React.FC<CoachMarkOverlayProps> = ({
  step,
  currentStep,
  totalSteps,
  onNext,
  onSkip,
}) => {
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    const updatePosition = () => {
      const target = document.querySelector(step.target);
      if (!target) return;

      const rect = target.getBoundingClientRect();
      const padding = step.padding ?? 8;

      setTargetRect({
        top: rect.top - padding + window.scrollY,
        left: rect.left - padding + window.scrollX,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      });

      // Scroll target into view if needed
      const viewportHeight = window.innerHeight;
      const viewportTop = window.scrollY;
      const viewportBottom = viewportTop + viewportHeight;
      const elementTop = rect.top + window.scrollY;
      const elementBottom = elementTop + rect.height;

      if (elementTop < viewportTop + 100 || elementBottom > viewportBottom - 100) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    // Initial position update
    updatePosition();

    // Update on scroll/resize
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [step]);

  useEffect(() => {
    if (!targetRect || !tooltipRef.current) return;

    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const padding = 16;
    const offset = 12;

    let top = 0;
    let left = 0;

    const position = step.position || 'bottom';

    // Calculate initial position based on preference
    switch (position) {
      case 'top':
        top = targetRect.top - tooltipRect.height - offset;
        left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
        break;
      case 'bottom':
        top = targetRect.top + targetRect.height + offset;
        left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
        break;
      case 'left':
        top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
        left = targetRect.left - tooltipRect.width - offset;
        break;
      case 'right':
        top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
        left = targetRect.left + targetRect.width + offset;
        break;
    }

    // Ensure tooltip stays within viewport
    if (left < padding) left = padding;
    if (left + tooltipRect.width > viewportWidth - padding) {
      left = viewportWidth - tooltipRect.width - padding;
    }
    if (top < padding + window.scrollY) top = padding + window.scrollY;
    if (top + tooltipRect.height > viewportHeight + window.scrollY - padding) {
      // If bottom doesn't fit, try top
      if (position === 'bottom') {
        top = targetRect.top - tooltipRect.height - offset;
      }
    }

    setTooltipPosition({ top, left });
  }, [targetRect, step.position]);

  const isLastStep = currentStep === totalSteps - 1;

  if (!mounted || !targetRect) return null;

  const overlay = (
    <div className={styles.overlay}>
      {/* SVG overlay with spotlight cutout */}
      <svg className={styles.svgOverlay}>
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={targetRect.left}
              y={targetRect.top}
              width={targetRect.width}
              height={targetRect.height}
              rx="8"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.6)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* Spotlight border */}
      <div
        className={styles.spotlight}
        style={{
          top: targetRect.top,
          left: targetRect.left,
          width: targetRect.width,
          height: targetRect.height,
        }}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className={styles.tooltip}
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
      >
        <div className={styles.tooltipContent}>
          <h3 className={styles.tooltipTitle}>{step.title}</h3>
          <p className={styles.tooltipMessage}>{step.message}</p>
        </div>

        <div className={styles.tooltipFooter}>
          <span className={styles.stepIndicator}>
            {currentStep + 1} of {totalSteps}
          </span>
          <div className={styles.tooltipButtons}>
            <button className={styles.skipButton} onClick={onSkip}>
              Skip
            </button>
            <button className={styles.nextButton} onClick={onNext}>
              {isLastStep ? 'Done' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
};
