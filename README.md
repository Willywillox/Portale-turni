# 📅 Portale Turni - Sistema di Gestione Turnistica

Sistema completo per la gestione dei turni di lavoro e delle richieste di cambio turno tra operatori.

## ✨ Funzionalità

- 🔐 **Autenticazione sicura** con Supabase
- 📊 **Dashboard personale** con panoramica turni
- 📅 **Calendario mensile** con visualizzazione turni
- 🔄 **Sistema cambio turno** con workflow di approvazione
- 👥 **Gestione ruoli**: Admin, Supervisore, Operatore
- 🔔 **Notifiche real-time** per nuove richieste
- 📱 **Design responsive** (funziona su mobile, tablet, desktop)

## 🛠️ Stack Tecnologico

### Frontend
- React 19 + TypeScript
- Tailwind CSS
- React Router
- Supabase Client
- Lucide Icons
- date-fns

### Backend
- Supabase (PostgreSQL + Auth + Real-time)
- Row Level Security (RLS) per sicurezza dati

## 🚀 Setup Rapido

### 1. Crea Account Supabase (GRATUITO)

1. Vai su [https://supabase.com](https://supabase.com)
2. Clicca "Start your project"
3. Crea un nuovo progetto:
   - **Nome progetto**: Portale-Turni
   - **Database Password**: (scegli una password sicura)
   - **Region**: Europe West (più vicina all'Italia)
4. Attendi 1-2 minuti per la creazione

### 2. Configura il Database

1. Nel dashboard Supabase, vai su **SQL Editor** (icona database a sinistra)
2. Clicca "New Query"
3. Copia TUTTO il contenuto del file `supabase-schema.sql` (nella root del progetto)
4. Incolla nell'editor SQL
5. Clicca **RUN** in basso a destra
6. Dovresti vedere: "Success. No rows returned"

### 3. Ottieni le Credenziali API

1. Nel dashboard Supabase, vai su **Settings** → **API**
2. Troverai:
   - **Project URL**: es. `https://xxxxx.supabase.co`
   - **anon/public key**: una lunga stringa che inizia con `eyJ...`

### 4. Configura l'Applicazione

1. Vai nella cartella `frontend/`
2. Copia il file `.env.example` in `.env`:
   ```bash
   cd frontend
   cp .env.example .env
   ```
3. Apri il file `.env` e inserisci le tue credenziali:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJxxxxxxxxxxxx...
   ```

### 5. Avvia l'Applicazione in Locale

```bash
cd frontend
npm install
npm run dev
```

L'app sarà disponibile su: **http://localhost:5173**

## 👤 Crea il Primo Utente Admin

### Opzione 1: Da Supabase Dashboard (CONSIGLIATO)

1. Nel dashboard Supabase, vai su **Authentication** → **Users**
2. Clicca "Add user" → "Create new user"
3. Compila:
   - **Email**: tua.email@esempio.it
   - **Password**: (scegli una password)
   - **Auto Confirm User**: ✅ ATTIVA
4. Clicca "Create user"

5. Ora vai su **Table Editor** → **profiles**
6. Trova il profilo appena creato
7. Clicca per modificare e imposta:
   - **first_name**: Tuo Nome
   - **last_name**: Tuo Cognome
   - **role**: admin
8. Salva

### Opzione 2: Via SQL

Esegui questo comando nel SQL Editor di Supabase:

```sql
-- Crea un utente admin (SOSTITUISCI I DATI)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@esempio.it',  -- CAMBIA QUI
  crypt('password123', gen_salt('bf')),  -- CAMBIA PASSWORD
  NOW(),
  '{"first_name":"Mario","last_name":"Rossi","role":"admin"}',  -- CAMBIA QUI
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);
```

Ora puoi fare login con le credenziali che hai impostato!

## 📝 Crea Operatori

### Da Applicazione (come Admin)

Purtroppo la funzione di registrazione pubblica non è inclusa per sicurezza.
Gli operatori devono essere creati da Supabase dashboard come sopra.

### Script SQL per Creare Multipli Operatori

```sql
-- Esempio: Crea 3 operatori
-- Esegui nel SQL Editor di Supabase

-- OPERATORE 1
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_user_meta_data, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'operatore1@esempio.it',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"first_name":"Luca","last_name":"Bianchi","role":"operator","department":"Reparto A"}',
  NOW(),
  NOW()
);

-- Ripeti per altri operatori...
```

## 🚢 Deploy su Vercel (GRATUITO)

### 1. Prepara il Repository

Il codice è già pronto! Assicurati che tutto sia committato su GitHub.

### 2. Deploy su Vercel

1. Vai su [https://vercel.com](https://vercel.com)
2. Clicca "Sign Up" e autenticati con GitHub
3. Clicca "Add New" → "Project"
4. Seleziona il repository `Portale-turni`
5. Configura:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

6. **Environment Variables** (IMPORTANTE):
   Aggiungi le stesse variabili del file `.env`:
   - `VITE_SUPABASE_URL` = il tuo URL Supabase
   - `VITE_SUPABASE_ANON_KEY` = la tua chiave anon

7. Clicca **Deploy**

In 2-3 minuti avrai il sito live! Es: `https://portale-turni.vercel.app`

