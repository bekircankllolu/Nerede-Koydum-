# Koydum — Eşya Hafızası

Nadiren kullandığın eşyaları nereye koyduğunu hatırlayan mobil uygulama. Eşyayı kaydederken fotoğrafını çek, yerini söyle; sonra "Pasaport nerede?" diye sor.

React Native (Expo) ile yazıldı, iOS ve Android'de çalışır.

## Özellikler

- **Bul** — Türkçe'ye duyarlı arama. Aksan/şapka farkı gözetmez ("sarj" → "şarj aleti"), soru kalıplarını temizler ("pasaport nerede koydum" → "pasaport"), sonuçları isim/not/konum eşleşmesine ve kaydın tazeliğine göre sıralar.
- **Sesle kayıt** — Gerçek Türkçe (tr-TR) konuşma tanıma. Arama kutusu, eşya adı, konum ve yer değiştirme alanlarının hepsinde mikrofon var.
- **Fotoğraf** — Kamerayla çek ya da galeriden seç.
- **Eşya detayı** — Bulunduğu yer, not, konum geçmişi. "Konumu doğrula" ile kaydı tazele, "Yerini değiştir" ile yeni konuma taşı (eskisi geçmişe düşer).
- **Eşyalar** — Tümü / Son eklenenler / Favoriler / Yatak odası / Fotoğrafsızlar filtreleri.
- **Onboarding** — 3 adımlık tanıtım, ilk açılışta bir kez.
- **Koydum Pro** — Ücretsiz sınır 20 eşya; sonrasında paywall.

Tüm veriler cihazda saklanır. Hesap gerekmez, sunucuya bir şey gitmez.

## Kurulum

```bash
git clone https://github.com/bekircankllolu/Nerede-Koydum-.git
cd Nerede-Koydum-
npm install
```

### Çalıştırma

**Expo Go ile (hızlı bakış):**

```bash
npx expo start
```

Telefonuna Expo Go kur, QR kodu okut. Arayüz, veritabanı ve kamera çalışır — **ses tanıma çalışmaz** (native modül, Expo Go desteklemiyor).

**Dev build ile (ses dahil her şey):**

```bash
npx expo prebuild
npx expo run:ios       # Mac + Xcode gerekir
npx expo run:android   # Android Studio / SDK gerekir
```

Mac'in yoksa bulutta derletebilirsin:

```bash
npm install -g eas-cli
eas login
eas build --profile development --platform android
```

Çıkan kurulum dosyasını telefonuna kur, sonra `npx expo start --dev-client` ile bağlan.

## Proje yapısı

```
App.tsx                    Ekran yönlendirme ve katman sırası
src/
  theme.ts                 Renk, köşe yarıçapı, ücretsiz sınır
  state/KoydumContext.tsx  Tüm uygulama durumu ve iş mantığı
  db/index.ts              SQLite şeması, seed verisi, CRUD
  lib/
    search.ts              Türkçe normalizasyon, skorlama, tarih biçimleme
    voice.ts               Konuşma tanıma hook'u (dinliyor → çeviriyor → sonuç)
  screens/                 Bul, Eşyalar, Ayarlar, Detay, Yeni eşya,
                           Yer değiştirme, Ses paneli, Paywall, Onboarding
  components/              Ortak butonlar, ikonlar, satır, toast, dalga formu
```

Uygulama ilk açılışta örnek 7 eşyayla gelir (pasaport, matkap, yedek anahtar…), böylece boş ekranla karşılaşmazsın. Bunları silip kendi eşyalarını ekleyebilirsin.

## İzinler

| İzin | Ne için |
|---|---|
| Mikrofon + Konuşma tanıma | Eşya adını/konumunu sesle girmek |
| Kamera | Eşyanın fotoğrafını çekmek |
| Galeri | Var olan fotoğrafı seçmek |

## Bilinen eksikler

- **Pro satın alma gerçek değil.** "Ömür Boyu Pro" butonu şu an sadece bir anahtar çeviriyor; gerçek ödeme için App Store Connect / Play Console tarafında ürün tanımlayıp `expo-in-app-purchases` benzeri bir katman eklemek gerekiyor.
- **Dark Mode yok.** Uygulama açık temada sabit (paywall ekranı hariç, o zaten koyu).
- **Düzenle / Paylaş / Arşivle** butonları detay ekranında duruyor ama henüz iş yapmıyor.
- **Oda filtresi sabit.** Filtre çipi yalnızca "Yatak odası" kayıtlarını süzer; odalar henüz kayıtlardan dinamik olarak çıkarılmıyor.
- **Cihaz üzerinde test edilmedi.** Kod her iki platform için de sorunsuz derleniyor (TypeScript hatasız, iOS/Android bundle başarılı) ama mikrofon izni akışı, kamera açılışı gibi şeyler gerçek telefonda henüz denenmedi.

## Teknik

Expo SDK 57 · React Native 0.86 · TypeScript (strict)

`expo-sqlite` · `expo-speech-recognition` · `expo-image-picker` · `react-native-svg` · `react-native-safe-area-context`

---

Tasarım [Claude Design](https://claude.ai/design) ile yapıldı, uygulama Claude Code ile hayata geçirildi.
