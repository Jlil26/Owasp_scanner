import { useState, useEffect } from 'react';
import { fetchHealth } from '../services/api';
import { HealthApiResponse } from '../types';

export function useHealth() {
  const [data, setData] = useState<HealthApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealth()
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return { data, loading };
}
