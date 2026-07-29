// Otomatik üretilir. KUZENLER_AYARLARI.env dosyasını düzenleyin.
export const RUNTIME_CONFIG = Object.freeze({
  "mode": "vercel",
  "appName": "Zihin Arenası",
  "shortName": "Zihin",
  "description": "1-12. sınıf öğrenme omurgasına sahip Türkçe, matematik, İngilizce, fen, sosyal, zekâ ve olimpiyat platformu.",
  "dataProvider": "firebase",
  "contentVersion": "6.5.0",
  "aiProvider": "local",
  "git": {
    "repositoryUrl": "https://github.com/alerthum/KuzenlerYarisiyor.git",
    "defaultBranch": "main"
  },
  "vercel": {
    "projectName": "kuzenler-yarisiyor"
  },
  "firebase": {
    "enabled": true,
    "apiKey": "AIzaSyAasvCdhWxDpQtwko01vneb5XQGZSreDFE",
    "authDomain": "kuzenleryarisiyor.firebaseapp.com",
    "projectId": "kuzenleryarisiyor",
    "storageBucket": "kuzenleryarisiyor.firebasestorage.app",
    "messagingSenderId": "640314518968",
    "appId": "1:640314518968:web:f881df8cba3df34a83334d",
    "measurementId": ""
  },
  "features": {
    "allowAnonymousPlay": false,
    "teacherPreview": true,
    "parentAnalytics": true,
    "pwa": true,
    "requireAuthInLive": true,
    "allowPublicSignup": true,
    "parentAccounts": true,
    "teacherAccounts": true,
    "studentAccounts": true,
    "teacherBulkImport": true,
    "teacherAnalytics": true
  },
  "ownerAdminEmail": "alerthum@yahoo.com",
  "studentAuthDomain": "students.kuzenleryarisiyor.local",
  "limits": {
    "maxChildrenPerParent": 8,
    "maxStudentsPerClassroom": 50,
    "maxBulkImport": 40
  }
});
