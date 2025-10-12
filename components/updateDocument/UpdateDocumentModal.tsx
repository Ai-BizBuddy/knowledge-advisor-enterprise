'use client';

import { useToast } from '@/components/toast';
import { useReactHookForm } from '@/hooks';
import type { Document, UpdateDocumentInput } from '@/interfaces/Project';
import { documentService } from '@/services';
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

type UpdateDocumentForm = {
  tag: string;
  description: string;
  version: number | null;
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
  const [validatingTag, setValidatingTag] = useState(false);

  const form = useReactHookForm<UpdateDocumentForm>({
    defaultValues: {
      tag: '',
      description: '',
      version: null,
    },
  });
  const { register, handleSubmit, watch, setValue, getValues, reset } = form;

  const existingMetadata = useMemo(
    () => (document?.metadata as Record<string, unknown>) || {},
    [document],
  );
  const currentVersion = useMemo(() => {
    const v = (existingMetadata?.currentVersion as number | undefined) ?? 1;
    return typeof v === 'number' && v > 0 ? v : 1;
  }, [existingMetadata]);

  useEffect(() => {
    if (isOpen && document) {
      const meta = (document.metadata || {}) as Record<string, unknown>;
      const tag = typeof meta.tag === 'string' ? meta.tag : '';
      const desc = (meta.description as string) || '';
      const latestVersion = currentVersion;
      reset({
        tag: tag,
        description: typeof desc === 'string' ? desc : '',
        version: latestVersion + 1,
      });
    }
  }, [isOpen, document, reset, currentVersion]);

  const processVersionUrl = useCallback(async (): Promise<{
    signedUrl?: string;
    versionItem?: VersionHistoryItem;
  }> => {
    const version = getValues('version');
    if (!version || version <= currentVersion) return {};

    const versionItem: VersionHistoryItem = {
      version: version,
      path: document?.url || '',
      uploadedAt: new Date().toISOString(),
      url: document?.url,
    };

    return { signedUrl: document?.url, versionItem };
  }, [getValues, currentVersion, document]);

  const onValid = useCallback(
    async (values: UpdateDocumentForm) => {
      if (submitting || validatingTag) return;
      try {
        setSubmitting(true);

        const result = await processVersionUrl();

        if (!document) throw new Error('No document to update');
        const meta = (document.metadata || {}) as Record<string, unknown>;
        const versionHistory: VersionHistoryItem[] = Array.isArray(
          meta.versionHistory,
        )
          ? (meta.versionHistory as VersionHistoryItem[])
          : [];

        if (result.versionItem) {
          versionHistory.push(result.versionItem);
        }

        const nextVersion = result.versionItem
          ? result.versionItem.version
          : currentVersion;

        const updateInput: UpdateDocumentInput = {
          url: result.signedUrl ? result.signedUrl : document!.url,
          file_size: result.versionItem
            ? result.versionItem.size
            : document!.file_size,
          mime_type: result.versionItem
            ? result.versionItem.mime
            : document!.mime_type,
          metadata: {
            ...meta,
            tag: values.tag,
            description: values.description,
            currentVersion: nextVersion,
            versionHistory,
          },
        } as unknown as UpdateDocumentInput;

        const updated = await onUpdate(document!.id, updateInput);
        showToast('Document updated successfully', 'success');
        onSuccess?.(updated);
        onClose();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to update document';
        showToast(message, 'error');
      } finally {
        setSubmitting(false);
      }
    },
    [
      submitting,
      validatingTag,
      processVersionUrl,
      document,
      onUpdate,
      onSuccess,
      onClose,
      showToast,
      currentVersion,
    ],
  );

  const handleTagBlur = async () => {
    // Fetch latest version on blur based on kb_id and tag
    const tagValue = (getValues('tag') as string).trim();
    if (document && tagValue) {
      setValidatingTag(true);
      try {
        const latestVersion = await documentService.getLatestVersionByTag(
          document.knowledge_base_id,
          tagValue,
        );
        setValue('version', latestVersion + 1);
        showToast('Version updated based on tag', 'success');
      } catch (error) {
        console.error('Failed to fetch latest version:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to validate tag';
        showToast(errorMessage, 'error');
        setValue('version', currentVersion + 1);
      } finally {
        setValidatingTag(false);
      }
    } else if (document) {
      setValue('version', currentVersion + 1);
    }
  };

  const hidden = !isOpen || !document;

  if (hidden) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm sm:p-6'>
      <div className='w-full max-w-2xl rounded-xl border border-gray-200 bg-white text-gray-900 shadow-2xl dark:border-gray-700 dark:bg-gray-800 dark:text-white'>
        <div className='flex items-center justify-between border-b border-gray-200 p-4 sm:p-6 dark:border-gray-700'>
          <div>
            <h2 className='text-lg font-bold text-gray-900 dark:text-white'>
              Update Document
            </h2>
            <p className='text-sm text-gray-600 dark:text-slate-400'>
              Edit tags, upload a new version, or update description
            </p>
          </div>
          <button
            className='rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-400 dark:hover:bg-gray-700 dark:hover:text-slate-200'
            disabled={submitting || validatingTag}
            onClick={onClose}
            aria-label='Close update modal'
          >
            <svg
              className='h-6 w-6'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M6 18L18 6M6 6l12 12'
              ></path>
            </svg>
          </button>
        </div>

        <form
          onSubmit={handleSubmit(onValid)}
          className='max-h-[70vh] space-y-6 overflow-y-auto p-4 sm:p-6'
        >
          {/* Tag input */}
          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700 dark:text-slate-200'>
              Tag
            </label>
            <div className='relative'>
              <input
                type='text'
                {...register('tag', {
                  maxLength: {
                    value: 55,
                    message: 'Tag must be 55 characters or less',
                  },
                })}
                onBlur={handleTagBlur}
                disabled={validatingTag}
                placeholder='Enter a tag (max 55 chars)'
                className='w-full rounded-lg border border-gray-300 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-700'
                maxLength={55}
              />
              {validatingTag && (
                <div className='absolute right-3 top-1/2 -translate-y-1/2'>
                  <svg
                    className='h-5 w-5 animate-spin text-blue-600 dark:text-blue-400'
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                  >
                    <circle
                      className='opacity-25'
                      cx='12'
                      cy='12'
                      r='10'
                      stroke='currentColor'
                      strokeWidth='4'
                    ></circle>
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                    ></path>
                  </svg>
                </div>
              )}
            </div>
            {form.formState.errors.tag && (
              <p className='mt-1 text-xs text-red-500'>
                {form.formState.errors.tag.message}
              </p>
            )}
            {validatingTag ? (
              <p className='mt-1 text-xs text-blue-600 dark:text-blue-400'>
                Validating tag and fetching latest version...
              </p>
            ) : (
              <p className='mt-1 text-xs text-gray-500 dark:text-slate-400'>
                Maximum 55 characters
              </p>
            )}
          </div>{' '}
          {/* Description */}
          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700 dark:text-slate-200'>
              Description
            </label>
            <textarea
              rows={4}
              {...register('description', {
                maxLength: {
                  value: 500,
                  message: 'Description must be 500 characters or less',
                },
              })}
              placeholder='Add a short description for this document (max 500 chars)'
              className='w-full rounded-lg border border-gray-300 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700'
              maxLength={500}
            />
            <p className='mt-1 text-xs text-gray-500 dark:text-slate-400'>
              {watch('description').length}/500 characters
            </p>
          </div>
          {/* Version number */}
          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700 dark:text-slate-200'>
              Version <span className='text-red-500'>*</span>
            </label>
            <input
              type='number'
              {...register('version', {
                required: 'Version is required',
                min: {
                  value: currentVersion + 1,
                  message: `Version must be greater than ${currentVersion}`,
                },
                valueAsNumber: true,
              })}
              placeholder='Enter version number'
              className='w-full rounded-lg border border-gray-300 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700'
              min={currentVersion + 1}
            />
            {form.formState.errors.version && (
              <p className='mt-1 text-xs text-red-500'>
                {form.formState.errors.version.message}
              </p>
            )}
            <p className='mt-1 text-xs text-gray-500 dark:text-slate-400'>
              Current version: {currentVersion}. New version must be{' '}
              {currentVersion + 1} or higher.
            </p>
          </div>
        </form>

        <div className='flex items-center justify-end gap-3 border-t border-gray-200 p-4 sm:p-6 dark:border-gray-700'>
          <button
            className='rounded-lg border border-gray-300 bg-gray-50 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 dark:focus:ring-offset-slate-800'
            disabled={submitting || validatingTag}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className='rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'
            disabled={submitting || validatingTag}
            type='submit'
            form={undefined}
            onClick={handleSubmit(onValid)}
          >
            {submitting ? 'Saving...' : validatingTag ? 'Validating...' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateDocumentModal;
