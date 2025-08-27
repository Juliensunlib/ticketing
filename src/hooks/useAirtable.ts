import { useState, useEffect } from 'react';
import AirtableService from '../services/AirtableService';
import { Subscriber } from '../types';

// Configuration depuis les variables d'environnement
const getAirtableConfig = () => {
  const apiKey = import.meta.env.VITE_AIRTABLE_API_KEY;
  const subscribersBaseId = import.meta.env.VITE_AIRTABLE_SUBSCRIBERS_BASE_ID;

  // Logs uniquement en mode développement et si les variables sont définies
  if (import.meta.env.DEV && (apiKey || subscribersBaseId)) {
    console.log('🔍 Configuration Airtable:');
    console.log('- API Key:', apiKey ? `${apiKey.substring(0, 8)}...` : 'MANQUANTE');
    console.log('- Base ID:', subscribersBaseId || 'MANQUANTE');
  }

  if (!apiKey || !subscribersBaseId || 
      apiKey === 'votre_clé_api_airtable' || 
      subscribersBaseId === 'id_de_votre_base_abonnés' ||
      apiKey.trim() === '' || 
      subscribersBaseId.trim() === '') {
    // Ne pas afficher d'avertissement si on est en production (variables dans Vercel)
    if (import.meta.env.DEV) {
      console.info('ℹ️ Configuration Airtable locale non trouvée. Mode saisie manuelle activé.');
    }
    return null;
  }

  return { apiKey, subscribersBaseId };
};

export const useAirtable = () => {
  const [airtableService, setAirtableService] = useState<AirtableService | null>(null);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    console.log('🔧 useAirtable: Initialisation...');
    
    const config = getAirtableConfig();
    
    if (config) {
      console.log('✅ useAirtable: Configuration Airtable trouvée');
      const service = new AirtableService(config.apiKey, config.subscribersBaseId);
      setAirtableService(service);
      
      // Charger les données immédiatement
      loadDataWithService(service);
    } else {
      console.log('❌ useAirtable: Configuration Airtable manquante');
      setInitialized(true);
    }
  }, []); // Pas de dépendances pour éviter les réinitialisations

  const loadDataWithService = async (service: AirtableService) => {
    console.log('🔄 useAirtable: Chargement des données...');
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Chargement des abonnés Airtable...');
      const subscribersData = await service.getSubscribers();
      console.log('✅ Abonnés chargés:', subscribersData.length);
      
      setSubscribers(subscribersData);
      setError(null);
    } catch (err) {
      console.error('❌ Erreur Airtable:', err);
      setError(`Erreur de chargement Airtable: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
      setSubscribers([]); // Tableau vide en cas d'erreur
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  const loadData = async () => {
    console.log('🔄 useAirtable: Rechargement manuel des données...');
    
    if (!airtableService) {
      console.warn('⚠️ Service Airtable non initialisé');
      setError('Configuration Airtable manquante. Vérifiez les variables d\'environnement VITE_AIRTABLE_API_KEY et VITE_AIRTABLE_SUBSCRIBERS_BASE_ID');
      return;
    }

    await loadDataWithService(airtableService);
  };

  const createTicket = async (ticketData: any) => {
    console.log('🎫 useAirtable: Création de ticket...');
    if (!airtableService) {
      console.warn('Service Airtable non configuré, ticket créé uniquement dans Supabase');
      return null;
    }
    
    try {
      return await airtableService.createTicketRecord(ticketData);
    } catch (error) {
      console.error('❌ Erreur création ticket Airtable:', error);
      // Ne pas faire échouer la création si Airtable échoue
      return null;
    }
  };

  const updateTicket = async (recordId: string, ticketData: any) => {
    console.log('🔄 useAirtable: Mise à jour de ticket...');
    if (!airtableService) {
      console.warn('Service Airtable non configuré, mise à jour uniquement dans Supabase');
      return null;
    }
    
    try {
      return await airtableService.updateTicketRecord(recordId, ticketData);
    } catch (error) {
      console.error('❌ Erreur mise à jour ticket Airtable:', error);
      // Ne pas faire échouer la mise à jour si Airtable échoue
      return null;
    }
  };

  return {
    subscribers,
    loading,
    error,
    initialized,
    loadData,
    createTicket,
    updateTicket,
  };
};