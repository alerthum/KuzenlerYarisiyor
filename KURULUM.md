# Kurulum

ZIP içindeki dosya ve klasörleri mevcut ana proje klasörünün üzerine kopyalayın:

`C:\Users\ibrahimyokus\Desktop\Kuzenler_Yarisiyor`

Ayar dosyanıza ve `.git` klasörünüze dokunulmaz.

```powershell
Ctrl + C
npm run check
npm run firebase:deploy
npm run dev
```

Bu sürüm Firestore kurallarına `blockedQuestionFamilies` koleksiyonunu eklediği için Firebase deploy zorunludur.

Yerel kontrolden sonra:

```powershell
git status
git add .
git commit -m "V9 Alpha 1 akademik metadata ustalik ve karantina temeli"
git push
```
