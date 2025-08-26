import React from 'react';
import { Ticket, AlertCircle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import StatsCard from './StatsCard';
import { useTickets } from '../../hooks/useTickets';

const Dashboard: React.FC = () => {
  const { tickets } = useTickets();

  // Calcul des statistiques
  const totalTickets = tickets.length;
  const openTickets = tickets.filter(t => t.status === 'Ouvert').length;
  const inProgressTickets = tickets.filter(t => t.status === 'En cours').length;
  const closedTickets = tickets.filter(t => t.status === 'Fermé').length;
  const highPriorityTickets = tickets.filter(t => t.priority === 'Haute').length;

  const recentTickets = tickets
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Haute': return 'text-red-600 bg-red-100';
      case 'Moyenne': return 'text-yellow-600 bg-yellow-100';
      case 'Basse': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ouvert': return 'text-green-600 bg-green-100';
      case 'En cours': return 'text-blue-600 bg-blue-100';
      case 'Résolu': return 'text-orange-600 bg-orange-100';
      case 'Fermé': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Vue d'ensemble de l'activité des tickets</p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Tickets"
          value={totalTickets}
          icon={Ticket}
          color="blue"
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="En Cours"
          value={inProgressTickets}
          icon={AlertCircle}
          color="blue"
        />
        <StatsCard
          title="Tickets Ouverts"
          value={openTickets}
          icon={Clock}
          color="yellow"
        />
        <StatsCard
          title="Fermés"
          value={closedTickets}
          icon={CheckCircle}
          color="green"
          trend={{ value: 8, isPositive: true }}
        />
      </div>

      {/* Tickets récents */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Tickets Récents</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {recentTickets.map((ticket) => (
            <div key={ticket.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900 mb-1">
                    {ticket.subscriberId} - {ticket.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {ticket.description}
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>Créé le {new Date(ticket.createdAt).toLocaleDateString('fr-FR')}</span>
                    <span>•</span>
                    <span>Origine: {ticket.origin}</span>
                    <span>•</span>
                    <span>Canal: {ticket.channel}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                    {ticket.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Graphique de répartition par priorité */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Répartition par Priorité</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Haute</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ width: `${(highPriorityTickets / totalTickets) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900">{highPriorityTickets}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Moyenne</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full" 
                    style={{ width: `${(tickets.filter(t => t.priority === 'Moyenne').length / totalTickets) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900">{tickets.filter(t => t.priority === 'Moyenne').length}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Basse</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${(tickets.filter(t => t.priority === 'Basse').length / totalTickets) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900">{tickets.filter(t => t.priority === 'Basse').length}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Répartition par Origine</h2>
          <div className="space-y-3">
            {[
              'SAV / question technique',
              'Recouvrement', 
              'Plainte Installateur',
              'changement date prélèvement/RIB',
              'Résiliation anticipée / cession de contrat',
              'Ajout contrat / Flexibilité'
            ].map((status) => {
              const count = tickets.filter(t => t.status === status).length;
              const percentage = totalTickets > 0 ? (count / totalTickets) * 100 : 0;
              
              return (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 truncate" title={status}>
                    {status.length > 15 ? `${status.substring(0, 15)}...` : status}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-500 h-2 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-6 text-right">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Volume par Type de Problème</h2>
          <div className="space-y-3">
            {[
              'SAV / question technique',
              'Recouvrement', 
              'Plainte Installateur',
              'changement date prélèvement/RIB',
              'Résiliation anticipée / cession de contrat',
              'Ajout contrat / Flexibilité'
            ].map((type) => {
              const count = tickets.filter(t => t.type === type).length;
              const percentage = totalTickets > 0 ? (count / totalTickets) * 100 : 0;
              
              return (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 truncate" title={type}>
                    {type.length > 20 ? `${type.substring(0, 20)}...` : type}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-6 text-right">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;