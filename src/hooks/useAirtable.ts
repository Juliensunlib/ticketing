import { useState, useEffect } from 'react';
import AirtableService from '../services/airtable';
import { Subscriber } from '../types';

// Configuration depuis les variables d'environnement
const getAirtableConfig = () => {
  const apiKey = import.meta.env.VITE_AIRTABLE_API_KEY;
  const subscribersBaseId = import.meta.env.VITE_AIRTABLE_SUBSCRIBERS_BASE_ID;

  if (!apiKey || !subscribersBaseId || apiKey === 'votre_clé_api_airtable' || subscribersBaseId === 'id_de_votre_base_abonnés') {
    console.warn('Configuration Airtable incomplète. Vérifiez votre fichier .env');
    return null;
  }

  return { apiKey, subscribersBaseId };
};

export const useAirtable = () => {
  const [airtableService, setAirtableService] = useState<AirtableService | null>(null);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  

  useEffect(() => {
    const config = getAirtableConfig();
    if (config) {
      const service = new AirtableService(config.apiKey, config.subscribersBaseId);
      setAirtableService(service);
      // Charger les données en arrière-plan sans bloquer l'interface
      loadDataWithService(service).catch((error) => {
        console.error('Erreur lors du chargement initial des données Airtable:', error);
        // Ne pas bloquer l'interface même en cas d'erreur
      });
    } else {
      console.warn('Configuration Airtable manquante');
      // Ne pas afficher d'erreur si la configuration est manquante
      setError(null);
    }
  }, []);

  const loadDataWithService = async (service: AirtableService) => {
    setLoading(true);
    try {
      let subscribersData: Subscriber[] = [];

      try {
        console.log('🔄 Chargement des abonnés Airtable...');
        subscribersData = await service.getSubscribers();
        console.log('✅ Abonnés chargés:', subscribersData.length);
      } catch (err) {
        console.error('❌ Erreur Airtable:', err);
        // Airtable non disponible - continuer sans erreur
      }

      setSubscribers(subscribersData);
      
    } catch (err) {
      console.error('❌ Erreur générale lors du chargement:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    if (!airtableService) {
      console.warn('Service Airtable non initialisé. Vérifiez la configuration dans le fichier .env');
      setError('Service Airtable non configuré. Contactez l\'administrateur.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Rechargement des données Airtable...');
      
      const subscribersData = await airtableService.getSubscribers();

      console.log('Abonnés récupérés:', subscribersData);

      setSubscribers(subscribersData);
    } catch (err) {
      console.error('Erreur lors du chargement des données Airtable:', err);
      if (err instanceof Error && err.message.includes('Failed to fetch')) {
        setError('Connexion à Airtable impossible. Contactez l\'administrateur si le problème persiste.');
      } else {
        setError(`Erreur lors du rechargement: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const createTicket = async (ticketData: any) => {
    if (!airtableService) {
      console.warn('Service Airtable non configuré, ticket créé uniquement dans Supabase');
      return null;
    }
    return await airtableService.createTicketRecord(ticketData);
  };

  const updateTicket = async (recordId: string, ticketData: any) => {
    if (!airtableService) {
      console.warn('Service Airtable non configuré, mise à jour uniquement dans Supabase');
      return null;
    }
    return await airtableService.updateTicketRecord(recordId, ticketData);
  };

  return {
    subscribers,
    loading,
    error,
    loadData,
    createTicket,
    updateTicket,
  };
};