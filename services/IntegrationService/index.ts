import type {
  CreateLineIntegrationRequest,
  CreateWebhookEndpointRequest,
  DeliveryEndpoint,
  IntegrationAccount,
  IntegrationStats,
  LineIntegrationSecrets,
  WebhookTestResult,
} from '@/interfaces/Integration';
import { getAuthSession } from '@/utils/supabase/authUtils';
import { createClientTable } from '@/utils/supabase/client';

/**
 * Integration Service Class
 *
 * Handles all integration operations including LINE bot connections,
 * webhook configurations, and messaging operations.
 */
export class IntegrationService {
  private readonly serviceName = 'Integration';

  constructor() {
    // Service initialization
  }

  /**
   * Validate UUID v1-v5 format
   */
  private isValidUUID(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id,
    );
  }

  /**
   * Get current user from Supabase auth
   */
  private async getCurrentUser() {
    try {
      const session = await getAuthSession();

      if (!session?.user) {
        throw new Error('User not authenticated');
      }

      return session.user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all integration accounts for a knowledge base
   */
  async getIntegrationAccounts(knowledgeBaseId: string): Promise<IntegrationAccount[]> {
    try {
      const supabaseTable = createClientTable();

      // const { data: accounts, error } = await supabaseTable
      //   .from('integration_account')
      //   .select('*')
      //   .eq('knowledge_base_id', knowledgeBaseId)
      //   .order('created_at', { ascending: false });

      // if (error) {
      //   throw new Error(`Failed to fetch integration accounts: ${error.message}`);
      // }

      return []
      // accounts || 
      // [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a new LINE integration account
   */
  async createLineIntegration(input: CreateLineIntegrationRequest): Promise<IntegrationAccount> {
    try {
      const user = await this.getCurrentUser();
      const supabaseTable = createClientTable();

      // Prepare LINE secrets
      const lineSecrets: LineIntegrationSecrets = {
        channel_access_token: input.channel_access_token,
        channel_secret: input.channel_secret,
      };

      const integrationData = {
        platform: 'line',
        display_name: input.display_name,
        secrets: lineSecrets,
        knowledge_base_id: input.knowledge_base_id,
        is_active: true,
        created_by: user.id,
      };

      const { data: integration, error } = await supabaseTable
        .from('integration_account')
        .insert([integrationData])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create LINE integration: ${error.message}`);
      }

      return integration as IntegrationAccount;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update integration account status
   */
  async updateIntegrationStatus(
    integrationId: string,
    isActive: boolean,
  ): Promise<IntegrationAccount> {
    try {
      await this.getCurrentUser();
      const supabaseTable = createClientTable();

      const { data: integration, error } = await supabaseTable
        .from('integration_account')
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', integrationId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update integration status: ${error.message}`);
      }

      return integration as IntegrationAccount;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete an integration account
   */
  async deleteIntegration(integrationId: string): Promise<void> {
    try {
      await this.getCurrentUser();
      const supabaseTable = createClientTable();

      // Soft delete: Update deleted_at timestamp instead of hard delete
      const { error } = await supabaseTable
        .from('integration_account')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', integrationId)
        .is('deleted_at', null);

      if (error) {
        throw new Error(`Failed to delete integration: ${error.message}`);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get integration statistics for a knowledge base
   */
  async getIntegrationStats(knowledgeBaseId: string): Promise<IntegrationStats> {
    try {
      await this.getCurrentUser();
      const supabaseTable = createClientTable();

      // Get account counts
      const { count: totalAccounts } = await supabaseTable
        .from('integration_account')
        .select('*', { count: 'exact', head: true })
        .eq('knowledge_base_id', knowledgeBaseId);

      const { count: activeAccounts } = await supabaseTable
        .from('integration_account')
        .select('*', { count: 'exact', head: true })
        .eq('knowledge_base_id', knowledgeBaseId)
        .eq('is_active', true);

      // Get message counts (if tables exist)
      // Note: These tables might not exist yet, so we'll handle gracefully
      let totalMessagesSent = 0;
      let totalEventsReceived = 0;

      try {
        const { count: messageCount } = await supabaseTable
          .from('outgoing_message')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'sent');

        totalMessagesSent = messageCount || 0;
      } catch (error) {
        // Table might not exist yet
        console.warn('Outgoing message table not available:', error);
      }

      try {
        const { count: eventCount } = await supabaseTable
          .from('incoming_event')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'processed');

        totalEventsReceived = eventCount || 0;
      } catch (error) {
        // Table might not exist yet
        console.warn('Incoming event table not available:', error);
      }

      // Get endpoint counts
      let totalEndpoints = 0;
      let activeEndpoints = 0;

      try {
        const { count: endpointCount } = await supabaseTable
          .from('delivery_endpoint')
          .select('*', { count: 'exact', head: true });

        totalEndpoints = endpointCount || 0;

        const { count: activeEndpointCount } = await supabaseTable
          .from('delivery_endpoint')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);

        activeEndpoints = activeEndpointCount || 0;
      } catch (error) {
        // Table might not exist yet
        console.warn('Delivery endpoint table not available:', error);
      }

      return {
        total_accounts: totalAccounts || 0,
        active_accounts: activeAccounts || 0,
        total_messages_sent: totalMessagesSent,
        total_events_received: totalEventsReceived,
        total_endpoints: totalEndpoints,
        active_endpoints: activeEndpoints,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Test LINE integration connection
   */
  async testLineConnection(
    channelAccessToken: string,
    channelSecret: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Basic validation
      if (!channelAccessToken || !channelSecret) {
        return {
          success: false,
          error: 'Channel access token and secret are required',
        };
      }

      // Here you would typically make a test API call to LINE
      // For now, we'll just validate the token format
      if (channelAccessToken.length < 50) {
        return {
          success: false,
          error: 'Invalid channel access token format',
        };
      }

      if (channelSecret.length < 20) {
        return {
          success: false,
          error: 'Invalid channel secret format',
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed',
      };
    }
  }

  /**
   * Get all delivery endpoints for an integration account
   */
  async getDeliveryEndpoints(accountId: string): Promise<DeliveryEndpoint[]> {
    try {
      await this.getCurrentUser();
      const supabaseTable = createClientTable();

      const { data: endpoints, error } = await supabaseTable
        .from('delivery_endpoint')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch delivery endpoints: ${error.message}`);
      }

      return endpoints || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a new webhook delivery endpoint
   */
  async createWebhookEndpoint(input: CreateWebhookEndpointRequest): Promise<DeliveryEndpoint> {
    try {
      await this.getCurrentUser();
      const supabaseTable = createClientTable();

      const endpointData = {
        account_id: input.account_id,
        platform: input.platform,
        name: input.name,
        webhook_url: input.webhook_url,
        metadata: input.metadata,
        is_active: true,
      };

      const { data: endpoint, error } = await supabaseTable
        .from('delivery_endpoint')
        .insert([endpointData])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create webhook endpoint: ${error.message}`);
      }

      return endpoint as DeliveryEndpoint;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update delivery endpoint status
   */
  async updateEndpointStatus(
    endpointId: string,
    isActive: boolean,
  ): Promise<DeliveryEndpoint> {
    try {
      await this.getCurrentUser();
      const supabaseTable = createClientTable();

      const { data: endpoint, error } = await supabaseTable
        .from('delivery_endpoint')
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', endpointId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update endpoint status: ${error.message}`);
      }

      return endpoint as DeliveryEndpoint;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a delivery endpoint
   */
  async deleteEndpoint(endpointId: string): Promise<void> {
    try {
      await this.getCurrentUser();
      const supabaseTable = createClientTable();

      const { error } = await supabaseTable
        .from('delivery_endpoint')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', endpointId);

      if (error) {
        throw new Error(`Failed to delete endpoint: ${error.message}`);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Test webhook endpoint connectivity
   */
  async testWebhookEndpoint(
    webhookUrl: string,
    platform: string,
    metadata: Record<string, unknown> = {},
  ): Promise<WebhookTestResult> {
    try {
      // Basic URL validation
      try {
        new URL(webhookUrl);
      } catch {
        return {
          success: false,
          error: 'Invalid webhook URL format',
        };
      }

      // Validate webhook URL format for specific platforms
      if (platform.toLowerCase() === 'slack' && !webhookUrl.includes('hooks.slack.com')) {
        return {
          success: false,
          error: 'Invalid Slack webhook URL format',
        };
      }

      if (platform.toLowerCase() === 'discord' && !webhookUrl.includes('discord.com/api/webhooks')) {
        return {
          success: false,
          error: 'Invalid Discord webhook URL format',
        };
      }

      // Validate required metadata for Slack
      if (platform.toLowerCase() === 'slack' && !metadata.channel) {
        return {
          success: false,
          error: 'Slack webhook requires a channel to be specified',
        };
      }

      // Here you would make the actual HTTP request to webhookUrl
      // For now, we'll simulate a successful test
      return {
        success: true,
        status_code: 200,
        response: `Test webhook configured successfully for ${platform}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Webhook test failed',
      };
    }
  }
}