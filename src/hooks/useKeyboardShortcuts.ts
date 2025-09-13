import { useEffect, useCallback } from 'react';

interface KeyboardShortcuts {
  // Basic navigation
  onSpace?: () => void; // Play/Pause
  onEnter?: () => void; // Confirm/Submit
  onEscape?: () => void; // Close/Cancel
  
  // Match controls
  onKeyS?: () => void; // Start/Stop match
  onKeyR?: () => void; // Reset match
  onKeyP?: () => void; // Pause/Resume match
  onKeyF?: () => void; // Full-time
  onKeyH?: () => void; // Half-time
  
  // Event logging
  onKeyL?: () => void; // Log event
  onKeyG?: () => void; // Goal
  onKeyY?: () => void; // Yellow card
  onKeyRed?: () => void; // Red card
  onKeySub?: () => void; // Substitution
  onKeyInj?: () => void; // Injury
  
  // Navigation
  onKeyN?: () => void; // New match
  onKeyE?: () => void; // Edit event
  onKeyD?: () => void; // Delete event
  onKeyU?: () => void; // Undo last event
  onKeyM?: () => void; // Match selector
  
  // Special functions
  onKeyC?: () => void; // Clear/Cancel
  onKeyV?: () => void; // View reports
  onKeyW?: () => void; // Post-match wrap-up
  onKeyO?: () => void; // Open settings
  
  // Number keys for quick actions
  onNumber?: (num: number) => void;
  
  // Modifier key combinations
  onCtrlS?: () => void; // Save
  onCtrlZ?: () => void; // Undo
  onCtrlY?: () => void; // Redo
  onCtrlN?: () => void; // New
  onCtrlO?: () => void; // Open
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcuts, deps: any[] = []) => {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore if typing in an input field
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      (e.target as HTMLElement).contentEditable === 'true'
    ) {
      return;
    }

    // Handle Ctrl/Cmd combinations
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 's':
        case 'S':
          e.preventDefault();
          shortcuts.onCtrlS?.();
          return;
        case 'z':
        case 'Z':
          e.preventDefault();
          shortcuts.onCtrlZ?.();
          return;
        case 'y':
        case 'Y':
          e.preventDefault();
          shortcuts.onCtrlY?.();
          return;
        case 'n':
        case 'N':
          e.preventDefault();
          shortcuts.onCtrlN?.();
          return;
        case 'o':
        case 'O':
          e.preventDefault();
          shortcuts.onCtrlO?.();
          return;
      }
      return;
    }

    // Handle regular keys
    switch (e.key) {
      case ' ':
        e.preventDefault();
        shortcuts.onSpace?.();
        break;
      case 'Enter':
        e.preventDefault();
        shortcuts.onEnter?.();
        break;
      case 'Escape':
        e.preventDefault();
        shortcuts.onEscape?.();
        break;
      case 's':
      case 'S':
        e.preventDefault();
        shortcuts.onKeyS?.();
        break;
      case 'r':
      case 'R':
        e.preventDefault();
        shortcuts.onKeyR?.();
        break;
      case 'p':
      case 'P':
        e.preventDefault();
        shortcuts.onKeyP?.();
        break;
      case 'f':
      case 'F':
        e.preventDefault();
        shortcuts.onKeyF?.();
        break;
      case 'h':
      case 'H':
        e.preventDefault();
        shortcuts.onKeyH?.();
        break;
      case 'l':
      case 'L':
        e.preventDefault();
        shortcuts.onKeyL?.();
        break;
      case 'g':
      case 'G':
        e.preventDefault();
        shortcuts.onKeyG?.();
        break;
      case 'y':
      case 'Y':
        e.preventDefault();
        shortcuts.onKeyY?.();
        break;
      case 'n':
      case 'N':
        e.preventDefault();
        shortcuts.onKeyN?.();
        break;
      case 'e':
      case 'E':
        e.preventDefault();
        shortcuts.onKeyE?.();
        break;
      case 'd':
      case 'D':
        e.preventDefault();
        shortcuts.onKeyD?.();
        break;
      case 'u':
      case 'U':
        e.preventDefault();
        shortcuts.onKeyU?.();
        break;
      case 'c':
      case 'C':
        e.preventDefault();
        shortcuts.onKeyC?.();
        break;
      case 'v':
      case 'V':
        e.preventDefault();
        shortcuts.onKeyV?.();
        break;
      case 'w':
      case 'W':
        e.preventDefault();
        shortcuts.onKeyW?.();
        break;
      case 'o':
      case 'O':
        e.preventDefault();
        shortcuts.onKeyO?.();
        break;
      case 'm':
      case 'M':
        e.preventDefault();
        shortcuts.onKeyM?.();
        break;
      default:
        // Handle number keys 0-9
        if (/^[0-9]$/.test(e.key)) {
          e.preventDefault();
          shortcuts.onNumber?.(parseInt(e.key));
        }
        break;
    }
  }, [shortcuts, ...deps]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};