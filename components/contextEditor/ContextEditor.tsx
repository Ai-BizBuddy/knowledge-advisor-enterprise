'use client';

import { KnowledgeBaseService } from '@/services/KnowledgeBaseService';
import { Button, Card, Label, Textarea } from 'flowbite-react';
import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import type { ContextEditorProps } from './ContextEditor.types';

const knowledgeBaseService = new KnowledgeBaseService();

export const ContextEditor: React.FC<ContextEditorProps> = ({
  knowledgeBaseId,
  initialContext = '',
  onSave,
}) => {
  const [context, setContext] = useState(initialContext);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Update context when initialContext changes
  useEffect(() => {
    setContext(initialContext);
  }, [initialContext]);

  // Track changes
  useEffect(() => {
    setHasChanges(context !== initialContext);
  }, [context, initialContext]);

  const handleSave = async () => {
    if (!hasChanges) {
      toast.info('No changes to save');
      return;
    }

    try {
      setIsSaving(true);
      await knowledgeBaseService.updateContext(knowledgeBaseId, context);
      toast.success('Context updated successfully');
      setHasChanges(false);

      // Call optional onSave callback
      if (onSave) {
        onSave(context);
      }
    } catch (error) {
      console.error('Error updating context:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update context',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setContext(initialContext);
    setHasChanges(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className='space-y-4'
    >
      <Card>
        <div className='space-y-4'>
          <div className='flex items-start justify-between'>
            <div>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                Knowledge Base Context
              </h3>
              <p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
                Provide contextual information or instructions for the RAG
                system. This helps improve the quality and relevance of
                responses.
              </p>
            </div>
            {hasChanges && (
              <span className='inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'>
                Unsaved changes
              </span>
            )}
          </div>

          <div>
            <Label htmlFor='context' className='mb-2 block'>
              Context Information
            </Label>
            <Textarea
              id='context'
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder='Enter contextual information for this knowledge base...'
              rows={8}
              disabled={isSaving}
              className='resize-none font-mono text-sm'
            />
            <p className='mt-2 text-xs text-gray-500 dark:text-gray-400'>
              {context.length} characters
            </p>
          </div>

          <div className='flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-700'>
            <div className='text-sm text-gray-500 dark:text-gray-400'>
              {hasChanges ? (
                <span className='flex items-center gap-2'>
                  <svg
                    className='h-4 w-4 text-yellow-500'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                    />
                  </svg>
                  Remember to save your changes
                </span>
              ) : (
                <span className='flex items-center gap-2'>
                  <svg
                    className='h-4 w-4 text-green-500'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M5 13l4 4L19 7'
                    />
                  </svg>
                  All changes saved
                </span>
              )}
            </div>

            <div className='flex gap-2'>
              {hasChanges && (
                <Button
                  color='gray'
                  size='sm'
                  onClick={handleReset}
                  disabled={isSaving}
                >
                  Reset
                </Button>
              )}
              <Button
                color='blue'
                size='sm'
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
              >
                {isSaving ? (
                  <>
                    <svg
                      className='mr-2 h-4 w-4 animate-spin'
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
                      />
                      <path
                        className='opacity-75'
                        fill='currentColor'
                        d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                      />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg
                      className='mr-2 h-4 w-4'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4'
                      />
                    </svg>
                    Save Context
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Help Section */}
      <Card>
        <div className='space-y-3'>
          <h4 className='text-sm font-semibold text-gray-900 dark:text-white'>
            💡 Tips for Writing Effective Context
          </h4>
          <ul className='space-y-2 text-sm text-gray-600 dark:text-gray-400'>
            <li className='flex items-start gap-2'>
              <span className='mt-0.5 text-blue-500'>•</span>
              <span>
                <strong>Be specific:</strong> Clearly describe the purpose and
                scope of this knowledge base
              </span>
            </li>
            <li className='flex items-start gap-2'>
              <span className='mt-0.5 text-blue-500'>•</span>
              <span>
                <strong>Define terminology:</strong> Explain any domain-specific
                terms or acronyms
              </span>
            </li>
            <li className='flex items-start gap-2'>
              <span className='mt-0.5 text-blue-500'>•</span>
              <span>
                <strong>Set expectations:</strong> Describe what kind of
                questions the system can answer
              </span>
            </li>
            <li className='flex items-start gap-2'>
              <span className='mt-0.5 text-blue-500'>•</span>
              <span>
                <strong>Provide guidelines:</strong> Include any response style
                preferences or constraints
              </span>
            </li>
          </ul>
        </div>
      </Card>
    </motion.div>
  );
};
