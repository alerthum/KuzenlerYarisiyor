# İçerik Geliştirme Rehberi — v3

## Eğitim kuralları

1. Açıklama yalnız doğru şıkkı değil düşünme yolunu anlatır.
2. Çeldiriciler muhtemel öğrenci hatalarından üretilir.
3. Aynı sorunun yalnız kelime sırası değiştirilmiş kopyaları eklenmez.
4. 9 yaş içeriği somut ve kısa adımlıdır.
5. 13 yaş içeriği çıkarım, çok aşamalı ilişki ve strateji gerektirir.
6. Soru şüpheliyse çocuk **Soru yanlış veya hatalı** düğmesiyle ebeveyne bildirebilir.

## Statik soru

```js
{
  minAge: 11,
  context: 'Gerekli bilgi metni',
  prompt: 'Soru kökü',
  options: ['A', 'B', 'C', 'D'],
  answer: 2,
  explanation: 'Cevaba götüren düşünme yolu.'
}
```

Kurallar:

- `answer` sıfır tabanlı seçenektir.
- Dört seçenek birbirinden farklı olmalıdır.
- Birden fazla doğruya izin verilmez.
- Soru metni ve bağlam birlikte benzersiz olmalıdır.

## Dinamik soru

Dinamik üretici aynı `seed` ile aynı soruyu üretmelidir. Üretilen tur:

- Geçerli dört seçenek
- Tek doğru cevap
- Açıklama
- Yaşa uygun değer aralığı
- Sıfıra bölme ve anlamsız sonuç koruması

sağlamalıdır.

## İngilizce kelime

```js
['word', 'Türkçe anlam', 'Example sentence using the word.']
```

- İngilizce kelime benzersiz olmalıdır.
- Örnek cümlede kelime doğal bağlamda kullanılmalıdır.
- Başlangıç kelimeleri `minAge: 8`, ileri kelimeler `minAge: 11` havuzuna eklenir.
- Her 20 kelimelik günlük paket daha önce görülmemiş ID’lerden seçilir.

## Kelime Madeni

Her set:

- `source`: ana kelime
- `allowed`: doğrulanmış örnekler
- `minAge`: alt yaş sınırı

Liste yalnız örnek havuzudur; kullanıcı cevabı geniş doğrulama sözlüğünde de aranır. Türkçede `ı/i`, `o/ö`, `u/ü`, `s/ş`, `c/ç`, `g/ğ` ayrı harftir.

## Soru anahtarı

Statik sorularda anahtar prompt, context ve seçenek imzasından; dinamik sorularda soru verilerinden üretilir. İki farklı içeriğin aynı `questionKey` üretmemesine dikkat edilmelidir.

## Otomatik kontrol

Her değişiklikten sonra:

```bash
npm run check
```

Testler içerik, cevap, çeşitlilik, tekrar engelleme, kelime harf uyumu, günlük plan ve matematik motorlarını kontrol eder.
