# V8 Veri Geçiş Raporu

## Korunan veriler

V8 yükseltmesi mevcut koleksiyon adlarını değiştirmez:

- `accounts`
- `learners`
- `learnerStates`
- `learnerMetrics`
- `attempts`
- `questionReports`
- `blockedQuestions`
- `leaderboards`
- `organizations`
- `classrooms`

`learnerStates.version` yeni senkronizasyonda `8` olur. Eski `version: 5` belgeleri okunmaya devam eder ve ilk kayıt sırasında yeni alanlarla birleştirilir.

## Yeni alanlar

`leaderboards` belgelerine aşağıdaki alanlar eklenir:

- `weeklyXp`
- `weekId`
- `seasonId`
- `leagueId`
- `leagueName`
- `badgeCount`

Bu alanlar öğrencinin ilk V8 senkronizasyonunda otomatik oluşur. Eski XP, doğruluk ve soru sayıları silinmez.

## Yeni koleksiyon izinleri

- `clubs`
- `seasons`
- `familyLeagues`
- `aiInsights`

Bu nedenle canlıya geçmeden önce `npm run firebase:deploy` bir kez çalıştırılmalıdır.

## Geri dönüş

Veri şeması yıkıcı değildir. V8 kodu geri alınsa bile mevcut temel koleksiyonlar kullanılabilir. Yeni sosyal alanlar eski sürümler tarafından yok sayılır.
