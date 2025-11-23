# 💰 Personal Finance - Aplikacion për Menaxhimin e Financave

> Aplikacion mobil për ndjekjen e shpenzimeve dhe të ardhurave, ndërtuar me React Native (Expo) dhe Supabase.

---

## 📱 Rreth Aplikacionit

**Personal Finance** është një aplikacion intuitiv që ju ndihmon të menaxhoni financat tuaja personale në mënyrë të thjeshtë dhe efikase. Ndiqni shpenzimet, të ardhurat, shihni raporte vizuale dhe merrni këshilla financiare të gjeneruara nga AI.

### ✨ Veçoritë Kryesore

- 🔐 **Autentifikim i Sigurt**: Regjistrim dhe login me Supabase Auth
- 💸 **Menaxhimi i Transaksioneve**: Shtoni, modifikoni dhe fshini shpenzime/të ardhura
- 📊 **Raporte Vizuale**: Grafik Pie dhe Bar për analizën e financave
- 🤖 **Këshilla AI**: Këshilla financiare të gjeneruara nga Google Gemini AI
- 👤 **Profili Personal**: Ngarkimi i fotos së profilit dhe ndryshimi i fjalëkalimit
- 🌐 **Multi-Platform**: Funksionon në Android, iOS dhe Web
- **Raporte Financiare**: Shikoni shpenzimet dhe të ardhurat përmes grafikëve vizualë.
- **Dark Mode**: Mundësi për të ndryshuar temën e aplikacionit (Light/Dark) nga ekrani kryesor.
- **AI Financial Advisor**: Integrim me Google Gemini për këshilla financiare të personalizuara.

---

## 🛠️ Teknologjitë e Përdorura

| Teknologjia | Qëllimi |
|------------|---------|
| **React Native** | Framework për zhvillimin e aplikacioneve mobile |
| **Expo** | Platforma për build, deploy dhe iterim të shpejtë |
| **Supabase** | Backend (Database, Auth, Storage) |
| **Google Gemini AI** | Gjenerimi i këshillave financiare |
| **React Navigation** | Navigimi ndërmjet ekraneve |
| **Victory Native** | Krijimi i grafikëve (Pie, Bar) |
| **Lucide React Native** | Ikonat moderne |
| **Expo Image Picker** | Zgjedhja e fotove nga galeria |

---

## 🚀 Instalimi dhe Konfigurimi

### Parakushtet

