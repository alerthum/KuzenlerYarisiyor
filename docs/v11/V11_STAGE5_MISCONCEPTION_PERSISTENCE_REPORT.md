# V11 Aşama 5 — Yanılgı Kalıcılığı

Bu aşamada Paragraf Dedektifi için seçenek bazlı V11 tanısı gerçek cevap akışına bağlandı.

## Uygulanan yapı

- V11 kimliği, kanıt haritası ve seçenek tanıları `toChoiceRound` üzerinden gerçek oyun turuna taşınır.
- Öğrencinin seçtiği seçenek `diagnoseV11ChoiceResponse` ile değerlendirilir.
- Yanlış seçimde `misconceptionId` ve açıklaması cevap kaydına eklenir.
- `recordAttempt`, tanılanmış hatayı `state.misconceptionProfiles[profileId]` altında toplar.
- Profil hem yanılgı hem bilişsel iskelet bazında hata sıklığı taşır.
- Doğru cevap ve süre aşımı sahte yanılgı üretmez.

## Kalıcı alanlar

- `skeletonId`
- `skeletonFamilyId`
- `selectedOptionIndex`
- `selectedOptionText`
- `responseStatus`
- `diagnosticStatus`
- `misconceptionId`
- `misconception`

## Öğrenci profili özeti

`misconceptionProfiles` içinde toplam tanılanmış hata, yanılgı sıklığı, ilişkili soru aileleri ve iskelet bazlı hata sayısı tutulur.
