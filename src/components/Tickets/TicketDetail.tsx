import React, { useState } from 'react';
import { X, Edit, MessageCircle, Paperclip, Clock, User, Building, Phone, Mail, Calendar, Tag, AlertCircle, ExternalLink } from 'lucide-react';
import { Ticket } from '../../types';
import { useTickets } from '../../hooks/useTickets';
import { useAuth } from '../../contexts/AuthContext';
import { useSupabaseUsers } from '../../hooks/useSupabaseUsers';
import { useAirtable } from '../../hooks/useAirtable';

interface TicketDetailProps {
  ticket: Ticket;
  onClose: () => void;
}

const TicketDetail: React.FC<TicketDetailProps> = ({ ticket, onClose }) => {
  const { updateTicket, addComment } = useTickets();
  const { user } = useAuth();
  const { users } = useSupabaseUsers();
  const { subscribers } = useAirtable();
  const [newComment, setNewComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    status: ticket.status,
    priority: ticket.priority,
    assignedTo: ticket.assignedTo || ''
  });

  const handleStatusUpdate = async () => {
    try {
      console.log('🔍 Mise à jour avec les données:', editData);
      console.log('🔍 ID du ticket:', ticket.id);
      console.log('🔍 Statut actuel:', ticket.status);
      console.log('🔍 Nouveau statut:', editData.status);
      
      // Préparer les données de mise à jour
      const updateData = {
        status: editData.status,
        priority: editData.priority,
        assigned_to: editData.assignedTo === '' ? null : editData.assignedTo
      };
      
      console.log('🔍 Données à envoyer:', updateData);
      
      const result = await updateTicket(ticket.id, updateData);
      console.log('✅ Résultat de la mise à jour:', result);
      
      // Afficher un message de succès
      alert('Ticket mis à jour avec succès !');
      
      setIsEditing(false);
      
      // Fermer le modal et forcer le rechargement
      onClose();
      
      // Attendre un peu avant de recharger pour laisser le temps à Supabase
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      alert(`Erreur lors de la mise à jour du ticket: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      addComment(ticket.id, newComment).then(() => {
        // Le commentaire sera visible immédiatement grâce au rechargement des données
      }).catch((error) => {
        console.error('Erreur lors de l\'ajout du commentaire:', error);
        alert('Erreur lors de l\'ajout du commentaire');
      });
      setNewComment('');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Haute': return 'text-red-600 bg-red-100 border-red-200';
      case 'Moyenne': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'Basse': return 'text-green-600 bg-green-100 border-green-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Nouveau': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'En attente du client': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'En attente de l\'installateur': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'En attente retour service technique': return 'text-purple-600 bg-purple-100 border-purple-200';
      case 'Fermé': return 'text-gray-600 bg-gray-100 border-gray-200';
      case 'Ouvert': return 'text-green-600 bg-green-100 border-green-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'SAV / question technique': return AlertCircle;
      case 'Recouvrement': return Tag;
      case 'Plainte Installateur': return User;
      case 'changement date prélèvement/RIB': return Calendar;
      case 'Résiliation anticipée / cession de contrat': return X;
      case 'Ajout contrat / Flexibilité': return Building;
      default: return User;
    }
  };

  const TypeIcon = getTypeIcon(ticket.type);

  // Trouver l'abonné correspondant dans Airtable
  const subscriber = subscribers.find(sub => 
    ticket.subscriberId.includes(sub.contratAbonne) || 
    ticket.subscriberId.includes(`${sub.prenom} ${sub.nom}`)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex">
        {/* Contenu principal */}
        <div className="flex-1 overflow-y-auto">
          {/* En-tête */}
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <TypeIcon className="w-5 h-5 text-orange-500" />
                  <h1 className="text-xl font-semibold text-gray-900">
                    {ticket.subscriberId} - Ticket #{ticket.id}
                  </h1>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                    {ticket.status}
                  </span>
                </div>
                <h2 className="text-lg font-medium text-gray-900 mb-2">{ticket.title}</h2>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Créé le {new Date(ticket.createdAt).toLocaleDateString('fr-FR')}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    Mis à jour le {new Date(ticket.updatedAt).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Contenu */}
          <div className="p-6 space-y-6">
            {/* Description */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Description</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
              </div>
            </div>

            {/* Informations détaillées */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Informations du ticket</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Type</span>
                    <span className="text-sm font-medium text-gray-900 capitalize">{ticket.type}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Origine</span>
                    <span className="text-sm font-medium text-gray-900">{ticket.origin}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Canal</span>
                    <span className="text-sm font-medium text-gray-900">{ticket.channel}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600">Créé par</span>
                    <span className="text-sm font-medium text-gray-900">
                      {ticket.createdBy || 'Utilisateur inconnu'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Assignation</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Assigné à</span>
                    <span className="text-sm font-medium text-gray-900">
                      {ticket.assignedTo 
                        ? users.find(u => u.id === ticket.assignedTo)?.name || 'Utilisateur inconnu'
                        : 'Non assigné'
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Abonné</span>
                    <span className="text-sm font-medium text-gray-900">
                      {ticket.subscriberId}
                    </span>
                  </div>
                  {subscriber && subscriber.lienCRM && (
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Fiche CRM</span>
                      <a
                        href={subscriber.lienCRM}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors"
                      >
                        Voir la fiche
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                  )}
                  {ticket.installerId && (
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-600">Installateur</span>
                      <span className="text-sm font-medium text-gray-900">{ticket.installerId}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pièces jointes */}
            {ticket.attachments.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                  <Paperclip className="w-5 h-5 mr-2" />
                  Pièces jointes ({ticket.attachments.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {ticket.attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <Paperclip className="w-4 h-4 text-gray-400 mr-3" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{attachment.name}</p>
                        <p className="text-xs text-gray-500">
                          Ajouté le {new Date(attachment.uploadedAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Commentaires */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <MessageCircle className="w-5 h-5 mr-2" />
                Commentaires ({ticket.comments.length})
              </h3>
              
              <div className="space-y-4">
                {ticket.comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">{comment.authorName}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.createdAt).toLocaleDateString('fr-FR')} à {new Date(comment.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                  </div>
                ))}
                
                {/* Nouveau commentaire */}
                <div className="border-t border-gray-200 pt-4">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Ajouter un commentaire..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panneau d'édition */}
        {isEditing && (
          <div className="w-80 border-l border-gray-200 bg-gray-50 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Modifier le ticket</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut
                </label>
                <select
                  value={editData.status}
                  onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value as any }))}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priorité
                </label>
                <select
                  value={editData.priority}
                  onChange={(e) => setEditData(prev => ({ ...prev, priority: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="Basse">Basse</option>
                  <option value="Moyenne">Moyenne</option>
                  <option value="Haute">Haute</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigné à
                </label>
                <select
                  value={editData.assignedTo}
                  onChange={(e) => setEditData(prev => ({ ...prev, assignedTo: e.target.value }))}
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

              <div className="flex space-x-2 pt-4">
                <button
                  onClick={handleStatusUpdate}
                  className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                >
                  Sauvegarder
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketDetail;