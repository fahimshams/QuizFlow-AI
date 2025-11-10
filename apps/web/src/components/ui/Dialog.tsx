/**
 * Dialog Component
 *
 * A modal dialog for confirmations and messages
 */

import { ReactNode } from 'react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
}

export function Dialog({
  isOpen,
  onClose,
  title,
  children,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmButtonClass = 'bg-primary-600 hover:bg-primary-700',
}: DialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 z-10 animate-fade-in">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {title}
        </h3>

        <div className="text-gray-600 mb-6">
          {children}
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md font-medium transition-colors"
          >
            {cancelText}
          </button>
          {onConfirm && (
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-white rounded-md font-medium transition-colors ${confirmButtonClass}`}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

