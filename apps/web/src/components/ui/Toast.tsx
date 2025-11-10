/**
 * Toast Component
 *
 * A notification toast for success/error messages
 */

import { useEffect } from 'react';

interface ToastProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  type?: 'success' | 'error';
  duration?: number;
}

export function Toast({
  isOpen,
  onClose,
  message,
  type = 'success',
  duration = 3000,
}: ToastProps) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose, duration]);

  if (!isOpen) return null;

  const bgColor = type === 'success' ? 'bg-green-600' : 'bg-red-600';

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in">
      <div className={`${bgColor} text-white px-6 py-4 rounded-lg shadow-lg max-w-md flex items-center gap-3`}>
        <span className="text-2xl">
          {type === 'success' ? '✓' : '✕'}
        </span>
        <p className="font-medium">{message}</p>
        <button
          onClick={onClose}
          className="ml-4 text-white hover:text-gray-200 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

