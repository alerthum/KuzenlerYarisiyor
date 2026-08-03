# V13.5 Question Factory Uygulama Raporu

## Net karar
Eski `PRODUCT_ACCEPTANCE_DECISION.json = PASS` kararı geçersiz sayıldı. Çünkü gerçek örneklerde:

- 10. sınıfa doğrudan `73 + 88` gibi rutin işlem sorusu hard sayılmıştı.
- Yanlış seçeneklerde `misconceptionId: null` ve `Yanılgı gerekçesi kayıtlı değil` vardı.
- `distractorPlanId` eksikken seçenek kalitesi PASS oluyordu.
- `sameExperienceRate = 0.437` gibi yüksek algısal tekrar PASS sayılıyordu.
- Content review alan doluluğunu kalite sanıyordu.

Bu paket bu sahte PASS yolunu kapatır.

## Eklenen ana servis

### `js/quality/question-factory-v13.js`

Bu servis üreticinin kendi etiketlerine güvenmez. Ham soru, seçenekler, çözüm, gerçek çeldirici metadata ve yaş bandı üzerinden karar verir.

Eklediği alanlar:

- `questionFactoryGate`
- `productQualityGate`
- `premiumBlueprint`
- `structuralId`
- `cognitiveExperienceId`
- `perceivedStructure`
- gerçek `optionDiagnostics`
- gerçek `distractorPlanId`
- `distractorValidation`

## Değişen akış

Önceki akış:

```text
Generator → metadata → gate → PASS
```

Yeni akış:

```text
Generator
→ Question Factory
→ fake-hard rejector
→ distractor diagnostics
→ cognitiveExperienceId / structuralId
→ option quality
→ solver
→ semantic repeat
→ cognitive depth
→ child mind
→ publication
```

## Artık reddedilen örnekler

- 10. sınıfta `73 + 88 işleminin sonucu kaçtır?`
- `çıkarım yapmana gerek yok, yalnız uygula` diyen hard soru
- Sabit artışta doğrudan 6. terim sorusu
- `misconceptionId: null` olan çoktan seçmeli soru
- `Yanılgı gerekçesi kayıtlı değil` içeren şık
- `distractorPlanId` eksik choice soru
- Sayı/dekor değişmiş aynı cognitive experience

## GOLD benchmark

8. sınıf için üç sabit insan-gözü GOLD örnek eklendi:

- Matematik: oran + değişim + denklem kurma
- Türkçe: ana düşünce + kanıt sentezi
- İngilizce: bağlamdan kelime anlamı

Bu örnekler yalnız doküman değil, test edilen benchmark’tır.

## REJECT benchmark

Aşağıdaki sahte premium örnekler testle reddedilir:

- 10. sınıf doğrudan toplama
- 8. sınıf açık sabit artış örüntüsü
- null/generic misconception seçenekleri

## Değiştirilen dosyalar

- `js/quality/question-factory-v13.js` — yeni servis
- `js/games/registry.js` — `createGameSession` yayın akışına Question Factory bağlandı
- `js/quality/cognitive-depth-engine.js` — routine surface metadata’ya rağmen hard sayılmaz
- `js/quality/premium-options-engine.js` — gerçek distractor diagnostics kullanır
- `js/quality/question-contract-v11.js` — optionDiagnostics ve distractorPlanId doğru okunur
- `js/quality/semantic-repeat-engine.js` — cognitiveExperienceId / structuralId tekrar ölçümüne dahil
- `js/quality/product-acceptance-audit.js` — ürün kabul kapıları sıkılaştırıldı
- `scripts/run-product-acceptance-audit.mjs` — strict ürün kabul varsayılanları
- `tests/v13-question-factory-gates.test.mjs` — yeni kabul testleri
- `package.json` — V13.5 komutları
- `PRODUCT_ACCEPTANCE_DECISION.json` — eski PASS iptal edildi
- `CONTEXT_SNAPSHOT.md` — yeni gerçek devam noktası

## Çalıştırılan doğrulama

```bash
node --test tests/stage05-cognitive-depth.test.mjs tests/stage06-premium-options.test.mjs tests/stage08-semantic-repeat.test.mjs tests/v13-question-factory-gates.test.mjs
```

Sonuç:

```text
20/20 PASS
```

## Bilerek PASS yapılmayan kısım

`PRODUCT_ACCEPTANCE_DECISION.json` şu anda `FAIL` durumundadır. Bu hata değil, doğru davranıştır.

Yeni sıkı gate çalışmadan ürün hazır sayılamaz:

```bash
npm run quality:product-acceptance:strict
```

Bu komut ağırdır. Eski 514 soru/yıl gibi zayıf ölçümü kabul etmez. `3600` yıllık minimum giriş eşiği, sıkı perceived diversity ve gerçek içerik ihlali kontrolü vardır.

## Sonraki kesin iş

Cursor veya terminal şu komutla devam eder:

```bash
npm run quality:premium-core
npm run quality:product-acceptance:strict
```

Ürün kabulü FAIL olursa tüm proje yeniden yazılmaz. Sadece raporda dönen oyun/aile/skeleton/cognitiveExperience düzeyindeki başarısızlıklar düzeltilir.
