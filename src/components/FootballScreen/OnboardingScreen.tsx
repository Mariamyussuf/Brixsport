import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { markOnboardingCompleted } from '@/utils/onboarding';

const steps = [
  {
    headline: 'Stay in the Game – Always!',
    subtitle: 'Never miss a match or goal again. Your one-stop hub for all Brixcity sports – from live scores to team updates and competition info',
  },
  {
    headline: 'Everything You Need in One Place',
    subtitle: 'Track inter-school competitions,  follow your favorite teams & players, view lineups and game schedules all in real time',
  },
  {
    headline: 'All Your Teams, One Place',
    subtitle: 'Follow your favorite teams, view schedules, and stay connected with the campus sports community.',
  },
];

export const OnboardingScreen: React.FC<{ onFinish?: () => void; userName?: string }> = ({ onFinish, userName }) => {
  const [step, setStep] = useState(0);
  const [liveMsg, setLiveMsg] = useState('');
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const totalSteps = steps.length;

  // Focus management: focus headline on step change
  useEffect(() => {
    headlineRef.current?.focus();
    setLiveMsg(`Step ${step + 1} of ${totalSteps}`);
  }, [step, totalSteps]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        if (step < totalSteps - 1) setStep(step + 1);
        else if (onFinish) onFinish();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (step > 0) setStep(step - 1);
      } else if (e.key === 'Escape') {
        if (onFinish) onFinish();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [step, totalSteps, onFinish]);

  const current = steps[step];

  // Button text - show "Get Started" on the first screen too
  const buttonText = "Get Started";

  // Skip button
  const handleSkip = () => {
    // Mark onboarding as completed
    markOnboardingCompleted();
    if (onFinish) onFinish();
  };

  // Progress dot click
  const handleDotClick = (i: number) => {
    setStep(i);
    setLiveMsg(`Step ${i + 1} of ${totalSteps}`);
  };

  // Animate button feedback
  const [btnPressed, setBtnPressed] = useState(false);

  // Handle finish
  const handleFinish = () => {
    // Mark onboarding as completed
    markOnboardingCompleted();
    if (onFinish) onFinish();
  };

  return (
    <div className="relative z-10 w-full flex flex-col min-h-screen justify-between px-0 pt-0 pb-8 sm:pb-10 items-center max-w-5xl mx-auto">
      {/* Skip button - top right */}
      {step < totalSteps - 1 && (
        <div className="absolute top-0 right-0 p-3 sm:p-4 md:p-5 z-50">
          <button
            className="text-white text-xs sm:text-sm md:text-base font-medium px-3 py-1 md:px-4 md:py-1.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/30 hover:bg-black/60 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-md"
            onClick={handleSkip}
            aria-label="Skip onboarding"
          >
            Skip
          </button>
        </div>
      )}
      
      {/* ARIA live region */}
      <div className="sr-only" aria-live="polite">{liveMsg}</div>
      
      <div className="w-full px-6 mt-16 sm:mt-20 md:mt-24 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.h1
            key={step}
            ref={headlineRef}
            tabIndex={-1}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold mb-3 md:mb-4 text-white text-center w-full max-w-3xl mx-auto outline-none leading-tight"
            aria-level={1}
            role="heading"
          >
            {userName ? `Hi ${userName}, ` : ''}<span className="inline-block">{current.headline}</span>
          </motion.h1>
        </AnimatePresence>
        
        {/* Subtitle */}
        <motion.p
          key={step + '-subtitle'}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-base sm:text-lg md:text-xl mb-6 text-gray-300 max-w-2xl w-full text-center mx-auto"
        >
          {current.subtitle}
        </motion.p>
      </div>
      
      <div className="w-full px-6 mb-8">
        {/* Progress Dots */}
        <div className="flex gap-3 mb-6 justify-center" role="tablist" aria-label="Onboarding steps">
          {steps.map((_, i) => (
            <motion.button
              key={i}
              type="button"
              className={`w-3 h-3 md:w-4 md:h-4 rounded-full transition-all duration-200 focus:outline-none ${i === step ? 'bg-white scale-110' : 'bg-gray-500/60'}`}
              aria-label={`Go to step ${i + 1}`}
              aria-current={i === step ? 'step' : undefined}
              onClick={() => handleDotClick(i)}
              whileTap={{ scale: 1.2 }}
            />
          ))}
        </div>
        
        {/* Next/Get Started Button */}
        <div className="mt-4 flex flex-col items-center w-full">
          <motion.button
            className="w-full max-w-md md:max-w-lg py-3 md:py-4 rounded-full bg-white/20 backdrop-blur-sm border border-white/60 text-white text-lg md:text-xl font-semibold mb-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all hover:bg-white/30 shadow-md hover:shadow-lg active:scale-98"
            onClick={() => {
              setBtnPressed(true);
              setTimeout(() => setBtnPressed(false), 120);
              if (step < totalSteps - 1) setStep(step + 1);
              else handleFinish();
            }}
            aria-label={buttonText}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {buttonText}
          </motion.button>
        </div>
        
        {/* Language selector placeholder */}
        <div className="mt-3 text-xs text-gray-400 text-center opacity-70">
          Language: English (more soon)
        </div>
      </div>
    </div>
  );
};