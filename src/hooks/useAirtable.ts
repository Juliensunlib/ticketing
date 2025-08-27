import { useState, useEffect } from 'react';
import AirtableService from '../services/AirtableService';
import { Subscriber } from '../types';

// Cache global pour éviter les requêtes multiples
let globalSubscribers: Subscriber[] = [];
let globalLoading = false;
let globalError: string | null = null;
let globalInitialized = false;
let airtableServiceInstance: AirtableService | null = null;

// Configuration depuis les variables d'environnement
const getAirtableConfig = () => {
  const apiKey = import.meta.env.VITE_AIRTABLE_API_KEY;
  const subscribersBaseId = import.meta.env.VITE_AIRTABLE_SUBSCRIBERS_BASE_ID;

  // Logs réduits pour éviter le spam
  if (!globalInitialized) {
    console.log('🔍 Configuration Airtable:', {
      mode: import.meta.env.MODE,
      hasApiKey: !!apiKey,
      hasBaseId: !!subscribersBaseId,
      apiKeyLength: apiKey?.length || 0
    });
  }

  if (!apiKey || !subscribersBaseId || 
      apiKey === 'votre_clé_api_airtable' || 
      subscribersBaseId === 'id_de_votre_base_abonnés' ||
      apiKey.trim() === '' || 
      subscribersBaseId.trim() === '') {
    if (!globalInitialized) {
      console.warn('❌ Configuration Airtable invalide');
    }
    return null;
  }

  if (!globalInitialized) {
    console.log('✅ Configuration Airtable valide trouvée');
  }
  return { apiKey, subscribersBaseId };
};

export const useAirtable = () => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>(globalSubscribers);
  const [loading, setLoading] = useState(globalLoading);
  const [error, setError] = useState<string | null>(globalError);
  const [initialized, setInitialized] = useState(globalInitialized);

  useEffect(() => {
    // Si déjà initialisé globalement, utiliser les données en cache
    if (globalInitialized) {
      setSubscribers(globalSubscribers);
      setLoading(globalLoading);
      setError(globalError);
      setInitialized(true);
      return;
    }

    // Si déjà en cours de chargement, attendre
    if (globalLoading) {
      setLoading(true);
      return;
    }

    console.log('🔧 useAirtable: Première initialisation...');
    
    const config = getAirtableConfig();
    
    if (config) {
      if (!airtableServiceInstance) {
        console.log('✅ useAirtable: Création du service Airtable');
        airtableServiceInstance = new AirtableService(config.apiKey, config.subscribersBaseId);
      }
      
      // Charger les données une seule fois
      loadDataWithService(airtableServiceInstance);
    } else {
      console.log('❌ useAirtable: Configuration manquante');
      globalInitialized = true;
      setInitialized(true);
    }
  }, []); // Exécuter une seule fois au montage

  const loadDataWithService = async (service: AirtableService) => {
    // Éviter les chargements multiples
    if (globalLoading) {
      console.log('⏳ Chargement déjà en cours, attente...');
      return;
    }

    console.log('🔄 useAirtable: Début du chargement des données...');
    globalLoading = true;
    globalError = null;
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Chargement des abonnés Airtable...');
      const subscribersData = await service.getSubscribers();
      console.log('✅ Abonnés chargés:', subscribersData.length);
      
      // Mettre à jour le cache global
      globalSubscribers = subscribersData;
      setSubscribers(subscribersData);
      globalError = null;
    } catch (err) {
      console.error('❌ Erreur Airtable:', err);
      const errorMessage = `Erreur de chargement Airtable: ${err instanceof Error ? err.message : 'Erreur inconnue'}`;
      globalError = errorMessage;
      globalSubscribers = [];
      setError(errorMessage);
      setSubscribers([]);
    } finally {
      globalLoading = false;
      globalInitialized = true;
      setLoading(false);
      setInitialized(true);
    }
  };

  const loadData = async () => {
    console.log('🔄 useAirtable: Rechargement manuel des données...');
    
    if (!airtableServiceInstance) {
      console.warn('⚠️ Service Airtable non initialisé');
      setError('Configuration Airtable manquante. Vérifiez les variables d\'environnement VITE_AIRTABLE_API_KEY et VITE_AIRTABLE_SUBSCRIBERS_BASE_ID');
      return;
    }

    // Réinitialiser le cache pour forcer le rechargement
    globalInitialized = false;
    globalLoading = false;
    await loadDataWithService(airtableServiceInstance);
  };

  const createTicket = async (ticketData: any) => {
    console.log('🎫 useAirtable: Création de ticket...');
    if (!airtableServiceInstance) {
      console.warn('Service Airtable non configuré, ticket créé uniquement dans Supabase');
      return null;
    }
    
    try {
      return await airtableServiceInstance.createTicketRecord(ticketData);
    } catch (error) {
      console.error('❌ Erreur création ticket Airtable:', error);
      // Ne pas faire échouer la création si Airtable échoue
      return null;
    }
  };

  const updateTicket = async (recordId: string, ticketData: any) => {
    console.log('🔄 useAirtable: Mise à jour de ticket...');
    if (!airtableServiceInstance) {
      console.warn('Service Airtable non configuré, mise à jour uniquement dans Supabase');
      return null;
    }
    
    try {
      return await airtableServiceInstance.updateTicketRecord(recordId, ticketData);
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