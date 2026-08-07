# Model yönlendirme politikası

## Varsayılan model
Cursor üzerinde ana geliştirme modeli:

`Sonnet 5 High`

Bu model bütün normal aşamalarda kullanılır.

## Güçlü model yükseltmesi
`Opus 5 High` yalnız aşağıdaki durumlarda tek oturumluk kullanılır:
- Üç ayrı doğru deneme sonrası çözülemeyen mimari engel
- Semantik tekrar algoritmasının temel tasarımı
- Birden fazla doğru mimari seçenek arasında kritik karar
- Büyük veri modeli geçişi
- Sonnet sonucunun iki bağımsız testle çelişmesi

## Yükseltme öncesi zorunlu paket
Opus'a bütün proje verilmez. Yalnız:
- `CONTEXT_SNAPSHOT.md`
- İlgili aşama dosyası
- `DIFF_ANALYSIS.md`
- İlgili 3–8 kaynak dosya
- İlgili test sonuçları
- Net karar sorusu
verilir.

## Yükseltme sonrası
- Opus yalnız karar veya dar çözüm önerisi üretir.
- Uygulama tekrar Sonnet 5 High ile sürdürülür.
- Opus'un kararı `CONTEXT_SNAPSHOT.md` içine kısa mimari karar olarak yazılır.

## Yasak
- Her aşamada model değiştirmek
- Tüm projeyi Opus'a yeniden okutmak
- Aynı problemi iki modele tekrar tekrar sormak
- Model cevabını testsiz doğru kabul etmek
