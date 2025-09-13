import { useState, useEffect } from 'react';
import { ScrollDetectionOptions, ScrollDetectionResult } from '@/types/scrollDetection';

export const useScrollDetection = ({
  shrinkThreshold = 50,
  expandThreshold = 20
}: ScrollDetectionOptions = {}): ScrollDetectionResult => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    let ticking = false;

    const updateScrollState = () => {
      const scrollY = window.scrollY;
      
      // Determine scroll direction
      if (scrollY > lastScrollY) {
        setScrollDirection('down');
      } else if (scrollY < lastScrollY) {
        setScrollDirection('up');
      }
      
      // Update scrolled state based on thresholds
      if (scrollY > shrinkThreshold && !isScrolled) {
        setIsScrolled(true);
      } else if (scrollY < expandThreshold && isScrolled) {
        setIsScrolled(false);
      }
      
      setLastScrollY(scrollY);
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollState);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, [isScrolled, lastScrollY, shrinkThreshold, expandThreshold]);

  return { isScrolled, scrollDirection };
};