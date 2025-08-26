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

// Emails de démonstration simulant une vraie boîte mail d'abonnés
const demoEmails: Email[] = [
  {
    id: '1',
    subject: 'Problème avec mon installation solaire - Contrat SL-000123',
    from: 'jean.dupont@email.com',
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // Il y a 2h
    snippet: 'Bonjour, j\'ai un problème avec mon installation solaire. Les panneaux ne produisent plus d\'électricité depuis hier...',
    body: `Bonjour,

J'ai un problème avec mon installation solaire. Les panneaux ne produisent plus d'électricité depuis hier matin.

Détails de mon contrat :
- Nom : Jean Dupont
- Contrat : SL-000123
- Installation : 12 panneaux solaires
- Date d'installation : 15/03/2024

Pouvez-vous m'aider rapidement ? C'est urgent car je n'ai plus de production.

Cordialement,
Jean Dupont
06 12 34 56 78`,
    hasAttachments: false,
    isRead: false
  },
  {
    id: '2',
    subject: 'Demande de changement de RIB - Marie Martin',
    from: 'marie.martin@gmail.com',
    date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // Il y a 5h
    snippet: 'Bonjour, je souhaite changer mon RIB pour les prélèvements de mon contrat SL-000456...',
    body: `Bonjour,

Je souhaite changer mon RIB pour les prélèvements de mon contrat solaire.

Informations :
- Nom : Marie Martin
- Contrat : SL-000456
- Nouveau RIB en pièce jointe

Merci de prendre en compte ce changement pour le prochain prélèvement.

Cordialement,
Marie Martin`,
    hasAttachments: true,
    isRead: false
  },
  {
    id: '3',
    subject: 'Facture impayée - Relance',
    from: 'pierre.bernard@outlook.fr',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Hier
    snippet: 'Suite à votre courrier concernant ma facture impayée, je vous informe que...',
    body: `Madame, Monsieur,

Suite à votre courrier concernant ma facture impayée du mois dernier, je vous informe que j'ai eu des difficultés financières temporaires.

Contrat : SL-000789
Montant dû : 89,50€

Je peux régler cette facture en 2 fois si possible. Merci de me confirmer.

Cordialement,
Pierre Bernard`,
    hasAttachments: false,
    isRead: true
  },
  {
    id: '4',
    subject: 'Plainte contre installateur - Installation défectueuse',
    from: 'sophie.leroy@yahoo.fr',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // Il y a 2 jours
    snippet: 'Je souhaite porter plainte contre l\'installateur qui a réalisé mon installation...',
    body: `Bonjour,

Je souhaite porter plainte contre l'installateur EcoSolar qui a réalisé mon installation solaire.

Problèmes constatés :
- Installation non conforme aux normes
- Panneaux mal fixés
- Onduleur défaillant
- Installateur injoignable depuis 1 mois

Contrat : SL-000321
Installateur : EcoSolar SARL
Date d'installation : 10/01/2024

Photos en pièce jointe.

Cordialement,
Sophie Leroy`,
    hasAttachments: true,
    isRead: false
  },
  {
    id: '5',
    subject: 'Résiliation anticipée de contrat',
    from: 'michel.dubois@free.fr',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // Il y a 3 jours
    snippet: 'Je souhaite résilier mon contrat de location de panneaux solaires...',
    body: `Madame, Monsieur,

Je souhaite résilier mon contrat de location de panneaux solaires pour cause de déménagement.

Informations :
- Contrat : SL-000654
- Date de déménagement prévue : 15/02/2025
- Nouvelle adresse : 123 Rue de la Paix, 69000 Lyon

Merci de me faire parvenir les documents nécessaires.

Cordialement,
Michel Dubois`,
    hasAttachments: false,
    isRead: true
  },
  {
    id: '6',
    subject: 'Question technique - Monitoring',
    from: 'claire.moreau@gmail.com',
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // Il y a 4 jours
    snippet: 'J\'ai des questions sur l\'application de monitoring de ma production solaire...',
    body: `Bonjour,

J'ai des questions sur l'application de monitoring de ma production solaire.

Questions :
1. Comment consulter ma production mensuelle ?
2. Les données sont-elles mises à jour en temps réel ?
3. Comment signaler un problème via l'app ?

Contrat : SL-000987
Installation : 8 panneaux + 1 onduleur

Merci pour votre aide.

Cordialement,
Claire Moreau`,
    hasAttachments: false,
    isRead: true
  },
  {
    id: '7',
    subject: 'Demande d\'ajout de panneaux - Extension',
    from: 'thomas.petit@hotmail.com',
    date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // Il y a 6 jours
    snippet: 'Je souhaite ajouter des panneaux solaires à mon installation existante...',
    body: `Bonjour,

Je souhaite ajouter des panneaux solaires à mon installation existante.

Installation actuelle :
- Contrat : SL-000147
- 6 panneaux installés en mars 2024
- Production satisfaisante

Demande :
- Ajout de 4 panneaux supplémentaires
- Sur le même toit (place disponible)
- Devis souhaité

Merci de me recontacter.

Cordialement,
Thomas Petit
07 89 12 34 56`,
    hasAttachments: false,
    isRead: false
  }
];

