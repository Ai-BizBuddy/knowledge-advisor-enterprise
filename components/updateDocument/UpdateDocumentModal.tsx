'use client';

import { useToast } from '@/components/toast';
import { useReactHookForm } from '@/hooks';
import type { Document, UpdateDocumentInput } from '@/interfaces/Project';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

interface UpdateDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  knowledgeBaseId: string;
  document: Document | null;
  onUpdate: (id: string, input: UpdateDocumentInput) => Promise<Document>;
  onSuccess?: (doc: Document) => void;
}

type VersionHistoryItem = {
  version: number;
  path: string;
  size?: number;
  mime?: string;
  uploadedAt: string;
  url?: string;
  originalFileName?: string;
};

export const UpdateDocumentModal: React.FC<UpdateDocumentModalProps> = ({
  isOpen,
  onClose,
  document,
  onUpdate,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  type UpdateDocumentForm = {
    tags: string[];
    tagInput: string;
    description: string;
    versionUrl: string;
  };

  const form = useReactHookForm<UpdateDocumentForm>({
    defaultValues: {
      tags: [],
      tagInput: '',
      description: '',
      versionUrl: '',
    },
  });
  const { register, handleSubmit, watch, setValue, getValues, reset } = form;

  const existingMetadata = useMemo(() => (document?.metadata as Record<string, unknown>) || {}, [document]);
  const currentVersion = useMemo(() => {
    const v = (existingMetadata?.currentVersion as number | undefined) ?? 1;
    return typeof v === 'number' && v > 0 ? v : 1;
  }, [existingMetadata]);

  useEffect(() => {
    if (isOpen && document) {
      const meta = (document.metadata || {}) as Record<string, unknown>;
      const t = (meta.tags as string[]) || [];
      const desc = (meta.description as string) || '';
      reset({
        tags: Array.isArray(t) ? t : [],
        description: typeof desc === 'string' ? desc : '',
        tagInput: '',
        versionUrl: '',
      });
    }
  }, [isOpen, document, reset]);

  const addTag = useCallback((value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const current = getValues('tags');
    if (current.includes(trimmed)) return;
    setValue('tags', [...current, trimmed], { shouldDirty: true });
  }, [getValues, setValue]);

  const removeTag = useCallback((tag: string) => {
    const current = getValues('tags');
    setValue('tags', current.filter((t) => t !== tag), { shouldDirty: true });
  }, [getValues, setValue]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' ) {
      e.preventDefault();
      const currentInput = getValues('tagInput');
      addTag(currentInput);
      setValue('tagInput', '');
    }
    const currentTags = getValues('tags');
    const currentInput = getValues('tagInput');
    if (e.key === 'Backspace' && !currentInput && currentTags.length > 0) {
      // remove last
      setValue('tags', currentTags.slice(0, -1), { shouldDirty: true });
    }
  };

  const processVersionUrl = useCallback(async (): Promise<{
    signedUrl?: string;
    versionItem?: VersionHistoryItem;
  }> => {
    const versionUrl = getValues('versionUrl')?.trim();
    if (!versionUrl) return {};

    const nextVersion = currentVersion + 1;

    const versionItem: VersionHistoryItem = {
      version: nextVersion,
      path: versionUrl,
      uploadedAt: new Date().toISOString(),
      url: versionUrl,
    };

    return { signedUrl: versionUrl, versionItem };
  }, [getValues, currentVersion]);

  const onValid = useCallback(async (values: UpdateDocumentForm) => {
    if (submitting) return;
    try {
      setSubmitting(true);

      const result = await processVersionUrl();

      // Prepare metadata updates
  if (!document) throw new Error('No document to update');
  const meta = (document.metadata || {}) as Record<string, unknown>;
      const versionHistory: VersionHistoryItem[] = Array.isArray(meta.versionHistory)
        ? (meta.versionHistory as VersionHistoryItem[])
        : [];

      if (result.versionItem) {
        versionHistory.push(result.versionItem);
      }

      const nextVersion = result.versionItem ? result.versionItem.version : currentVersion;

      const updateInput: UpdateDocumentInput = {
  url: result.signedUrl ? result.signedUrl : document!.url,
  file_size: result.versionItem ? result.versionItem.size : document!.file_size,
  mime_type: result.versionItem ? result.versionItem.mime : document!.mime_type,
        metadata: {
          ...meta,
          tags: values.tags,
          description: values.description,
          currentVersion: nextVersion,
          versionHistory,
        },
      } as unknown as UpdateDocumentInput;

      // We extend UpdateDocumentInput shape by casting to allow file_size/url updates
  const updated = await onUpdate(document!.id, updateInput);
      showToast('Document updated successfully', 'success');
      onSuccess?.(updated);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update document';
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  }, [submitting, processVersionUrl, document, onUpdate, onSuccess, onClose, showToast, currentVersion]);

  const hidden = !isOpen || !document;

  if (hidden) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm sm:p-6'>
      <div className='w-full max-w-2xl rounded-xl border border-gray-200 bg-white text-gray-900 shadow-2xl dark:border-gray-700 dark:bg-gray-800 dark:text-white'>
        <div className='flex items-center justify-between border-b border-gray-200 p-4 sm:p-6 dark:border-gray-700'>
          <div>
            <h2 className='text-lg font-bold text-gray-900 dark:text-white'>Update Document</h2>
            <p className='text-sm text-gray-600 dark:text-slate-400'>Edit tags, upload a new version, or update description</p>
          </div>
          <button
            className='rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-400 dark:hover:bg-gray-700 dark:hover:text-slate-200'
            disabled={submitting}
            onClick={onClose}
            aria-label='Close update modal'
          >
            <svg className='h-6 w-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12'></path>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onValid)} className='max-h-[70vh] space-y-6 overflow-y-auto p-4 sm:p-6'>
          {/* Tags input */}
          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700 dark:text-slate-200'>Tags</label>
            <div className='flex flex-wrap items-center gap-2 rounded-lg border border-gray-300 bg-white p-2 dark:border-slate-600 dark:bg-slate-700'>
              {watch('tags').map((tag) => (
                <span key={tag} className='inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'>
                  {tag}
                  <button className='rounded-full p-0.5 hover:bg-blue-200 dark:hover:bg-blue-900/50' onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`}>
                    <svg className='h-3 w-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12' />
                    </svg>
                  </button>
                </span>
              ))}
              <input
                type='text'
                {...register('tagInput')}
                onKeyDown={handleKeyDown}
                placeholder='Type a tag and press Enter'
                className='flex-1 min-w-[120px] border-none bg-transparent p-2 text-sm outline-none placeholder:text-gray-400 dark:placeholder:text-slate-400'
              />
            </div>
            <p className='mt-1 text-xs text-gray-500 dark:text-slate-400'>Press Enter or comma to add tags</p>
          </div>

          {/* Description */}
          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700 dark:text-slate-200'>Description</label>
            <textarea
              rows={4}
              {...register('description')}
              placeholder='Add a short description for this document'
              className='w-full rounded-lg border border-gray-300 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700'
            />
          </div>

          {/* Version upload */}
          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700 dark:text-slate-200'>New Version URL (optional)</label>
            <input
              type='text'
              {...register('versionUrl')}
              placeholder='Enter document URL for new version'
              className='w-full rounded-lg border border-gray-300 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700'
            />
            <p className='mt-1 text-xs text-gray-500 dark:text-slate-400'>Current version: {currentVersion}. Entering a URL will create version {currentVersion + 1}.</p>
          </div>
        </form>

        <div className='flex items-center justify-end gap-3 border-t border-gray-200 p-4 sm:p-6 dark:border-gray-700'>
          <button
            className='rounded-lg border border-gray-300 bg-gray-50 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 dark:focus:ring-offset-slate-800'
            disabled={submitting}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className='rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'
            disabled={submitting}
            type='submit'
            form={undefined}
            onClick={handleSubmit(onValid)}
          >
            {submitting ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateDocumentModal;
