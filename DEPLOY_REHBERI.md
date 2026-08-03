# Kuzenler Yarışıyor V5 — Tek Dosyadan Git, Firebase ve Vercel Yayını

Bütün proje değerleri `KUZENLER_AYARLARI.env` dosyasında tutulur. Parola, Firebase service-account anahtarı, GitHub tokenı veya Vercel tokenı bu dosyaya yazılmaz.

## 1. Firebase projesini hazırlayın

Firebase Console’da:

1. Yeni proje oluşturun.
2. Bir Web uygulaması ekleyin.
3. Authentication > Sign-in method alanında **Email/Password** yöntemini açın.
4. Firestore Database oluşturun.
5. Web yapılandırma değerlerini `KUZENLER_AYARLARI.env` dosyasına girin.

```text
APP_MODE=vercel
DATA_PROVIDER=firebase
FIREBASE_ENABLED=true
REQUIRE_AUTH_IN_LIVE=true
ALLOW_ANONYMOUS_PLAY=false

FIREBASE_API_KEY=...
FIREBASE_AUTH_DOMAIN=proje.firebaseapp.com
FIREBASE_PROJECT_ID=proje-id
FIREBASE_STORAGE_BUCKET=proje.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=...
FIREBASE_APP_ID=...
```

Firebase Web yapılandırması istemci uygulamasının bağlantı bilgisidir. Service account/private key kesinlikle bu dosyaya eklenmez.

## 2. Canlı ayarları doğrulayın

```bash
npm run check
```

Komut aşağıdaki güvensiz durumlarda bilinçli olarak durur:

- `APP_MODE=vercel` fakat `DATA_PROVIDER=local`
- Firebase kapalı veya temel alanlar eksik
- Canlı giriş zorunluluğu kapalı
- Anonim oyun açık

## 3. Firestore kurallarını tek komutla yayınlayın

İlk kez:

```bash
npm install -g firebase-tools
firebase login
```

Sonra:

```bash
npm run firebase:deploy
```

Komut Firebase proje kimliğini doğrudan `KUZENLER_AYARLARI.env` içindeki `FIREBASE_PROJECT_ID` alanından alır ve kurallar ile indeksleri yayınlar.

## 4. GitHub deposuna gönderin

Ayar dosyasına:

```text
GIT_REPOSITORY_URL=https://github.com/KULLANICI/DEPO.git
GIT_DEFAULT_BRANCH=main
```

Git hesabınız bilgisayarda hazırsa:

```bash
npm run git:publish
```

Komut depoyu başlatır, `origin` adresini ayar dosyasından kurar, commit oluşturur ve seçili dala gönderir.

## 5. Vercel’e yayınlayın

### GitHub bağlantısıyla

Vercel panelinde GitHub deposunu içe aktarın:

- Framework Preset: **Other**
- Build Command: `npm run build`
- Output Directory: `dist`

### CLI ile

İlk kez:

```bash
npm install -g vercel
vercel login
```

Sonra:

```bash
npm run vercel:deploy
```

`VERCEL_TEAM_ID` ve `VERCEL_PROJECT_ID` girilmişse komut bunları kullanır. Boşsa Vercel CLI ilk bağlantı akışını yürütür.

## 6. İlk canlı pilot kontrolü

1. Giriş yapmadan oyunun açılmadığını doğrulayın.
2. Veli hesabı açın ve farklı sınıflarda iki çocuk ekleyin.
3. Oluşturulan kod ve PIN’i kaydedin.
4. Gizli sekmede öğrenci koduyla giriş yapın.
5. En az 10 soru çözün ve birkaç ipucu kullanın.
6. Veli panelinde toplam ve oyun bazında analizleri kontrol edin.
7. Öğretmen hesabıyla sınıf oluşturun.
8. `Ad Soyad;Sınıf;Yaş` biçiminde toplu öğrenci ekleyin.
9. Öğretmen panelinde sınıf filtresi ve öğrenci analizlerini kontrol edin.
10. Bir soruyu hatalı bildirip yetişkin analizinde kaydın göründüğünü doğrulayın.

## Pilot güvenlik sınırı

V5 kontrollü okul pilotuna yöneliktir. Öğretmen rolü kayıt sırasında seçilebilir. Halka açık geniş yayın öncesinde öğretmen hesabı davet/onay sistemine; öğrenci oluşturma ve PIN sıfırlama ise güvenli Cloud Function/Admin API katmanına taşınmalıdır.
