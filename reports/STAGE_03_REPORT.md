# Aşama 03 — Ortak Soru Sözleşmesi Raporu

**Durum: PASS**
**Tarih:** 2026-08-01
**Kapsam:** `js/quality/question-contract-v11.js` (yeni), `js/games/registry.js` (2 satır ekleme), `tests/stage03-question-contract.test.mjs`

## 1. Mevcut davranış neydi?

`createGameSession()` yaklaşık 24 farklı oyun için farklı üreticilerden gelen round nesnelerini birleştiriyordu. Kimlik alanları tutarsızdı:
- 7 oyun (6 legacy matematik + `paragraph-detective`) hem `familyId` hem `skeletonId` üretiyordu.
- 2 oyun (`logic-station`, `olympiad-ladder`) yalnız `familyId` üretiyordu.
- Kalan ~15 oyun (`science-lab`, `science-reasoning`, `social-*`, `religion-practice`, `lgs-foundation`, `word-mine`, `word-ladder`, `forbidden-story`, `meaning-hunt`, `english-*`, sınav oyunları) **hiçbir kimlik** üretmiyordu; yalnız `academic-metadata-v9.js`'nin sessizce ürettiği sentetik bir `questionFamilyId` (`${gameId}:${topicId}:${kind}`) vardı — bu gerçek bir semantik aile değil, tahmini bir gruplama.

Ortak bir "QuestionContract" şeması hiç yoktu; her tüketici modül kendi ad-hoc mantığıyla (`familyId||questionFamilyId`) alan okuyordu.

## 2. Uygulanan minimal değişiklik

Yeni `js/quality/question-contract-v11.js` modülü, `attachQuestionContract(round)` fonksiyonunu dışa aktarır. Bu fonksiyon **hiçbir mevcut alanı değiştirmez/silmez**; yalnız şu 9 zorunlu grubu içeren salt-ekleyici bir `questionContract` alt-nesnesi ekler:

1. `academicIdentity` (subjectId, topicId, subtopicId, skillId, learningOutcomeId) — zaten var olan `enrichRoundAcademicMetadata` çıktısından okunur.
2. `family` (familyId, isExplicit, legacyFallbackFamilyId) — yalnız gerçek `round.familyId` doluysa `isExplicit:true`; sentetik `questionFamilyId` ayrı bir alanda tutulur, gerçek aile kimliğiyle karıştırılmaz.
3. `skeleton` (skeletonId, isExplicit).
4. `reasoningPath` (reasoningPathId, thinkingPatternId, derivationMethod) — yalnız skeletonId varsa türetilir; yoksa `null` + `PENDING_SKELETON_IDENTITY`.
5. `optionMetadata` (optionCount, hasDetailedOptions, hasMisconceptionDiagnostics, distractorPlanId).
6. `solution` (hasExplanation, explanationLength, solutionGraphId).
7. `quality` (globalQualityScore/Status/Warnings — var olan `attachGlobalQuality` çıktısından okunur).
8. `repeat` (questionKey, semanticFingerprint, surfaceFingerprint).
9. `publication` (status).

Ayrıca `pendingFields: string[]` — gerçekten bilinmeyen her alan burada **açıkça** listelenir; hiçbir alan sessizce uydurulmaz.

`registry.js`'de tek değişiklik: `createGameSession()`'ın son dönüşünden hemen önce `rounds = rounds.map(attachQuestionContract);` eklendi. Bu, tüm ~24 oyun için ortak, hiçbir oyuna özel dallanma gerektirmeyen tek bir noktadır.

## 3. Neden bu kapsamla sınırlı kalındı?

