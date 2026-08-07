# Aşama 05 — Bilişsel Derinlik Raporu

**Durum: PASS**
**Tarih:** 2026-08-02T00:00:00Z

## Çıkış kriterleri
| Kriter | Sonuç |
|--------|--------|
| grade≥3 easy/medium yayın | 0 |
| cognitiveDepthEvidence zorunlu | PASS |
| reasoningStepCount≥2 | PASS |
| ≥2 yüksek bilişsel özellik | PASS |
| hard etiketi tek başına yeterli değil | PASS |
| yalnız büyük sayı/uzun metin zor değil | PASS |
| stage puanı ≥95 | PASS |

## Kanıt
- `js/quality/cognitive-depth-engine.js`
- `js/games/registry.js` (grade≥3 yayın filtresi)
- `js/quality/question-contract-v11.js` (evidence sözleşmede)
- `tests/stage05-cognitive-depth.test.mjs` — **8/8 PASS**

## Not
Aşama 01–04 içerikleri yeniden yazılmadı; kapı/evidence katmanı eklendi.
