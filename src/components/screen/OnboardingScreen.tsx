import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const steps = [
  {
    headline: 'Stay in the Game – Always!',
    subtitle: 'Never miss a match or goal again. Your one-stop hub for all Brix city sports – from live scores to team updates and competition info',
    bg: '/onboarding-bg-1.jpg',
  },
  {
    headline: 'Everything You Need in One Place',
    subtitle: 'Track inter-school competitions,  follow your favorite teams & players, view lineups and game schedules all in real time',
    bg: '/onboarding-bg-2.jpg',
  },
  {
    headline: 'All Your Teams, One Place',
    subtitle: 'Follow your favorite teams, view schedules, and stay connected with the campus sports community.',
    bg: '/onboarding-bg-3.jpg',
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

  // Button text
  const buttonText = step === totalSteps - 1 ? 'Get Started' : 'Next';

  // Skip button
  const handleSkip = () => {
    if (onFinish) onFinish();
  };

  // Progress dot click
  const handleDotClick = (i: number) => {
    setStep(i);
    setLiveMsg(`Step ${i + 1} of ${totalSteps}`);
  };

  // Animate button feedback
  const [btnPressed, setBtnPressed] = useState(false);

  return (
    <div className="relative min-h-screen flex flex-col justify-end items-center text-white bg-black" style={{ background: `url(${current.bg}), #111`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      {/* SVG Logo */}
      <div className="absolute top-10 left-0 right-0 flex justify-center">
        <svg width="180" height="48" viewBox="0 0 180 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="BrixSports logo">
          <text x="0" y="36" fontFamily="'Montserrat',sans-serif" fontWeight="bold" fontSize="36" fill="white">BrixSports</text>
          <circle cx="160" cy="24" r="16" stroke="white" strokeWidth="3" fill="none" />
          <path d="M160 8v32M144 24h32M150 14l20 20M170 14l-20 20" stroke="white" strokeWidth="2" />
        </svg>
      </div>
      {/* Skip button */}
      {step < totalSteps - 1 && (
        <button
          className="absolute top-8 right-6 text-white/80 text-base font-semibold underline focus:outline-none focus:ring-2 focus:ring-blue-400"
          onClick={handleSkip}
          aria-label="Skip onboarding"
        >
          Skip
        </button>
      )}
      {/* Content */}
      <div className="relative z-10 w-full flex flex-col items-center px-6 pb-10 pt-24 min-h-screen justify-end">
        {/* ARIA live region */}
        <div className="sr-only" aria-live="polite">{liveMsg}</div>
        {/* Headline */}
        <AnimatePresence mode="wait">
          <motion.h1
            key={step}
            ref={headlineRef}
            tabIndex={-1}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4 }}
            className="text-3xl sm:text-4xl font-bold mb-4 mt-32 text-left w-full max-w-md mx-auto outline-none"
            aria-level={1}
            role="heading"
          >
            {userName ? `Hi ${userName}, ` : ''}{current.headline}
          </motion.h1>
        </AnimatePresence>
        {/* Subtitle */}
        <motion.p
          key={step + '-subtitle'}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-base sm:text-lg mb-8 text-gray-200 max-w-md w-full mx-auto text-left"
        >
          {current.subtitle}
        </motion.p>
        {/* Progress Dots */}
        <div className="flex gap-2 mb-8" role="tablist" aria-label="Onboarding steps">
          {steps.map((_, i) => (
            <motion.button
              key={i}
              type="button"
              className={`w-8 h-2 rounded-full transition-all duration-200 focus:outline-none ${i === step ? 'bg-white scale-110' : 'bg-gray-500/60'}`}
              aria-label={`Go to step ${i + 1}`}
              aria-current={i === step ? 'step' : undefined}
              onClick={() => handleDotClick(i)}
              whileTap={{ scale: 1.2 }}
            />
          ))}
        </div>
        {/* Next/Get Started Button */}
        <motion.button
          className="w-full max-w-md py-3 rounded-2xl bg-white/10 border-2 border-white text-white text-lg font-semibold mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all hover:bg-white/20"
          onClick={() => {
            setBtnPressed(true);
            setTimeout(() => setBtnPressed(false), 120);
            if (step < totalSteps - 1) setStep(step + 1);
            else if (onFinish) onFinish();
          }}
          aria-label={buttonText}
          whileTap={{ scale: 0.97 }}
          style={{ transform: btnPressed ? 'scale(0.97)' : undefined }}
        >
          {buttonText}
        </motion.button>
        {/* Language selector placeholder */}
        <div className="mt-2 text-xs text-gray-400">Language: English (more soon)</div>
      </div>
    </div>
  );
}; 