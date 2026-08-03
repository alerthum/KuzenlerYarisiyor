# Zihin Arenası V11.1 — Ürün İçerik Motoru Güçlendirmesi

## Canlı değişiklik

Paragraf Dedektifi artık `createV4ParagraphSession` kullanmaz. Canlı oturumlar doğrudan `premium-paragraph-engine-v11.js` üzerinden üretilir.

- 15 bilişsel soru ailesi
- en az 90 deterministik çekirdek varyasyon kapasitesi
- dört seçenek için uzunluk ve biçim dengesi
- üç ayrı yanılgıya bağlı çeldirici
- kanıt haritası ve seçenek tanısı
- doğrulanmış çeldirici gerekçeleri
- oturum başına sekiz soru garantisi

## Proje geneli

`choice-integrity-engine-v11.js` bütün çoktan seçmeli oyunlarda ortak denetim uygular. Doğru seçeneğin uzunlukla ele verilmesi, aşırı kesinlik sözcükleriyle eleme yapılması ve birden fazla ilgisiz çeldirici ayrı kalite sinyalleri olarak kaydedilir. Paragraf Dedektifi bu kapıyı geçemeyen soruyu öğrenciye vermez.

## Kabul ölçütü

24 farklı seed ile 192 canlı Paragraf Dedektifi sorusu üretilir; her oturum sekiz sorudur ve hiçbir soruda bloklayıcı seçenek bütünlüğü hatası kabul edilmez.
