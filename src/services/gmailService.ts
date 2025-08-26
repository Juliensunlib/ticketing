interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload: {
    headers: Array<{
      name: string;
      value: string;
    }>;
    body?: {
      data?: string;
    };
    parts?: Array<{
      mimeType: string;
      body: {
        data?: string;
      };
    }>;
  };
  internalDate: string;
}

interface GmailListResponse {
  messages: Array<{
    id: string;
    threadId: string;
  }>;
  nextPageToken?: string;
  resultSizeEstimate: number;
}

class GmailService {
  private accessToken: string | null = null;
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private scope: string;

  constructor() {
    this.clientId = import.meta.env.VITE_GMAIL_CLIENT_ID || '';
    this.clientSecret = import.meta.env.VITE_GMAIL_CLIENT_SECRET || '';
    this.redirectUri = import.meta.env.VITE_GMAIL_REDIRECT_URI || 'http://localhost:5173/auth/callback';
    this.scope = import.meta.env.VITE_GMAIL_SCOPE || 'https://www.googleapis.com/auth/gmail.readonly';
    
    console.log('🔧 Configuration Gmail Service:', {
      clientId: this.clientId ? `${this.clientId.substring(0, 20)}...` : 'MANQUANT',
      clientSecret: this.clientSecret ? 'CONFIGURÉ' : 'MANQUANT',
      redirectUri: this.redirectUri,
      scope: this.scope
    });
  }

  isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret);
  }

  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: this.scope,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent'
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<void> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: this.redirectUri,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur OAuth: ${response.statusText}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      
      // Sauvegarder le token dans le localStorage
      localStorage.setItem('gmail_access_token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('gmail_refresh_token', data.refresh_token);
      }
    } catch (error) {
      console.error('Erreur lors de l\'échange du code:', error);
      throw error;
    }
  }

  loadStoredToken(): boolean {
    const token = localStorage.getItem('gmail_access_token');
    if (token) {
      this.accessToken = token;
      return true;
    }
    return false;
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  async makeGmailRequest(endpoint: string): Promise<any> {
    if (!this.accessToken) {
      throw new Error('Non authentifié');
    }

    const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expiré, supprimer et demander une nouvelle authentification
        this.logout();
        throw new Error('Token expiré, veuillez vous reconnecter');
      }
      throw new Error(`Erreur Gmail API: ${response.statusText}`);
    }

    return response.json();
  }

  async getMessages(maxResults: number = 50): Promise<any[]> {
    try {
      // Récupérer la liste des messages
      const listResponse: GmailListResponse = await this.makeGmailRequest(
        `messages?maxResults=${maxResults}&q=in:inbox`
      );

      if (!listResponse.messages || listResponse.messages.length === 0) {
        return [];
      }

      // Récupérer les détails de chaque message
      const messages = await Promise.all(
        listResponse.messages.slice(0, 10).map(async (msg) => {
          try {
            const messageDetail: GmailMessage = await this.makeGmailRequest(`messages/${msg.id}`);
            return this.parseMessage(messageDetail);
          } catch (error) {
            console.error(`Erreur lors de la récupération du message ${msg.id}:`, error);
            return null;
          }
        })
      );

      return messages.filter(msg => msg !== null);
    } catch (error) {
      console.error('Erreur lors de la récupération des messages:', error);
      throw error;
    }
  }

  private parseMessage(message: GmailMessage): any {
    const headers = message.payload.headers;
    const subject = headers.find(h => h.name === 'Subject')?.value || 'Sans sujet';
    const from = headers.find(h => h.name === 'From')?.value || 'Expéditeur inconnu';
    const date = headers.find(h => h.name === 'Date')?.value || message.internalDate;

    // Extraire le corps du message
    let body = message.snippet;
    if (message.payload.body?.data) {
      body = this.decodeBase64(message.payload.body.data);
    } else if (message.payload.parts) {
      const textPart = message.payload.parts.find(part => 
        part.mimeType === 'text/plain' && part.body.data
      );
      if (textPart?.body.data) {
        body = this.decodeBase64(textPart.body.data);
      }
    }

    return {
      id: message.id,
      subject,
      from,
      date: new Date(parseInt(message.internalDate)).toISOString(),
      snippet: message.snippet,
      body,
      hasAttachments: message.payload.parts?.some(part => 
        part.body && Object.keys(part.body).length > 1
      ) || false,
      isRead: !message.labelIds.includes('UNREAD')
    };
  }

  private decodeBase64(data: string): string {
    try {
      // Gmail utilise base64url, on doit le convertir en base64 standard
      const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
      return decodeURIComponent(escape(atob(base64)));
    } catch (error) {
      console.error('Erreur lors du décodage base64:', error);
      return data;
    }
  }

  logout(): void {
    this.accessToken = null;
    localStorage.removeItem('gmail_access_token');
    localStorage.removeItem('gmail_refresh_token');
  }
}

export default new GmailService();