import React, { useState } from 'react';
import { Settings as SettingsIcon, Database, Users, Mail, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { useAirtable } from '../../hooks/useAirtable';

const Settings: React.FC = () => {
  const { subscribers, loading, error, loadData } = useAirtable();
  const [testingConnection, setTestingConnection] = useState(false);

  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      await loadData();
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Paramètres</h1>
        <p className="text-gray-600">Configuration et diagnostic de l'application</p>
      </div>

      {/* Diagnostic Airtable */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Database className="w-5 h-5 mr-2 text-orange-500" />
            Diagnostic Airtable
          </h2>
          <button
            onClick={handleTestConnection}
            disabled={testingConnection}
            className="flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${testingConnection ? 'animate-spin' : ''}`} />
            {testingConnection ? 'Test...' : 'Tester la connexion'}
          </button>
        </div>

        <div className="space-y-4">
          {/* Statut de la connexion */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <Users className="w-5 h-5 mr-3 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Base de données Abonnés</p>
                <p className="text-sm text-gray-600">
                  {subscribers.length} abonnés chargés
                </p>
              </div>
            </div>
            <div className="flex items-center">
              {error ? (
                <div className="flex items-center text-red-600">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">Erreur</span>
                </div>
              ) : subscribers.length > 0 ? (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">Connecté</span>
                </div>
              ) : (
                <div className="flex items-center text-yellow-600">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">En attente</span>
                </div>
              )}
            </div>
          </div>

          {/* Messages d'erreur détaillés */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-red-800 mb-2">
                    Problème de connexion Airtable
                  </h3>
                  <p className="text-sm text-red-700 mb-3">{error}</p>
                  
                  <div className="text-xs text-red-600 space-y-1">
                    <p><strong>Solutions possibles :</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Vérifiez que les variables VITE_AIRTABLE_API_KEY et VITE_AIRTABLE_SUBSCRIBERS_BASE_ID sont configurées dans Vercel</li>
                      <li>Vérifiez que la clé API Airtable est valide et a les bonnes permissions</li>
                      <li>Vérifiez que l'ID de la base Airtable est correct</li>
                      <li>Redéployez l'application après avoir modifié les variables d'environnement</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Informations de debug */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">
              Informations de diagnostic
            </h3>
            <div className="text-xs text-blue-700 space-y-1">
              <p><strong>Environnement :</strong> {import.meta.env.MODE}</p>
              <p><strong>Variables configurées :</strong></p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>VITE_AIRTABLE_API_KEY: {import.meta.env.VITE_AIRTABLE_API_KEY ? '✅ Configurée' : '❌ Manquante'}</li>
                <li>VITE_AIRTABLE_SUBSCRIBERS_BASE_ID: {import.meta.env.VITE_AIRTABLE_SUBSCRIBERS_BASE_ID ? '✅ Configurée' : '❌ Manquante'}</li>
                <li>VITE_SUPABASE_URL: {import.meta.env.VITE_SUPABASE_URL ? '✅ Configurée' : '❌ Manquante'}</li>
              </ul>
            </div>
          </div>

          {/* Statistiques */}
          {subscribers.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-green-800 mb-2">
                ✅ Connexion Airtable réussie
              </h3>
              <div className="text-sm text-green-700">
                <p><strong>{subscribers.length}</strong> abonnés disponibles dans le système</p>
                <p className="text-xs mt-1">
                  Les utilisateurs peuvent maintenant sélectionner des clients depuis la base Airtable
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Configuration Gmail */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
          <Mail className="w-5 h-5 mr-2 text-orange-500" />
          Configuration Gmail
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Intégration Gmail</p>
              <p className="text-sm text-gray-600">
                Permet de recevoir et envoyer des emails depuis l'application
              </p>
            </div>
            <div className="flex items-center text-blue-600">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span className="text-sm font-medium">Configuré</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;