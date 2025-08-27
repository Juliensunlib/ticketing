import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface SupabaseSubscriber {
  id: string;
  airtable_record_id?: string;
  nom: string;
  prenom: string;
  contrat_abonne: string;
  nom_entreprise?: string;
  installateur?: string;
  lien_crm?: string;
  email?: string;
  telephone?: string;
  created_at: string;
  updated_at: string;
}

export const useSupabaseSubscribers = () => {
  const [subscribers, setSubscribers] = useState<SupabaseSubscriber[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const loadSubscribers = async () => {
    console.log('🔄 Chargement des abonnés depuis Supabase...');
    setLoading(true);
    setError(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from('subscribers')
        .select('*')
        .order('nom', { ascending: true });

      if (supabaseError) {
        throw supabaseError;
      }

      console.log('✅ Abonnés Supabase récupérés:', data?.length || 0);
      setSubscribers(data || []);
      setInitialized(true);
    } catch (err) {
      console.error('❌ Erreur lors de la récupération des abonnés Supabase:', err);
      setError(`Erreur lors du chargement des abonnés: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
      setSubscribers([]);
      setInitialized(true);
    } finally {
      setLoading(false);
    }
  };

  const syncFromAirtable = async () => {
    console.log('🔄 Déclenchement de la synchronisation Airtable → Supabase...');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-airtable-subscribers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur de synchronisation: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Synchronisation terminée:', result);

      // Recharger les données après synchronisation
      await loadSubscribers();

      return result;
    } catch (err) {
      console.error('❌ Erreur lors de la synchronisation:', err);
      setError(`Erreur de synchronisation: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscribers();
  }, []);

  return {
    subscribers,
    loading,
    error,
    initialized,
    loadSubscribers,
    syncFromAirtable
  };
};