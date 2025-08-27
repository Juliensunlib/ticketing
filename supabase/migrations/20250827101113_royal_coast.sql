/*
  # Création de la table subscribers et synchronisation Airtable

  1. Nouvelle Table
    - `subscribers`
      - `id` (uuid, primary key)
      - `airtable_record_id` (text, unique, pour la synchronisation)
      - `nom` (text)
      - `prenom` (text)
      - `contrat_abonne` (text, unique)
      - `nom_entreprise` (text)
      - `installateur` (text)
      - `lien_crm` (text)
      - `email` (text)
      - `telephone` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Sécurité
    - Enable RLS sur la table subscribers
    - Politiques pour permettre la lecture à tous les utilisateurs authentifiés
    - Politiques pour permettre la synchronisation

  3. Index
    - Index sur contrat_abonne pour les recherches rapides
    - Index sur airtable_record_id pour la synchronisation
    - Index sur nom/prenom pour les recherches
*/

-- Créer la table subscribers
CREATE TABLE IF NOT EXISTS subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  airtable_record_id text UNIQUE,
  nom text NOT NULL,
  prenom text NOT NULL,
  contrat_abonne text UNIQUE NOT NULL,
  nom_entreprise text,
  installateur text,
  lien_crm text,
  email text,
  telephone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_subscribers_contrat_abonne ON subscribers(contrat_abonne);
CREATE INDEX IF NOT EXISTS idx_subscribers_airtable_record_id ON subscribers(airtable_record_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_nom_prenom ON subscribers(nom, prenom);
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_subscribers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour updated_at sur subscribers
DROP TRIGGER IF EXISTS update_subscribers_updated_at ON subscribers;
CREATE TRIGGER update_subscribers_updated_at
  BEFORE UPDATE ON subscribers
  FOR EACH ROW
  EXECUTE FUNCTION update_subscribers_updated_at();

-- Enable RLS
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour subscribers
CREATE POLICY "Authenticated users can read all subscribers"
  ON subscribers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role has full access to subscribers"
  ON subscribers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Politique pour permettre la synchronisation via les fonctions Edge
CREATE POLICY "Allow sync operations on subscribers"
  ON subscribers
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);