- Node.js (v16 ose më të re)
- npm ose yarn
- Expo CLI (instaloni globalisht: `npm install -g expo-cli`)
- Llogari në [Supabase](https://supabase.com)
- (Opsionale) Google AI Studio për Gemini API Key

### Hapat e Instalimit

1. **Klononi repositorin**

```bash
git clone https://github.com/gentrithyseni/AI-Mobile-Gentrit-Hyseni-PF.git
cd PersonalFinance
```

2. **Instaloni varësitë**

```bash
npm install
```

3. **Konfiguroni `.env` file**

Krijoni një skedar `.env` në rrënjën e projektit dhe shtoni kredencialet tuaja:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
EXPO_PUBLIC_GEMINI_API_KEY=your-gemini-api-key-here
```

4. **Konfiguroni Supabase Database**

Ekzekutoni SQL scripts në Supabase SQL Editor:

```bash
# 1. Krijo tabelat dhe kolonat
supabase_schema_fix.sql
supabase_schema_fix_v2.sql

# 2. Optimizo politikat RLS
supabase_optimization.sql

# 3. Konfiguro Storage për avatars
supabase_storage.sql
```

5. **Nisni aplikacionin**

```bash
npx expo start
```

Skanoni QR kodin me **Expo Go** (Android/iOS) ose hapni në shfletues për Web.

---

## 📖 Si të Përdorni Aplikacionin

### 1️⃣ **Regjistrohu / Hyni**
- Hapni aplikacionin dhe regjistrohuni me email dhe fjalëkalim
- Pasi të krijohet llogaria, do të hyni automatikisht

### 2️⃣ **Shtoni Transaksione**
- Klikoni butonin `+` në ekranin kryesor
- Zgjidhni llojin: **Shpenzim** ose **Të Ardhura**
- Vendosni shumën, kategorinë dhe përshkrimin
- Klikoni "Ruaj Transaksionin"

### 3️⃣ **Shihni Raportet**
- Shkoni te **Raporte** nga menyja e poshtme
- Shikoni grafikët Pie (sipas kategorive) dhe Bar (Të Ardhura vs Shpenzime)

### 4️⃣ **Menaxhoni Profilin**
- Shkoni te **Profili** nga menyja e poshtme
- Ngarkoni foto profili duke klikuar mbi ikonën e kamerës
- Ndryshoni të dhënat personale (Emri, Mbiemri, Gjinia, Ditëlindja)
- Ndryshoni fjalëkalimin në seksionin përkatës

### 5️⃣ **Dilni nga Llogaria**
- Klikoni ikonën e kuqe të daljes në këndin e sipërm djathtas (Kreu, Raporte, Profili)
- Ose klikoni butonin "Dil nga llogaria" në fund të faqes së Profilit

---

## 📂 Struktura e Projektit

```
PersonalFinance/
├── src/
│   ├── api/
│   │   ├── gemini.js          # Integrimi me Gemini AI
│   │   └── transactions.js    # CRUD për transaksionet
│   ├── config/
│   │   └── supabase.js        # Konfigurimi i Supabase Client
│   ├── contexts/
│   │   └── AuthContext.js     # Menaxhimi i sesionit të përdoruesit
│   └── screens/
│       ├── HomeScreen.js           # Ekrani kryesor (Dashboard)
│       ├── AddTransactionScreen.js # Shtimi/Modifikimi i transaksioneve
│       ├── AllTransactionsScreen.js # Lista e të gjitha transaksioneve
│       ├── ReportsScreen.js        # Raporte vizuale
│       ├── ProfileScreen.js        # Profili i përdoruesit
│       └── LoginScreen.js          # Login / Sign Up
├── App.js                     # Entry point i aplikacionit
├── .env                       # Variablat e mjedisit (nuk duhet të komitotohet)
└── README.md                  # Ky skedar
```

---

## 🔧 Zgjidhja e Problemeve

### Problem: "Column does not exist" në Supabase
**Zgjidhja**: Ekzekutoni `supabase_schema_fix.sql` dhe `supabase_schema_fix_v2.sql` në SQL Editor.

### Problem: Fshirja nuk funksionon në Web
**Zgjidhja**: Përdorni `window.confirm` në vend të `Alert.alert` (tashmë e rregulluar në kod).

### Problem: Gemini API nuk funksionon
**Zgjidhja**: 
- Kontrolloni që API Key të jetë i saktë në `.env`
- Nëse jeni në rajon të bllokuar, përdorni VPN ose aplikacioni do të shfaqë këshilla fallback.

### Problem: Session timeout në Web
**Zgjidhja**: Pastroni Local Storage në F12 > Application > Local Storage, ose bëni Sign Out dhe hyni përsëri.

---

## 📄 Liçensa

Ky projekt është zhvilluar për qëllime akademike në Universitetin AAB (Viti 3, Semestri 5 - Programimi për Pajisje Mobile).

---

## 👨‍💻 Autori

**Gentrit Hyseni**  
📧 Email: [gentrit.hyseni@example.com](mailto:gentrit.hyseni@example.com)  
🔗 GitHub: [gentrithyseni](https://github.com/gentrithyseni)

---

## 🙏 Falënderime

- [Expo Documentation](https://docs.expo.dev)
- [Supabase Documentation](https://supabase.com/docs)
- [React Native Community](https://reactnative.dev)
- [Google AI Studio](https://aistudio.google.com)