### 3. Configura Custom Domain (OPZIONALE)

Se hai un dominio:
1. In Vercel, vai su **Settings** → **Domains**
2. Aggiungi il tuo dominio (es: `turni.tuaazienda.it`)
3. Segui le istruzioni per configurare i DNS

## 📖 Come Usare il Sistema

### Per Operatori

1. **Login**: Accedi con email e password
2. **Dashboard**: Vedi i tuoi prossimi turni
3. **Calendario**: Visualizza tutti i tuoi turni del mese
4. **Richiedi Cambio Turno**:
   - Vai su "Cambi Turno"
   - Clicca su un turno che vuoi cambiare
   - Aggiungi motivazione
   - Invia richiesta

### Per Supervisori/Admin

1. Stesse funzioni degli operatori
2. **Visualizza tutti i turni** nel calendario
3. **Approva/Rifiuta** richieste di cambio turno
4. **Crea nuovi turni** (da fare via Supabase per ora)

## 🗂️ Struttura Database

```
profiles
├── id (UUID, PK)
├── email
├── first_name
├── last_name
├── role (admin|supervisor|operator)
└── department

shifts
├── id (UUID, PK)
├── user_id (FK → profiles)
├── start_time
├── end_time
├── shift_type (morning|afternoon|night)
├── location
└── notes

shift_swaps
├── id (UUID, PK)
├── requested_by_id (FK → profiles)
├── swap_with_id (FK → profiles)
├── original_shift_id (FK → shifts)
├── status
├── reason
└── approved_by
```

## 🔧 Gestione Turni

### Creare Turni (per Admin)

Per ora i turni devono essere creati manualmente da Supabase:

1. Vai su **Table Editor** → **shifts**
2. Clicca "Insert" → "Insert row"
3. Compila:
   - **user_id**: UUID dell'operatore (copialo da profiles)
   - **start_time**: es. `2025-11-05 06:00:00+00`
   - **end_time**: es. `2025-11-05 14:00:00+00`
   - **shift_type**: morning/afternoon/night
   - **location**: es. "Reparto A"

### Importazione Massiva

Per creare molti turni, usa SQL:

```sql
-- Esempio: Turni per una settimana
INSERT INTO shifts (user_id, start_time, end_time, shift_type, location) VALUES
  ('uuid-operatore-1', '2025-11-05 06:00:00+00', '2025-11-05 14:00:00+00', 'morning', 'Reparto A'),
  ('uuid-operatore-2', '2025-11-05 14:00:00+00', '2025-11-05 22:00:00+00', 'afternoon', 'Reparto B'),
  ('uuid-operatore-3', '2025-11-05 22:00:00+00', '2025-11-06 06:00:00+00', 'night', 'Reparto C');
  -- ... continua per altri giorni
```

## 🛡️ Sicurezza

- ✅ Autenticazione JWT con Supabase
- ✅ Row Level Security (RLS) attiva
- ✅ Password hashate con bcrypt
- ✅ HTTPS automatico su Vercel
- ✅ Variabili ambiente per credenziali
- ✅ Validazione input lato client e server

## 🐛 Troubleshooting

### "Invalid login credentials"
- Verifica che l'utente sia stato confermato (email_confirmed_at non null)
- Controlla che la password sia corretta
- Assicurati che esista un profilo in `profiles`

### "No rows returned" dopo aver eseguito lo schema
- È normale! Significa che lo schema è stato creato con successo

### Le variabili d'ambiente non funzionano
- Assicurati che il file `.env` sia nella cartella `frontend/`
- Riavvia il server di sviluppo (`npm run dev`)
- Su Vercel, controlla che le variabili siano configurate correttamente

### I turni non appaiono
- Verifica che `user_id` corrisponda all'ID del profilo loggato
- Controlla che le date siano nel formato corretto (ISO 8601)
- Guarda la console browser per errori

## 📞 Supporto

Per problemi o domande:
1. Controlla la console del browser (F12 → Console)
2. Controlla i log di Supabase (Dashboard → Logs)
3. Verifica le policy RLS in Supabase

## 🎯 Roadmap Future

- [ ] Interfaccia admin per creare turni
- [ ] Import turni da Excel/CSV
- [ ] Notifiche email automatiche
- [ ] App mobile (PWA)
- [ ] Report e statistiche
- [ ] Export PDF calendario
- [ ] Sistema di badge/incentivi

## 📄 Licenza

Questo progetto è sviluppato per uso interno aziendale.

---

**Fatto con ❤️ per semplificare la gestione dei turni**
