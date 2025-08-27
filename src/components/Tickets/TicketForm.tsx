import React, { useState, useEffect } from 'react';
import { useAirtable } from '../../hooks/useAirtable';
import { useSupabaseTickets } from '../../hooks/useSupabaseTickets';
import { useSupabaseUsers } from '../../hooks/useSupabaseUsers';
import { Send, User, Mail, AlertCircle, Clock, Flag } from 'lucide-react';

interface TicketFormProps {
  onTicketCreated?: () => void;
}

export default function TicketForm({ onTicketCreated }: TicketFormProps) {
  const { subscribers, loading: airtableLoading, error: airtableError, initialized } = useAirtable();
  const { createTicket, loading: createLoading } = useSupabaseTickets();
  const { users } = useSupabaseUsers();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    clientName: '',
    clientEmail: '',
    assignedTo: '',
  });

  const [isManualEntry, setIsManualEntry] = useState(false);
  const [selectedSubscriber, setSelectedSubscriber] = useState('');

  // Vérifier si Airtable est disponible
  const isAirtableAvailable = initialized && subscribers.length > 0 && !airtableError;

  useEffect(() => {
    console.log('TicketForm: Chargement des abonnés...');
    console.log('- Abonnés disponibles:', subscribers.length);
    console.log('- Airtable initialisé:', initialized);
    console.log('- Erreur Airtable:', airtableError);
  }, [subscribers, initialized, airtableError]);

  const handleSubscriberChange = (value: string) => {
    if (value === 'manual') {
      setIsManualEntry(true);
      setSelectedSubscriber('');
      setFormData(prev => ({ ...prev, clientName: '', clientEmail: '' }));
    } else {
      setIsManualEntry(false);
      setSelectedSubscriber(value);
      
      const subscriber = subscribers.find(s => s.id === value);
      if (subscriber) {
        setFormData(prev => ({
          ...prev,
          clientName: subscriber.name,
          clientEmail: subscriber.email
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!isManualEntry && !selectedSubscriber) {
      alert('Veuillez sélectionner un client');
      return;
    }

    if (isManualEntry && (!formData.clientName.trim() || !formData.clientEmail.trim())) {
      alert('Veuillez remplir le nom et l\'email du client');
      return;
    }

    try {
      await createTicket({
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        client_name: formData.clientName,
        client_email: formData.clientEmail,
        assigned_to: formData.assignedTo || null,
        status: 'open'
      });

      // Réinitialiser le formulaire
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        clientName: '',
        clientEmail: '',
        assignedTo: '',
      });
      setSelectedSubscriber('');
      setIsManualEntry(false);

      if (onTicketCreated) {
        onTicketCreated();
      }

      alert('Ticket créé avec succès !');
    } catch (error) {
      console.error('Erreur lors de la création du ticket:', error);
      alert('Erreur lors de la création du ticket');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="w-4 h-4" />;
      case 'medium': return <Clock className="w-4 h-4" />;
      case 'low': return <Flag className="w-4 h-4" />;
      default: return <Flag className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Send className="w-5 h-5 text-blue-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Nouveau Ticket</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sélection du client */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Client *
          </label>
          
          {isAirtableAvailable ? (
            <div className="space-y-3">
              <select
                value={selectedSubscriber || (isManualEntry ? 'manual' : '')}
                onChange={(e) => handleSubscriberChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                required={!isManualEntry}
              >
                <option value="">Sélectionner un client</option>
                {subscribers.map((subscriber) => (
                  <option key={subscriber.id} value={subscriber.id}>
                    {subscriber.name} - {subscriber.email}
                  </option>
                ))}
                <option value="manual">➕ Saisie manuelle</option>
              </select>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-800 mb-2">
                <AlertCircle className="w-4 h-4" />
                <span className="font-medium">Mode saisie manuelle</span>
              </div>
              <p className="text-sm text-yellow-700">
                Saisissez manuellement les informations du client
              </p>
            </div>
          )}

          {/* Saisie manuelle ou Airtable non disponible */}
          {(isManualEntry || !isAirtableAvailable) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Nom du client *
                </label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Nom complet du client"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email du client *
                </label>
                <input
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="email@exemple.com"
                  required
                />
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
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' }))}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none ${getPriorityColor(formData.priority)}`}
              >
                <option value="low">Faible</option>
                <option value="medium">Moyenne</option>
                <option value="high">Élevée</option>
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
                  {user.email}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bouton de soumission */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={createLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
  );
}