'use client';

import { ContextEditor } from '@/components/contextEditor';
import type {
  IntegrationAccount,
  LineIntegrationFormValues,
} from '@/interfaces/Integration';
import { IntegrationService } from '@/services/IntegrationService';
import { KnowledgeBaseService } from '@/services/KnowledgeBaseService';
import { Button, Card, Label, TextInput } from 'flowbite-react';
import { motion } from 'framer-motion';
import React, { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import WebhookConfig from './WebhookConfig';

interface SettingsTabProps {
  knowledgeBaseId: string;
  isActive: boolean;
}

const integrationService = new IntegrationService();
const knowledgeBaseService = new KnowledgeBaseService();

export const SettingsTab: React.FC<SettingsTabProps> = ({
  knowledgeBaseId,
  isActive,
}) => {
  const [integrations, setIntegrations] = useState<IntegrationAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'context' | 'accounts' | 'webhooks'>('context');
  const [contextValue, setContextValue] = useState<string>('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LineIntegrationFormValues>();

  // Fetch integrations
  const fetchIntegrations = useCallback(async () => {
    if (!isActive) return;

    try {
      setLoading(true);
      const accounts = await integrationService.getIntegrationAccounts(knowledgeBaseId);
      setIntegrations(accounts);
    } catch (error) {
      console.error('Error fetching integrations:', error);
      toast.error('Failed to load integrations');
    } finally {
      setLoading(false);
    }
  }, [knowledgeBaseId, isActive]);

  // Fetch only the context value for this KB (avoid selecting all columns)
  const fetchContext = useCallback(async () => {
    if (!isActive) return;

    try {
      const ctx = await knowledgeBaseService.getContext(knowledgeBaseId);
      setContextValue(ctx || '');
    } catch (error) {
      console.error('Error fetching context:', error);
      toast.error('Failed to load context');
    }
  }, [knowledgeBaseId, isActive]);

  useEffect(() => {
    fetchIntegrations();
    fetchContext();
  }, [fetchIntegrations, fetchContext]);

  // Create new LINE integration
  const onSubmit = async (data: LineIntegrationFormValues) => {
    try {
      await integrationService.createLineIntegration({
        ...data,
        knowledge_base_id: knowledgeBaseId,
      });

      toast.success('LINE integration created successfully');
      setShowForm(false);
      reset();
      fetchIntegrations();
    } catch (error) {
      console.error('Error creating integration:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to create integration',
      );
    }
  };

  // Toggle integration status
  const handleToggleStatus = async (integrationId: string, currentStatus: boolean) => {
    try {
      await integrationService.updateIntegrationStatus(integrationId, !currentStatus);
      toast.success(`Integration ${!currentStatus ? 'enabled' : 'disabled'}`);
      fetchIntegrations();
    } catch (error) {
      console.error('Error updating integration status:', error);
      toast.error('Failed to update integration status');
    }
  };

  // Delete integration
  const handleDelete = async (integrationId: string) => {
    if (!confirm('Are you sure you want to delete this integration?')) {
      return;
    }

    try {
      await integrationService.deleteIntegration(integrationId);
      toast.success('Integration deleted successfully');
      fetchIntegrations();
    } catch (error) {
      console.error('Error deleting integration:', error);
      toast.error('Failed to delete integration');
    }
  };

  if (!isActive) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className='space-y-6'
    >
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>
            Settings
          </h2>
          <p className='text-sm text-gray-600 dark:text-gray-400'>
            Manage knowledge base configuration and integrations
          </p>
        </div>
        {activeTab === 'accounts' && (
          <Button
            onClick={() => setShowForm(!showForm)}
            color='blue'
            size='sm'
          >
            {showForm ? 'Cancel' : 'Add Integration'}
          </Button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className='border-b border-gray-200 dark:border-gray-700'>
        <nav className='-mb-px flex space-x-8'>
          <button
            onClick={() => setActiveTab('context')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'context'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Context
          </button>
          <button
            onClick={() => setActiveTab('accounts')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'accounts'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Integration Accounts
          </button>
          <button
            onClick={() => setActiveTab('webhooks')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'webhooks'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Webhook Configuration
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'context' && (
        <ContextEditor
          knowledgeBaseId={knowledgeBaseId}
          initialContext={contextValue}
          onSave={(newCtx) => {
            setContextValue(newCtx);
          }}
        />
      )}

      {activeTab === 'accounts' && (
        <>
          {/* Create Integration Form */}
      {showForm && (
        <Card>
          <div className='space-y-4'>
            <h3 className='text-lg font-medium text-gray-900 dark:text-white'>
              Create LINE Integration
            </h3>
            <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
              <div>
                <Label htmlFor='display_name'>Display Name</Label>
                <TextInput
                  id='display_name'
                  placeholder='e.g., Customer Support Bot'
                  {...register('display_name', {
                    required: 'Display name is required',
                  })}
                  color={errors.display_name ? 'failure' : 'gray'}
                />
                {errors.display_name && (
                  <p className='mt-1 text-sm text-red-600 dark:text-red-400'>
                    {errors.display_name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor='channel_access_token'>Channel Access Token</Label>
                <TextInput
                  id='channel_access_token'
                  type='password'
                  placeholder='Enter your LINE channel access token'
                  {...register('channel_access_token', {
                    required: 'Channel access token is required',
                    minLength: {
                      value: 50,
                      message: 'Invalid token format',
                    },
                  })}
                  color={errors.channel_access_token ? 'failure' : 'gray'}
                />
                {errors.channel_access_token && (
                  <p className='mt-1 text-sm text-red-600 dark:text-red-400'>
                    {errors.channel_access_token.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor='channel_secret'>Channel Secret</Label>
                <TextInput
                  id='channel_secret'
                  type='password'
                  placeholder='Enter your LINE channel secret'
                  {...register('channel_secret', {
                    required: 'Channel secret is required',
                    minLength: {
                      value: 20,
                      message: 'Invalid secret format',
                    },
                  })}
                  color={errors.channel_secret ? 'failure' : 'gray'}
                />
                {errors.channel_secret && (
                  <p className='mt-1 text-sm text-red-600 dark:text-red-400'>
                    {errors.channel_secret.message}
                  </p>
                )}
              </div>

              <div className='flex gap-2'>
                <Button
                  type='submit'
                  color='blue'
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Integration'}
                </Button>
                <Button
                  type='button'
                  color='gray'
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      {/* Integrations List */}
      <div className='space-y-4'>
        <h3 className='text-lg font-medium text-gray-900 dark:text-white'>
          Active Integrations
        </h3>

        {loading ? (
          <div className='flex items-center justify-center p-8'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
          </div>
        ) : integrations.length === 0 ? (
          <Card>
            <div className='text-center py-8'>
              <svg
                className='mx-auto h-12 w-12 text-gray-400'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={1}
                  d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
              <h3 className='mt-2 text-sm font-medium text-gray-900 dark:text-white'>
                No integrations configured
              </h3>
              <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
                Get started by creating your first integration.
              </p>
            </div>
          </Card>
        ) : (
          <div className='space-y-3'>
            {integrations.map((integration) => (
              <Card key={integration.id}>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-4'>
                    <div className='flex-shrink-0'>
                      <div className='h-10 w-10 rounded-full bg-green-100 flex items-center justify-center dark:bg-green-900'>
                        <span className='text-green-600 font-medium text-sm dark:text-green-300'>
                          LINE
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className='text-sm font-medium text-gray-900 dark:text-white'>
                        {integration.display_name}
                      </p>
                      <p className='text-xs text-gray-500 dark:text-gray-400'>
                        Platform: {integration.platform.toUpperCase()}
                      </p>
                      <p className='text-xs text-gray-500 dark:text-gray-400'>
                        Created: {new Date(integration.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className='flex items-center space-x-2'>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        integration.is_active
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      }`}
                    >
                      {integration.is_active ? 'Active' : 'Inactive'}
                    </span>

                    <Button
                      size='xs'
                      color={integration.is_active ? 'failure' : 'success'}
                      onClick={() => handleToggleStatus(integration.id, integration.is_active)}
                    >
                      {integration.is_active ? 'Disable' : 'Enable'}
                    </Button>

                    <Button
                      size='xs'
                      color='failure'
                      onClick={() => handleDelete(integration.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      </>
      )}

      {/* Webhook Configuration Tab */}
      {activeTab === 'webhooks' && (
        <WebhookConfig 
          integrationAccounts={integrations}
          onWebhookCreated={fetchIntegrations}
        />
      )}
    </motion.div>
  );
};

export default SettingsTab;