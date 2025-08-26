import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginForm from './components/Auth/LoginForm';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import TicketForm from './components/Tickets/TicketForm';
import TicketList from './components/Tickets/TicketList';
import TicketDetail from './components/Tickets/TicketDetail';
import Settings from './components/Settings/Settings';
import { Ticket } from './types';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);

  const handleViewChange = (view: string) => {
    setActiveView(view);
    if (view === 'create') {
      setShowTicketForm(true);
    }
  };

  const handleTicketFormClose = () => {
    setShowTicketForm(false);
    setActiveView('dashboard');
  };

  const handleTicketFormSuccess = () => {
    // Optionnel : afficher une notification de succès
    console.log('Ticket créé avec succès !');
  };

  const handleViewTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
  };

  const handleCloseTicketDetail = () => {
    setSelectedTicket(null);
  };

  const handleEditTicket = (ticket: Ticket) => {
    setEditingTicket(ticket);
  };

  const handleCloseEditTicket = () => {
    setEditingTicket(null);
  };

  const handleEditTicketSuccess = () => {
    setEditingTicket(null);
    console.log('Ticket modifié avec succès !');
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'tickets':
        return <TicketList onViewTicket={handleViewTicket} onEditTicket={handleEditTicket} />;
      case 'settings':
        return <Settings />;
      case 'analytics':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Statistiques</h1>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <p className="text-gray-600">
                Les statistiques avancées seront disponibles prochainement.
              </p>
            </div>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Initialisation de l'application...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar activeView={activeView} onViewChange={handleViewChange} />
        <main className="flex-1">
          {renderContent()}
        </main>
      </div>

      {/* Modales */}
      {showTicketForm && (
        <TicketForm
          onClose={handleTicketFormClose}
          onSuccess={handleTicketFormSuccess}
        />
      )}

      {selectedTicket && (
        <TicketDetail
          ticket={selectedTicket}
          onClose={handleCloseTicketDetail}
        />
      )}

      {editingTicket && (
        <TicketForm
          ticket={editingTicket}
          onClose={handleCloseEditTicket}
          onSuccess={handleEditTicketSuccess}
        />
      )}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;