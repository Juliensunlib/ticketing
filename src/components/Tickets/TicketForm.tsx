import React, { useState, useEffect } from 'react';
import { X, Save, User, AlertCircle, Search, Plus } from 'lucide-react';
import { useTickets } from '../../hooks/useTickets';
import { useAirtable } from '../../hooks/useAirtable';
import { useSupabaseUsers } from '../../hooks/useSupabaseUsers';
import { Ticket } from '../../types';

interface TicketFormProps {
  ticket?: Ticket;
  onClose: () => void;
  onSuccess: () => void;
}

const TicketForm: React.FC<TicketFormProps> = ({ ticket, onClose, onSuccess }) => {
  const { createTicket, updateTicket } = useTickets();
  const { subscribers, loading: airtableLoading } = useAirtable();
  const { users } = useSupabaseUsers();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCustomSubscriber, setShowCustomSubscriber] = useState(false);
  const [formData, setFormData] = useState({
    title: ticket?.title || '',
    description: ticket?.description || '',
    priority: ticket?.priority || 'Moyenne' as const,
    status: ticket?.status || 'Nouveau' as const,
    type: ticket?.type || 'SAV / question technique' as const,
    origin: ticket?.origin || 'SunLib' as const,
    channel: ticket?.channel || 'Formulaire de contact' as const,
    assignedTo: ticket?.assignedTo || '',
    subscriberId: ticket?.subscriberId || '',
    installerId: ticket?.installerId || '',
  });

  // Filtrer les abonnés selon le terme de recherche
  const filteredSubscribers = subscribers.filter(subscriber => {
    const searchLower = searchTerm.toLowerCase();
    return (
      subscriber.nom.toLowerCase().includes(searchLower) ||
      subscriber.prenom.toLowerCase().includes(searchLower) ||
      subscriber.contratAbonne.toLowerCase().includes(searchLower) ||
      subscriber.email?.toLowerCase().includes(searchLower) ||
      `${subscriber.prenom} ${subscriber.nom}`.toLowerCase().includes(searchLower)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const ticketData = {
        ...formData,
        // Si c'est un abonné personnalisé, garder le texte saisi
        // Sinon, formater avec le nom complet de l'abonné sélectionné
        subscriberId: showCustomSubscriber ? formData.subscriberId : formData.subscriberId,
      };

      console.log('🔍 TicketForm - Données du formulaire:', ticketData);

      if (ticket) {
        // Mise à jour
        await updateTicket(ticket.id, ticketData);
      } else {
        // Création
        await createTicket(ticketData);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du ticket:', error);
      alert(`Erreur lors de la sauvegarde: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriberSelect = (subscriber: any) => {
    const fullName = `${subscriber.prenom} ${subscriber.nom} - ${subscriber.contratAbonne}`;
    setFormData(prev => ({ ...prev, subscriberId: fullName }));
    setSearchTerm('');
    setShowCustomSubscriber(false);
  };

  const handleCustomSubscriber = () => {
    setShowCustomSubscriber(true);
    setFormData(prev => ({ ...prev, subscriberId: '' }));
    setSearchTerm('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {ticket ? 'Modifier le ticket' : 'Nouveau ticket'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Titre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titre *
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
            
            {!showCustomSubscriber && subscribers.length > 0 ? (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Rechercher un abonné..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                
                {searchTerm && (
                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                    {filteredSubscribers.length > 0 ? (
                      filteredSubscribers.map((subscriber) => (
                        <button
                          key={subscriber.id}
                          type="button"
                          onClick={() => handleSubscriberSelect(subscriber)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">
                            {subscriber.prenom} {subscriber.nom}
                          </div>
                          <div className="text-sm text-gray-600">
                            {subscriber.contratAbonne} {subscriber.email && `• ${subscriber.email}`}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-gray-500 text-sm">
                        Aucun abonné trouvé
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={formData.subscriberId}
                    onChange={(e) => setFormData(prev => ({ ...prev, subscriberId: e.target.value }))}
                    placeholder="Abonné sélectionné..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                    readOnly={!showCustomSubscriber}
                  />
                  <button
                    type="button"
                    onClick={handleCustomSubscriber}
                    className="ml-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                    title="Saisie manuelle"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={formData.subscriberId}
                  onChange={(e) => setFormData(prev => ({ ...prev, subscriberId: e.target.value }))}
                  placeholder="Nom de l'abonné ou contrat (ex: Jean Dupont - SL-000123)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
                {subscribers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowCustomSubscriber(false)}
                    className="text-sm text-orange-600 hover:text-orange-700"
                  >
                    ← Retour à la recherche Airtable
                  </button>
                )}
              </div>
            )}
            
            {airtableLoading && (
              <p className="text-sm text-gray-500 mt-1">
                Chargement des abonnés...
              </p>
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
              rows={4}
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

            {/* Statut */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="Nouveau">Nouveau</option>
                <option value="En attente du client">En attente du client</option>
                <option value="En attente de l'installateur">En attente de l'installateur</option>
                <option value="En attente retour service technique">En attente retour service technique</option>
                <option value="Fermé">Fermé</option>
                <option value="Ouvert">Ouvert</option>
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

            {/* Origine */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Origine
              </label>
              <select
                value={formData.origin}
                onChange={(e) => setFormData(prev => ({ ...prev, origin: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="Installateur">Installateur</option>
                <option value="SunLib">SunLib</option>
                <option value="Abonné">Abonné</option>
              </select>
            </div>

            {/* Canal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Canal
              </label>
              <select
                value={formData.channel}
                onChange={(e) => setFormData(prev => ({ ...prev, channel: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="Mail">Mail</option>
                <option value="Téléphone">Téléphone</option>
                <option value="Formulaire de contact">Formulaire de contact</option>
                <option value="Site abonné">Site abonné</option>
                <option value="Application SunLib">Application SunLib</option>
              </select>
            </div>

            {/* Assigné à */}
            <div>
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

          {/* Installateur (optionnel) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Installateur (optionnel)
            </label>
            <input
              type="text"
              value={formData.installerId}
              onChange={(e) => setFormData(prev => ({ ...prev, installerId: e.target.value }))}
              placeholder="Nom de l'installateur"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
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
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {ticket ? 'Modifier' : 'Créer'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TicketForm;