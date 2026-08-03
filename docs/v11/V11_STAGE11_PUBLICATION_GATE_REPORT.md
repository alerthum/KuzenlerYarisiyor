# V11 Aşama 11 — Otomatik Yayın ve Karantina Kapısı

AI üretimleri artık katı sözleşme doğrulamasından sonra dört karardan yalnız birini alır:

- `PUBLISH`: Öğrenciye açılabilir.
- `REVIEW`: Yapısal olarak geçerli, editör onayı gerekir.
- `QUARANTINE`: Düzeltilebilir biçim veya içerik sözleşmesi hatası vardır.
- `REJECT`: Kimlik ya da sözleşme güvenliği ihlali vardır.

Yalnız `PUBLISH` kararı `studentVisible: true` üretir. Her karar; hata/uyarı listesi, iskelet ve sözleşme kimliği, zaman, kaynak, parmak izi ve denetim izi taşır. Böylece kalite kapısını geçmeyen hiçbir AI sorusu doğrudan öğrenci havuzuna giremez.
