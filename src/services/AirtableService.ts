import { Subscriber } from '../types';

export default class AirtableService {
  private apiKey: string;
  private baseId: string;
  private baseUrl: string;

  constructor(apiKey: string, baseId: string) {
    this.apiKey = apiKey;
    this.baseId = baseId;
    this.baseUrl = `https://api.airtable.com/v0/${baseId}`;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getSubscribers(): Promise<Subscriber[]> {
    console.log('🔄 AirtableService: Récupération des abonnés...');
    console.log('🔍 URL de base:', this.baseUrl);
    console.log('🔍 API Key (début):', this.apiKey.substring(0, 12) + '...');
    
    let allRecords: any[] = [];
    let offset: string | undefined;
    
    do {
      const params = new URLSearchParams({
        pageSize: '100',
        ...(offset && { offset })
      });
      
      console.log(`📊 Airtable: Récupération de la page ${Math.floor(allRecords.length / 100) + 1}...`);
      console.log(`📊 URL complète: ${this.baseUrl}/Abonnés?${params}`);
      
      let response: any;
      try {
        response = await this.makeRequest(`/Abonnés?${params}`);
        console.log('📊 Réponse reçue:', {
          recordsCount: response.records?.length || 0,
          hasOffset: !!response.offset,
          firstRecord: response.records?.[0]?.fields || 'Aucun'
        });
      
        allRecords = [...allRecords, ...response.records];
        offset = response.offset;
      } catch (error) {
        console.error('❌ Erreur lors de la requête Airtable:', error);
        console.error('❌ Détails de l\'erreur:', {
          message: error instanceof Error ? error.message : 'Erreur inconnue',
          stack: error instanceof Error ? error.stack : 'Pas de stack'
        });
        throw error;
      }
      
      if (response.records.length > 0) {
        console.log(`📊 Airtable: ${allRecords.length} abonnés récupérés jusqu'à présent...`);
      }
      
    } while (offset);

    console.log(`✅ Airtable: ${allRecords.length} abonnés récupérés au total`);

    return allRecords.map((record: any) => ({
      id: record.id,
      nom: record.fields['Nom'] || record.fields['nom'] || 'Nom manquant',
      prenom: record.fields['Prénom'] || record.fields['prenom'] || record.fields['Prenom'] || 'Prénom manquant',
      contratAbonne: record.fields['Contrat abonné'] || record.fields['contrat_abonne'] || record.fields['Contrat'] || record.id,
      nomEntreprise: record.fields['Nom entreprise'] || record.fields['nom_entreprise'] || record.fields['Entreprise'] || '',
      installateur: record.fields['Installateur'] || record.fields['installateur'] || '',
      lienCRM: record.fields['Lien CRM'] || record.fields['lien_crm'] || record.fields['CRM'] || '',
      email: record.fields['Email'] || record.fields['email'] || record.fields['E-mail'] || '',
      telephone: record.fields['Téléphone'] || record.fields['telephone'] || record.fields['Tel'] || record.fields['Phone'] || '',
    }));
  }

  async createTicketRecord(ticketData: any) {
    console.log('🎫 AirtableService: Création de ticket...');
    
    const response = await this.makeRequest('/Tickets', {
      method: 'POST',
      body: JSON.stringify({
        fields: {
          'Titre': ticketData.title,
          'Description': ticketData.description,
          'Statut': ticketData.status || 'Ouvert',
          'Priorité': ticketData.priority || 'Normale',
          'Client': ticketData.clientName,
          'Email': ticketData.clientEmail,
          'Date de création': new Date().toISOString(),
        }
      })
    });

    console.log('✅ Ticket créé dans Airtable:', response.id);
    return response;
  }

  async updateTicketRecord(recordId: string, ticketData: any) {
    console.log('🔄 AirtableService: Mise à jour de ticket...');
    
    const response = await this.makeRequest(`/Tickets/${recordId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        fields: {
          'Titre': ticketData.title,
          'Description': ticketData.description,
          'Statut': ticketData.status,
          'Priorité': ticketData.priority,
          'Date de modification': new Date().toISOString(),
        }
      })
    });

    console.log('✅ Ticket mis à jour dans Airtable:', response.id);
    return response;
  }
}