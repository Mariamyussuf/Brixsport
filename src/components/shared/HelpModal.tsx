import React, { useState, useCallback, useContext, createContext } from 'react';

interface HelpModalContextType {
  open: () => void;
  close: () => void;
}
const HelpModalContext = createContext<HelpModalContextType | undefined>(undefined);

export const useHelpModal = () => {
  const ctx = useContext(HelpModalContext);
  if (!ctx) throw new Error('useHelpModal must be used within HelpModalProvider');
  return ctx;
};

export const HelpModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const openModal = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => setOpen(false), []);
  return (
    <HelpModalContext.Provider value={{ open: openModal, close: closeModal }}>
      {children}
      {open && <HelpModal onClose={closeModal} />}
    </HelpModalContext.Provider>
  );
};

interface HelpModalProps {
  onClose: () => void;
}

const sportTips = [
  { sport: 'Football', tips: ['Max 11 players per team', 'No duplicate goals in same second', 'Yellow/Red cards for fouls'] },
  { sport: 'Basketball', tips: ['Track field goals, three-pointers, free throws', 'Timeouts and fouls are important'] },
  { sport: 'Track & Field', tips: ['Use timer for races', 'Lap and finish times are critical'] },
  { sport: 'Volleyball', tips: ['Track serves, spikes, blocks, errors'] },
];

const shortcuts = [
  { key: 'Space', action: 'Start/Pause/Resume Timer' },
  { key: 'L', action: 'Lap (Track Timer)' },
  { key: 'F', action: 'Finish (Track Timer)' },
  { key: 'R', action: 'Reset Timer' },
  { key: 'U', action: 'Undo Last Lap/Event' },
  { key: 'Arrow Keys', action: 'Navigate lists/queues' },
];

const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-lg w-full flex flex-col gap-4 relative">
      <button
        type="button"
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-900 text-2xl font-bold"
        aria-label="Close help"
        onClick={onClose}
      >×</button>
      <h2 className="font-bold text-xl mb-2">How to Use the Logger</h2>
      <div className="mb-2">
        <h3 className="font-semibold mb-1">Sport-Specific Tips</h3>
        <ul className="list-disc list-inside space-y-1">
          {sportTips.map((s) => (
            <li key={s.sport} className="mb-1">
              <span className="font-bold">{s.sport}:</span> {s.tips.join('; ')}
            </li>
          ))}
        </ul>
      </div>
      <div className="mb-2">
        <h3 className="font-semibold mb-1">Keyboard Shortcuts</h3>
        <ul className="list-disc list-inside space-y-1">
          {shortcuts.map((s) => (
            <li key={s.key}><span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{s.key}</span> — {s.action}</li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="font-semibold mb-1">Quick Guide</h3>
        <ol className="list-decimal list-inside space-y-1">
          <li>Select the sport and match.</li>
          <li>Choose the team and player (if required).</li>
          <li>Log events using the event buttons.</li>
          <li>Use the timer for track events.</li>
          <li>Review and sync events in the queue.</li>
        </ol>
      </div>
    </div>
  </div>
); 