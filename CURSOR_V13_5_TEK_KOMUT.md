# Cursor V13.5 Tek Komut

Projede V13.5 Question Factory uygulanmış durumdadır.

Önce yalnız şu dosyaları oku:

- `CONTEXT_SNAPSHOT.md`
- `IMPLEMENTATION_REPORT_V13_5_QUESTION_FACTORY.md`
- `js/quality/question-factory-v13.js`
- `js/games/registry.js`
- `js/quality/product-acceptance-audit.js`
- `tests/v13-question-factory-gates.test.mjs`
- `PRODUCT_ACCEPTANCE_DECISION.json`

Bütün projeyi yeniden tarama.
Aşama 01–04 ve eski Stage14 raporlarını yeniden açma.
Eski `PRODUCT_ACCEPTANCE: PASS` kararını geçersiz kabul et.

Aktif hedef:

```text
V13.5 Question Factory sonrası strict ürün kabulünü gerçekten geçirmek.
```

Önce çalıştır:

```bash
npm run quality:premium-core
```

PASS ise çalıştır:

```bash
npm run quality:product-acceptance:strict
```

Eğer `quality:product-acceptance:strict` FAIL olursa:

1. Eşiği düşürme.
2. `productReady=true` yazma.
3. Rapora PASS verme.
4. Tüm mimariyi yeniden yazma.
5. Hangi oyun/aile/skeleton/cognitiveExperience başarısızsa yalnız onu düzelt.
6. `misconceptionId`, `distractorPlanId`, `cognitiveExperienceId`, `structuralId` ve fake-hard ret kurallarını gevşetme.
7. “73+88” tarzı doğrudan işlem, 3. sınıf sonrası hard olamaz.
8. “çıkarım yapmana gerek yok” yazan soru hard olamaz.
9. `sameExperienceRate > 0.12` ise perceived diversity PASS olamaz.
10. İçerik review, alan doluluğunu değil gerçek kalite ihlalini denetler.

Her düzeltmeden sonra yalnız ilgili testleri çalıştır. Sıkı ürün kabulü PASS olmadıkça kullanıcıya ürün tamamlandı deme.

Çalışma sınırı nedeniyle durursan:

- `CONTEXT_SNAPSHOT.md` içine gerçek hata, dosya, test ve sonraki kesin komutu yaz.
- `PRODUCT_ACCEPTANCE_DECISION.json` içinde `productReady=false` kalsın.
- Kullanıcıdan kapsam/eşik/onay isteme.
