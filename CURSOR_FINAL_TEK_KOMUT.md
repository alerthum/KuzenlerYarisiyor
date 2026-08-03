# Cursor'a gönderilecek tek komut

Zihin Arenası projesinde Aşama 01–04 tamamlanmıştır; Aşama 04 sonucu 23/23 aktif oyun PASS'tır.

Önce yalnız şunları oku:
- 00_AUTONOMOUS_MASTER.md
- CONTEXT_SNAPSHOT.md
- PROJECT_STATE.json
- QUALITY_SCORE.json
- BLOCKERS.json
- AGENTS.md
- docs/rules/11_AUTONOMOUS_NO_ASK_POLICY.md
- docs/rules/12_STAGE_QUALITY_GATE_POLICY.md
- docs/rules/13_ANTI_FALSE_PASS_POLICY.md
- docs/rules/14_FINAL_REGRESSION_POLICY.md
- docs/rules/15_MODEL_INDEPENDENT_ACCEPTANCE.md
- docs/rules/16_NO_FUTURE_SCOPE_EXPANSION.md
- docs/stages/05_COGNITIVE_DEPTH_ENGINE.md

Bütün projeyi yeniden tarama. Aşama 01–04'ü yeniden analiz etme. Yalnız aktif aşama ve ilgili kaynak/test dosyalarını aç.

Aşama 05'ten başla ve Aşama 15 PASS olana kadar otonom çalış.

Her PASS sonrası kullanıcıya sorma; snapshot/durum/puan/blocker/analiz/stage raporunu güncelle, sonraki stage dosyasını aç ve devam et.

Aşağıdakileri sorma:
- Devam edeyim mi?
- Hangi oyundan başlayayım?
- Kapsamı/eşiği düşürelim mi?
- Sonraki aşamaya geçeyim mi?
- Tam regresyon çalıştırayım mı?
- Uzun sürüyor, azaltalım mı?

Başarısız stage için FAIL_CONTINUE yaz ve aynı stage içinde düzelt. Yalnız ana yürütücüdeki teknik koşullarda PAUSED_TECHNICAL kullan.

3+ sınıfta kolay/orta soru yayınlama. Hard etiketi gerçek bilişsel kanıt yerine geçmez.
Zayıf seçenekli soruya GOLD verme. Alakasız, saçma, tek olumsuz, biçimsel ipuçlu veya rastgele seçenek yayınlama. Öğrenci tüm seçenekleri okumadan doğru cevabı bulabiliyorsa reddet.
Yanlış cevap, çoklu doğru, açıklama uyumsuzluğu ve yüzeysel tekrar sıfır olmalı.
Sayı/isim/dekor değişmiş aynı çözüm grafiği yeni soru değildir.

Stage09'da her oyun için 500 oturum zorunlu.
Stage15'te clean install, tüm testler, web/mobil/admin E2E, üç seed ve altı profil zorunlu.
Genel kalite >=90, zorluk/seçenek >=95, doğruluk/tek cevap=100 ve critical/high blocker=0 olmadan tamamlandı deme.

Proje yalnız FINAL_RELEASE_DECISION.json içinde decision=PASS olduğunda tamamlanır. FAIL ise otomatik Stage14 düzeltme döngüsüne dön.

Şimdi Stage05'i başlat ve Stage15 PASS olana kadar kullanıcı müdahalesi olmadan devam et.
