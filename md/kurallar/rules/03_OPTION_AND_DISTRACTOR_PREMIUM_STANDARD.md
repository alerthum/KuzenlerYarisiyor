# Premium seçenek ve çeldirici standardı

## Zorunlu koşullar
- Bütün seçenekler soru köküyle doğrudan ilgilidir.
- Bütün seçenekler aynı dilbilgisel yapıda ve benzer uzunluktadır.
- Doğru seçenek biçim, ayrıntı, teknik dil veya olumluluk bakımından ayrışmaz.
- En az iki yanlış seçenek gerçek ve farklı öğrenci yanılgılarını temsil eder.
- Üç yanlış seçenek de “neden seçilebilir?” açıklamasına sahip olmalıdır.
- Seçenekler birlikte değerlendirildiğinde tek doğru cevap bulunur.
- Öğrenci yalnız bir seçeneğin konu ile ilgili olduğunu görerek cevap veremez.
- Olumsuz soru köklerinde bütün seçeneklerin mantıksal yönü aynı biçimde ele alınır.

## Otomatik ret örnekleri
- İki seçenek konuyla ilgisiz
- Bir seçenek anlamsız veya komik
- Bir seçenek tek olumsuz ifade
- Doğru seçenek diğerlerinden belirgin uzun
- Yanlış seçenekler rastgele sayılar
- Doğru seçenek metindeki cümleyi birebir tekrar ediyor
- Seçenekler farklı kavram kategorilerinden
- Yanlış seçeneklerden biri fiziksel/matematiksel olarak imkânsız ve bunu çocuk ilk bakışta görüyor

## Zorunlu veri
Her seçenek:
- `optionId`
- `text`
- `isCorrect`
- `misconceptionId`
- `misconceptionExplanation`
- `plausibilityScore`
- `grammarShape`
- `semanticCategory`
alanlarını taşır.
