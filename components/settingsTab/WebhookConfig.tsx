'use client';

import type {
    DeliveryEndpoint,
    IntegrationAccount,
    WebhookFormValues,
} from '@/interfaces/Integration';
import { IntegrationService } from '@/services/IntegrationService';
import { Button, Card, Label, Select, TextInput } from 'flowbite-react';
import { motion } from 'framer-motion';
import React, { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

interface WebhookConfigProps {
  integrationAccounts: IntegrationAccount[];
  onWebhookCreated?: () => void;
}

const integrationService = new IntegrationService();

export const WebhookConfig: React.FC<WebhookConfigProps> = ({
  integrationAccounts,
  onWebhookCreated,
}) => {
  const [endpoints, setEndpoints] = useState<DeliveryEndpoint[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WebhookFormValues>();

  const selectedPlatform = watch('platform');

  // Fetch endpoints for selected account
  const fetchEndpoints = useCallback(async (accountId: string) => {
    if (!accountId) return;

    try {
      setLoading(true);
      const accountEndpoints = await integrationService.getDeliveryEndpoints(accountId);
      setEndpoints(accountEndpoints);
    } catch (error) {
      console.error('Error fetching endpoints:', error);
      toast.error('Failed to load webhook endpoints');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      fetchEndpoints(selectedAccount);
    } else {
      setEndpoints([]);
    }
  }, [selectedAccount, fetchEndpoints]);

  // Create webhook endpoint
  const onSubmit = async (data: WebhookFormValues) => {
    try {
      const account = integrationAccounts.find((acc) => acc.id === selectedAccount);
      if (!account) {
        toast.error('Please select an integration account first');
        return;
      }

      // Prepare metadata based on platform
      let metadata = {};
      switch (data.platform) {
        case 'slack':
          metadata = {
            channel: data.channel,
            username: data.username || 'Knowledge Advisor',
            icon_emoji: data.icon_emoji || ':robot_face:',
          };
          break;
        case 'discord':
          metadata = {
            username: data.username || 'Knowledge Advisor',
          };
          break;
        default:
          metadata = {
            method: 'POST',
            content_type: 'application/json',
          };
      }

      await integrationService.createWebhookEndpoint({
        account_id: selectedAccount,
        platform: data.platform,
        name: data.name,
        webhook_url: data.webhook_url,
        metadata,
      });

      toast.success('Webhook endpoint created successfully');
      setShowForm(false);
      reset();
      fetchEndpoints(selectedAccount);
      onWebhookCreated?.();
    } catch (error) {
      console.error('Error creating webhook:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to create webhook endpoint',
      );
    }
  };

  // Test webhook endpoint
  const handleTestWebhook = async (endpoint: DeliveryEndpoint) => {
    try {
      setTestingWebhook(endpoint.id);
      const result = await integrationService.testWebhookEndpoint(
        endpoint.webhook_url,
        endpoint.platform,
        endpoint.metadata,
      );

      if (result.success) {
        toast.success(`Webhook test successful: ${result.response}`);
      } else {
        toast.error(`Webhook test failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error testing webhook:', error);
      toast.error('Failed to test webhook');
    } finally {
      setTestingWebhook(null);
    }
  };

  // Toggle endpoint status
  const handleToggleEndpointStatus = async (endpointId: string, currentStatus: boolean) => {
    try {
      await integrationService.updateEndpointStatus(endpointId, !currentStatus);
      toast.success(`Endpoint ${!currentStatus ? 'enabled' : 'disabled'}`);
      fetchEndpoints(selectedAccount);
    } catch (error) {
      console.error('Error updating endpoint status:', error);
      toast.error('Failed to update endpoint status');
    }
  };

  // Delete endpoint
  const handleDeleteEndpoint = async (endpointId: string) => {
    if (!confirm('Are you sure you want to delete this webhook endpoint?')) {
      return;
    }

    try {
      await integrationService.deleteEndpoint(endpointId);
      toast.success('Webhook endpoint deleted successfully');
      fetchEndpoints(selectedAccount);
    } catch (error) {
      console.error('Error deleting endpoint:', error);
      toast.error('Failed to delete webhook endpoint');
    }
  };

  const renderPlatformSpecificFields = () => {
    switch (selectedPlatform) {
      case 'slack':
        return (
          <>
            <div>
              <Label htmlFor='channel'>Channel</Label>
              <TextInput
                id='channel'
                placeholder='#general'
                {...register('channel', {
                  required: 'Channel is required for Slack',
                })}
                color={errors.channel ? 'failure' : 'gray'}
              />
              {errors.channel && (
                <p className='mt-1 text-sm text-red-600 dark:text-red-400'>
                  {errors.channel.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor='username'>Bot Username (Optional)</Label>
              <TextInput
                id='username'
                placeholder='Knowledge Advisor'
                {...register('username')}
              />
            </div>

            <div>
              <Label htmlFor='icon_emoji'>Icon Emoji (Optional)</Label>
              <TextInput
                id='icon_emoji'
                placeholder=':robot_face:'
                {...register('icon_emoji')}
              />
            </div>
          </>
        );

      case 'discord':
        return (
          <div>
            <Label htmlFor='username'>Bot Username (Optional)</Label>
            <TextInput
              id='username'
              placeholder='Knowledge Advisor'
              {...register('username')}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className='space-y-6'
    >
      {/* Account Selection */}
      <div>
        <Label htmlFor='account_select'>Select Integration Account</Label>
        <Select
          id='account_select'
          value={selectedAccount}
          onChange={(e) => setSelectedAccount(e.target.value)}
          required
        >
          <option value=''>Choose an account...</option>
          {integrationAccounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.display_name} ({account.platform.toUpperCase()})
            </option>
          ))}
        </Select>
      </div>

      {selectedAccount && (
        <>
          {/* Add Webhook Button */}
          <div className='flex items-center justify-between'>
            <h3 className='text-lg font-medium text-gray-900 dark:text-white'>
              Webhook Endpoints
            </h3>
            <Button
              onClick={() => setShowForm(!showForm)}
              color='blue'
              size='sm'
            >
              {showForm ? 'Cancel' : 'Add Webhook'}
            </Button>
          </div>

          {/* Create Webhook Form */}
          {showForm && (
            <Card>
              <div className='space-y-4'>
                <h4 className='text-md font-medium text-gray-900 dark:text-white'>
                  Create Webhook Endpoint
                </h4>
                <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
                  <div>
                    <Label htmlFor='name'>Endpoint Name</Label>
                    <TextInput
                      id='name'
                      placeholder='e.g., Support Alerts'
                      {...register('name', {
                        required: 'Endpoint name is required',
                      })}
                      color={errors.name ? 'failure' : 'gray'}
                    />
                    {errors.name && (
                      <p className='mt-1 text-sm text-red-600 dark:text-red-400'>
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor='platform'>Platform</Label>
                    <Select
                      id='platform'
                      {...register('platform', {
                        required: 'Platform is required',
                      })}
                      color={errors.platform ? 'failure' : 'gray'}
                    >
                      <option value=''>Select platform...</option>
                      <option value='slack'>Slack</option>
                      <option value='discord'>Discord</option>
                      <option value='webhook'>Generic Webhook</option>
                    </Select>
                    {errors.platform && (
                      <p className='mt-1 text-sm text-red-600 dark:text-red-400'>
                        {errors.platform.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor='webhook_url'>Webhook URL</Label>
                    <TextInput
                      id='webhook_url'
                      type='url'
                      placeholder='https://hooks.slack.com/services/...'
                      {...register('webhook_url', {
                        required: 'Webhook URL is required',
                        pattern: {
                          value: /^https?:\/\/.+/,
                          message: 'Please enter a valid URL',
                        },
                      })}
                      color={errors.webhook_url ? 'failure' : 'gray'}
                    />
                    {errors.webhook_url && (
                      <p className='mt-1 text-sm text-red-600 dark:text-red-400'>
                        {errors.webhook_url.message}
                      </p>
                    )}
                  </div>

                  {renderPlatformSpecificFields()}

                  <div className='flex gap-2'>
                    <Button
                      type='submit'
                      color='blue'
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Creating...' : 'Create Webhook'}
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

          {/* Endpoints List */}
          <div className='space-y-3'>
            {loading ? (
              <div className='flex items-center justify-center p-8'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
              </div>
            ) : endpoints.length === 0 ? (
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
                      d='M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1'
                    />
                  </svg>
                  <h3 className='mt-2 text-sm font-medium text-gray-900 dark:text-white'>
                    No webhook endpoints configured
                  </h3>
                  <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
                    Create your first webhook endpoint to start receiving notifications.
                  </p>
                </div>
              </Card>
            ) : (
              endpoints.map((endpoint) => (
                <Card key={endpoint.id}>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-4'>
                      <div className='flex-shrink-0'>
                        <div className='h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center dark:bg-blue-900'>
                          <span className='text-blue-600 font-medium text-xs dark:text-blue-300'>
                            {endpoint.platform.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className='text-sm font-medium text-gray-900 dark:text-white'>
                          {endpoint.name}
                        </p>
                        <p className='text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs'>
                          {endpoint.webhook_url}
                        </p>
                        <p className='text-xs text-gray-500 dark:text-gray-400'>
                          Created: {new Date(endpoint.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className='flex items-center space-x-2'>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          endpoint.is_active
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                        }`}
                      >
                        {endpoint.is_active ? 'Active' : 'Inactive'}
                      </span>

                      <Button
                        size='xs'
                        color='purple'
                        onClick={() => handleTestWebhook(endpoint)}
                        disabled={testingWebhook === endpoint.id}
                      >
                        {testingWebhook === endpoint.id ? 'Testing...' : 'Test'}
                      </Button>

                      <Button
                        size='xs'
                        color={endpoint.is_active ? 'failure' : 'success'}
                        onClick={() =>
                          handleToggleEndpointStatus(endpoint.id, endpoint.is_active)
                        }
                      >
                        {endpoint.is_active ? 'Disable' : 'Enable'}
                      </Button>

                      <Button
                        size='xs'
                        color='failure'
                        onClick={() => handleDeleteEndpoint(endpoint.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </>
      )}
    </motion.div>
  );
};

export default WebhookConfig;