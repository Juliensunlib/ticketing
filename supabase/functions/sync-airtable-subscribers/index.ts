import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface AirtableRecord {
  id: string;
  fields: {
    [key: string]: any;
  };
}

interface AirtableResponse {
  records: AirtableRecord[];
  offset?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔄 Début de la synchronisation Airtable → Supabase')

    // Initialiser Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Configuration Airtable
    const airtableApiKey = Deno.env.get('VITE_AIRTABLE_API_KEY')
    const airtableBaseId = Deno.env.get('VITE_AIRTABLE_SUBSCRIBERS_BASE_ID')

    if (!airtableApiKey || !airtableBaseId) {
      throw new Error('Configuration Airtable manquante')
    }

    console.log('✅ Configuration trouvée, début de la récupération des données Airtable')

    // Récupérer tous les abonnés depuis Airtable
    let allRecords: AirtableRecord[] = []
    let offset: string | undefined
    let pageCount = 0

    do {
      pageCount++
      console.log(`📊 Récupération de la page ${pageCount}...`)

      const params = new URLSearchParams({
        pageSize: '100',
        ...(offset && { offset })
      })

      const airtableUrl = `https://api.airtable.com/v0/${airtableBaseId}/Abonnés?${params}`
      
      const response = await fetch(airtableUrl, {
        headers: {
          'Authorization': `Bearer ${airtableApiKey}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Erreur Airtable: ${response.status} ${response.statusText}`)
      }

      const data: AirtableResponse = await response.json()
      allRecords = [...allRecords, ...data.records]
      offset = data.offset

      console.log(`📊 Page ${pageCount}: ${data.records.length} abonnés récupérés (total: ${allRecords.length})`)

    } while (offset && pageCount < 20) // Limite de sécurité

    console.log(`✅ ${allRecords.length} abonnés récupérés depuis Airtable`)

    // Transformer les données Airtable vers le format Supabase
    const subscribersData = allRecords.map(record => ({
      airtable_record_id: record.id,
      nom: record.fields['Nom'] || record.fields['nom'] || 'Nom manquant',
      prenom: record.fields['Prénom'] || record.fields['prenom'] || record.fields['Prenom'] || 'Prénom manquant',
      contrat_abonne: record.fields['Contrat abonné'] || record.fields['contrat_abonne'] || record.fields['Contrat'] || record.id,
      nom_entreprise: record.fields['Nom entreprise'] || record.fields['nom_entreprise'] || record.fields['Entreprise'] || null,
      installateur: record.fields['Installateur'] || record.fields['installateur'] || null,
      lien_crm: record.fields['Lien CRM'] || record.fields['lien_crm'] || record.fields['CRM'] || null,
      email: record.fields['Email'] || record.fields['email'] || record.fields['E-mail'] || null,
      telephone: record.fields['Téléphone'] || record.fields['telephone'] || record.fields['Tel'] || record.fields['Phone'] || null,
    }))

    console.log('🔄 Synchronisation avec Supabase...')

    // Récupérer les abonnés existants dans Supabase
    const { data: existingSubscribers, error: fetchError } = await supabase
      .from('subscribers')
      .select('airtable_record_id, contrat_abonne')

    if (fetchError) {
      throw new Error(`Erreur lors de la récupération des abonnés existants: ${fetchError.message}`)
    }

    const existingRecordIds = new Set(existingSubscribers?.map(s => s.airtable_record_id) || [])
    const existingContracts = new Set(existingSubscribers?.map(s => s.contrat_abonne) || [])

    // Séparer les nouveaux abonnés et les mises à jour
    const newSubscribers = subscribersData.filter(s => !existingRecordIds.has(s.airtable_record_id))
    const updatedSubscribers = subscribersData.filter(s => existingRecordIds.has(s.airtable_record_id))

    let insertCount = 0
    let updateCount = 0

    // Insérer les nouveaux abonnés
    if (newSubscribers.length > 0) {
      console.log(`➕ Insertion de ${newSubscribers.length} nouveaux abonnés...`)
      
      const { error: insertError } = await supabase
        .from('subscribers')
        .insert(newSubscribers)

      if (insertError) {
        console.error('❌ Erreur lors de l\'insertion:', insertError)
        throw new Error(`Erreur lors de l'insertion: ${insertError.message}`)
      }

      insertCount = newSubscribers.length
      console.log(`✅ ${insertCount} nouveaux abonnés insérés`)
    }

    // Mettre à jour les abonnés existants
    if (updatedSubscribers.length > 0) {
      console.log(`🔄 Mise à jour de ${updatedSubscribers.length} abonnés existants...`)
      
      for (const subscriber of updatedSubscribers) {
        const { error: updateError } = await supabase
          .from('subscribers')
          .update({
            nom: subscriber.nom,
            prenom: subscriber.prenom,
            contrat_abonne: subscriber.contrat_abonne,
            nom_entreprise: subscriber.nom_entreprise,
            installateur: subscriber.installateur,
            lien_crm: subscriber.lien_crm,
            email: subscriber.email,
            telephone: subscriber.telephone,
          })
          .eq('airtable_record_id', subscriber.airtable_record_id)

        if (updateError) {
          console.error(`❌ Erreur mise à jour abonné ${subscriber.airtable_record_id}:`, updateError)
        } else {
          updateCount++
        }
      }
      
      console.log(`✅ ${updateCount} abonnés mis à jour`)
    }

    // Supprimer les abonnés qui n'existent plus dans Airtable
    const airtableRecordIds = new Set(subscribersData.map(s => s.airtable_record_id))
    const toDelete = existingSubscribers?.filter(s => s.airtable_record_id && !airtableRecordIds.has(s.airtable_record_id)) || []

    let deleteCount = 0
    if (toDelete.length > 0) {
      console.log(`🗑️ Suppression de ${toDelete.length} abonnés obsolètes...`)
      
      const { error: deleteError } = await supabase
        .from('subscribers')
        .delete()
        .in('airtable_record_id', toDelete.map(s => s.airtable_record_id))

      if (deleteError) {
        console.error('❌ Erreur lors de la suppression:', deleteError)
      } else {
        deleteCount = toDelete.length
        console.log(`✅ ${deleteCount} abonnés supprimés`)
      }
    }

    const result = {
      success: true,
      message: 'Synchronisation terminée avec succès',
      stats: {
        total_airtable: allRecords.length,
        inserted: insertCount,
        updated: updateCount,
        deleted: deleteCount,
        final_count: allRecords.length
      }
    }

    console.log('✅ Synchronisation terminée:', result.stats)

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})