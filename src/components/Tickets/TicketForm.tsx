import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { useSupabaseSubscribers } from '../../hooks/useSupabaseSubscribers';
import { useTickets } from '../../hooks/useTickets';
import { useSupabaseUsers } from '../../hooks/useSupabaseUsers';
import { Send, User, Mail, AlertCircle, Clock, Flag } from 'lucide-react';

interface TicketFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const TicketForm: React.FC<TicketFormProps> = ({ onClose, onSuccess }) => {
  const { subscribers, loading: subscribersLoading, error: subscribersError, initialized, syncFromAirtable } = useSupabaseSubscribers();
  const { createTicket, loading: createLoading } = useTickets();
  const { users } = useSupabaseUsers();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Moyenne' as 'Haute' | 'Moyenne' | 'Basse',
    status: 'Nouveau' as const,
    type: 'SAV / question technique' as const,
    origin: 'SunLib' as const,
    channel: 'Formulaire de contact' as const,
    assignedTo: '',
    subscriberId: '',
    installerId: '',
    clientName: '',
    clientEmail: '',
  });

  const [isManualEntry, setIsManualEntry] = useState(false);
  const [selectedSubscriber, setSelectedSubscriber] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredSubscribers, setFilteredSubscribers] = useState(subscribers);
  const [syncing, setSyncing] = useState(false);

  // Vérifier si les abonnés sont disponibles
  const isSubscribersAvailable = initialized && subscribers.length > 0 && !subscribersError;

  // Synchroniser avec Airtable au premier chargement si aucun abonné
  useEffect(() => {
    if (initialized && subscribers.length === 0 && !subscribersError) {
      console.log('🔄 Aucun abonné trouvé, synchronisation automatique avec Airtable...');
      handleSyncFromAirtable();
    }
  }, [initialized, subscribers.length, subscribersError]);

  // Filtrer les abonnés selon le terme de recherche
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredSubscribers(subscribers);
    } else {
      const filtered = subscribers.filter(subscriber => {
        const fullName = `${subscriber.prenom} ${subscriber.nom}`.toLowerCase();
        const contract = subscriber.contrat_abonne.toLowerCase();
        const email = subscriber.email?.toLowerCase() || '';
        const company = subscriber.nom_entreprise?.toLowerCase() || '';
        const search = searchTerm.toLowerCase();
        
        return fullName.includes(search) || 
               contract.includes(search) || 
               email.includes(search) ||
               company.includes(search);
      });
      setFilteredSubscribers(filtered);
    }
  }, [searchTerm, subscribers]);

  const handleSyncFromAirtable = async () => {
    setSyncing(true);
    try {
      await syncFromAirtable();
      console.log('✅ Synchronisation Airtable terminée');
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleSubscriberSelect = (subscriber: any) => {
    setSelectedSubscriber(subscriber.id);
    setSearchTerm(`${subscriber.prenom} ${subscriber.nom} - ${subscriber.contrat_abonne}`);
    setFormData(prev => ({
      ...prev,
      subscriberId: `${subscriber.prenom} ${subscriber.nom} - ${subscriber.contrat_abonne}`
    }));
    setShowDropdown(false);
    setIsManualEntry(false);
  };

  const handleManualEntry = () => {
    setIsManualEntry(true);
    setSelectedSubscriber('');
    setSearchTerm('');
    setFormData(prev => ({ ...prev, subscriberId: '' }));
    setShowDropdown(false);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setShowDropdown(value.length > 0 && !isManualEntry);
    
    // Si l'utilisateur efface tout, réinitialiser
    if (!value.trim()) {
      setSelectedSubscriber('');
      setFormData(prev => ({ ...prev, subscriberId: '' }));
    }
  };

  const toggleManualEntry = () => {
    if (isManualEntry) {
      // Retour au mode recherche
      setIsManualEntry(true);
      setSelectedSubscriber('');
      setSearchTerm('');
    } else {
      // Passage au mode manuel
      handleManualEntry();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!isManualEntry && !selectedSubscriber && isSubscribersAvailable) {
      alert('Veuillez sélectionner un abonné');
      return;
    }

    if ((isManualEntry || !isSubscribersAvailable) && !formData.subscriberId.trim()) {
      alert('Veuillez remplir les informations de l\'abonné');
      return;
    }

    try {
      await createTicket(formData);

      // Réinitialiser le formulaire
      setFormData({
        title: '',
        description: '',
        priority: 'Moyenne',
        status: 'Nouveau',
        type: 'SAV / question technique',
        origin: 'SunLib',
        channel: 'Formulaire de contact',
        assignedTo: '',
        subscriberId: '',
        installerId: '',
        clientName: '',
        clientEmail: '',
      });
      setSelectedSubscriber('');
      setIsManualEntry(false);

      onSuccess();
      alert('Ticket créé avec succès !');
    } catch (error) {
      console.error('Erreur lors de la création du ticket:', error);
      alert(`Erreur lors de la création du ticket: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Haute': return 'text-red-600 bg-red-50 border-red-200';
      case 'Moyenne': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Basse': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'Haute': return <AlertCircle className="w-4 h-4" />;
      case 'Moyenne': return <Clock className="w-4 h-4" />;
      case 'Basse': return <Flag className="w-4 h-4" />;
      default: return <Flag className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Send className="w-5 h-5 mr-2 text-orange-500" />
              Nouveau Ticket
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <h3 className="text-lg font-medium text-gray-900">Informations du ticket</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sélection du client */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                <div className="flex items-center justify-between">
                  <span>Abonné *</span>
                  {isSubscribersAvailable && (
                    <button
                      type="button"
                      onClick={handleSyncFromAirtable}
                      disabled={syncing}
                      className="text-xs text-orange-600 hover:text-orange-700 underline disabled:opacity-50"
                    >
                      {syncing ? '🔄 Synchronisation...' : '🔄 Synchroniser avec Airtable'}
                    </button>
                  )}
                </div>
              </label>
              
              {isSubscribersAvailable ? (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                    <p className="text-sm text-green-800">
                      ✅ {subscribers.length} abonnés disponibles depuis Supabase
                    </p>
                  </div>
                  
                  {!isManualEntry ? (
                    <div className="relative">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => handleSearchChange(e.target.value)}
                          onFocus={() => setShowDropdown(searchTerm.length > 0)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                          placeholder="Rechercher un abonné (nom, prénom, contrat, email...)"
                          required={!isManualEntry}
                        />
                      </div>
                      
                      {/* Dropdown des résultats */}
                      {showDropdown && filteredSubscribers.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {filteredSubscribers.slice(0, 10).map((subscriber) => (
                            <button
                              key={subscriber.id}
                              type="button"
                              onClick={() => handleSubscriberSelect(subscriber)}
                              className="w-full px-4 py-3 text-left hover:bg-orange-50 focus:bg-orange-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-gray-900">
                                {subscriber.prenom} {subscriber.nom}
                              </div>
                              <div className="text-sm text-gray-600">
                                {subscriber.contrat_abonne}
                                {subscriber.email && ` • ${subscriber.email}`}
                                {subscriber.nom_entreprise && ` • ${subscriber.nom_entreprise}`}
                              </div>
                            </button>
                          ))}
                          {filteredSubscribers.length > 10 && (
                            <div className="px-4 py-2 text-sm text-gray-500 bg-gray-50">
                              ... et {filteredSubscribers.length - 10} autres résultats
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Message si aucun résultat */}
                      {showDropdown && searchTerm && filteredSubscribers.length === 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500">
                          Aucun abonné trouvé pour "{searchTerm}"
                        </div>
                      )}
                    </div>
                  ) : null}
                  
                  {/* Bouton pour basculer entre recherche et saisie manuelle */}
                  <button
                    type="button"
                    onClick={handleManualEntry}
                    className="w-full px-4 py-2 text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50 border border-orange-200 rounded-lg transition-colors"
                  >
                    ➕ Saisie manuelle (client non répertorié)
                  </button>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-yellow-800 mb-2">
                    <AlertCircle className="w-4 h-4" />
                    <span className="font-medium">Mode saisie manuelle</span>
                  </div>
                  <p className="text-sm text-yellow-700">
                    Abonnés non disponibles ({subscribersError || 'Chargement en cours'}). S