- Her üreticiyi (~20 dosya) tek tek gerçek `familyId`/`skeletonId` üretecek şekilde yeniden yazmak bu aşamanın kapsamı değil — bu, Aşama 04 (aile/iskelet mimarisi) ve Aşama 06'nın (seçenek/çeldirici motoru) konusu. Aşama 01'de `social-engine.js`'e dokunmanın gizli bir sonsuz döngüyü tetiklediği kanıtlanmıştı; bu riski tekrar almadan, dekoratör deseniyle "dürüst eksiklik kaydı" yaklaşımı seçildi.
- `family.familyId`'yi sentetik `questionFamilyId` ile doldurmak (bir bakıma "çalışıyormuş gibi görünmesini sağlamak") kasıtlı olarak **yapılmadı** çünkü bu, kullanıcının açıkça yasakladığı "sessiz varsayılan alan doldurma" olurdu. Bunun yerine iki ayrı alan tutuldu ve dürüstçe işaretlendi.

## 4. Test merdiveni sonucu (gerçek komut çıktıları)

1. **İlgili testler:** `node --test tests/stage03-question-contract.test.mjs tests/content-integrity.test.mjs tests/stage01-family-skeleton-identity.test.mjs` → **12/12 PASS**.
2. **Kalite kapısı:** `npm run quality:gate` → `162 örnek • 0 hata • 140 eksik havuz • 10 yüksek blokaj` (değişmedi — beklenen, bu değişiklik içerik üretmiyor, yalnız salt-okunur metadata ekliyor).
3. **Tam regresyon (ortak altyapı — `registry.js` — değiştiği için gerekliydi):**
   - `npm run check` → **234/234 test PASS** (229 eski + 5 yeni), `check-project.mjs` PASS, `build` PASS.
   - `npm run v11:check` → tüm V11 alt-aşamaları PASS, regresyon yok.

## 5. Kanıtlanan sonuçlar (canlı testten)

- Tüm 24 oyunun, iki farklı profil (9 ve 13 yaş) için ürettiği **her** turda geçerli `questionContract` var; mevcut `prompt` gibi alanlar korunuyor.
- 6 legacy matematik oyunu + `paragraph-detective`: `family.isExplicit=true`, `skeleton.isExplicit=true`, `semanticFingerprint` dolu.
- `logic-station`, `olympiad-ladder`: `family.isExplicit=true` ama `skeleton.skeletonId=null` ve `pendingFields` bunu açıkça listeliyor — uydurma yok.
- `science-lab` (ve dolaylı olarak kimliksiz diğer ~14 oyun): `family.isExplicit=false`, `skeleton.skeletonId=null`, `semanticFingerprint=null`, hepsi `pendingFields`'ta.
- Tüm oyunlarda `repeat.surfaceFingerprint` ve `repeat.questionKey` dolu (en azından yüzeysel tekrar denetimi artık her oyunda mümkün).

## 6. Aşama 03 çıkış kriteri değerlendirmesi

`docs/stages/03_COMMON_QUESTION_CONTRACT.md`: "Tüm oyunların ortak QuestionContract kullanmasını sağla... eski üreticiler için geçici adapter; sessiz varsayılan alan doldurma yasak."
- Ortak sözleşme tanımlandı ve **tüm** oyunlara (istisnasız) uygulandı: ✅.
- Eski üreticiler için geçici adapter (dekoratör, üretici kodu değişmedi): ✅.
- Sessiz varsayılan alan doldurma yok — her eksik alan `null` + `pendingFields`'ta açık: ✅ (test #3 ve #4 ile kanıtlandı).
- Regresyon yok: ✅ 234/234 + v11:check tam PASS.

**Sonuç: PASS.** Sonraki aşama: Aşama 04 — Aile-İskelet-Düşünme Yolu Mimarisi.

## 7. Bu aşamada üretilen/güncellenen açık engeller
`BLOCKERS.json` B-003 (social/religion/lgs-foundation kimliksizliği) ve yeni bir alt-bulgu olarak `logic-station`/`olympiad-ladder`'ın skeletonId üretmediği artık **ölçülebilir** hâle geldi (`questionContract.pendingFields` üzerinden); bu, Aşama 04'ün somut girdi verisidir. Yeni kritik/yüksek engel eklenmedi.
