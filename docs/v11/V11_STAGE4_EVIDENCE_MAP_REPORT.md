# V11 Aşama 4 — Evidence Map ve Seçenek Yanılgı Kimliği

Paragraf Dedektifi tarafından üretilen her soru artık iki yeni tanısal yapı taşır:

- `evidenceMap`: Doğru cevabın dayandığı metin kanıtlarını kimliklendirir.
- `optionDiagnostics`: Dört seçeneği tek tek değerlendirir; doğru seçeneği kanıta, üç yanlış seçeneği bilişsel yanılgılara bağlar.

## Çalışma zamanı sözleşmesi

Her soru için:

- en az bir `evidenceUnit` bulunur,
- doğru cevap `correctAnswerEvidenceIds` alanına bağlanır,
- dört seçenek için tanı kaydı üretilir,
- yalnız bir seçenek `SUPPORTED_CORRECT` olur,
- üç yanlış seçenek `MISCONCEPTION_MAPPED` olur,
- yanılgılar ilgili V11 iskelet kataloğundan alınır.

Bu aşama öğrenci cevabının yalnız doğru/yanlış olarak değil, hangi düşünme hatasına dayanarak verildiğinin kaydedilebilmesi için altyapıyı hazırlar.
