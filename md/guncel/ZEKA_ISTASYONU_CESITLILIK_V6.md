# Zekâ İstasyonu Algılanan Çeşitlilik V6

## Kullanıcı Testinden Gelen Kök Sorun

Sekiz soru teknik olarak farklı `familyId` değerleri taşısa da oturumun büyük bölümü kişi/harf sıralama, önünde-arkasında ve yan yana kısıtlarının yüzey varyasyonlarından oluşuyordu. Bu nedenle öğrenci farklı başlıklar görse bile aynı soruyu yeniden çözdüğü hissine kapılıyordu. Ayrıca 5/5 zorluk için 90 saniyelik varsayılan süre yetersizdi.

## Yeni Oturum Planı

1. Dairesel oturma ve blok yerleşimi — 240 sn
2. Harita üzerinde rota ve graph kısıtları — 210 sn
3. Üç kümede kesişim ve bölge sayma — 210 sn
4. Lambalarda durum dönüşümü ve değişmezlik — 180 sn
5. Ağır parayı bulmada en kötü durum stratejisi — 180 sn
6. Araştırma cihazlarında birebir eşleştirme — 210 sn
7. Haftalık atölye zamanlama — 210 sn
8. Doğru/yanlış ifadelerde durum analizi — 180 sn

## Sert Yayın Kuralları

- Oturumda 8/8 benzersiz `perceivedStructureId` zorunludur.
- Oturumda 8/8 benzersiz yüzey alanı zorunludur.
- 5/5 Zekâ İstasyonu soruları en az 180 saniye alır.
- Her soru en az dört yazılmış çözüm adımı ve bağımsız model taraması taşır.
- Eski sıralama, raf dizme ve kolay dört basamaklı kod soruları whitelist içinde değildir.
- Whitelist tükendiğinde eski jeneratör veya fallback açılmaz.

## Doğrulama

- Canlı çıktı testleri: 36/36 PASS
- Zekâ deneyim çeşitliliği: 8/8
- Son öğrenci yüzeyi: 161/161 PASS
- Eski fallback: 0
- Production build: PASS
