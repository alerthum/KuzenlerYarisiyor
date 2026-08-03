# V11 Aşama 3 — Paragraf Dedektifi Question Identity Card

## Sonuç

Paragraf Dedektifi motorundaki 16 dinamik aile kod üzerinden incelenerek 40 gerçek V11 bilişsel iskeletinden uygun olanlara kesin biçimde bağlandı.

Her üretilen soru artık çalışma zamanında şu alanları taşır:

- `skeletonId`
- `skeletonFamilyId`
- `v11Identity.visibleSkillName`
- `v11Identity.mainSkill`
- `v11Identity.subSkill`
- `v11Identity.evidenceRequirements`
- `v11Identity.distractorMisconceptions`
- `v11Identity.notTogetherWith`
- `v11Identity.mappingStatus`

Bilinmeyen bir paragraf ailesi kimliksiz yayımlanamaz; üretim sırasında hata verir. Bu, yeni ailelerin V11 sözleşmesi dışında sessizce sisteme eklenmesini engeller.

## Kapsam

- 16 dinamik paragraf ailesi
- 14 farklı V11 bilişsel iskeleti
- 16 kesin eşleştirme
- otomatik tahmin yok
- mevcut soru metni ve cevap mantığında değişiklik yok
