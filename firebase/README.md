# Firebase V5 Kurulumu

1. Firebase projesi oluşturun ve Web uygulaması ekleyin.
2. Authentication > Sign-in method altında **Email/Password** yöntemini açın.
3. Firestore Database oluşturun.
4. `KUZENLER_AYARLARI.env` dosyasındaki Firebase Web alanlarını doldurun.
5. `APP_MODE=vercel`, `DATA_PROVIDER=firebase`, `FIREBASE_ENABLED=true` yapın.
6. `npm run check` ile canlı yapılandırmayı doğrulayın.
7. İlk kez `npm install -g firebase-tools` ve `firebase login` çalıştırın.
8. Kuralları ve indeksleri `npm run firebase:deploy` ile yayınlayın.
9. Git/Vercel yayınına geçin.

Canlı modda Firebase ayarları eksikse build başarısız olur ve anonim oyun açılmaz. Firestore kuralları normal kullanıcıların rol ve öğrenci sahipliği alanlarını değiştirmesini engeller.
