import React, { useState, useEffect } from 'react';
import { Mail, Plus, Search, RefreshCw, Calendar, User, Paperclip, ExternalLink } from 'lucide-react';

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

interface GmailIntegrationProps {
  onCreateTicketFromEmail?: (email: Email) => void;
}

const GmailIntegration: React.FC<GmailIntegrationProps> = ({ onCreateTicketFromEmail }) => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);

  // Emails de démonstration
  const demoEmails: Email[] = [
    {
      id: '1',
      subject: 'Problème avec mon installation solaire',
      from: 'jean.dupont@email.com',
      date: '2025-01-26T10:30:00Z',
      snippet: 'Bonjour, j\'ai un problème avec mon installation solaire depuis hier. Les panneaux ne semblent plus produire...',
      body: 'Bonjour,\n\nJ\'ai un problème avec mon installation solaire depuis hier. Les panneaux ne semblent plus produire d\'électricité et l\'onduleur affiche un voyant rouge.\n\nPouvez-vous m\'aider ?\n\nCordialement,\nJean Dupont\nContrat: SL-000123',
      hasAttachments: true,
      isRead: false
    },
    {
      id: '2',
      subject: 'Demande de modification de prélèvement',
      from: 'marie.martin@email.com',
      date: '2025-01-26T09:15:00Z',
      snippet: 'Bonjour, je souhaiterais modifier la date de prélèvement de mon contrat...',
      body: 'Bonjour,\n\nJe souhaiterais modifier la date de prélèvement de mon contrat du 5 au 15 de chaque mois.\n\nPouvez-vous faire le nécessaire ?\n\nCordialement,\nMarie Martin\nContrat: SL-000456',
      hasAttachments: false,
      isRead: true
    },
    {
      id: '3',
      subject: 'Question sur ma facture',
      from: 'pierre.bernard@email.com',
      date: '2025-01-25T16:45:00Z',
      snippet: 'Bonjour, j\'ai une question concernant ma dernière facture...',
      body: 'Bonjour,\n\nJ\'ai une question concernant ma dernière facture. Le montant me semble élevé par rapport aux mois précédents.\n\nPouvez-vous vérifier ?\n\nCordialement,\nPierre Bernard\nContrat: SL-000789',
      hasAttachments: true,
      isRead: false
    }
  ];

  useEffect(() => {
    // Simuler le chargement des emails
    setLoading(true);
    setTimeout(() => {
      setEmails(demoEmails);
      setLoading(false);
    }, 1000);
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setEmails(demoEmails);
      setLoading(false);
    }, 1000);
  };

  const handleCreateTicket = (email: Email) => {
    if (onCreateTicketFromEmail) {
      onCreateTicketFromEmail(email);
    } else {
      // Logique par défaut pour créer un ticket
      alert(`Création d'un ticket depuis l'email: ${email.subject}`);
    }
  };

  const filteredEmails = emails.filter(email =>
    email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.snippet.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Emails Abonnés</h1>
        <p className="text-gray-600">Gérez vos emails et créez des tickets directement</p>
      </div>

      {/* Configuration Gmail */}
      {!isConfigured && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <Mail className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-lg font-semibold text-blue-900">Configuration Emails Abonnés</h2>
          </div>
          <p className="text-blue-800 mb-4">
            Pour utiliser cette fonctionnalité, vous devez configurer l'intégration avec l'API Gmail de Google.
          </p>
          <div className="space-y-2 text-sm text-blue-700">
            <p>• Créer un projet dans Google Cloud Console</p>
            <p>• Activer l'API Gmail</p>
            <p>• Configurer OAuth 2.0</p>
            <p>• Ajouter les identifiants dans les variables d'environnement</p>
          </div>
          <button
            onClick={() => setIsConfigured(true)}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Utiliser la démo
          </button>
        </div>
      )}

      {/* Interface principale */}
      {isConfigured && (
        <>
          {/* Barre d'outils */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative flex-1 min-w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Rechercher dans les emails..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Liste des emails */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Emails ({filteredEmails.length})
                </h2>
              </div>
              
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Chargement des emails...</p>
                  </div>
                ) : filteredEmails.length === 0 ? (
                  <div className="p-8 text-center">
                    <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Aucun email trouvé</p>
                  </div>
                ) : (
                  filteredEmails.map((email) => (
                    <div
                      key={email.id}
                      onClick={() => setSelectedEmail(email)}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        selectedEmail?.id === email.id ? 'bg-orange-50 border-r-4 border-orange-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className={`text-sm font-medium ${email.isRead ? 'text-gray-700' : 'text-gray-900 font-semibold'}`}>
                            {email.subject}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">{email.from}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {email.hasAttachments && (
                            <Paperclip className="w-3 h-3 text-gray-400" />
                          )}
                          {!email.isRead && (
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                        {email.snippet}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {formatDate(email.date)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreateTicket(email);
                          }}
                          className="text-xs px-2 py-1 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded transition-colors"
                        >
                          Créer ticket
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Détail de l'email sélectionné */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Détail de l'email</h2>
              </div>
              
              {selectedEmail ? (
                <div className="p-4 space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">{selectedEmail.subject}</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        <span>De: {selectedEmail.from}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>{formatDate(selectedEmail.date)}</span>
                      </div>
                      {selectedEmail.hasAttachments && (
                        <div className="flex items-center">
                          <Paperclip className="w-4 h-4 mr-2" />
                          <span>Pièces jointes</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Contenu:</h4>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {selectedEmail.body || selectedEmail.snippet}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleCreateTicket(selectedEmail)}
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Créer un ticket
                    </button>
                    <button
                      onClick={() => window.open(`mailto:${selectedEmail.from}`, '_blank')}
                      className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Sélectionnez un email pour voir les détails</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default GmailIntegration;