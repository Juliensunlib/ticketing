import React, { useState, useEffect } from 'react';
import { X, Save, Mail, User, AlertCircle, Search } from 'lucide-react';
import { useTickets } from '../../hooks/useTickets';
import { useAirtable } from '../../hooks/useAirtable';
import { useSupabaseUsers } from '../../hooks/useSupabaseUsers';

interface Email {
  id: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  body?: string;
  hasAttachments: boolean;
  isRead: boolean;
}

interface TicketFormFromEmailProps {
  email: Email;
  onClose: () => void;
  onSuccess: () => void;
}

const TicketFormFromEmail: React.FC<TicketFormFromEmailProps> = ({ email, onClose, onSuccess }) => {
  const { createTicket } = useTickets();
  const { subscribers } = useAirtable();
  const { users } = useSupabaseUsers();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: email.subject || 'Email reçu',
    description: `Email reçu de: ${email.from}\nDate: ${new Date(email.date).toLocaleString('fr-FR')}\nSujet: ${email.subject}\n\n${email.body || email.snippet}`,
    priority: 'Moyenne' as const,
    status: 'Nouveau' as const,
    type: 'SAV / question technique' as const,
    origin: 'Abonné' as const,
    channel: 'Mail' as const,
    assignedTo: '',
    subscriberId: '',
    installerId: '',
  });

  // Essayer de détecter automatiquement l'abonné depuis l'email
  useEffect(() => {
    const detectSubscriber = () => {
      console.log('🔍 === DÉTECTION ABONNÉ DEPUIS EMAIL ===');
      console.log('🔍 Email from:', email.from);
      console.log('🔍 Nombre d\'abonnés disponibles:', subscribers.length);
      
      const emailAddress = email.from.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)?.[1];
      const fromName = email.from.replace(/<.*>/, '').trim();
      
      console.log('🔍 Email extrait:', emailAddress);
      console.log('🔍 Nom extrait:', fromName);
      
      if (emailAddress) {
        // Chercher par email
        const subscriberByEmail = subscribers.find(sub => 
          sub.email?.toLowerCase() === emailAddress.toLowerCase()
        );
        
        if (subscriberByEmail) {
          console.log('✅ Abonné trouvé par email:', subscriberByEmail);
          setFormData(prev => ({
            ...prev,
            subscriberId: `${subscriberByEmail.prenom} ${subscriberByEmail.nom} - ${subscriberByEmail.contratAbonne}`
          }));
          return;
        }
      }
      
      if (fromName) {
        // Chercher par nom
        const subscriberByName = subscribers.find(sub => {
          const fullName = `${sub.prenom} ${sub.nom}`.toLowerCase();
          return fullName.includes(fromName.toLowerCase()) || fromName.toLowerCase().includes(fullName);
        });
        
        if (subscriberByName) {
          console.log('✅ Abonné trouvé par nom:', subscriberByName);
          setFormData(prev => ({
            ...prev,
            subscriberId: `${subscriberByName.prenom} ${subscriberByName.nom} - ${subscriberByName.contratAbonne}`
          }));
          return;
        }
      }
      
      // Si aucun abonné trouvé, utiliser l'email comme identifiant
      console.log('❌ Aucun abonné trouvé, utilisation de l\'email');
      setFormData(prev => ({
        ...prev,
        subscriberId: `Autre - ${email.from}`
      }));
      console.log('🔍 === FIN DÉTECTION ===');
    };

    if (subscribers.length > 0) {
      detectSubscriber();
    }
  }, [email, subscribers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createTicket(formData);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la création du ticket:', error);
      alert(`Erreur lors de la création: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Mail className="w-5 h-5 mr-2 text-orange-500" />
              Créer un ticket depuis un email
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Aperçu de l'email */}
        <div className="p-6 bg-blue-50 border-b border-blue-200">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Email source :</h3>
          <div className="space-y-1 text-sm">
            <p><span className="font-medium text-blue-800">De :</span> {email.from}</p>
            <p><span className="font-medium text-blue-800">Sujet :</span> {email.subject}</p>
            <p><span className="font-medium text-blue-800">Date :</span> {new Date(email.date).toLocaleString('fr-FR')}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Titre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titre du ticket *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              required
            />
          </div>

          {/* Abonné */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Abonné *
            </label>
            
            {subscribers.length > 0 ? (
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
                  ➕ Garder les infos de l'email (client non répertorié)
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  value={formData.subscriberId}
                  onChange={(e) => setFormData(prev => ({ ...prev, subscriberId: e.target.value }))}
                  placeholder="Nom de l'abonné ou contrat"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Détecté automatiquement depuis l'email ou modifiez si nécessaire
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              required
            />
          </div>

          {/* Grille des champs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Priorité */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priorité
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="Basse">Basse</option>
                <option value="Moyenne">Moyenne</option>
                <option value="Haute">Haute</option>
              </select>
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="SAV / question technique">SAV / question technique</option>
                <option value="Recouvrement">Recouvrement</option>
                <option value="Plainte Installateur">Plainte Installateur</option>
                <option value="changement date prélèvement/RIB">changement date prélèvement/RIB</option>
                <option value="Résiliation anticipée / cession de contrat">Résiliation anticipée / cession de contrat</option>
                <option value="Ajout contrat / Flexibilité">Ajout contrat / Flexibilité</option>
              </select>
            </div>

            {/* Assigné à */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assigné à
              </label>
              <select
                value={formData.assignedTo}
                onChange={(e) => setFormData(prev => ({ ...prev, assignedTo: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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

          {/* Boutons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Création...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Créer le ticket
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TicketFormFromEmail;