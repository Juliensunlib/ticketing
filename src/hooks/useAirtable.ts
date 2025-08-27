import { useState, useEffect } from 'react';
import AirtableService from '../services/airtable';
import { Subscriber } from '../types';

// Configuration depuis les variables d'environnement
const getAirtableConfig = () => {
  const apiKey = import.meta.env.VITE_AIRTABLE_API_KEY;
  const subscribersBaseId = import.meta.env.VITE_AIRTABLE_SUBSCRIBERS_BASE_ID;

  if (!apiKey || !subscribersBaseId || 
      apiKey === 'votre_clé_api_airtable' || 
      subscribersBaseId === 'id_de_votre_base_abonnés' ||
      apiKey.trim() === '' || 
      subscribersBaseId.trim() === '') {
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
    const config = getAirtableConfig();
    if (config) {
      const service = new AirtableService(config.apiKey, config.subscribersBaseId);
      setAirtableService(service);
      // Charger les données en arrière-plan sans bloquer l'interface
      loadDataWithService(service).catch((error) => {
        console.error('Erreur lors du chargement initial des données Airtable:', error);
        setError(`Connexion Airtable impossible: ${error.message}`);
      }).finally(() => {
        setInitialized(true);
      });
    } else {
      // Mode saisie manuelle silencieux
      setInitialized(true);
    }
    
    // Timeout de sécurité pour éviter le blocage
    const timeout = setTimeout(() => {
      if (!initialized) {
        console.warn('⚠️ Timeout d\'initialisation Airtable, déblocage forcé');
        setInitialized(true);
        setLoading(false);
      }
    }, 5000); // 5 secondes maximum
    
    return () => clearTimeout(timeout);
  }, []);

  const loadDataWithService = async (service: AirtableService) => {
    setLoading(true);
    setError(null);
    
    try {
      let subscribersData: Subscriber[] = [];

      try {
        subscribersData = await service.getSubscribers();
      } catch (err) {
        console.error('❌ Erreur Airtable:', err);
        setError(`Erreur de chargement Airtable: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
        // Airtable non disponible - continuer avec tableau vide
      }

      setSubscribers(subscribersData);
      
    } catch (err) {
      console.error('❌ Erreur générale lors du chargement:', err);
      setError(`Erreur générale: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    if (!airtableService) {
      setError('Service Airtable non disponible');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const subscribersData = await airtableService.getSubscribers();
      setSubscribers(subscribersData);
      setError(null); // Réinitialiser l'erreur en cas de succès
    } catch (err) {
      console.error('Erreur lors du chargement des données Airtable:', err);
      if (err instanceof Error && err.message.includes('Failed to fetch')) {
        setError('Connexion à Airtable impossible');
      } else {
        setError(`Erreur Airtable: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const createTicket = async (ticketData: any) => {
    if (!airtableService) {
      return null;
    }
    
    try {
      return await airtableService.createTicketRecord(ticketData);
    } catch (error) {
      console.error('❌ Erreur création ticket Airtable:', error);
      return null;
    }
  };

  const updateTicket = async (recordId: string, ticketData: any) => {
    if (!airtableService) {
      return null;
    }
    
    try {
      return await airtableService.updateTicketRecord(recordId, ticketData);
    } catch (error) {
      console.error('❌ Erreur mise à jour ticket Airtable:', error);
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