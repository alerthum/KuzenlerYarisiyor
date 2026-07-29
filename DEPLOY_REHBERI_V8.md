# Zihin Arenası V8 Canlıya Alma

1. Mega ZIP içeriğini mevcut ana klasörün üzerine kopyalayın. `.git` ve `KUZENLER_AYARLARI.env` korunur.
2. PowerShell açın:

```powershell
powershell -ExecutionPolicy Bypass -File .\TEK_KOMUTLA_KURULUM.ps1
```

3. Firestore kurallarını ve indekslerini bir kez gönderin:

```powershell
npm run firebase:deploy
```

4. Yerel kontrol:

```powershell
npm run dev
```

5. GitHub ve Vercel:

```powershell
git status
git add .
git commit -m "Zihin Arenasi V8 Mega Release"
git push
```

Vercel GitHub bağlantısı açıksa push sonrası canlı dağıtım otomatik başlar.
