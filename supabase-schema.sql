-- =============================================
-- PORTALE TURNI - DATABASE SCHEMA
-- Da eseguire nel SQL Editor di Supabase
-- =============================================

-- Estensione per UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABELLA PROFILES (Profili Utenti)
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'operator' CHECK (role IN ('admin', 'supervisor', 'operator')),
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) per profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Gli utenti possono vedere tutti i profili
CREATE POLICY "Profiles are viewable by authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Gli utenti possono aggiornare solo il proprio profilo
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Policy: Solo admin possono inserire nuovi profili
CREATE POLICY "Only admins can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- TABELLA SHIFTS (Turni)
-- =============================================
CREATE TABLE IF NOT EXISTS shifts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  shift_type TEXT NOT NULL CHECK (shift_type IN ('morning', 'afternoon', 'night')),
  location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX idx_shifts_user_id ON shifts(user_id);
CREATE INDEX idx_shifts_start_time ON shifts(start_time);
CREATE INDEX idx_shifts_shift_type ON shifts(shift_type);

-- RLS per shifts
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

-- Policy: Tutti gli utenti autenticati possono vedere tutti i turni
CREATE POLICY "Shifts are viewable by authenticated users"
  ON shifts FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Solo admin e supervisor possono creare turni
CREATE POLICY "Only admin and supervisor can create shifts"
  ON shifts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
    )
  );

-- Policy: Solo admin e supervisor possono aggiornare turni
CREATE POLICY "Only admin and supervisor can update shifts"
  ON shifts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
    )
  );

-- Policy: Solo admin può eliminare turni
CREATE POLICY "Only admin can delete shifts"
  ON shifts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- TABELLA SHIFT_SWAPS (Richieste Cambio Turno)
-- =============================================
CREATE TABLE IF NOT EXISTS shift_swaps (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  requested_by_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  swap_with_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  original_shift_id UUID REFERENCES shifts(id) ON DELETE CASCADE NOT NULL,
  target_shift_id UUID REFERENCES shifts(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted_by_operator', 'approved', 'rejected', 'cancelled')),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES profiles(id)
);

-- Indici per performance
CREATE INDEX idx_swap_requested_by ON shift_swaps(requested_by_id);
CREATE INDEX idx_swap_with ON shift_swaps(swap_with_id);
CREATE INDEX idx_swap_status ON shift_swaps(status);
CREATE INDEX idx_swap_created_at ON shift_swaps(created_at);

-- RLS per shift_swaps
ALTER TABLE shift_swaps ENABLE ROW LEVEL SECURITY;

-- Policy: Gli utenti possono vedere le richieste che li riguardano
CREATE POLICY "Users can view relevant swap requests"
  ON shift_swaps FOR SELECT
  TO authenticated
  USING (
    auth.uid() = requested_by_id OR
    auth.uid() = swap_with_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
    )
  );

-- Policy: Gli operatori possono creare richieste di cambio
CREATE POLICY "Users can create swap requests"
  ON shift_swaps FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requested_by_id);

-- Policy: Gli utenti coinvolti e i supervisor possono aggiornare le richieste
CREATE POLICY "Relevant users can update swap requests"
  ON shift_swaps FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = requested_by_id OR
    auth.uid() = swap_with_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
    )
  );

-- =============================================
-- TABELLA SWAP_MESSAGES (Messaggi per cambio turno)
-- =============================================
CREATE TABLE IF NOT EXISTS swap_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  swap_id UUID REFERENCES shift_swaps(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX idx_messages_swap_id ON swap_messages(swap_id);
CREATE INDEX idx_messages_created_at ON swap_messages(created_at);

-- RLS per swap_messages
ALTER TABLE swap_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Gli utenti possono vedere i messaggi delle richieste a cui sono coinvolti
CREATE POLICY "Users can view messages of relevant swaps"
  ON swap_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shift_swaps
      WHERE id = swap_id AND (
        requested_by_id = auth.uid() OR
        swap_with_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid() AND role IN ('admin', 'supervisor')
        )
      )
    )
  );

-- Policy: Gli utenti possono creare messaggi nelle richieste a cui sono coinvolti
CREATE POLICY "Users can create messages in relevant swaps"
  ON swap_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM shift_swaps
      WHERE id = swap_id AND (
        requested_by_id = auth.uid() OR
        swap_with_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid() AND role IN ('admin', 'supervisor')
        )
      )
    )
  );

-- =============================================
-- FUNZIONE: Crea profilo automaticamente dopo signup
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'operator')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger per creare profilo dopo signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- FUNZIONE: Aggiorna timestamp updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger per aggiornare updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- DATI DI ESEMPIO (OPZIONALE - per test)
-- =============================================
-- NOTA: Esegui questa sezione solo se vuoi dati di test
-- Dovrai prima creare gli utenti in Supabase Authentication

/*
-- Esempio: Inserimento turni di test
-- (sostituisci gli UUID con quelli reali dei tuoi utenti)

INSERT INTO shifts (user_id, start_time, end_time, shift_type, location) VALUES
  ('uuid-user-1', '2025-11-05 06:00:00+00', '2025-11-05 14:00:00+00', 'morning', 'Reparto A'),
  ('uuid-user-2', '2025-11-05 14:00:00+00', '2025-11-05 22:00:00+00', 'afternoon', 'Reparto B'),
  ('uuid-user-3', '2025-11-05 22:00:00+00', '2025-11-06 06:00:00+00', 'night', 'Reparto C');
*/

-- =============================================
-- FINE SCHEMA
-- =============================================
