# Phase 5H Gerçek Öğrenci Pilotu Operasyon Rehberi

1. İnceleme çalışma masası anonim uzman kimliği ve uzman rolüyle açılır.
2. Exact outcome referanslı, çoktan seçmeli görevlerde bir uzman yeterli olabilir. Exact olmayan kazanım eşleşmeleri ve etkileşimli görevlerde iki bağımsız uzman gerekir; exact olmayanlarda en az bir CURRICULUM_REVIEWER kararı zorunludur. Mevcut 30 görev için toplam 49 karar gerekir: 11 görev tek, 19 görev çift incelemelidir.
3. Karar JSON dosyaları `npm run assessment:v2:phase5h:reviews -- <dosya1> <dosya2> ...` komutuyla birleştirilir.
4. 30/30 insan onayı ve 30/30 semantik round-trip oluşmadan öğrenci pilotu açılmaz.
5. Okul yetkisi, veli/onam, anonim katılımcı üretimi, pilot salt güvenliği ve 90 günlük ham veri saklama kararı gizlilik kontrol listesine kaydedilir.
6. `public/assessment-v2-phase5h-pilot-assignment.csv` yalnız anonim slotları içerir. Gerçek öğrenci kimliği bu dosyaya yazılmaz.
7. Yanıtlar `public/assessment-v2-phase5h-pilot-response-template.csv` sözleşmesinde toplanır.
8. Her görevde en az 80 yanıt ve toplam en az 100 anonim öğrenci olmadan madde analizi yayın kanıtı sayılamaz.
9. Kontrollü pilot PASS olsa bile kamu production yayını ayrıca açılır; bu paket tam ürün onayı vermez.
