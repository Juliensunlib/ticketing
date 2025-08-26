import React, { useState, useEffect } from 'react';
import { Mail, Plus, Search, RefreshCw, Calendar, User, Paperclip, ExternalLink, LogIn, LogOut } from 'lucide-react';
import gmailService from '../../services/gmailService';

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
  const [authenticating, setAuthenticating] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Vérifier si on a un token stocké
    if (gmailService.loadStoredToken()) {
      setIsAuthenticated(true);
      loadEmails();
    }

    // Gérer le retour de l'authentification OAuth
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      handleOAuthCallback(code);
    }
  }, []);

  const handleOAuthCallback = async (code: string) => {
    setAuthenticating(true);
    setError(null);
    
    try {
      await gmailService.exchangeCodeForToken(code);
      setIsAuthenticated(true);
      
      // Nettoyer l'URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Charger les emails
      await loadEmails();
    } catch (error) {
      console.error('Erreur lors de l\'authentification:', error);
      setError('Erreur lors de la connexion à Gmail. Veuillez réessayer.');
    } finally {
      setAuthenticating(false);
    }
  };

  const handleGmailLogin = () => {
    console.log('🔍 Configuration Gmail:', {
      clientId: gmailService.isConfigured() ? 'Configuré' : 'Manquant',
      redirectUri: import.meta.env.VITE_GMAIL_REDIRECT_URI
    });
    
    if (!gmailService.isConfigured()) {
      setError('Configuration Gmail manquante. Vérifiez vos variables d\'environnement.');
      return;
    }
    
    setError(null);
    const authUrl = gmailService.getAuthUrl();
    console.log('🔗 URL d\'authentification:', authUrl);
    window.location.href = authUrl;
  };

  const handleGmailLogout = () => {
    gmailService.logout();
    setIsAuthenticated(false);
    setEmails([]);
    setSelectedEmail(null);
    setError(null);
  };

  const loadEmails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const gmailMessages = await gmailService.getMessages(50);
      setEmails(gmailMessages);
    } catch (error) {
      console.error('Erreur lors du chargement des emails:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors du chargement des emails');
      
      if (error instanceof Error && error.message.includes('Token expiré')) {
        setIsAuthenticated(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (isAuthenticated) {
      await loadEmails();
    }
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
        <p className="text-gray-600">
          {isAuthenticated 
            ? 'Gérez vos emails Gmail et créez des tickets directement'
            : 'Connectez-vous à Gmail pour voir vos emails'
          }
        </p>
      </div>

      {/* Messages d'erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center">
            <Mail className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* État d'authentification */}
      {!isAuthenticated && !authenticating && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <Mail className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-lg font-semibold text-blue-900">Connexion Gmail</h2>
          </div>
          <p className="text-blue-800 mb-4">
            Connectez-vous à votre compte Gmail pour voir vos emails et créer des tickets.
          </p>
          <button
            onClick={handleGmailLogin}
            disabled={!gmailService.isConfigured()}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Se connecter à Gmail
          </button>
          {!gmailService.isConfigured() && (
            <p className="text-xs text-blue-600 mt-2">
              Configuration Gmail manquante. Vérifiez que votre fichier .env contient les variables VITE_GMAIL_*.
            </p>
          )}
          
          {/* Debug info en développement */}
          {import.meta.env.DEV && (
            <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
              <p><strong>Debug:</strong></p>
              <p>Client ID: {import.meta.env.VITE_GMAIL_CLIENT_ID ? '✅ Configuré' : '❌ Manquant'}</p>
              <p>Client Secret: {import.meta.env.VITE_GMAIL_CLIENT_SECRET ? '✅ Configuré' : '❌ Manquant'}</p>
              <p>Redirect URI: {import.meta.env.VITE_GMAIL_REDIRECT_URI || 'http://localhost:5173/auth/callback'}</p>
            </div>
          )}
        </div>
      )}

      {/* État d'authentification en cours */}
      {authenticating && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600 mr-3"></div>
            <p className="text-yellow-800">Connexion à Gmail en cours...</p>
          </div>
        </div>
      )}

      {/* Interface principale */}
      {isAuthenticated && (
        <>
          {/* Barre d'outils */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
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
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Actualiser
                </button>
                <button
                  onClick={handleGmailLogout}
                  className="flex items-center px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Se déconnecter de Gmail"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Connecté à Gmail • {emails.length} email{emails.length !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Liste des emails */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Boîte de réception ({filteredEmails.length})
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
                    <p className="text-gray-600">
                      {searchTerm ? 'Aucun email trouvé pour cette recherche' : 'Aucun email dans votre boîte de réception'}
                    </p>
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