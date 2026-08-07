# Paket dosyalarının özeti

- `00_AUTONOMOUS_MASTER.md`: Kullanıcıdan yeni komut beklemeden bütün aşamaları yürüten ana talimat.
- `CURSOR_TEK_PROMPT.md`: Cursor'a yalnız bir kez gönderilecek başlangıç promptu.
- `AGENTS.md`: Kontrol ajanlarının görev ayrımı.
- `docs/stages/*`: V11 kök nedeninden final kabule kadar 15 kilitli aşama.
- `docs/rules/*`: Zorluk, seçenek, semantik çeşitlilik, GOLD ve puan kuralları.
- `docs/agents/*`: En kritik denetçilerin ayrıntılı görevleri.
- `docs/admin/*`: Admin analiz sayfası ve veri sözleşmesi.
- `schemas/*`: Oturumlar arasında otomatik devamı sağlayan durum, puan ve engel yapıları.
- `templates/*`: Her aşamada zorunlu kanıt raporu.

## Paket tamamlandığında beklenen ürün
- Bütün oyunlar tek ortak motoru kullanır.
- 3. sınıf ve sonrasında yalnız zorlayıcı, geliştirici sorular yayınlanır.
- Zayıf veya alakasız seçenek içeren soru yayınlanmaz.
- Öğrenci bütün seçenekleri okumadan doğru cevabı çıkaramaz.
- Aynı aile/iskelet ve yüzeysel varyasyon tekrarları engellenir.
- Öğrenci geçmişine göre oturumlar çeşitlendirilir.
- Admin ekranında canlı durum, puan, tekrar ve kalite görünür.
- %90 kalite ve kritik kapılar geçmeden proje tamamlanmış sayılmaz.

## Token tasarrufu için eklenen dosyalar
- `docs/rules/07_TOKEN_AND_CONTEXT_BUDGET_POLICY.md`: Yeniden tarama ve gereksiz test yasağı.
- `docs/rules/08_CONTEXT_SNAPSHOT_PROTOCOL.md`: Her aşama sonunda 2–5 KB bağlam özeti.
- `docs/rules/09_DIFF_ANALYSIS_PROTOCOL.md`: Kod değişikliğinden önce en küçük değişiklik analizi.
- `docs/rules/10_MODEL_ROUTING_POLICY.md`: Sonnet ana model, Opus yalnız kritik mimari danışman.
- `templates/CONTEXT_SNAPSHOT_TEMPLATE.md`: Yeni oturumların tek başlangıç özeti.
- `templates/DIFF_ANALYSIS_TEMPLATE.md`: Gereksiz dosya değişimini önleyen şablon.

