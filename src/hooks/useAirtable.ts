import { useState, useEffect } from 'react';
import AirtableService from '../services/airtable';
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
    const config = getAirtableConfig();
    
    const loadDataWithService = async (service: AirtableService) => {
      console.log('✅ Configuration Airtable trouvée, chargement des données...');
      console.log('✅ Configuration Airtable trouvée, chargement des données...');
      setError(null);
      
      try {
        let subscribersData: Subscriber[] = [];

        try {
          console.log('🔄 Chargement des abonnés Airtable...');
          subscribersData = await service.getSubscribers();
          console.log('✅ Abonnés chargés:', subscribersData.length);
        } catch (err) {
          console.error('❌ Erreur Airtable:', err);
          setError(`Erreur Airtable: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
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

    if (config) {
      console.log('🚀 Initialisation du service Airtable...');
      console.log('✅ Configuration Airtable trouvée, chargement des données...');
      const service = new AirtableService(config.apiKey, config.subscribersBaseId);
      setAirtableService(service);
      // Charger les données en arrière-plan sans bloquer l'interface
      loadDataWithService(service).catch((error) => {
        console.error('Erreur lors du chargement initial des données Airtable:', error);
        // Ne pas bloquer l'interface même en cas d'erreur
        setError(`Connexion Airtable impossible: ${error.message}`);
      }).finally(() => {
        setInitialized(true);
      });
    } else {
      const timeout = setTimeout(() => {
        console.error('❌ Configuration Airtable invalide ou manquante');
        setInitialized(true);
      }, 5000); // 5 secondes maximum
      
      return () => clearTimeout(timeout);
    }
  }, []);

  const loadData = async () => {
    console.log('🔄 useAirtable: Rechargement manuel des données...');
    if (!airtableService) {
      console.warn('⚠️ Service Airtable non initialisé');
      setError('Configuration Airtable manquante. Vérifiez les variables d\'environnement VITE_AIRTABLE_API_KEY et VITE_AIRTABLE_SUBSCRIBERS_BASE_ID dans votre fichier .env\n💡 Vérifiez que les variables VITE_AIRTABLE_API_KEY et VITE_AIRTABLE_SUBSCRIBERS_BASE_ID sont configurées dans votre fichier .env');
      return;
    }
    
    if (!airtableService) {
      console.warn('⚠️ Service Airtable en cours d\'initialisation...');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Rechargement des données Airtable...');
      
      const subscribersData = await airtableService.getSubscribers();

      console.log('Abonnés récupérés:', subscribersData);

      setSubscribers(subscribersData);
      setError(null); // Réinitialiser l'erreur en cas de succès
    } catch (err) {
      console.error('Erreur lors du chargement des données Airtable:', err);
      if (err instanceof Error && err.message.includes('Failed to fetch')) {
        setError('Connexion à Airtable impossible. Vérifiez votre connexion internet et les variables d\'environnement.');
      } else {
        setError(`Erreur lors du rechargement: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
      }
    } finally {
      setLoading(false);
    }
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

  console.log('✅ Configuration Airtable valide');
  
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