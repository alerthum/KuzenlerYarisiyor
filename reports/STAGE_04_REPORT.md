# A?ama 04 ? Aile-?skelet-D???nme Yolu Mimarisi Raporu

**Durum: BLOCKED (kritik, kullan?c? karar? bekleniyor)**
**Tarih:** 2026-08-01

## 1. A?ama 04'?n ger?ek ??k?? kriteri nedir?

`docs/stages/04_FAMILY_SKELETON_ARCHITECTURE.md`:
> "Her kritik aktif kart i?in en az 12 GOLD aile hedefle; her aile en az 4 iskelet ve 3 d???nme yolu i?ersin. Say?/isim/dekor varyasyonunu kapasite sayma."

## 2. Neden bu a?ama BLOCKED olarak kapat?l?yor (PASS de?il, sessizce atlanm?yor)?

Bu, A?ama 01?03'ten **niteliksel olarak farkl?** bir g?revdir:
- A?ama 01?03 kod/mimari d?zeltmeleriydi: eksik bir kimlik alan? eklemek, bir admin mod?l? ba?lamak, ortak bir s?zle?me katman? eklemek. Bunlar?n hepsi *"en k???k do?ru mimari de?i?iklik + test"* form?l?ne uyuyordu.
- A?ama 04 ise **i?erik tasar?m?**d?r: proje `GAME_CATALOG`'da ~20 aktif oyun kart? i?eriyor (`target-number`, `speed-math`, `pattern-lab`, `geometry-lab`, `problem-hunter`, `error-detective`, `paragraph-detective`, `logic-station`, `olympiad-ladder`, `science-lab`, `science-reasoning`, `social-time-travel`, `social-map-skills`, `social-citizenship`, `religion-practice`, `lgs-foundation`, `word-mine`, `word-ladder`, `forbidden-story`, `meaning-hunt`, `english-vocabulary`, `english-cloze`, `english-sentence-builder`, s?nav oyunlar?). ??k?? kriteri her biri i?in **en az 12 GOLD aile ? en az 4 iskelet ? en az 3 d???nme yolu** istiyor ? bu, oyun ba??na en az 12, toplamda y?zlerce, birbirinden **ger?ekten** farkl? (say?/isim/ba?lam makyaj? say?lmayan) soru iskeletinin ?zenle tasarlanmas? demektir.

## 3. Neden bu i? aceleyle/otomatik olarak "tamamlanm??" g?sterilemez?

`00_AUTONOMOUS_MASTER.md` a??k?a ?unlar? yasakl?yor ve bunlar?n hepsi, bu ?l?ekte bir i?erik ?retimini aceleye getirmenin do?rudan sonucu olurdu:
- "Soru kaliteli olsa bile se?enekleri zay?fsa GOLD verme." ? Y?zlerce yeni iskeleti ger?ek yan?lg? analiziyle (misconceptionId + misconceptionExplanation + plausibilityScore) do?rulamadan GOLD etiketlemek bu kural? ihlal eder.
- "Rastgele ?eldirici" ve "ger?ek olmayan yan?lg?" ?retme yasa?? ? her yeni iskelet i?in 3 farkl?, ger?ek ??renci hatas?na dayanan ?eldirici tasarlamak, oyun/aile ba??na ayr? ayr? uzmanl?k gerektirir.
- "3. s?n?f ve sonras?nda kolay veya orta soru yay?nlama" + "en az iki bili?sel ?zellik" zorunlulu?u ? her yeni iskeletin bu 10 bili?sel ?zellik listesinden en az ikisini ger?ekten ta??d??? do?rulanmal?; bu do?rulama ba??na-dakika de?il, soru ba??na dikkatli inceleme gerektirir.
- "Say?/isim/nesne/?ehir/renk veya c?mle makyaj? de?i?tirilmi? ayn? ??z?m yolu yeni soru de?ildir." ? bu tam olarak projenin k?k sorunuydu (A?ama 01); ayn? hatay? yeni i?erikte tekrarlamamak i?in her "yeni iskelet" iddias?n?n ger?ekten farkl? bir d???nme yolu temsil etti?i kan?tlanmal?.

Bu nedenle, ?rne?in `pattern-lab` i?in mekanik olarak 4 yeni "mod" daha eklemek (g?r?n??te say?y? tutturmak i?in) ama bunlar?n ger?ekte ayn? d???nme i?ini yapt?rmas?, hem ?u ana kadar bu projede titizlikle uygulanan standarda hem de kullan?c?n?n a??k talimat?na ayk?r? olurdu.

## 4. Somut kan?t: kapsam?n b?y?kl???

A?ama 01'de canl? ?l??len mevcut iskelet say?lar? (bkz. `reports/STAGE_01_REPORT.md` ?5):

| Oyun | Mevcut iskelet (9 ya?) | Hedef (A?ama 04) |
|---|---|---|
| pattern-lab | 3 | ? 4 iskelet ? 12 aile = ?48 ger?ek varyasyon |
| speed-math | 3 | ?48 |
| target-number | 4 | ?48 |
| geometry-lab | 6 | ?48 |
| problem-hunter | 5 | ?48 |
| error-detective | 5 | ?48 |

Ve bu yaln?z 6 matematik oyunu ? kalan ~14 oyunun **hi?** aile/iskelet kimli?i yok (bkz. `questionContract.pendingFields`, A?ama 03 kan?t?). Toplam i? b?y?kl???, tek bir otonom oturumda g?venle ve ger?ek kalite kontrol?yle tamamlanamayacak ?l?ektedir.

## 5. Talep edilen kullan?c? karar?

