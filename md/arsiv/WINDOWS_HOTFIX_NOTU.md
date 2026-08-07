# V5.0.2 Windows Hotfix

Düzeltilenler:

- `npm run check` sırasında Windows sürücü harfinin iki kez eklenmesi (`C:\\C:\\...`).
- `npm run firebase:deploy` sırasında `firebase.cmd` için `spawn EINVAL`.
- `npm run vercel:deploy` sırasında oluşabilecek aynı `.cmd` çalıştırma sorunu.

Yerel kullanım:

```powershell
npm run check
npm run dev
```

Firebase kuralları:

```powershell
npm run firebase:deploy
```
