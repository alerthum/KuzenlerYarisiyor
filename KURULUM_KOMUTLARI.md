# Kuzenler Yarışıyor v5.0.1 — Kurulum ve Yayın Komutları

## Tek değiştireceğiniz yer

`KUZENLER_AYARLARI.env` dosyasının en üstündeki satır:

```env
CALISMA_MODU=local
```

Bilgisayarda test için `local`, GitHub/Vercel canlı yayın için `canli` yazın.
GitHub ve Firebase Web bağlantıları önceden doldurulmuştur.

> Hesap parolaları, GitHub tokenları, Vercel tokenları veya Firebase private key dosyaları projeye yazılmaz.

---

## 1. Bilgisayarda çalıştırma

ZIP'i çıkartın. Proje klasöründe PowerShell veya Terminal açın:

```powershell
node --version
npm run check
npm run dev
```

Tarayıcı:

```text
http://localhost:6220
```

`npm install firebase` çalıştırmayın. Uygulama Firebase Web SDK'yı tarayıcıdan modüler olarak yükler.

---

## 2. Firebase hazırlığı

Firebase Console'da şu iki hizmet hazır olmalıdır:

1. Authentication > Sign-in method > Email/Password: Enabled
2. Firestore Database: Production mode

Firebase CLI ilk kurulum:

```powershell
npm install -g firebase-tools
firebase login
```

Kuralları ve indeksleri yayınlama:

```powershell
npm run firebase:deploy
```

Firebase Authentication ekranında elle oluşturulmuş kullanıcı giriş yaptığında, uygulama hesap türünü seçtirerek eksik `accounts` belgesini tamamlayabilir.

---

## 3. GitHub'a gönderme

Önce `KUZENLER_AYARLARI.env` içinde:

```env
CALISMA_MODU=canli
```

yapın.

Sonra:

```powershell
npm run check
npm run git:publish
```

Komut şu depoya gönderir:

```text
https://github.com/alerthum/KuzenlerYarisiyor.git
```

GitHub deposu daha önce yalnız README ile oluşturulduysa yayın betiği geçmişleri otomatik birleştirir.
GitHub giriş ekranı açılırsa tarayıcıdan hesabınızla yetki verin.

---

## 4. Vercel ayarları

GitHub deposunu Vercel'e bağlayın:

- Framework / Application Preset: `Other`
- Root Directory: `./`
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variables: boş

`vercel.json` bu ayarları proje içinden taşır.

Deploy bittikten sonra Firebase Console > Authentication > Settings > Authorized domains alanına Vercel alan adını ekleyin:

```text
kuzenler-yarisiyor.vercel.app
```

Gerçek Vercel adresi farklı oluşursa ekranda verilen alan adını ekleyin.

---

## 5. Sonraki güncellemeler

Dosyalarda değişiklik yaptıktan sonra:

```powershell
npm run check
npm run git:publish
```

Vercel GitHub'daki `main` dalını otomatik yeniden deploy eder.
