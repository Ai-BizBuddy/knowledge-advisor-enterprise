'use client';

import { Modal } from 'flowbite-react';
import type { FC, ReactNode } from 'react';

export interface BaseModalProps {
  show: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';
  children?: ReactNode;
  footer?: ReactNode;
  bodyClassName?: string;
  headerClassName?: string;
  footerClassName?: string;
}

/**
 * BaseModal wraps Flowbite Modal but applies our existing design classes
 * (rounded, borders, dark theme) to keep visual parity while standardizing API.
 */
export const BaseModal: FC<BaseModalProps> = ({
  show,
  onClose,
  title,
  description,
  size = 'xl',
  children,
  footer,
  bodyClassName = 'max-h-[60vh] overflow-y-auto px-6 py-5',
  headerClassName = 'flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700',
  footerClassName = 'flex items-center justify-between border-t border-gray-200 px-6 py-4 dark:border-gray-700',
}) => {
  return (
    <Modal
      show={show}
      size={size}
      onClose={onClose}
      className='[&_.modal-content]:rounded-xl'
      theme={{
        root: {
          base: 'fixed top-0 left-0 right-0 z-50 h-screen w-screen overflow-y-auto overflow-x-hidden bg-black/50 backdrop-blur-sm',
          show: {
            on: 'flex',
            off: 'hidden',
          },
        },
        content: {
          inner: 'relative m-4 w-full max-w-4xl rounded-xl border border-gray-200 bg-white text-gray-900 shadow-2xl dark:border-gray-700 dark:bg-gray-800 dark:text-white',
        },
      }}
    >
      <div className={headerClassName}>
        <div>
          {title && (
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>{title}</h3>
          )}
          {description && (
            <p className='mt-1 text-sm text-gray-600 dark:text-slate-400'>{description}</p>
          )}
        </div>
        <button
          aria-label='Close'
          onClick={onClose}
          className='rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-400 dark:hover:bg-gray-700 dark:hover:text-slate-200'
        >
          <svg className='h-6 w-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12' />
          </svg>
        </button>
      </div>

      <div className={bodyClassName}>{children}</div>

      {footer && <div className={footerClassName}>{footer}</div>}
    </Modal>
  );
};

export default BaseModal;
