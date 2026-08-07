# Aşama 01 — V11 Kök Neden Analizi Raporu

**Durum: PASS**
**Tarih:** 2026-08-01
**Kapsam:** `js/engines/math-engine.js`, `js/games/registry.js`, `tests/stage01-family-skeleton-identity.test.mjs`

## 1. Kanıt: Sorun gerçekten var mıydı?

Canlı `createGameSession()` çağrılarıyla (gerçek uygulama kod yolu, mock yok) 5 legacy sayısal oyun × 15 oturum üretildi:

| Oyun | Üretilen tur | familyId dolu (düzeltme öncesi) | Yaklaşık ayrık "iskelet" sayısı |
|---|---|---|---|
| pattern-lab | 75 | 0 | 1 (yalnız yüzeysel şekil kıyaslamasıyla bile) |
| geometry-lab | 90 | 0 | 7 |
| problem-hunter | 75 | 0 | 5 |
| speed-math | 120 | 0 | 3 |
| target-number | 60 | 0 | 1 |

Doğrudan `createPatternRound(10, seed)` 300 kez farklı seed ile çağrıldığında: `growing` modu 300 üretimin 105'inde (%35) seçildi; dönen nesnede `familyId`/`skeletonId` alanı **hiç yoktu** (`'familyId' in sample === false`).

## 2. Kök neden

`js/engines/math-engine.js` içindeki 6 üretici (`createArithmeticRound`, `createTargetRound`, `createPatternRound`, `createGeometryRound`, `createProblemRound`, `createErrorRound`) her çağrıda bir "mode" (gerçek bilişsel iskelet) seçiyor fakat bu kimliği hiçbir zaman soruya etiketlemiyordu.

