# Semantik çeşitlilik kuralları

Bir soru şu kimliklerle izlenir:
- familyId
- skeletonId
- reasoningPathId
- solutionGraphId
- distractorPlanId
- semanticFingerprint
- surfaceFingerprint

## Aynı kabul etme
Aşağıdakiler değişse bile çözüm grafiği aynıysa soru aynıdır:
- Sayılar
- İsimler
- Nesneler
- Renkler
- Şehirler
- Cümle sırası
- Küçük sözcük değişiklikleri

## Oturum kapıları
- Aynı familyId en fazla 1
- Aynı skeletonId kesinlikle 1
- Aynı reasoningPathId art arda gelemez
- Aynı distractorPlanId baskın olamaz
- Yüksek semantik benzerlikli iki soru aynı oturuma giremez

## Oturumlar arası
Son N oturumdaki iskelet ve düşünme yolları öğrenci geçmişinde tutulur.
Yalnız sayı/isim değişmiş varyasyonlar soğuma süresi bitmeden seçilemez.
