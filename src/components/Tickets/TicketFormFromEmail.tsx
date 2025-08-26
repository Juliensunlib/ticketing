import { Save, X, Mail, User, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { useTickets } from '../../hooks/useTickets';
import { useSupabaseUsers } from '../../hooks/useSupabaseUsers';
import { useAirtable } from '../../hooks/useAirtable';
import React, { useState, useEffect } from 'react';

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
  const { users: employees } = useSupabaseUsers();
  const { getSubscriberByEmail } = useAirtable();
  
  const [subscriberInfo, setSubscriberInfo] = useState<{
    name: string;
    contract: string;
    found: boolean;
  }>({
    name: '',
    contract: '',
    found: false
  });
  const [loadingSubscriber, setLoadingSubscriber] = useState(true);
  
  const [formData, setFormData] = useState({
    title: email.subject,
    description: `Email reçu de: ${email.from}\nDate: ${new Date(email.date).toLocaleString('fr-FR')}\n\n${email.body || email.snippet}`,
    priority: 'Moyenne' as 'Haute' | 'Moyenne' | 'Basse',
    status: 'Nouveau' as 'Nouveau' | 'En attente du client' | 'En attente de l\'installateur' | 'En attente retour service technique' | 'Fermé' | 'Ouvert',
    type: 'SAV / question technique' as 'SAV / question technique' | 'Recouvrement' | 'Plainte Installateur' | 'changement date prélèvement/RIB' | 'Résiliation anticipée / cession de contrat' | 'Ajout contrat / Flexibilité',
    origin: 'Abonné' as 'Installateur' | 'SunLib' | 'Abonné',
    channel: 'Mail' as 'Mail' | 'Téléphone' | 'Formulaire de contact' | 'Site abonné' | 'Application SunLib',
    assignedTo: '',
    subscriberId: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Rechercher l'abonné dans Airtable au chargement
  useEffect(() => {
    const searchSubscriber = async () => {
      setLoadingSubscriber(true);
      
      // Extraire l'email de l'expéditeur
      const emailMatch = email.from.match(/<(.+)>/) || email.from.match(/([^\s<>]+@[^\s<>]+)/);
      const senderEmail = emailMatch ? emailMatch[1] || emailMatch[0] : email.from;
      
      console.log('🔍 Recherche abonné pour email:', senderEmail);
      
      try {
        const subscriber = await getSubscriberByEmail(senderEmail);
        
        if (subscriber) {
          const subscriberName = `${subscriber.prenom} ${subscriber.nom}`.trim();
          const subscriberDisplay = subscriber.contratAbonne 
            ? `${subscriberName} - ${subscriber.contratAbonne}`
            : subscriberName;
            
          setSubscriberInfo({
            name: subscriberName,
            contract: subscriber.contratAbonne,
            found: true
          });
          
          setFormData(prev => ({
            ...prev,
            subscriberId: subscriberDisplay
          }));
          
          console.log('✅ Abonné trouvé et assigné:', subscriberDisplay);
        } else {
          // Fallback : extraire le nom depuis l'email
          const nameFromEmail = email.from.split('@')[0].replace(/[._]/g, ' ');
          setSubscriberInfo({
            name: nameFromEmail,
            contract: '',
            found: false
          });
          
          setFormData(prev => ({
            ...prev,
            subscriberId: `${nameFromEmail} (${senderEmail})`
          }));
          
          console.log('⚠️ Abonné non trouvé, utilisation du nom extrait:', nameFromEmail);
        }
      } catch (error) {
        console.error('❌ Erreur recherche abonné:', error);
        // Fallback en cas d'erreur
        const nameFromEmail = email.from.split('@')[0].replace(/[._]/g, ' ');
        setSubscriberInfo({
          name: nameFromEmail,
          contract: '',
          found: false
        });
        
        setFormData(prev => ({
          ...prev,
          subscriberId: `${nameFromEmail} (${email.from})`
        }));
      } finally {
        setLoadingSubscriber(false);
      }
    };
    
    searchSubscriber();
  }, [email.from, getSubscriberByEmail]);

  // Détection automatique du type de ticket basé sur le contenu
  React.useEffect(() => {
    const content = (email.subject + ' ' + email.snippet).toLowerCase();
    
    if (content.includes('prélèvement') || content.includes('rib') || content.includes('paiement')) {
      setFormData(prev => ({ ...prev, type: 'changement date prélèvement/RIB' }));
    } else if (content.includes('résiliation') || content.includes('cession')) {
      setFormData(prev => ({ ...prev, type: 'Résiliation anticipée / cession de contrat' }));
    } else if (content.includes('recouvrement') || content.includes('facture') || content.includes('impayé')) {
      setFormData(prev => ({ ...prev, type: 'Recouvrement' }));
    } else if (content.includes('installateur') || content.includes('plainte')) {
      setFormData(prev => ({ ...prev, type: 'Plainte Installateur' }));
    } else if (content.includes('contrat') || content.includes('ajout') || content.includes('flexibilité')) {
      setFormData(prev => ({ ...prev, type: 'Ajout contrat / Flexibilité' }));
    }
    
    // Détection de la priorité
    if (content.includes('urgent') || content.includes('panne') || content.includes('problème grave')) {
      setFormData(prev => ({ ...prev, priority: 'Haute' }));
    }
  }, [email]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Le titre est obligatoire';
    if (!formData.description.trim()) newErrors.description = 'La description est obligatoire';
    if (!formData.subscriberId.trim()) newErrors.subscriberId = 'L\'abonné est obligatoire';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      createTicket(formData);
      
      // Marquer l'email comme traité dans le localStorage
      const processedEmails = JSON.parse(localStorage.getItem('processed_emails') || '[]');
      processedEmails.push(email.id);
      localStorage.setItem('processed_emails', JSON.stringify(processedEmails));
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la création du ticket:', error);
      setErrors({ general: 'Erreur lors de la création du ticket' });
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Mail className="w-5 h-5 mr-2 text-orange-500" />
            Créer un Ticket depuis Email
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Informations de l'email source */}
        <div className="p-6 bg-blue-50 border-b border-gray-200">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Email source :</h3>
          <div className="space-y-1 text-sm text-blue-800">
            <div className="flex items-center">
              <User className="w-4 h-4 mr-2" />
              <span>De: {email.from}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              <span>Date: {new Date(email.date).toLocaleString('fr-FR')}</span>
            </div>
            <div className="flex items-center">
              <Mail className="w-4 h-4 mr-2" />
              <span>Sujet: {email.subject}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">{errors.general}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informations du ticket */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Informations du Ticket</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre du ticket *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={6}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priorité
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => handleChange('priority', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="Basse">Basse</option>
                    <option value="Moyenne">Moyenne</option>
                    <option value="Haute">Haute</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Statut
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de problème
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleChange('type', e.target.value)}
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
            </div>

            {/* Assignation */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Assignation</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Abonné concerné *
                </label>
                
                {loadingSubscriber ? (
                  <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                    <span className="text-sm text-blue-700">Recherche de l'abonné dans Airtable...</span>
                  </div>
                ) : (
                  <>
                    {subscriberInfo.found ? (
                      <div className="mb-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                          <span className="text-sm text-green-800 font-medium">
                            Abonné trouvé dans Airtable
                          </span>
                        </div>
                        <div className="text-xs text-green-700 mt-1">
                          {subscriberInfo.name} {subscriberInfo.contract && `- ${subscriberInfo.contract}`}
                        </div>
                      </div>
                    ) : (
                      <div className="mb-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center">
                          <AlertCircle className="w-4 h-4 text-yellow-500 mr-2" />
                          <span className="text-sm text-yellow-800 font-medium">
                            Abonné non trouvé dans Airtable
                          </span>
                        </div>
                        <div className="text-xs text-yellow-700 mt-1">
                          Email: {email.from} - Vérifiez que l'email existe dans la base Airtable
                        </div>
                      </div>
                    )}
                  </>
                )}
                
                <input
                  type="text"
                  value={formData.subscriberId}
                  onChange={(e) => handleChange('subscriberId', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                    errors.subscriberId ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Nom de l'abonné - Contrat"
                  disabled={loadingSubscriber}
                />
                {errors.subscriberId && <p className="text-red-500 text-sm mt-1">{errors.subscriberId}</p>}
                {!loadingSubscriber && (
                  <p className="text-xs text-gray-500 mt-1">
                    {subscriberInfo.found 
                      ? "Abonné trouvé automatiquement dans Airtable. Modifiez si nécessaire."
                      : "Abonné non trouvé dans Airtable. Saisissez manuellement les informations."
                    }
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigné à
                </label>
                <select
                  value={formData.assignedTo}
                  onChange={(e) => handleChange('assignedTo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Non assigné</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} - {employee.user_group}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Détection automatique :</h4>
                <div className="space-y-1 text-xs text-gray-600">
                  <p>• Type: Détecté selon le contenu de l'email</p>
                  <p>• Priorité: Détectée selon les mots-clés (urgent, panne, etc.)</p>
                  <p>• Abonné: Extrait du contenu de l'email</p>
                  <p>• Canal: Automatiquement défini sur "Mail"</p>
                  <p>• Origine: Automatiquement définie sur "Abonné"</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              Créer le Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TicketFormFromEmail;