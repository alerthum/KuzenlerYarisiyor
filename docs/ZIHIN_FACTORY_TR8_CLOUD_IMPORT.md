# Zihin Factory TR8 Bulut İçe Aktarım

Bu hat, yalnız Factory'nin `approved-package` kapısından geçen 8. sınıf Türkçe paragraf paketini KuzenlerYarisiyor içinde ayrı bir taslak içerik PR'ına dönüştürür. Bilgisayarın açık kalması gerekmez.

## Önkoşullar

- Factory sürümü tam olarak `0.10.1` olmalıdır.
- İş 20 soruluk calibration işi olmalı; 20/20 soru insan tarafından incelenmeli ve en az 16 soru kabul edilmelidir.
- KuzenlerYarisiyor Actions secret'ı `FACTORY_ADMIN_TOKEN` bulunmalıdır. Değer, Factory admin token'ıyla aynı olmalı; GitHub bu değeri loglarda göstermemelidir.
- KuzenlerYarisiyor → Settings → Actions → General altında workflow için **Read and write permissions** ve **Allow GitHub Actions to create and approve pull requests** etkin olmalıdır.
- Vercel Production Branch Tracking `production/vercel` olarak doğrulanmalıdır.

## Çalıştırma

GitHub Actions içinden **Import approved Zihin Factory TR8 pilot** seçilir. `job_id` girilir ve onay alanına `IMPORT_APPROVED_TR8_PILOT` yazılır.

Workflow yalnız şu tek sonucu üretir: `factory/tr8-pilot-<job-id>` dalında, gerçek paket verisini taşıyan taslak bir içerik PR'ı. Main'e merge, production deploy veya gizli bir API çağrısıyla yayın yapmaz. PR'ın kendi kalite kontrolleri ayrıca çalıştırılır. Bu içerik PR'ının ileride insan tarafından main'e alınması açık whitelist kararıdır; o birleşimden önce son öğrenci yüzeyi ve Vercel production koruması yeniden doğrulanır.

## Fail-closed sınırı

Yanlış Factory sürümü, eksik insan incelemesi, zayıf kalite puanı, kelime veya yapısal kalıp tekrarı, yetersiz söylem/akıl-yürütme çeşitliliği, cevap konumu dengesizliği, uzun doğru cevap sızıntısı veya son öğrenci ekranı kapısı hatası dosya yazılmadan önce işlemi durdurur.
