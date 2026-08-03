# V11 Aşama 10 — İskelete Özel AI Üretim Sözleşmeleri

Bu aşama 40 Question Blueprint kaydını, üretici modelin doğrudan kullanabileceği katı talimat ve JSON çıktı sözleşmelerine dönüştürür.

## Eklenen yetenekler

- Her bilişsel iskelet için benzersiz AI sözleşmesi
- İskelete özel sistem talimatı ve üretim bağlamı
- Kolay, orta ve zor üretim kuralları
- Üç ayrı yanılgıya bağlı çeldirici talimatı
- Gerçek varyasyon ekseni ve kozmetik varyasyon yasağı
- Markdown içermeyen katı JSON çıktı zorunluluğu
- Kanıt, seçenek, doğru cevap ve yanılgı izlenebilirliği
- Bilinmeyen alanları reddeden çıktı doğrulayıcısı

## Temel dosyalar

- `content/v11/ai-generation-contracts.v11.json`
- `schemas/v11/ai-generation-output.schema.json`
- `js/engines/v11-ai-generation-contract.js`
- `scripts/v11-ai-contract-build.mjs`
- `scripts/v11-ai-contract-audit.mjs`
- `tests/v11-stage10-ai-generation-contract.test.mjs`

Bu aşama doğrudan bir harici AI servisine çağrı yapmaz. Üretim servisinden bağımsız, test edilebilir ve sağlayıcıdan bağımsız bir sözleşme katmanı oluşturur. Aşama 11 bu çıktıları yayın veya karantina kararına bağlayacaktır.