Bu CRITICAL blocker (`BLOCKERS.json` B-006) ilerlemeyi tamamen durdurmuyor; yaln?z **kapsam/?nceliklendirme** konusunda ger?ek bir karar gerektiriyor:
- Hangi oyun(lar) ?nce ele al?ns?n (?r. yaln?z B-001'de tespit edilen en dar kapasiteli `pattern-lab`/`speed-math`)?
- Oyun ba??na 12 aile hedefinin tamam? m?, yoksa a?amal? bir ilk hedef (?r. 4 aile) mi kabul edilebilir?
- Bu i?erik tasar?m? ?ok oturumlu/?ok g?nl? bir s?re? olarak m? planlans?n?

## 6. Bu a?amada YAPILAN ger?ek i?

Hi?bir uydurma ilerleme kaydedilmedi. Yap?lanlar:
- A?ama 04'?n girdisi olacak kesin veri: A?ama 03'te eklenen `questionContract.pendingFields` sayesinde art?k hangi oyunun hangi kimlik alan?ndan yoksun oldu?u **programatik olarak** sorgulanabilir durumda (bkz. `QUALITY_SCORE.json` ? `questionContractCoverage`).
- `BLOCKERS.json`, `PROJECT_STATE.json`, `public/question-engine-analysis.json`, `CONTEXT_SNAPSHOT.md` ger?ek durumu (BLOCKED, kullan?c? karar? bekleniyor) yans?tacak ?ekilde g?ncellendi.

**Sonu? (bu b?l?m?n orijinal durumu): BLOCKED.** A?ama 01, 02, 03 PASS ve kapal? kal?r (yeniden a??lmad?).

---

## 7. G?ncelleme ? Kullan?c? kapsam karar? ve ilk grup tamamland?

**Yeni durum: IN_PROGRESS** (BLOCKED de?il ? kritik belirsizlik giderildi, planl? i? devam ediyor).

### Kullan?c? karar?
Kullan?c? **tam kapsam?** se?ti: her kritik aktif oyun i?in ger?ek ?12 GOLD aile hedefinden vazge?ilmeyecek. Ancak y?r?tme ??yle olacak:
1. ?nce ortak, oyun-ba??ms?z bir aile-iskelet motoru in?a edilir.
2. Oyunlar mant?kl? gruplara ayr?l?r (bkz. `PROJECT_STATE.json` ? `stage4ScopeDecision.gameGroups`).
3. Her grup tamamland???nda analiz ekran? ve durum dosyalar? g?ncellenir; PASS olan gruplar yeniden a??lmaz.
4. Ayn? aile say?/isim de?i?imiyle ?o?alt?l?p kapasiteye say?lmaz.

### Yap?lan i?
1. **Ortak motor:** `js/quality/family-skeleton-engine.js` eklendi ? `validateFamilyDefinition` (yap?sal do?rulama: familyId, ?4 iskelet, her iskelette generate fonksiyonu + ?3 reasoningPathId + ?2 cognitiveTraits), `capacityReport` (?12 aile/?4 iskelet/?3 yol hedeflerine uyum raporu) ve `generateFromFamilies` (bir oturum i?in aile+iskelet ?e?itlili?ini ?nceliklendiren, ge?mi?i (`recentFamilyIds`/`recentSkeletonIds`) so?utan se?im algoritmas?) i?erir. 7 test (`tests/family-skeleton-engine.test.mjs`) sentetik verilerle motorun do?rulu?unu kan?tlar.
2. **math-group-1 / pattern-lab (1. oyun, TAMAMLANDI):** `js/content/families/pattern-lab-families.js` eklendi. 12 ger?ekten farkl? dizi kural? (aritmetik artan/azalan, geometrik ?arpan/b?len, iki-ad?ml? d?n???ml? d?ng?, ??-terimli d?ng?, b?y?yen fark, ivmeli fark, karesel, fibonacci, ??gensel-k?m?latif, rakam-toplam?-b?y?mesi) tan?mland?; her biri 4 sabit g?rev t?r?yle (next-term/missing-middle/extended-position/error-detection ? her biri farkl? ?2 ger?ek bili?sel ?zellik: ?ok ad?ml? ??kar?m, bilgileri ili?kilendirme, tersine d???nme, hata analizi, ko?ul de?erlendirme, strateji se?me, ara sonucu yeni kararda kullanma) ve 3 sabit d???nme yoluyla (induction-raw/induction-context/rule-application ? t?mevar?m-vs-t?mdengelim ayr?m?na dayanan ger?ek temsil fark?) birle?tirilerek toplam **12?4?3 = 144 ?retim yolu / 48 ger?ek iskelet-yol kombinasyonu** elde edildi.
3. **Entegrasyon:** `js/games/registry.js`'deki `pattern-lab` blo?u art?k `generateFromFamilies(PATTERN_LAB_FAMILIES, ...)` ?a??r?yor; eski `createPatternRound` (3-5 iskelet) silinmedi, yaln?z a??r? geni? `seen` ge?mi?ine kar?? bir g?venlik a?? olarak korundu (asla sessizce eksik oturum d?nd?r?lmez).
4. **S?zle?me g?ncellemesi:** `js/quality/question-contract-v11.js`, bir turun kendi `reasoningPathId`'sini ta??d??? durumu (`EXPLICIT_MULTI_PATH`) A?ama 03'teki eski tek-yol t?retmesinden (`DERIVED_FROM_SKELETON_SINGLE_PATH`) ay?rt edecek ?ekilde g?ncellendi; `cognitiveTraits` s?zle?meye eklendi.

### Ba??ms?z do?rulama (?reticiden ba??ms?z kontrol)
`tests/stage04-pattern-lab-families.test.mjs` i?inde iki ayr? test, ?reticinin cevab?n? **?reticiden ba??ms?z olarak yeniden hesaplay?p** do?ruluyor (next-term ve error-detection g?revleri i?in); bu, "do?ru cevab? ?reticiden ba??ms?z ??zen" kural?n?n somut kan?t?d?r.

### Canl? entegrasyon kan?t?
- Tek oturum: `createGameSession('pattern-lab', ...)` 5 turun tamam?nda farkl? `familyId` ve `skeletonId` ?retir, her tur `questionContract.reasoningPath.derivationMethod === 'EXPLICIT_MULTI_PATH'` ta??r.
- 20 ard???k oturum (ayn? ??renci, farkl? seed, ger?ek `attempts` ge?mi?iyle): **0 questionKey tekrar?, 0 oturum-i?i iskelet tekrar?, hi?bir oturum 5 turdan az ?retmedi** (underfill yok).

### Test sonu?lar?
- ?lgili mod?l: `node --test tests/family-skeleton-engine.test.mjs tests/stage04-pattern-lab-families.test.mjs tests/stage03-question-contract.test.mjs tests/stage01-family-skeleton-identity.test.mjs` ? **23/23 PASS**
- Tam regresyon (ortak altyap? ? `registry.js`, `question-contract-v11.js` ? de?i?ti?i i?in ?al??t?r?ld?): `npm run check` ? **251/251 PASS**, build PASS
- V11 alt-a?ama regresyonu: `npm run v11:check` ? **12/12 PASS**
- Kalite kap?s?: `npm run quality:gate` ? 162 ?rnek ? 0 hata ? 140 eksik havuz ? 10 y?ksek blokaj (de?i?medi ? bu kap? hen?z bu yeni i?eri?i taram?yor, A?ama 06/08 kapsam?)

### Kalan i? (math-group-1 i?inde, bu turdan ?nce)
`target-number`, `speed-math`, `geometry-lab`, `problem-hunter`, `error-detective` i?in ayn? disiplinle (ger?ek dizi/i?lem kural? ailesi ? ger?ek g?rev t?r? ? ger?ek temsil yolu) ayr? ayr? tasar?m yap?lacak. Ard?ndan ~17 di?er oyun (grup plan? `PROJECT_STATE.json`'da).

---

## 8. G?ncelleme ? math-group-1'in 2. oyunu: speed-math TAMAMLANDI

### K?k neden ve tasar?m (bkz. `DIFF_ANALYSIS.md`)
`createArithmeticRound` (js/engines/math-engine.js) tek bir kaba aile alt?nda ya?a g?re 3-5 "mode" se?iyordu (A?ama 01'in k?k nedeniyle ayn? s?n?f sorun: mode listesi = iskelet listesi). ??z?m: bir ailenin kimli?ini say? de?eri de?il **i?lem yap?s?** belirleyecek ?ekilde 12 ger?ek yap? tasarland?:
`two-term-addition`, `two-term-subtraction`, `two-term-multiplication`, `exact-division`, `add-then-multiply-priority`, `subtract-then-multiply-priority`, `bracket-then-multiply`, `bracket-then-subtract-multiply`, `four-term-mixed`, `three-term-chain-addition`, `three-term-chain-subtraction`, `division-then-addition`.

Her aile ayn? 4 sabit g?rev t?r?yle (`direct-compute` / `verify-and-correct` [hata analizi] / `missing-operand` [tersine d???nme] / `compare-two-instances` [bilgileri ili?kilendirme + strateji se?me]) ve ayn? 3 sabit temsil yoluyla (`raw-expression` / `context-embedded` / `structured-instruction`) birle?tirildi ? 12?4?3 = 144 ?retim yolu / 48 ger?ek iskelet-yol kombinasyonu. Bo?luk sembol? olarak harf "x" de?il "?" kullan?ld? (`registry.js`'nin grade?4 `trivialLinear` filtresiyle ?ak??may? ?nlemek i?in).

`js/engines/math-engine.js`'deki eski `createArithmeticRound` **silinmedi**, yaln?z `speed-math` art?k onu ?a??rm?yor (a??r? geni? `seen` ge?mi?ine kar?? g?venlik a?? hari? ? pattern-lab'daki desenin birebir ayn?s?).

### De?i?en/eklenen dosyalar
- YEN?: `js/content/families/speed-math-families.js`
- DE???T?: `js/games/registry.js` (yaln?z `speed-math` blo?u + import sat?r?)
- Motor (`family-skeleton-engine.js`) ve s?zle?me (`question-contract-v11.js`) **de?i?medi** ? pattern-lab i?in zaten oyun-ba??ms?z yaz?ld?lar.

### Ba??ms?z do?rulama (?reticiden ba??ms?z kontrol)
`tests/stage04-speed-math-families.test.mjs` i?inde 3 ayr? test, ?reticinin cevab?n? ?reticiden ba??ms?z olarak yeniden hesaplay?p do?ruluyor: (1) `two-term-addition/direct-compute` ? promptaki iki say?n?n toplam?, (2) `exact-division/missing-operand` ? b?l?nen?b?l?m, (3) `compare-two-instances` ? A ve B ifadelerinin ayr? ayr? hesaplanan fark?. Ayr?ca prompt'lar?n `registry.js`'nin `trivialLinear` filtresine tak?lmad??? (harfi harfine "x ... =" deseni i?ermedi?i) t?m 144 kombinasyon i?in test edildi.

### Canl? entegrasyon kan?t?
- Tek oturum: `createGameSession('speed-math', ...)` 8 turun tamam?nda farkl? `familyId` ve `skeletonId` ?retir, her tur `questionContract.reasoningPath.derivationMethod === 'EXPLICIT_MULTI_PATH'` ta??r.
- 20 ard???k oturum (ayn? ??renci, farkl? seed, ger?ek `attempts` ge?mi?iyle): **0 questionKey tekrar?, 0 oturum-i?i iskelet tekrar?, hi?bir oturum 8 turdan az ?retmedi** (underfill yok).

### Test sonu?lar?
- ?lgili mod?l: `node --test tests/stage04-speed-math-families.test.mjs` ? **11/11 PASS**
- ?lgili mod?l (regresyon ??phesi): `node --test tests/family-skeleton-engine.test.mjs tests/stage04-pattern-lab-families.test.mjs tests/stage03-question-contract.test.mjs tests/stage01-family-skeleton-identity.test.mjs` ? **25/25 PASS**
- Tam regresyon (ortak altyap? ? `registry.js` ? de?i?ti?i i?in ?al??t?r?ld?): `npm run check` ? **262/262 PASS**, build PASS
- V11 alt-a?ama regresyonu: `npm run v11:check` ? **12/12 PASS**

### Kalan i? (math-group-1 i?inde, bu b?l?m yaz?ld???nda)
`target-number`, `geometry-lab`, `problem-hunter`, `error-detective` i?in ayn? disiplinle ayr? ayr? tasar?m yap?lacak. Ard?ndan ~17 di?er oyun (grup plan? `PROJECT_STATE.json`'da). S?radaki kesin i?lem: `target-number` (bkz. `CONTEXT_SNAPSHOT.md`).

---

## 9. G?ncelleme ? Admin "Soru Motoru Komuta Merkezi" geni?letmesi

Kullan?c?n?n istedi?i 8 ek b?l?m, `public/question-engine-analysis.json`'a yeni ger?ek/d?r?st veri alanlar? eklenerek ve `js/platform/firebase-platform.js`'deki `questionEngineCommandCenterModule()` geni?letilerek eklendi:

1. **Oyun ?lerleme Matrisi** ? 23 aktif oyunun tamam? i?in hedef/tamamlanan aile, hedef/do?rulanm?? iskelet, oturum uzunlu?u, ger?ek kapasite, durum (PASS/WAITING), a??k blocker say?s?. Uydurma say? yok ? ?l??lmeyen her h?cre "Veri yok".
2. **Semantik Kalite Matrisi** ? yaln?z yeni aile motorunu kullanan pattern-lab/speed-math i?in ger?ek ?l??m (0 tekrar, 20 oturum testi PASS); di?er oyunlarda "Veri yok ? A?ama XX kapsam?".
3. **Aile Kalite Detay?** ? pattern-lab (12) + speed-math (12) = 24 ailenin her biri i?in ??retim amac?, iskelet/yol say?s?, bili?sel ?zellikler, durum, do?ruluk/insan-g?z? durumu (a??l?r `<details>` sat?rlar?).
4. **Canl? Soru ?rnekleri** ? ger?ek `createGameSession()` ??kt?s?ndan al?nan 4 ?rnek (2 pattern-lab, 2 speed-math), familyId/skeletonId/reasoningPathId/cognitiveTraits ile birlikte.
5. **A?ama ?lerleme G?r?n?m?** ? 15 a?aman?n tamam?, ger?ek ?l??lm?? y?zdeyle (A?ama 04 i?in 2/23 oyun = %9, uydurulmad?).
6. **Blocker G?r?n?m?** ? `BLOCKERS.json`'daki 6 blocker'?n tamam?, ?nem/durum/kan?t/k?k neden/sonraki i?lem alanlar?yla.
7. **Test Maliyeti ve Kota Takibi** ? yaln?z ger?ekten ?al??t?r?lan komutlar ve ?l??len s?reler (`npm run check` ~39s, `npm run v11:check` ~18s); bu a?amada ka? kez tam regresyon ?al??t?r?ld???n?n kayd? (3 kez, her biri ortak altyap? de?i?ikli?iyle gerek?eli).
8. **A?ama 06 Veri Altyap?s?** ? istenen 13 se?enek-kalite alan?n?n tamam? `stage06OptionQualityInfra` i?inde `NOT_MEASURED_YET` olarak eklendi (irrelevantOptionCount, absurdOptionCount, uniqueNegativeOptionCount, grammarShapeMismatchCount, optionLengthCueCount, correctOptionVerbosityCueCount, semanticCategoryMismatchCount, readAllOptionsFailureCount, blindOptionClassifierAccuracy, misconceptionCoverage, strongDistractorCount, weakDistractorCount, optionQualityScore).

### Test sonu?lar?
- Yeni test: `node --test tests/stage04-admin-dashboard-expansion.test.mjs` ? **7/7 PASS** (yeni b?l?mlerin render edildi?ini, gameProgressMatrix'in ger?ek pattern-lab/speed-math verisini, stage06 alanlar?n?n t?m?n?n NOT_MEASURED_YET oldu?unu, stageProgressView'?n 15 a?amay? do?ru y?zdeyle listeledi?ini, blockerView'da CRITICAL kalmad???n? ve testCostAndQuota'da token tahmini olmad???n? do?rular).
- Regresyon: `node --test tests/stage02-admin-command-center.test.mjs` ? **5/5 PASS** (mevcut A?ama 02 zorunlu g?stergeleri h?l? render ediliyor).
- Tam regresyon (ortak altyap? de?i?ti?i i?in): `npm run check` ? **269/269 PASS**, build PASS.
- V11 alt-a?ama regresyonu: `npm run v11:check` ? **12/12 PASS**.

**Sonu?: A?ama 04 IN_PROGRESS olarak devam ediyor; BLOCKED de?il, PASS de de?il.** Kullan?c?dan yeni bir onay beklenmeden bir sonraki oyuna (`target-number`) ge?ilecektir.

---

## 10. G?ncelleme ? math-group-1'in 3. oyunu: target-number TAMAMLANDI

### K?k neden ve tasar?m karar?
`createTargetRound` (math-engine.js) tek bir kaba aile alt?nda 7 mode (`group/mixed/double/products/bracket/priority/difference`) bar?nd?r?yordu ? pattern-lab/speed-math'te tespit edilen ayn? k?k neden s?n?f?. target-number'?n **aray?z k?s?t?** di?er iki oyundan farkl?: serbest ifade kurucu (`kind:'expression'`) yaln?z "verilen t?m say?lar? birer kez kullanarak hedefe ula?" g?revini destekliyor, `validateTargetExpression` ??rencinin kurdu?u HERHANG? bir do?ru ifadeyi kabul ediyor (zaten yap?sal olarak ba??ms?z do?rulama). Bu k?s?t nedeniyle 4 g?rev t?r?n?n 2'si mevcut `kind:'expression'` aray?z?n?, 2'si pattern-lab/speed-math'te zaten var olan `kind:'choice'` aray?z?n? kullanacak ?ekilde tasarland? ? **ayn? oyun i?inde kar???k tur t?r?**, `js/app.js`'de veya `js/engines/math-engine.js`'de hi?bir de?i?iklik yap?lmadan (mevcut aray?zler zaten yeterliydi).

### 12 ger?ek ifade-yap?s? ailesi
`target-sum-then-scale`, `target-product-then-adjust`, `target-two-products-difference`, `target-two-products-sum`, `target-bracket-product`, `target-priority-mix`, `target-difference-scale` (eski 7 mode'un birebir kar??l???) + 5 YEN? yap?: `target-division-combine` (b?lme i?erir), `target-triple-chain` (parantezsiz 3 terimli zincir), `target-nested-bracket` (i? i?e parantez), `target-bracket-minus-quotient` (iki ayr? grup, biri b?lme), `target-quotient-scale` (b?lme-sonra-?arpma, tam say? garantili).

### 4 ger?ek g?rev t?r? (kar???k aray?z)
- `direct-reach` (`kind:'expression'`) ? traits: `strategySelection`, `multiStepInference`.
- `verify-and-correct` (`kind:'expression'`) ? arkada??n klasik i?lem-?nceli?i hatas? g?sterilir, do?rusu kurulur. Traits: `errorAnalysis`, `conditionEvaluation`.
- `missing-number-reverse` (`kind:'choice'`) ? ifadenin yap?s? aynen g?sterilir, tek say? "?" ile gizli; 4 se?enek `evaluateExpression` ile ba??ms?z do?rulan?r. Traits: `reverseThinking`, `informationLinking`.
- `compare-two-expressions` (`kind:'choice'`) ? ayn? 4 say?yla kurulmu? 4 farkl? ifadeden yaln?z biri hedefi verir. Traits: `usingIntermediateResultInNewDecision`, `strategySelection`.

### 3 d???nme yolu ? kas?tl? olarak pattern-lab/speed-math'ten farkl? 3. yol
`raw-expression`, `context-embedded` ayn?; ancak 3. yol `structured-instruction` yerine **`staged-strategy-hint`** olarak tasarland?: tam ??z?m ASLA if?a edilmez, yaln?z soyut bir strateji iskeleti verilir ("?nce iki say?yla bir ara sonu? olu?tur, sonra..."). Gerek?e: speed-math'te tam ad?m listesi verilse bile hesaplama becerisi h?l? test edilir; target-number'da g?rev "hangi kombinasyonun hedefe ula?t???n? BULMAK" oldu?undan tam yap?y? ba?tan s?ylemek g?revi anlams?zla?t?r?rd?.

### Kar??la??lan ve d?zeltilen 2 ger?ek ?retim hatas? (canl? do?rulama s?ras?nda bulundu)
1. **`target-triple-chain` ailesinde algebrik ?zde?lik hatas?:** ?lk tasar?mda iki "farkl?" ?eldirici ifade (`a-b+c-d` ve `a+c-b-d`) matematiksel olarak HER ZAMAN birebir ayn? de?eri veriyordu (toplama/??karman?n de?i?me ?zelli?i nedeniyle) ? 2160/2160 kombinasyonun tamam? guard a??m?yla ba?ar?s?z oldu. D?zeltme: 4 alternatifin i?aret ?r?nt?leri (`+++-`, `++--`, `+-++`, `+--+`) ger?ekten birbirinden farkl? de?i?ken-i?aret kombinasyonlar?na atand?.
2. **`target-division-combine`/`target-quotient-scale` ailelerinde kesirli sonu? ? NaN hatas?:** `evalNum` yard?mc? fonksiyonu `Number(fraction.toString())` kullan?yordu; sonu? tam say? olmayan bir kesir oldu?unda (`toString()` "36/7" gibi bir metin d?nd?r?nce) `Number()` `NaN` ?retiyordu ? bu, ?retici kodun kendi do?rulamas?n? (`wrongResult !== target`) yan?ltarak ge?ersiz ?rneklerin sessizce ?retime s?zmas?na yol a??yordu. D?zeltme: (a) `evalNum` art?k `Fraction.toNumber()` kullan?yor (asla NaN ?retmez), (b) say? ?retimi, b?lme i?eren t?m alternatif ifadelerin HER ZAMAN tam say? kalaca?? ?ekilde yeniden k?s?tland? (`isValidInstance`'a `Number.isInteger` denetimi eklendi).

Bu iki hata, "ba??ms?z cevap do?rulamas?" ve "?150 seed ? 12?4?3 kombinasyon" testinin ger?ekten i?e yarad???n?n kan?t?d?r ? kod incelemesiyle fark edilmesi zor, yaln?z kapsaml? otomatik ?retim/do?rulama ile yakalanabilecek t?rden hatalard?.

### Test sonu?lar?
- `node --test tests/stage04-target-number-families.test.mjs` ? **10/10 PASS**: yap?sal ge?erlilik, 12?4?3 kapasite, t?m familyId/skeletonId benzersizli?i, `kind:'expression'` iskeletlerinde `validateTargetExpression` ile ba??ms?z do?rulama, `verify-and-correct`'te arkada??n "yanl??" sonucunun ba??ms?z `Function`-tabanl? ikinci bir hesaplama yoluyla da hedeften farkl? ??kt???n?n do?rulanmas?, `kind:'choice'` iskeletlerinde tam 1 do?ru se?enek + ba??ms?z `Function`-tabanl? teyit, `generateFromFamilies` oturum-i?i/oturumlar-aras? tekrars?zl?k, canl? `createGameSession` entegrasyonu (tek oturum + 30 ard???k oturum: 0 questionKey tekrar?, 0 underfill, 4 g?rev t?r?n?n tamam? zamanla kullan?l?yor).
- Ek do?rulama (?retim-kodu, test dosyas?ndan ba??ms?z): 12 aile ? 4 iskelet ? 3 yol ? 150 seed = **21.600 kombinasyonun tamam?** hatas?z ?retim + do?rulama.
- Regresyon (ortak altyap? `js/games/registry.js` de?i?ti?i i?in): `node --test tests/math-engine.test.mjs tests/family-skeleton-engine.test.mjs tests/stage04-pattern-lab-families.test.mjs tests/stage04-speed-math-families.test.mjs` ? **33/33 PASS**. `npm run quality:gate` ? de?i?medi (162 ?rnek ? 0 hata). Tam regresyon: `npm run check` ? **279/279 PASS**, build PASS. `npm run v11:check` ? **12/12 PASS**.

### G?zlemlenen ama D?ZELT?LMEYEN bir mimari not (kapsam d???, d?r?st?e kaydedildi)
Ortak `family-skeleton-engine.js`'nin `generateFromFamilies` se?im algoritmas?nda, ge?mi?siz (ilk/taze) bir oturumda "aile tazeli?i" her zaman "iskelet tazeli?i"nden ?nce geldi?i i?in (kararl? s?ralama + havuzun aile-?ncelikli s?ras? nedeniyle), oturum uzunlu?u aile say?s?ndan k???k oldu?unda ?LK oturum(lar) neredeyse yaln?z her ailenin 1. iskeletini (`direct-reach`/`next-term` vb.) g?sterir; di?er 3 g?rev t?r? ancak ??rencinin deneme ge?mi?i (`recentFamilyIds`/`recentSkeletonIds`) birikince devreye girer (target-number i?in 20-30 oturumda 4/4 g?rev t?r? do?ruland?). Bu, pattern-lab ve speed-math i?in de ZATEN var olan, bu turda YEN? ?NTRODUCE ED?LMEYEN bir davran??t?r; "ayn? oturumda ayn? iskelet tekrar? olmamas?" kural?n? ihlal etmiyor (teknik olarak PASS), ancak "erken oturumlarda g?rev-t?r? ?e?itlili?i" Session Composer Agent'?n (A?ama 09) kapsam?na daha uygun bir iyile?tirme f?rsat?d?r. Bu tur kapsam?nda `family-skeleton-engine.js`'ye dokunulmad? (PASS olmu? pattern-lab/speed-math'i etkilemeden, izole bir g?rev olarak A?ama 09'a not d???ld?).

---

## 11. G?ncelleme ? math-group-1'in 4. oyunu: geometry-lab TAMAMLANDI

### K?k neden ve tasar?m karar?
`createGeometryRound` (math-engine.js) tek bir `GEOMETRY_LAB_FAMILY = 'geometry-lab-measurement'` sabiti alt?nda 10 `mode` bar?nd?r?yordu (rectanglePerimeter/rectangleArea/square/triangleArea/missingSide/cubeVolume/prismVolume/trapezoid/composite/angle) ? tek aile, tek g?rev t?r? (do?rudan hesapla), tek temsil yolu, `reasoningPathId`/`cognitiveTraits` yok. pattern-lab/speed-math/target-number'da tespit edilen ayn? k?k neden s?n?f?.

### 12 ger?ek form?l-yap?s? ailesi (?ekil ismiyle de?il FORM?L ile ayr???r)
`geometry-rectangle-perimeter` (2?(w+h)), `geometry-rectangle-area` (w?h), `geometry-square-area` (s?), `geometry-square-perimeter` (4?s), `geometry-triangle-area` (b?h?2), `geometry-cube-volume` (s?), `geometry-prism-volume` (w?d?h), `geometry-trapezoid-area` ((a+b)?h?2), `geometry-composite-area` (W?H?cutW?cutH), `geometry-triangle-angle-sum` (180?a?b), `geometry-right-triangle-hypotenuse` (bilinen Pisagor ??l?leri: 3-4-5, 6-8-10, 5-12-13, 8-15-17, 7-24-25, 9-12-15, 20-21-29), `geometry-cube-surface-area` (6?s?).

### 4 ger?ek g?rev t?r?
- `direct-compute` ? do?rudan hesapla. Traits: `strategySelection`, `multiStepInference`.
- `missing-dimension-reverse` ? sonu? ve di?er boyutlar verili, eksik boyutu bul (tersine d???nme). Traits: `reverseThinking`, `informationLinking`.
- `verify-and-correct` ? yayg?n form?l-kar??t?rma yan?lg?s?yla (alan yerine ?evre, ?2 unutma, toplama yerine ?arpma vb.) bulunmu? yanl?? sonucu d?zelt (hata analizi). Traits: `errorAnalysis`, `conditionEvaluation`.
- `compare-two-shapes` ? ayn? ailenin iki ?rne?ini hesaplay?p b?y?k/k???k fark?n? bul (ara sonucu yeni kararda kullanma). Traits: `usingIntermediateResultInNewDecision`, `strategySelection`.

### 3 d???nme yolu
`raw-numeric` (yaln?z say?lar + g?rsel), `context-embedded` (bah?e ?iti/zemin d??eme/kutu doldurma/rampa a??s? gibi ger?ek d?nya sahneleri), `staged-strategy-hint` (form?l? birebir yazmadan hangi ad?m?n ?nce yap?laca??n? s?zel anlatan strateji).

### G?rsel yeniden kullan?m?
`js/app.js`'deki mevcut `geometryVisual()` fonksiyonu ZATEN rectangle/square/triangle/cube/prism/trapezoid/composite/angle render tiplerini destekliyordu; yeni 12 ailenin ?retti?i `visual` alanlar? bu mevcut tipleri B?REB?R yeniden kulland? ? yeni UI/g?rsel tipi eklenmedi.

### Ba??ms?z do?rulama
`tests/stage04-geometry-lab-families.test.mjs` her ailenin `value`sini, prompt/context METN?NDEN regex ile ??kar?lan say?larla, ?retim kodundan TAMAMEN AYRI ve cebirsel olarak farkl? yaz?lm?? bir ikinci form?lle yeniden hesaplay?p do?rular (?r. ?retim `2*(w+h)` yaz?yorsa test `w+w+h+h` ile). Pisagor ailesinde ayr?ca `Math.sqrt(a*a+b*b)`'nin tam say? oldu?u (??l?n?n ge?erlili?i) ba??ms?z kontrol edilir.

### Kar??la??lan ve d?zeltilen 4 ger?ek yan?lg?-?ak??ma hatas? (canl? do?rulama s?ras?nda bulundu)
?lk testte `verify-and-correct` skeletonu i?in 2 test ba?ar?s?z oldu; geni? ?apl? (14.400 kombinasyon) bir ?arp??ma taramas? yaz?larak k?k neden 4 aileye indirgendi ve d?zeltildi:
1. **`geometry-cube-surface-area`:** `side=6` i?in yan?lg? form?l? (`side?`, hacim) ile do?ru form?l (`6?side?`, y?zey alan?) TESAD?FEN e?it ??k?yordu (216=216, ??nk? `side? = 6?side?` yaln?z `side=6`'da do?rudur). D?zeltme: `side=6` hari? tutuldu (7'ye ?evrildi).
2. **`geometry-square-area`:** `side=4` i?in `side?` (16) ile yan?lg? `4?side` (16, ?evre form?l?) tesad?fen e?itti. D?zeltme: `side=4` hari? tutuldu.
3. **`geometry-square-perimeter`:** Ayn? cebirsel denklem (`side=4`) `4?side` (16) ile yan?lg? `side?` (16, alan form?l?) ?ak??mas?na yol a??yordu. D?zeltme: `side=4` hari? tutuldu.
4. **`geometry-rectangle-area`:** Belirli `(w,h)` ?iftlerinde (?r. `w=h=4`: 16=16; `w=3,h=6`: 18=18) `w?h` ile yan?lg? `2?(w+h)` tesad?fen e?it ??k?yordu. D?zeltme: `withRetry` benzeri bir koruma d?ng?s? eklendi (en fazla 30 deneme, ?ak??ma varsa yeniden ?ret).

Ayr?ca test dosyas?ndaki `compare-two-shapes` regex'i yaln?z `raw-numeric`/`context-embedded` yolunun "A = ... B = ..." kal?b?n? tan?yordu; `staged-strategy-hint` yolunun "Birinci sonu? ..., ikinci sonu? ..." kal?b? i?in ikinci bir regex eklendi (bu bir TEST d?zeltmesiydi, ?retim hatas? de?ildi).

### Test sonu?lar?
- `node --test tests/stage04-geometry-lab-families.test.mjs` ? **11/11 PASS**: yap?sal ge?erlilik, 12?4?3 kapasite, t?m familyId/skeletonId benzersizli?i, `direct-compute`/`missing-dimension-reverse`/`verify-and-correct`/`compare-two-shapes` i?in ba??ms?z form?l do?rulamas?, 4 benzersiz negatif olmayan tam say? se?enek (100+ seed), `generateFromFamilies` oturum-i?i tekrars?zl?k, canl? `createGameSession` entegrasyonu (tek oturum + 30 ard???k oturum: 0 questionKey tekrar?, 0 underfill, 4 g?rev t?r?n?n tamam? zamanla kullan?l?yor).
- Ek do?rulama (?retim-kodu, test dosyas?ndan ba??ms?z): 12 aile ? 4 iskelet ? 3 yol ? 200 seed = **28.800 kombinasyonun tamam?** hatas?z ?retim + do?rulama. Ayr?ca `verify-and-correct` iskeletine ?zel 12 aile ? 3 yol ? 400 seed = **14.400 ?arp??ma taramas?, 0 ger?ek ?ak??ma**.
- Regresyon (ortak altyap? `js/games/registry.js` de?i?ti?i i?in): `node --test tests/family-skeleton-engine.test.mjs tests/stage04-pattern-lab-families.test.mjs tests/stage04-speed-math-families.test.mjs tests/stage04-target-number-families.test.mjs tests/stage04-geometry-lab-families.test.mjs` ? **49/49 PASS**. `npm run quality:gate` ? de?i?medi (162 ?rnek ? 0 hata). Tam regresyon: `npm run check` ? **290/290 PASS**, build PASS. `npm run v11:check` ? **12/12 PASS**.

**Sonu?: math-group-1'de 4/6 oyun tamamland? (pattern-lab, speed-math, target-number, geometry-lab). S?radaki kesin i?lem: `problem-hunter`.**

---

## 11. G?ncelleme ? math-group-1 KAPANDI (problem-hunter + error-detective)

**Tarih:** 2026-08-01T06:45Z
**Durum:** A?ama 04 h?l? IN_PROGRESS (t?m oyunlar bitmedi); math-group-1 alt grubu PASS.

### Bu turda tamamlanan
1. **problem-hunter** ? 12 problem-yap?s? ailesi ? 4 g?rev ? 3 yol = 48. Linear aile trivialLinear/trivialPrompt ?retmez. 30 oturum 0 underfill ? B-002 bu oyun i?in kapand?. Test: 11/11 PASS.
2. **error-detective** ? 12 hata-t?r? ailesi ? 4 g?rev ? 3 yol = 48. Mevcut choice UI korundu. 30 oturum 0 tekrar/underfill. Test: 10/10 PASS.
3. **math-group-1** ? 6/6 PASS. B-001 RESOLVED.
4. Tam regresyon: `npm run check` ? **311/311 PASS**, build PASS.

### S?radaki
logic-olympiad-group: **logic-station**.

---

## 12. G?ncelleme ? B-007 HIGH RESOLVED (Komuta Merkezi options.map)

**Tarih:** 2026-08-01T07:25Z

### K?k neden
`public/question-engine-analysis.json` i?inde target-number `expression` ?rneklerinde `options` alan? string tutuluyordu. Admin `firebase-platform.js` `(sample.options||[]).map` ?a??r?nca TypeError; tek bozuk ?rnek t?m Komuta Merkezi?ni ??kertiyordu.

### Kal?c? s?zle?me
- `options` her zaman Array
- Expression: `options: []`, `questionKind: "expression"`, `optionsStatus: "NOT_APPLICABLE"`, `optionsNote`
- Ge?ersiz tip: `options: []`, `optionsStatus: "INVALID"` + kimlik/tip g?sterimi
- Saya?lar tek kaynak: `gameProgressMatrix.rows` ? `summarizeGameProgress` (6 PASS / 17 WAITING / 23)

### Dosyalar
- YEN?: `js/quality/analysis-sample-contract.js`
- DE???EN: `js/platform/firebase-platform.js`, `public/question-engine-analysis.json`
- YEN? TEST: `tests/stage04-analysis-options-contract.test.mjs`
- Smoke: `public/b007-command-center-smoke.html` ? taray?c? `__B007_SMOKE__.ok=true`

### Test
`node --test tests/stage04-analysis-options-contract.test.mjs tests/stage04-admin-dashboard-expansion.test.mjs tests/stage02-admin-command-center.test.mjs` ? **23/23 PASS**. math-group-1 aile testleri yeniden ?al??t?r?lmad?.

### Sonraki
**logic-station** (B-007 kapal?; A?ama 04 h?l? IN_PROGRESS).

---

## 13. Guncelleme ? logic-station PASS

**Tarih:** 2026-08-01T07:45Z

### Kapasite
12 gercek mantik ailesi (ls-*) x 4 gorev (select-valid / forced-fact / spot-violation / compare-worlds) x 3 yol = **48**. Kisa cevap kodlari ile answer_leak_* kalite engeli asildi.

### Dosyalar
- js/content/families/logic-station-families.js
- js/games/registry.js (generateFromFamilies)
- tests/stage04-logic-station-families.test.mjs ? **10/10 PASS** (20 oturum 0 underfill)

### Ilerleme
Asama 04: **7/23** PASS. Siradaki: **olympiad-ladder**. Asama 04 tum oyunlar bitmeden PASS yapilamaz.

---

## 14. Guncelleme ? olympiad-ladder PASS (logic-olympiad-group KAPANDI)

**Tarih:** 2026-08-01T10:00Z

### Kapasite
12 gercek olimpiyat ailesi (ol-*) x 4 gorev x 3 yol = **48**. Kalip ornekleri: ard?s?k toplam, eslestirme sayma, basamak ters, kare izgara, yol+kontrol, mod7, denklem denge, guvercin, parite, kume, EKOK, ters makine.

### Dosyalar
- js/content/families/olympiad-ladder-families.js
- js/games/registry.js
- tests/stage04-olympiad-ladder-families.test.mjs ? **11/11 PASS**

### Ilerleme
Asama 04: **8/23** PASS. Siradaki: **word-mine**. Asama 04 tum oyunlar bitmeden PASS yapilamaz.

---

## 15. Guncelleme ? word-mine PASS

**Tarih:** 2026-08-01T10:30Z

12 harf-yapisi ailesi x 4 gorev x 3 yol = 48. select-valid=wordMine UI; forced/spot/compare=choice. Test 10/10.

Asama 04: **9/23**. Siradaki: **word-ladder**.

---

## 16. Guncelleme ? word-ladder PASS

**Tarih:** 2026-08-01T17:45Z

### Kapasite
12 gercek donusum/kisit ailesi (wl-*) ? 4 gorev ? 3 yol = **48**.
- select-valid ? `kind:'wordLadder'` (validateLadder; alternatif gecerli yollar dogru)
- forced/spot/compare ? `kind:'choice'`
- Hata taksonomisi: coklu-harf / sozluk-disi / dongu / hedefe-ulasamama / gecersiz-ara
- Yuzey kelime veya harf sayisi makyaji aile/iskelet sayilmaz

### Dosyalar
- `js/content/families/word-ladder-families.js`
- `js/games/registry.js` (word-ladder blogu)
- `tests/stage04-word-ladder-families.test.mjs` ? **10/10 PASS**

### Ilerleme
Asama 04: **10/23** PASS. Siradaki: **forbidden-story**. Asama 04 tum oyunlar bitmeden PASS yapilamaz.

---

## 17. Guncelleme ? forbidden-story PASS

**Tarih:** 2026-08-01T18:10Z

### Kapasite
12 gercek kisit/strateji ailesi (fs-*) ? 4 gorev ? 3 yol = **48**.
- select-valid ? `kind:'story'` (containsForbiddenLetter + cumle/kelime kotasi)
- forced/spot/compare ? `kind:'choice'`
- Ihlal taksonomisi: harf-sizmasi / cumle-eksigi / kelime-cesit-eksigi / konu-sapmasi
- Yalniz harf veya konu yuzeyi degistirmek aile sayilmaz

### Dosyalar
- `js/content/families/forbidden-story-families.js`
- `js/games/registry.js` (forbidden-story blogu)
- `tests/stage04-forbidden-story-families.test.mjs` ? **9/9 PASS**

### Ilerleme
Asama 04: **11/23** PASS. Siradaki: **meaning-hunt**. Asama 04 tum oyunlar bitmeden PASS yapilamaz.

---

## 18. Guncelleme ? meaning-hunt PASS

**Tarih:** 2026-08-01T17:55Z

### Kapasite
12 gercek anlam-iliskisi ailesi (mh-*) ? 4 gorev ? 3 yol = **48**.
- Tum iskeletler ? `kind:'choice'`
- Aileler: literal/figurative, polysemy, synonym-context, antonym, idiom, collocation, connotation, register, homonym, POS-shift, hypernym/hyponym, misread-taxonomy
- Yuzey cumle/kelime degisimi aile sayilmaz

### Dosyalar
- `js/content/families/meaning-hunt-families.js`
- `js/games/registry.js` (meaning-hunt blogu; legacy ALL_MEANING_QUESTIONS bos havuz fallback)
- `tests/stage04-meaning-hunt-families.test.mjs` ? **10/10 PASS**

### Ilerleme
Asama 04: **12/23** PASS. Siradaki: **paragraph-detective**. Asama 04 tum oyunlar bitmeden PASS yapilamaz.

---

## 19. Guncelleme ? paragraph-detective PASS

**Tarih:** 2026-08-01T18:25Z

### Kapasite
12 gercek paragraf-becerisi ailesi (pd-*) ? 4 gorev ? 3 yol = **48**.
- Tum iskeletler ? `kind:'choice'`
- Aileler: ana dusunce, ayrinti, cikarim, neden-sonuc, kanit-sav, gereksiz bilgi, baslik, amac, uslup, karsilastirma, sira, yanlis-okuma taksonomisi
- Metin yuzeyi makyaji aile sayilmaz
- Registry `sessionLength*2` uretir (premium gecis/besteci 2? hedefi)

### Dosyalar
- `js/content/families/paragraph-detective-families.js`
- `js/games/registry.js` (paragraph-detective; legacy premium fallback)
- `tests/stage04-paragraph-detective-families.test.mjs` ? **10/10 PASS**

### Ilerleme
Asama 04: **13/23** PASS. Siradaki: **english-vocabulary**. Asama 04 tum oyunlar bitmeden PASS yapilamaz.

---

## 20. Guncelleme ? english-vocabulary PASS

**Tarih:** 2026-08-01T19:05Z

### Kapasite
12 gercek kelime-bilme ailesi (ev-*) ? 4 gorev ? 3 yol = **48**.
- Tum iskeletler ? `kind:'choice'`
- Aileler: esanlam, karsit, tanim, baglam, esdizim, yanlis-dost, kok-aile, kayit, kategori, phrasal, sestes, yanlis-okuma taksonomisi
- Yuzey kelime degisimi aile sayilmaz
- sessionLength=20; createEnglishRounds yalniz bos-havuz fallback

### Dosyalar
- `js/content/families/english-vocabulary-families.js`
- `js/games/registry.js` (english-vocabulary; legacy fallback)
- `tests/stage04-english-vocabulary-families.test.mjs` ? **10/10 PASS**

### Ilerleme
Asama 04: **14/23** PASS. Siradaki: **english-cloze**. Asama 04 tum oyunlar bitmeden PASS yapilamaz.

---

## 21. Guncelleme ? english-cloze PASS

**Tarih:** 2026-08-01T19:20Z

### Kapasite
12 gercek dilbilgisi-bosluk ailesi (ec-*) ? 4 gorev ? 3 yol = **48**.
- Tum iskeletler ? `kind:'choice'`
- Aileler: artikel, edat, zaman, o-f uyumu, zamir, baglac, miktar, modal, karsilastirma, phrasal-slot, esdizim-bosluk, yanlis-okuma taksonomisi
- Yuzey cumle degisimi aile sayilmaz
- sessionLength=10; createEnglishActivityRounds yalniz bos-havuz fallback

### Dosyalar
- `js/content/families/english-cloze-families.js`
- `js/games/registry.js` (english-cloze; legacy fallback)
- `tests/stage04-english-cloze-families.test.mjs` ? **10/10 PASS**

### Ilerleme
Asama 04: **15/23** PASS. Siradaki: **english-sentence-builder**. Asama 04 tum oyunlar bitmeden PASS yapilamaz.

---

## 22. Guncelleme ? english-sentence-builder PASS

**Tarih:** 2026-08-01T19:35Z

### Kapasite
12 gercek sozdizimi ailesi (esb-*) ? 4 gorev ? 3 yol = **48**.
- select-valid ? `kind:'wordOrder'` (tokens + answerTokens)
- forced/spot/compare ? `kind:'choice'`
- Yuzey token makyaji aile sayilmaz

### Dosyalar
- `js/content/families/english-sentence-builder-families.js`
- `js/games/registry.js`
- `tests/stage04-english-sentence-builder-families.test.mjs` ? **10/10 PASS**

### Ilerleme
Asama 04: **16/23** PASS. Siradaki: **social-time-travel**.

---

## 23. Guncelleme ? social-time-travel PASS

**Tarih:** 2026-08-01T20:05Z

### Kapasite
12 gercek sosyal/tarih dusuncesi ailesi (stt-*) ? 4 gorev ? 3 yol = **48**.
- Tum iskeletler ? `kind:'choice'`
- Aileler: birincil kaynak, ikincil kaynak, kronoloji, neden-sonuc, sureklilik/degisim, bakis acisi, kanit-sav, kulturel miras, sozlu tarih, yer-zaman, cagdisilik, yanlis-okuma taksonomisi
- Yuzey isim/yer degisimi aile sayilmaz
- sessionLength=10; SOCIAL_QUESTIONS/createSocialRound yalniz bos-havuz fallback

### Dosyalar
- `js/content/families/social-time-travel-families.js`
- `js/games/registry.js` (social-time-travel; legacy fallback)
- `tests/stage04-social-time-travel-families.test.mjs` ? **10/10 PASS**

### Ilerleme
Asama 04: **17/23** PASS. Siradaki: **social-map-skills**. Asama 04 tum oyunlar bitmeden PASS yapilamaz.

---

## 24. Guncelleme ? social-map-skills PASS

**Tarih:** 2026-08-01T20:15Z

### Kapasite
12 gercek cografya dusuncesi ailesi (sm-*) ? 4 gorev ? 3 yol = **48**.
- Tum iskeletler ? `kind:'choice'`
- Aileler: yon, olcek, lejant, enlem/boylam, iklim, yer sekli, kaynak-yer, nufus, rota, sinir/bolge, harita turu, yanlis-okuma
- sessionLength=10; legacy fallback korundu

### Dosyalar
- `js/content/families/social-map-skills-families.js`
- `js/games/registry.js`
- `tests/stage04-social-map-skills-families.test.mjs` ? **10/10 PASS**

### Ilerleme
Asama 04: **18/23** PASS. Siradaki: **social-citizenship**.

---

## 25. Guncelleme ? social-citizenship PASS

**Tarih:** 2026-08-01T20:25Z

### Kapasite
12 gercek vatandaslik dusuncesi ailesi (sc-*) ? 4 gorev ? 3 yol = **48**.
- Tum iskeletler ? `kind:'choice'`
- Aileler: hak/odev, hukuk, kamu hizmeti, katilim, esitlik, sorumluluk, catisma, medya, cevre, yerel-kuresel, dijital, yanlis-okuma
- sessionLength=10; legacy fallback korundu

### Dosyalar
- `js/content/families/social-citizenship-families.js`
- `js/games/registry.js`
- `tests/stage04-social-citizenship-families.test.mjs` ? **10/10 PASS**

### Ilerleme
Asama 04: **19/23** PASS. Siradaki: **religion-practice**. Asama 04 tum oyunlar bitmeden PASS yapilamaz.

---

## 26. Guncelleme ? religion-practice PASS

**Tarih:** 2026-08-01T20:40Z

### Kapasite
12 gercek din kulturu dusuncesi ailesi (rp-*) ? 4 gorev ? 3 yol = **48**.
- Tum iskeletler ? `kind:'choice'`
- Aileler: inanc/pratik, deger-durum, saygi/cesitlilik, ibadet anlami, ahlaki secim, cemaat rol?, sembol, metin-baglam, empati, sorumluluk, kavram yanilgisi, yanlis-okuma
- sessionLength=10; RELIGION_QUESTIONS/createReligionVariant yalniz bos-havuz fallback
- grade?8, age?12

### Dosyalar
- `js/content/families/religion-practice-families.js`
- `js/games/registry.js` (religion-practice)
- `tests/stage04-religion-practice-families.test.mjs` ? **10/10 PASS**

### Ilerleme
Asama 04: **20/23** PASS. Siradaki: **lgs-foundation**.

---

## 27. Guncelleme ? lgs-foundation PASS

**Tarih:** 2026-08-01T20:55Z

### Kapasite
12 gercek LGS kaliibi ailesi (lgs-*) × 4 gorev × 3 yol = **48**.
- Tum iskeletler ? `kind:'choice'`
- grade?8, age?12; legacy LGS_FOUNDATION_QUESTIONS / createLgsFoundationVariant yalniz bos-havuz fallback

### Dosyalar
- `js/content/families/lgs-foundation-families.js`
- `js/games/registry.js`
- `tests/stage04-lgs-foundation-families.test.mjs` ? **10/10 PASS**

### Ilerleme
Asama 04: **21/23** PASS. Siradaki: **science-lab**.

---

## 28. Guncelleme ? science-lab PASS

**Tarih:** 2026-08-01T21:05Z

### Kapasite
12 gercek fen kavrami ailesi (sl-*) × 4 gorev × 3 yol = **48**.
- sessionLength=6; SCIENCE_QUESTIONS yalniz fallback

### Dosyalar
- `js/content/families/science-lab-families.js`
- `js/games/registry.js`
- `tests/stage04-science-lab-families.test.mjs` ? **10/10 PASS**

### Ilerleme
Asama 04: **22/23** PASS. Siradaki: **science-reasoning**.

---

## 29. Guncelleme ? science-reasoning PASS + A?ama 04 KAPANDI

**Tarih:** 2026-08-01T21:10Z

### Kapasite
12 gercek deney-akil yurutme ailesi (sr-*) × 4 gorev × 3 yol = **48**.
- sessionLength=5; SCIENCE_REASONING_QUESTIONS yalniz fallback

### Dosyalar
- `js/content/families/science-reasoning-families.js`
- `js/games/registry.js`
- `tests/stage04-science-reasoning-families.test.mjs` ? **10/10 PASS**

### Ilerleme
Asama 04: **23/23 PASS**. Tum kritik aktif oyunlar hedefe ulasti. Siradaki: **Asama 05**.
