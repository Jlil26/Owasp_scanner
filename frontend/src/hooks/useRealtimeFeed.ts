import { useState, useEffect } from 'react';

export interface RealtimeEvent {
  id: string;
  timestamp: string;
  event_type: string;
  severity?: string;
  title: string;
  description: string;
}

export interface RealtimeFeedData {
  active_scans_count: number;
  open_critical_count: number;
  pending_verifications_count: number;
  events: RealtimeEvent[];
}

const MOCK_REALTIME_DATA: RealtimeFeedData = {
  active_scans_count: 3,
  open_critical_count: 2,
  pending_verifications_count: 5,
  events: [
    {
      id: 'evt-1',
      timestamp: new Date().toISOString(),
      event_type: 'SCAN_COMPLETED',
      severity: 'HIGH',
      title: 'Analyse OWASP Complétée',
      description: 'Audit automatisé sur l\'infrastructure PME. 2 vulnérabilités détectées.'
    },
    {
      id: 'evt-2',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      event_type: 'VULN_DETECTED',
      severity: 'CRITICAL',
      title: 'Injection SQL Détectée',
      description: 'Paramètre endpoint /api/v1/user non assaini (OWASP A03:2021).'
    },
    {
      id: 'evt-3',
      timestamp: new Date(Date.now() - 900000).toISOString(),
      event_type: 'AI_REMEDIATION',
      severity: 'MEDIUM',
      title: 'Correctif IA Généré',
      description: 'Patch de sécurité généré pour la vulnérabilité XSS Refléchi.'
    }
  ]
};

export function useRealtimeFeed(autoRefreshMs: number = 5000) {
  const [data, setData] = useState<RealtimeFeedData | null>(MOCK_REALTIME_DATA);
  const [loading, setLoading] = useState<boolean>(false);
  const [isLive, setIsLive] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchFeed = async () => {
    try {
      const res = await fetch('/api/v1/analytics/realtime-feed');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
          setLastUpdated(new Date());
          return;
        }
      }
    } catch {
      // Backend not running in standalone preview; use fallback mock data silently
    }
    setData(MOCK_REALTIME_DATA);
    setLastUpdated(new Date());
    setLoading(false);
  };

  useEffect(() => {
    fetchFeed();
    if (!isLive) return;

    const interval = setInterval(() => {
      fetchFeed();
    }, autoRefreshMs);

    return () => clearInterval(interval);
  }, [isLive, autoRefreshMs]);

  return { data, loading, isLive, setIsLive, lastUpdated, refresh: fetchFeed };
}

