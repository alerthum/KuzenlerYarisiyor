Zihin Arenası'nın güncel proje dosyaları ve dış kalite araçları kurulmuştur.

Önce yalnız şunları oku:
- 00_AUTONOMOUS_MASTER.md
- CONTEXT_SNAPSHOT.md
- PROJECT_STATE.json
- QUALITY_SCORE.json
- BLOCKERS.json
- EXTERNAL_QUALITY_TOOLING.md
- package.json
- aktif stage MD dosyası

Bütün projeyi yeniden tarama. Aşama 01–04'ü yeniden analiz etme.

Önce ortam kontrolü yap:
1. Node sürümü >=22.22 değilse PAUSED_TECHNICAL olarak yalnız sürüm gereksinimini kaydet.
2. `npm install` çalıştır.
3. `npm run tools:install:browsers` çalıştır.
4. `npm run check` çalıştır.
5. `npm run test:property` çalıştır.
6. `npm run test:e2e:smoke` çalıştır.

Sonra Aşama 05'ten Aşama 15'e kadar 00_AUTONOMOUS_MASTER.md döngüsünü uygula.

Her PASS sonrası kullanıcıya soru sorma; durum/snapshot/analiz/stage raporunu güncelle ve sonraki stage'e geç.

3+ sınıfta kolay/orta soru yayınlama. Hard etiketi gerçek bilişsel kanıt değildir.
Zayıf seçenekli soruya GOLD verme. Öğrenci tüm seçenekleri okumadan cevabı bulabiliyorsa reddet.
Sayı/isim/dekor değişmiş aynı çözüm grafiğini yeni soru sayma.

Hazır araçları yeniden yazma:
- Rastgele/property testi için fast-check kullan.
- Browser ve mobil için Playwright kullan.
- Erişilebilirlik için axe-core kullan.
- Test güvenilirliği için Stryker kullan.
- Firestore rol kuralları için Firebase Emulator kullan.
- AI hakemliği yalnız seçilmiş örneklerde promptfoo + Ollama ile yap; model sonucunu otomatik PASS kabul etme.

Stage09'da her oyun için 500 oturum; Stage15'te clean install, tüm testler, property, E2E, a11y, Firebase rules, mutation ve üç seed/altı profil zorunludur.

Proje yalnız FINAL_RELEASE_DECISION.json decision=PASS olduğunda tamamlanır. FAIL ise otomatik Stage14 düzeltme döngüsüne dön.

Şimdi Aşama 05'i başlat ve Aşama 15 PASS olana kadar kullanıcı müdahalesi olmadan devam et.
