# Zihin Arenası V6.5.2 — Sürüm Kabul Raporu

## Düzeltilen regresyonlar

- 11. sınıf oyun kütüphanesine TYT ve AYT kategori filtreleri eklendi.
- 12. sınıf oyun kütüphanesine TYT, AYT ve KPSS kategori filtreleri eklendi.
- 11–12. sınıf filtrelerinden LGS ve Din kaldırıldı.
- TYT, AYT ve KPSS kartlarında görülen `undefined` kategori değeri kaldırıldı.
- Oyun adları tek merkezi Türkçe sözlüğe bağlandı.
- Admin, öğretmen ve veli analizlerinde teknik oyun kimlikleri yerine Türkçe ad kullanılması sağlandı.
- Yerel profil normalizasyonunda 8. sınıf LGS, 11. sınıf YKS, 12. sınıf YKS+KPSS varsayılanları düzeltildi.

## Korunduğu otomatik testlerle doğrulanan özellikler

- Öğrenci düzenleme ve PIN işlemleri
- Profil ve çıkış işlemleri
- Soru durdurma, beyaz tahta ve hesap makinesi
- Kalıcı gelişim kayıtları
- Genel, sınıf ve yaş sıralaması
- Soru bildirme ve admin inceleme akışı
- Orta-üstü zorluk kalite kapısı
- Aynı sorunun oturum içinde ve geçmiş profilde tekrarlanmaması
- V6.5 Zihin Rehberi ve ders/kazanım matrisi

## Bilinçli olarak kaldırılan özellik

Yok.

## Bilinen eksikler

- MEB kazanımlarının tamamı henüz geniş ve editör onaylı soru havuzuyla doldurulmuş değildir.
- AI ajanları şu aşamada yerel karar motorlarıdır; harici üretken AI servisi henüz bağlanmamıştır.
- Mobil yönetim ekranlarının cihaz bazlı görsel test kapsamı genişletilecektir.

## Kabul senaryoları

- 8. sınıf: LGS görünür; TYT, AYT, KPSS görünmez.
- 11. sınıf: TYT ve AYT görünür; LGS ve KPSS görünmez.
- 12. sınıf: TYT, AYT ve KPSS görünür; LGS ve Din filtreleri görünmez.
- Kullanıcı ekranlarında sınav kartı kategorisi `undefined` olamaz.
- Oyun bazında analizde bilinen oyun kimlikleri İngilizce teknik adla gösterilemez.
