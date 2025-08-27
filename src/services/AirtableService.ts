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
    
    let allRecords: any[] = [];
    let offset: string | undefined;
    
    do {
      const params = new URLSearchParams({
        pageSize: '100',
        ...(offset && { offset })
      });
      
      console.log(`📊 Airtable: Récupération de la page ${Math.floor(allRecords.length / 100) + 1}...`);
      
      const response = await this.makeRequest(`/Abonnés?${params}`);
      
      allRecords = [...allRecords, ...response.records];
      offset = response.offset;
      
      if (response.records.length > 0) {
        console.log(`📊 Airtable: ${allRecords.length} abonnés récupérés jusqu'à présent...`);
      }
      
    } while (offset);

    console.log(`✅ Airtable: ${allRecords.length} abonnés récupérés au total`);

    return allRecords.map((record: any) => ({
      id: record.id,
      name: record.fields['Nom'] || record.fields['Name'] || 'Nom manquant',
      email: record.fields['Email'] || record.fields['email'] || '',
      subscription: record.fields['Abonnement'] || record.fields['Subscription'] || 'Standard',
      status: record.fields['Statut'] || record.fields['Status'] || 'Actif',
      createdAt: record.fields['Date de création'] || record.fields['Created'] || record.createdTime,
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