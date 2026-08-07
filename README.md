# Zihin Arenası — Güvenli Canlı Çekirdek

Bu paket ürünün tamamını yayınlamaz. Yalnız son öğrenci yüzeyi incelenmiş açık whitelist hücrelerini gösterir; doğrulanmamış eski jeneratör ve fallback soruları öğrenciye ulaşmaz.

## Tek komutla çalıştırma

Windows'ta proje klasöründe:

```powershell
.\BASLAT.cmd
```

`node_modules` yoksa bağımlılıklar kurulur; uygulama `http://localhost:6220` adresinde açılır.

## Açık güvenli kapsam

### 7. sınıf

- Paragraf Dedektifi: 4 derin soru
- Anlam Avı: 4 derin soru
- Problem Avcısı: 8 çok adımlı Matematik sorusu
- Fen Akıl Yürütme: 8 deney, veri ve çoklu kanıt sorusu

### 8. sınıf

- Paragraf Dedektifi: 8 soru
- Anlam Avı: 8 soru
- Problem Avcısı: 12 çok adımlı Matematik sorusu
- Fen Akıl Yürütme: 12 deney, veri ve çoklu kanıt sorusu
- Zekâ İstasyonu: 8 kısıt çözücülü soru
- Olimpiyat Merdiveni: 9 çözücü-doğrulamalı model

### İngilizce

- 5–8. sınıf Günün 20 İngilizce Kelimesi: sınıf bazlı temiz bağlamsal oturumlar

Toplam: **7 oyun, 14 sınıf-oyun hücresi, 161 onaylı atama, 121 benzersiz soru.**

## Yayın kuralı

- Whitelist dışındaki bütün sınıf-oyun hücreleri kapalıdır.
- Güvenli soru kalmazsa eski havuza geçilmez; oturum boş döner.
- Ürün bütünü hazır değildir.
- Güncel karar: `public/trusted-live-release.json`
- Son-ekran inceleme paketi: `quality-reports/trusted-live-review.html`


## Yönetim paneli çalışma zamanı düzeltmeleri

- **Canlı Durum Özetini Kopyala** artık null alanlar yerine güncel güvenli yayın durumunu, mevcut işi, sıradaki adımı ve engelleri verir.
- Eski Phase5I Firestore soru sağlık taraması yönetim paneli açılırken otomatik çalışmaz; gereksiz yetki uyarısı üretmez.
- Tamamlanmış `PASS/FAIL/ABORTED` işlemler 5 saniyede bir sorgulanmaz; polling yalnız `STARTING/RUNNING/STALLED` sırasında çalışır.
- Yerel sunucu CSP ayarı Firebase kaynak haritalarını engellemez.
- Modern PWA meta etiketi eklenmiştir; deprecated tarayıcı uyarısı kaldırılmıştır.
- 5. sınıf Günün 20 İngilizce Kelimesi whitelist'i tam 20 sorudur.

## Ana klasör düzeni

- `js/`: uygulama ve soru motoru kaynakları
- `css/`: arayüz stilleri
- `scripts/`: aktif Node.js bakım, kalite ve paketleme betikleri
- `tests/`: aktif testler
- `md/guncel/`: güncel durum ve çalışma belgeleri
- `md/arsiv/`: eski faz ve rapor belgeleri
- `public/`: Komuta Merkezi ve yayın durumu
- `quality-reports/`: güncel kalite kanıtları

Tarihsel olarak bütün ürünü PASS yazabilen eski test ve betikler aktif yoldan çıkarılmıştır; final çalışma ZIP'ine alınmaz.
