import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { useAirtable } from '../../hooks/useAirtable';
import { useTickets } from '../../hooks/useTickets';
import { useSupabaseUsers } from '../../hooks/useSupabaseUsers';
import { Send, User, Mail, AlertCircle, Clock, Flag } from 'lucide-react';

interface TicketFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const TicketForm: React.FC<TicketFormProps> = ({ onClose, onSuccess }) => {
  const { subscribers, loading: airtableLoading, error: airtableError, initialized } = useAirtable();
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

  // Vérifier si Airtable est disponible
  const isAirtableAvailable = initialized && subscribers.length > 0 && !airtableError;

  // Debug pour voir l'état en temps réel
  useEffect(() => {
    console.log('🔍 TicketForm - État Airtable:', {
      initialized,
      subscribersCount: subscribers.length,
      hasError: !!airtableError,
      isAvailable: isAirtableAvailable,
      loading: airtableLoading
    });
  }, [initialized, subscribers.length, airtableError, isAirtableAvailable, airtableLoading]);

  // Écouter les mises à jour globales d'Airtable
  useEffect(() => {
    const handleAirtableUpdate = (event: CustomEvent) => {
      console.log('🔄 TicketForm: Mise à jour Airtable reçue:', event.detail);
      
      // Forcer la mise à jour des états avec les données globales
      const { subscribers: newSubscribers, count, initialized, error } = event.detail;
      console.log('🔄 TicketForm: Application des nouvelles données:', {
        newCount: count,
        currentCount: subscribers.length,
        newInitialized: initialized,
        currentInitialized: initialized
      });
      
      // Déclencher un re-render complet du composant
      setFormData(prev => ({ ...prev }));
      
      // Forcer une nouvelle évaluation de isAirtableAvailable
      setTimeout(() => {
        console.log('🔍 TicketForm: Vérification post-mise à jour:', {
          subscribersLength: subscribers.length,
          initialized,
          hasError: !!airtableError,
          isAvailable: initialized && subscribers.length > 0 && !airtableError
        });
      }, 100);
    };

    window.addEventListener('airtable-data-updated', handleAirtableUpdate as EventListener);
    return () => {
      window.removeEventListener('airtable-data-updated', handleAirtableUpdate as EventListener);
    };
  }, [subscribers.length, initialized, airtableError]);

  // Filtrer les abonnés selon le terme de recherche
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredSubscribers(subscribers);
    } else {
      const filtered = subscribers.filter(subscriber => {
        const fullName = `${subscriber.prenom} ${subscriber.nom}`.toLowerCase();
        const contract = subscriber.contratAbonne.toLowerCase();
        const email = subscriber.email?.toLowerCase() || '';
        const company = subscriber.nomEntreprise?.toLowerCase() || '';
        const search = searchTerm.toLowerCase();
        
        return fullName.includes(search) || 
               contract.includes(search) || 
               email.includes(search) ||
               company.includes(search);
      });
      setFilteredSubscribers(filtered);
    }
  }, [searchTerm, subscribers]);

  useEffect(() => {
    console.log('TicketForm: Chargement des abonnés...');
    console.log('- Abonnés disponibles:', subscribers.length);
    console.log('- Airtable initialisé:', initialized);
    console.log('- Erreur Airtable:', airtableError);
  }, [subscribers, initialized, airtableError]);

  const handleSubscriberSelect = (subscriber: any) => {
    setSelectedSubscriber(subscriber.id);
    setSearchTerm(`${subscriber.prenom} ${subscriber.nom} - ${subscriber.contratAbonne}`);
    setFormData(prev => ({
      ...prev,
      subscriberId: `${subscriber.prenom} ${subscriber.nom} - ${subscriber.contratAbonne}`
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

    if (!isManualEntry && !selectedSubscriber && isAirtableAvailable) {
      alert('Veuillez sélectionner un abonné');
      return;
    }

    if ((isManualEntry || !isAirtableAvailable) && !formData.subscriberId.trim()) {
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
                Abonné *
              </label>
              
              {isAirtableAvailable ? (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                    <p className="text-sm text-green-800">
                      ✅ {subscribers.length} abonnés disponibles depuis Airtable
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
                                {subscriber.contratAbonne}
                                {subscriber.email && ` • ${subscriber.email}`}
                                {subscriber.nomEntreprise && ` • ${subscriber.nomEntreprise}`}
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
                    Airtable non disponible ({airtableError || 'Configuration manquante'}). Saisissez manuellement les informations de l'abonné.
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">
                    Abonnés chargés: {subscribers.length} | Initialisé: {initialized ? 'Oui' : 'Non'}
                  </p>
                </div>
              )}

              {/* Saisie manuelle ou Airtable non disponible */}
              {(isManualEntry || !isAirtableAvailable) && (
                <div>
                  <div className="space-y-3">
                    {isAirtableAvailable && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsManualEntry(false);
                          setSearchTerm('');
                          setFormData(prev => ({ ...prev, subscriberId: '' }));
                        }}
                        className="text-sm text-orange-600 hover:text-orange-700 underline"
                      >
                        ← Retour à la recherche d'abonnés
                      </button>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <User className="w-4 h-4 inline mr-1" />
                        Nom de l'abonné *
                      </label>
                      <input
                        type="text"
                        value={formData.subscriberId}
                        onChange={(e) => setFormData(prev => ({ ...prev, subscriberId: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                        placeholder="Nom de l'abonné ou numéro de contrat"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Titre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titre du ticket *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Résumé du problème"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                placeholder="Décrivez le problème en détail..."
                required
              />
            </div>

            {/* Priorité et Assignation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priorité
                </label>
                <div className="relative">
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as 'Haute' | 'Moyenne' | 'Basse' }))}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none ${getPriorityColor(formData.priority)}`}
                  >
                    <option value="Basse">Faible</option>
                    <option value="Moyenne">Moyenne</option>
                    <option value="Haute">Élevée</option>
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    {getPriorityIcon(formData.priority)}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigner à
                </label>
                <select
                  value={formData.assignedTo}
                  onChange={(e) => setFormData(prev => ({ ...prev, assignedTo: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <option value="">Non assigné</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                     {user.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Type et Canal d'entrée */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de ticket *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                  required
                >
                  <option value="SAV / question technique">SAV / question technique</option>
                  <option value="Recouvrement">Recouvrement</option>
                  <option value="Plainte Installateur">Plainte Installateur</option>
                  <option value="changement date prélèvement/RIB">Changement date prélèvement/RIB</option>
                  <option value="Résiliation anticipée / cession de contrat">Résiliation anticipée / cession de contrat</option>
                  <option value="Ajout contrat / Flexibilité">Ajout contrat / Flexibilité</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Canal d'entrée *
                </label>
                <select
                  value={formData.channel}
                  onChange={(e) => setFormData(prev => ({ ...prev, channel: e.target.value as any }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                  required
                >
                  <option value="Formulaire de contact">Formulaire de contact</option>
                  <option value="Mail">Mail</option>
                  <option value="Téléphone">Téléphone</option>
                  <option value="Site abonné">Site abonné</option>
                  <option value="Application SunLib">Application SunLib</option>
                </select>
              </div>
            </div>

            {/* Origine */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Origine *
              </label>
              <select
                value={formData.origin}
                onChange={(e) => setFormData(prev => ({ ...prev, origin: e.target.value as any }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                required
              >
                <option value="SunLib">SunLib</option>
                <option value="Abonné">Abonné</option>
                <option value="Installateur">Installateur</option>
              </select>
            </div>
            {/* Bouton de soumission */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={createLoading}
                className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {createLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Créer le ticket
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TicketForm;