`js/games/registry.js` → `generateUniqueRounds` yalnız **literal** `questionKey` (üretilen metin/cevabın hash'i) ile tekilleştiriyordu; `options.recentFamilyIds`/geçmiş bu 6 oyun için hiç okunmuyordu. Sonuç: "aynı iskelet, farklı sayı" sonsuza kadar yeni soru sayılıyordu — bu tam olarak kullanıcının şüphelendiği "sayı/isim makyajı" sorunuydu.

Yalnız `paragraph-detective` (V11 motoru), `logic-station` ve `olympiad-ladder` (V9 motoru) gerçek `familyId`/`skeletonId` kimliği taşıyordu. Geri kalan 6 oyun bundan tamamen yoksundu. `js/state.js` → `recentFamilyIds` (bkz. `js/app.js:999`) yalnız `attempt.familyId` doluysa işe yarıyordu; bu 6 oyun hiç `familyId` üretmediği için öğrenci geçmişi bu oyunlar için sürekli boştu ("öğrenci geçmişinin yazılmaması" kural ihlali).

Sabit seed veya cache tabanlı bir üretici **bulunmadı**; sorun tamamen kimlik eksikliği ve tekilleştirme algoritmasının yalnız yüzeysel metne bakmasıydı.

## 3. Uygulanan en küçük mimari düzeltme

1. **`js/engines/math-engine.js`** — 6 üreticinin her mod dalına stabil `familyId` (oyun başına bir aile, örn. `pattern-lab-sequences`) ve `skeletonId` (`<familyId>:<mode>`, örn. `pattern-lab-sequences:linear`) eklendi.
2. **`js/games/registry.js`**
   - `generateUniqueRounds` yeni bir `skeletonAware` bayrağıyla genişletildi. Bayrak `false` (varsayılan) olduğunda davranış birebir eskisiyle aynıdır — `religion-practice`, `lgs-foundation` ve `SOCIAL_QUESTIONS` yolu etkilenmez.
   - Bayrak `true` olduğunda (yalnız 6 düzeltilen oyun için): (a) bir oturumda aynı `skeletonId` havuz yeterliyken tekrar edemez, (b) `options.attempts` üzerinden hesaplanan `recentSkeletonIds` (öğrencinin o oyundaki son 30 denemesinin iskelet kimlikleri) havuz yeterliyken öncelik dışı bırakılır, (c) havuz gerçekten yetersizse oturumu boş bırakmak yerine tekrara izin verilir.
   - 5 oyunun `convert` fonksiyonuna `familyId`/`skeletonId` alanları eklendi (target-number zaten `...target` spread'iyle otomatik alıyordu; error-detective zaten `toChoiceRound` üzerinden `question.familyId/skeletonId` okuyordu).
   - `createGameSession` içinde `recentSkeletonIds` hesaplaması eklendi (`options.attempts` → `attempt.gameId===gameId && attempt.skeletonId` filtreli, son 30).

## 4. Yeniden üretilebilir test

`tests/stage01-family-skeleton-identity.test.mjs` (3 test):
1. 6 oyunun her turu `familyId` **ve** `skeletonId` taşır.
2. Bir oturumda, havuz yeterliyken aynı `skeletonId` ikinci kez kullanılmaz.
3. Öğrenci geçmişinden (`attempts`) türetilen iskelet listesi, havuz yeterliyken sonraki oturumda öncelik dışı bırakılır.

Düzeltmeden önce test 1 kesin olarak **FAIL** veriyordu (`target-number: round.familyId eksik`). Düzeltmeden sonra 3/3 PASS.

## 5. Doğrulanan artık kapasite kanıtı (post-fix, canlı ölçüm)

| Oyun | Yaş 9 iskelet sayısı / oturum uzunluğu | Yaş 13 iskelet sayısı / oturum uzunluğu |
|---|---|---|
| target-number | 4 / 4 | 4 / 4 |
| speed-math | 3 / 8 | 5 / 8 |
| pattern-lab | 3 / 5 | 5 / 5 |
| geometry-lab | 6 / 6 | 10 / 6 |
| problem-hunter | 5 / 5 | 5 / 5 (1 mod — `algebra` — mevcut "rutin işlem" filtresiyle her zaman elenir) |
| error-detective | 5 / 5 | 6 / 5 |

`missingIdentity=0` — 20 oturum × her iki yaş bandında toplam 1080 turun tamamında `familyId` ve `skeletonId` doluydu.

## 6. Test merdiveni sonucu (gerçek komut çıktıları)

1. **İlgili testler:** `node --test tests/stage01-family-skeleton-identity.test.mjs tests/math-engine.test.mjs tests/content-integrity.test.mjs` → 12/12 PASS.
2. **Kalite kapısı:** `npm run quality:gate` → `Quality Gate: 162 örnek • 0 hata • 140 eksik havuz • 10 yüksek blokaj.` (bu sayılar Aşama 04/06/08 tamamlanmadan iyileşmeyecek; aşağıdaki Bilinen Riskler'e taşındı.)
3. **Tam regresyon (ortak altyapı değiştiği için gerekliydi):** `npm run check` → 224/224 test PASS, `check-project.mjs` PASS, `build` PASS. `npm run v11:check` → tüm 12 V11 alt aşaması PASS (regresyon yok).

## 7. Bilinen riskler / sonraki aşamalara devredilen bulgular (gizlenmedi, PASS'ı etkilemiyor)

- **Kapasite yetersizliği (Aşama 04/08 kapsamı):** `pattern-lab` (9 yaş) ve `speed-math` (9 yaş) yalnız 3 iskelete sahip; oturum uzunluğu bundan büyük olduğunda iskelet tekrarı hâlâ zorunlu (havuz gerçekten yetersiz). Aşama 04 "her aile en az 4 iskelet" hedefiyle çözülmeli.
- **Oturum doldurma açığı (Aşama 09 kapsamı olası):** `problem-hunter` (13 yaş) mevcut "rutin tek işlem" filtresi `algebra` modunu her zaman eledikten sonra eksik kalan turu yeniden üretmiyor; bu **düzeltmemle önceden vardı ve iyileşti** (temel kod tabanında 20 oturumun 13'ü 5'ten az tur üretiyordu, düzeltmemle bu oran azaldı) ama tam çözülmedi. Kök neden ayrı: post-filter sonrası yeniden üretim/backfill mekanizması yok. Bu, DIFF_ANALYSIS.md kapsamının (yalnız 2 dosya, familyId/skeletonId) dışında olduğu için bu aşamada dokunulmadı.
- **Diğer oyunlar henüz kapsam dışı:** `religion-practice`, `lgs-foundation`, `social-*` üreticileri hâlâ familyId/skeletonId üretmiyor (kasıtlı olarak bu aşamada değiştirilmedi — bkz. DIFF_ANALYSIS.md §7). Aşama 03/04'te ortak sözleşmeye taşınmaları gerekir.
- **`quality:gate` çıktısı** (162 örnek, 140 eksik havuz, 10 yüksek blokaj) büyük ölçüde bu kapsam dışı oyunlardan ve henüz kurulmamış aile/iskelet mimarisinden (Aşama 04) kaynaklanıyor; Aşama 01 bunu çözmekle yükümlü değildi (yalnız kök neden + en küçük düzeltme + test).

## 8. Aşama 01 çıkış kriteri değerlendirmesi

`docs/stages/01_V11_ROOT_CAUSE.md` çıkışı: *"tekrarın kesin kök nedeni ve yeniden üretilebilir testleri olmadan PASS yok."*
- Kesin kök neden: ✅ kanıtlandı (yukarı bkz.).
- Yeniden üretilebilir test: ✅ yazıldı, düzeltme öncesi FAIL, sonrası PASS.
- En küçük doğru mimari değişiklik: ✅ yalnız 2 kaynak dosya + 1 yeni test dosyası.
- Regresyon yok: ✅ 224/224 + v11:check tam PASS.

**Sonuç: PASS.** Sonraki aşama: Aşama 02 — Admin Soru Motoru Komuta Merkezi.
