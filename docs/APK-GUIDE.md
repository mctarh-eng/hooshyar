# 📱 راهنمای تولید خروجی APK «هوش‌یار»

این پروژه با **Capacitor** اندروید شده و با **GitHub Actions** به‌صورت خودکار APK می‌سازد.
نیازی به اندروید استودیو یا هیچ نصب محلی نیست — همه‌چیز در سرورهای گیت‌هاب ساخته می‌شود.

---

## 🗺️ تصویر کلی

```
هوش‌یار (وب اپ Next.js)  ←  مغز اپ (AI، دیتابیس) روی سرور می‌ماند
        ↓
اپ اندروید (Capacitor WebView)  ←  فقط «قاب» امن اندروید است و سایت را داخل خودش باز می‌کند
        ↓
GitHub Actions  ←  هر push → APK آماده دانلود
```

> نکته‌ی مهم: قابلیت‌های هوش مصنوعی (گفتگو، تصویر، صدا) سمت سرور اجرا می‌شوند؛
> بنابراین برای اینکه APK واقعاً کار کند، اول باید وب‌اپ روی یک آدرس HTTPS منتشر شود
> (مثلاً یک VPS ایران‌دوست یا هر هاست Node). بعد آدرسش را به اپ می‌دهیم.

---

## مرحله ۱ — اتصال به گیت‌هاب (توکن بده)

1. وارد GitHub شو → گوشه‌ی بالا-راست روی عکس پروفایل → **Settings**
2. پایین صفحه: **Developer settings**
3. **Personal access tokens → Fine-grained tokens** → **Generate new token**
4. تنظیمات توکن:
   - **Token name:** `hooshyar-apk`
   - **Expiration:** مثلاً ۷ روز (بعد از کار می‌توانی حذفش کنی)
   - **Repository access:** فعلاً لازم نیست ریپویی انتخاب کنی (ریپو را ما می‌سازیم)
   - **Permissions → Repository permissions:**
     - `Administration`: **Read and write** (برای ساخت ریپو جدید)
     - `Contents`: **Read and write** (برای push کردن کد)
     - `Actions`: **Read and write** (برای اجرا و دیدن خروجی‌ها)
5. **Generate token** → توکن (`github_pat_...`) را کپی کن و به من بده

🔒 بعد از اتمام کار می‌توانی از همان صفحه توکن را **Revoke** کنی.

## مرحله ۲ — من این کارها را انجام می‌دهم

1. ساخت ریپو `hooshyar` (پابلیک پیشنهاد می‌شود تا مینوت‌های Actions نامحدود باشد)
2. push کل پروژه (وب + پوشه‌ی `android/` + workflow)
3. اجرای خودکار workflow → APK آماده‌ی دانلود در تب **Actions**

## مرحله ۳ — گرفتن خروجی APK

1. ریپو → تب **Actions** → آخرین رانِ «Build Android APK (هوش‌یار)»
2. پایین صفحه‌ی ران، بخش **Artifacts** → دانلود **hooshyar-apk**
3. فایل زیپ را باز کن:
   - `hooshyar-debug.apk` → برای تست روی گوشی (نصب مستقیم)
   - `hooshyar-release.apk` / `hooshyar-release.aab` → برای انتشار در بازار/مایکت (اگر امضا تنظیم شده باشد)

> اگر ریپو پابلیک باشد، با تگ زدن (مثل `v1.0.0`) خروجی در بخش **Releases** هم قرار می‌گیرد و بدون لاگین قابل دانلود است.

---

## ⚙️ تنظیم آدرس سرور (بعد از deploy)

وقتی وب‌اپ روی آدرس HTTPS منتشر شد:

**در گیت‌هاب:**
`Settings → Secrets and variables → Actions → تب Variables → New repository variable`
- Name: `CAP_SERVER_URL`
- Value: `https://آدرس-اپ-تو.example.com`

بعد: تب **Actions** → workflow را انتخاب → **Run workflow** → APK جدید با آدرس درست ساخته می‌شود.

**یا لوکال:** `CAP_SERVER_URL=https://... bunx cap sync android` و بعد commit پوشه‌ی android.

---

## ✍️ امضای Release (برای بازار و مایکت)

برای انتشار در استورها، APK/AAB باید با کلید تو امضا شود:

```bash
# ساخت کلید (یک بار برای همیشه — گم نشود!)
keytool -genkey -v -keystore hooshyar.keystore -alias hooshyar \
  -keyalg RSA -keysize 2048 -validity 10000
```

بعد در گیت‌هاب، ۴ تا **Secret** بساز (`Settings → Secrets and variables → Actions → تب Secrets`):

| Secret | مقدار |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | خروجی این دستور: `base64 -w0 hooshyar.keystore` |
| `ANDROID_KEYSTORE_PASSWORD` | پسورد استور |
| `ANDROID_KEY_ALIAS` | `hooshyar` |
| `ANDROID_KEY_PASSWORD` | پسورد کلید |

از ران بعدی، `hooshyar-release.apk` و `hooshyar-release.aab` **امضاشده** ساخته می‌شوند.

> ⚠️ کلید `.keystore` را هرگز داخل ریپو commit نکن (در `.gitignore` هست) و نسخه‌ی پشتیبانش را جای امن نگه دار — برای آپدیت‌های بعدی در استورها همان کلید لازم است.

---

## 🏪 نکات انتشار در بازار و مایکت

- شناسه‌ی پکیج: `ir.hooshyar.app` — شماره‌ی نسخه در `android/app/build.gradle` (`versionCode` / `versionName`)
- بازار: فایل APK امضاشده + توضیحات و اسکرین‌شات؛ مایکت: APK یا AAB
- برای گرفتن اسکرین‌شات مناسب استور، از اپ در اندازه‌های گوشی + تبلت عکس بگیر
- قبل از ارسال، حتماً `CAP_SERVER_URL` تنظیم شده باشد وگرنه اپ باز می‌شود ولی به سرور وصل نمی‌شود

---

## 🛠️ دستورات مفید لوکال

```bash
bun run cap:sync      # همگام‌سازی config و آیکون‌ها با اندروید
bun run cap:android   # sync + build debug (نیاز به Android SDK)
bunx cap open android # باز کردن پروژه اندروید در اندروید استودیو
```
