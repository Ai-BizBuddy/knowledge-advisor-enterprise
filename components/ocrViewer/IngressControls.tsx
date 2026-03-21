import React from 'react';

export type IngressActionType =
  | 'standard'
  | 'perPage'
  | 'ocrOnly'
  | 'embeddingOnly'
  | 'colPali'
  | 'pageImages'
  | 'metadata'
  | 'cancel';

interface IngressControlsProps {
  onAction: (action: IngressActionType) => void;
  isLoading?: boolean;
  statusLabel?: string;
  className?: string;
}

const buttons: { label: string; action: IngressActionType; color: string }[] = [
  {
    label: 'Standard',
    action: 'standard',
    color: 'bg-indigo-600 hover:bg-indigo-700',
  },
  {
    label: 'Per Page',
    action: 'perPage',
    color: 'bg-blue-600 hover:bg-blue-700',
  },
  {
    label: 'OCR Only',
    action: 'ocrOnly',
    color: 'bg-sky-600 hover:bg-sky-700',
  },
  {
    label: 'Embed Only',
    action: 'embeddingOnly',
    color: 'bg-teal-600 hover:bg-teal-700',
  },
  {
    label: 'ColPali',
    action: 'colPali',
    color: 'bg-violet-600 hover:bg-violet-700',
  },
  {
    label: 'Page Images',
    action: 'pageImages',
    color: 'bg-pink-600 hover:bg-pink-700',
  },
];

export const IngressControls: React.FC<IngressControlsProps> = ({
  onAction,
  isLoading = false,
  statusLabel,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-900 ${className}`}
    >
      <div className='flex items-center justify-between px-1'>
        <span className='text-xs font-semibold text-gray-500 uppercase dark:text-gray-400'>
          Actions
        </span>
        {statusLabel && (
          <span
            className='max-w-[120px] truncate rounded bg-gray-200 px-1.5 py-0.5 text-[10px] text-gray-700 dark:bg-gray-800 dark:text-gray-300'
            title={statusLabel}
          >
            {statusLabel}
          </span>
        )}
      </div>

      <div className='grid grid-cols-2 gap-2'>
        {buttons.map((btn) => (
          <button
            key={btn.action}
            onClick={() => onAction(btn.action)}
            disabled={isLoading}
            className={`w-full rounded px-2 py-1.5 text-xs font-medium text-white shadow-sm transition-all ${btn.color} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      <div className='mt-1 grid grid-cols-2 gap-2 border-t border-gray-200 pt-2 dark:border-gray-700'>
        <button
          onClick={() => onAction('metadata')}
          disabled={isLoading}
          className='w-full rounded bg-slate-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50'
        >
          Check Status
        </button>
        <button
          onClick={() => onAction('cancel')}
          disabled={isLoading}
          className='w-full rounded bg-red-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50'
        >
          Cancel Job
        </button>
      </div>
    </div>
  );
};
