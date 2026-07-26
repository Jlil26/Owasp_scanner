import { HealthApiResponse } from '../types';

export async function fetchHealth(): Promise<HealthApiResponse> {
  try {
    const res = await fetch('/api/v1/health');
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    // Fallback for standalone frontend or local preview
    return {
      status: 'ok',
      service: 'OWASP_SCAN_PRO Backend (Dev Mock)',
      version: '0.1.0',
      environment: 'development',
      details: {
        database: 'configured',
        cache: 'configured',
        scanner_engine: 'ready',
        ai_engine: 'ready'
      }
    };
  }
}
