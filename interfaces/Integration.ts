export type IntegrationPlatform = 'line' | 'slack' | 'discord' | 'webhook';

export interface IntegrationAccount {
  id: string;
  platform: IntegrationPlatform;
  display_name: string;
  secrets: Record<string, unknown>;
  is_active: boolean;
  knowledge_base_id?: string;
  is_deleted: boolean;
  deleted_at?: string;
  deleted_by?: string;
  created_at: string;
  updated_at: string;
}

export interface LineIntegrationSecrets {
  channel_access_token: string;
  channel_secret: string;
}

export interface CreateLineIntegrationRequest {
  display_name: string;
  channel_access_token: string;
  channel_secret: string;
  knowledge_base_id: string;
}

export interface LineIntegrationFormValues {
  display_name: string;
  channel_access_token: string;
  channel_secret: string;
}

export interface DeliveryEndpoint {
  id: string;
  account_id: string;
  platform: IntegrationPlatform;
  name: string;
  webhook_url: string;
  metadata: Record<string, unknown>;
  is_active: boolean;
  is_deleted: boolean;
  deleted_at?: string;
  deleted_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateWebhookEndpointRequest {
  account_id: string;
  platform: IntegrationPlatform;
  name: string;
  webhook_url: string;
  metadata: WebhookMetadata;
}

export interface WebhookFormValues {
  name: string;
  webhook_url: string;
  platform: IntegrationPlatform;
  channel?: string;
  username?: string;
  icon_emoji?: string;
}

export interface SlackWebhookMetadata {
  channel: string;
  username?: string;
  icon_emoji?: string;
}

export interface DiscordWebhookMetadata {
  username?: string;
  avatar_url?: string;
}

export interface GenericWebhookMetadata {
  method?: 'POST' | 'GET';
  headers?: Record<string, string>;
  content_type?: string;
}

export type WebhookMetadata = SlackWebhookMetadata | DiscordWebhookMetadata | GenericWebhookMetadata;

export interface WebhookTestResult {
  success: boolean;
  status_code?: number;
  response?: string;
  error?: string;
}

export interface IntegrationStats {
  total_accounts: number;
  active_accounts: number;
  total_messages_sent: number;
  total_events_received: number;
  total_endpoints: number;
  active_endpoints: number;
}