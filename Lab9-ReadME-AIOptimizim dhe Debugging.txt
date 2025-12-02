# Lab 9: AI Debugging & Performance Optimization

## Faza 1: Debugging me AI

**Problemi:**
Gjatë zhvillimit të `AddTransactionScreen.js`, aplikacioni dështoi me gabimin:
`SyntaxError: Missing semicolon. (141:16)`

**Prompt-i për AI:**
"Kam këtë error në React Native. Këtu është kodi i komponentit. Shpjego shkakun dhe jep zgjidhjen."

**Zgjidhja:**
AI identifikoi që gjatë një "merge" ose editimi, një bllok kodi ishte dyfishuar gabimisht brenda funksionit `onSubmit`, duke prishur strukturën e objektit JS. U pastrua kodi i tepërt.

## Faza 2: Optimizim Performance

**Komponenti:** `AllTransactionsScreen.js`

**Problemi:**
Lista e transaksioneve përorte një funksion `renderItem` të definuar brenda komponentit kryesor, duke shkaktuar ri-krijim të panevojshëm të çdo rreshti gjatë çdo renderimi.

**Prompt-i për AI:**
"Ky është komponenti im `AllTransactionsScreen`. Dua ta optimizosh për më pak renderime dhe performancë më të mirë duke përdorur `useCallback` dhe `React.memo`."

**Ndryshimet e bëra:**
1. U krijua komponenti i ndarë `TransactionItem` i mbështjellë me `React.memo`.
2. U përdor `useCallback` për funksionin `renderItem` dhe `handlePress`.
3. Në `api/transactions.js`, u ndryshua query nga `select('*')` në `select('id, amount, category, description, date, type, user_id')` për të ulur ngarkesën e rrjetit.

**Rezultati:**
Lista tani është më e rrjedhshme (smoother) gjatë lëvizjes (scrolling) dhe koha e renderimit është ulur.

## Faza 3: Debugging i Avancuar (Shtesë)

**Problemi:**
Pas modifikimit të `ProfileScreen.js` për të shtuar zgjedhjen e monedhës, aplikacioni dështoi me error-in:
`SyntaxError: Expected corresponding JSX closing tag for <View>. (365:6)`

**Prompt-i për AI:**
"Kam këtë error në Expo: `SyntaxError: Expected corresponding JSX closing tag for <View>`. Këtu është kodi i `ProfileScreen.js`. Gjej ku mungon tag-u mbyllës."

**Zgjidhja:**
AI identifikoi që blloku `<View>` i seksionit "Cilësimet" nuk ishte mbyllur para se të fillonte seksioni tjetër "Mbështetje".
U shtua `</View>` dhe u rikthye butoni "Eksporto" që ishte fshirë gjatë editimit.

**Kodi i Rregulluar:**
```javascript
            <TouchableOpacity ...>
                {/* ... Currency Button ... */}
            </TouchableOpacity>

            {/* U rikthye butoni Eksporto dhe u mbyll View */}
            <TouchableOpacity ...>
                {/* ... Export Button ... */}
            </TouchableOpacity>
        </View> {/* <--- Tag-u që mungonte */}

        {/* Support Section */}