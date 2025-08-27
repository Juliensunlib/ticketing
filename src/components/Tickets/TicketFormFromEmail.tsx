import React, { useState, useEffect } from 'react';
import { X, Save, Mail, User, AlertCircle } from 'lucide-react';
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
                <select
                  value={subscribers.find(s => formData.subscriberId.includes(s.contratAbonne))?.id || 'manual'}
                  onChange={(e) => {
                    if (e.target.value === 'manual') {
                      // Garder la valeur actuelle pour saisie manuelle
                    } else {
                      const subscriber = subscribers.find(s => s.id === e.target.value);
                      if (subscriber) {
                        setFormData(prev => ({
                          ...prev,
                          subscriberId: `${subscriber.prenom} ${subscriber.nom} - ${subscriber.contratAbonne}`
                        }));
                      }
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="manual">✏️ Saisie manuelle (actuel: {formData.subscriberId})</option>
                  {subscribers.map((subscriber) => (
                    <option key={subscriber.id} value={subscriber.id}>
                      {subscriber.prenom} {subscriber.nom} - {subscriber.contratAbonne}
                      {subscriber.email && ` (${subscriber.email})`}
                    </option>
                  ))}
                </select>
                
                <input
                  type="text"
                  value={formData.subscriberId}
                  onChange={(e) => setFormData(prev => ({ ...prev, subscriberId: e.target.value }))}
                  placeholder="Nom de l'abonné ou contrat"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
                <p className="text-xs text-gray-500">
                  Sélectionnez dans la liste ou modifiez manuellement
                </p>
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