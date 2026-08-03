# Hazır dış kalite araçları

Bu proje artık yalnız Cursor'ın yazdığı testlere güvenmez.

- fast-check: seed, profil ve soru varyasyonlarını property-based test eder.
- Playwright: gerçek Chromium ve mobil görünümde runtime/console/taşma hatalarını yakalar.
- axe-core: WCAG kritik ve ciddi ihlallerini yakalar.
- StrykerJS: testlerin kasıtlı kod bozulmalarını gerçekten yakalayıp yakalamadığını ölçer.
- Firebase Emulator: Firestore kurallarını üretim verisine dokunmadan test etmek için script hazırdır.
- promptfoo + Ollama: yalnız seçilmiş/sınırda sorularda ücretsiz yerel hakemlik yapar; deterministik doğruluğun yerine geçmez.
- GitHub Actions: modelden bağımsız kalite kapısıdır.

Kurulum:
1. Node.js 22.22+ kullan.
2. `npm install`
3. `npm run tools:install:browsers`
4. `npm run verify:ci`

Ağır ve isteğe bağlı kontroller:
- `npm run test:mutation`
- `npm run test:firebase:rules`
- Ollama'da qwen3:8b kurulduktan sonra `npm run ai:eval`
