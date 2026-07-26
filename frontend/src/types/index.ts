export interface ServiceHealth {
  name: string;
  type: 'backend' | 'frontend' | 'database' | 'cache' | 'proxy';
  status: 'online' | 'ready' | 'pending' | 'offline';
  port: number;
  description: string;
}

export interface HealthApiResponse {
  status: string;
  service: string;
  version: string;
  environment: string;
  details?: Record<string, string>;
}