const GmailIntegration: React.FC<GmailIntegrationProps> = ({ onCreateTicketFromEmail }) => {
  const [emails, setEmails] = useState<Email[]>(demoEmails);
  const [loading, setLoading] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleRefresh = async () => {
    setLoading(true);
    // Simuler un rechargement
    setTimeout(() => {
      // Ajouter un nouvel email de démonstration
      const newEmail: Email = {
        id: Date.now().toString(),
        subject: 'Nouveau message - Maintenance programmée',
        from: 'info.maintenance@sunlib.fr',
        date: new Date().toISOString(),
        snippet: 'Information importante concernant la maintenance de votre installation...',
        body: `Cher abonné,

Nous vous informons qu'une maintenance préventive de votre installation solaire est programmée.

Cette maintenance permettra de :
- Vérifier le bon fonctionnement des panneaux
- Nettoyer les surfaces
- Contrôler les connexions

Aucune action de votre part n'est requise.

Cordialement,
L'équipe SunLib`,
        hasAttachments: false,
        isRead: false
      };
      
      setEmails(prev => [newEmail, ...prev]);
      setLoading(false);
    }, 1000);
  };

  const handleCreateTicket = (email: Email) => {
    if (onCreateTicketFromEmail) {
      onCreateTicketFromEmail(email);
    } else {
      alert(`Création d'un ticket depuis l'email: ${email.subject}`);
    }
  };

  const markAsRead = (emailId: string) => {
    setEmails(prev => 
      prev.map(email => 
        email.id === emailId ? { ...email, isRead: true } : email
      )
    );
  };

  const filteredEmails = emails.filter(email =>
    email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.snippet.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'À l\'instant';
    } else if (diffInHours < 24) {
      return `Il y a ${diffInHours}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays === 1) {
        return 'Hier';
      } else if (diffInDays < 7) {
        return `Il y a ${diffInDays} jours`;
      } else {
        return date.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      }
    }
  };

  const unreadCount = emails.filter(email => !email.isRead).length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Emails Abonnés</h1>
        <p className="text-gray-600">
          Boîte mail des abonnés SunLib - {unreadCount} message{unreadCount !== 1 ? 's' : ''} non lu{unreadCount !== 1 ? 's' : ''}
        </p>
      </div>

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
          </div>
        </div>
        <div className="text-sm text-gray-600">
          Boîte mail SunLib • {emails.length} email{emails.length !== 1 ? 's' : ''} • {unreadCount} non lu{unreadCount !== 1 ? 's' : ''}
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
            {filteredEmails.length === 0 ? (
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
                  onClick={() => {
                    setSelectedEmail(email);
                    if (!email.isRead) {
                      markAsRead(email.id);
                    }
                  }}
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
                    <span>{new Date(selectedEmail.date).toLocaleString('fr-FR')}</span>
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
    </div>
  );
};

export default GmailIntegration;