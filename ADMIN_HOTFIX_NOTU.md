# V5.0.3 Admin Hotfix

- OWNER_ADMIN_EMAIL=alerthum@yahoo.com hesabı ilk girişte Sistem Yöneticisi olarak tamamlanabilir.
- Admin tüm hesapları, öğrencileri ve sınıfları görebilir.
- Admin kullanıcı rollerini veli/öğretmen/öğrenci olarak değiştirebilir.
- Admin ekranından admin, öğretmen ve veli görünümü arasında önizleme yapılabilir.
- Herhangi bir Firebase hatasında uygulama artık “Veriler hazırlanıyor” ekranında sonsuza kadar kalmaz; hata ve yeniden dene ekranı gösterilir.
- Firestore kuralları, yalnız OWNER_ADMIN_EMAIL hesabının kendi admin belgesini ilk kez oluşturmasına izin verir.

## Kurulum sırası

1. Eski sunucuyu Ctrl+C ile durdurun.
2. Bu paketi ayrı klasöre çıkarın.
3. `CALISMA_MODU=canli` hazırdır.
4. `npm run check`
5. `npm run firebase:deploy`
6. `npm run dev`
7. Tarayıcıda Ctrl+Shift+R yapın veya gizli sekmede açın.
8. alerthum@yahoo.com ile giriş yapın.
9. Hesap kaydını tamamla ekranında Sistem Yöneticisi seçili gelecektir.
