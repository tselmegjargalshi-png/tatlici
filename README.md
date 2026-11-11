# Tatlı Durağı Dijital Menü

Gaziantep Tatlı Durağı için QR menü. Yalnızca Türkçe, alerjen simgeleri, kalori bilgisi, arama, alerjen filtresi ve yönetim paneli içerir.

Canlı adres: https://tatlici.vercel.app

## Yapı

| Yol | Görev |
| --- | --- |
| `index.html`, `assets/app.js`, `assets/styles.css` | Misafirlerin gördüğü menü |
| `admin.html`, `assets/admin.js`, `assets/admin.css` | Yönetim paneli (`/admin`), görsel yükleme dahil |
| `assets/allergens.js` | 14 alerjen simgesi ve adı |
| `data/menu.json` | Varsayılan menü (Blob boşsa kullanılır) |
| `api/` | Menü okuma ve kaydetme, görsel yükleme, giriş |
| `qr/` | İki özel QR tasarımı (SVG ve PNG) |
| `tools/` | QR üretme betikleri |

## Nasıl saklanır

* Panelde Kaydet düğmesi menüyü Vercel Blob alanına JSON olarak yazar. Son 10 sürüm saklanır.
* Menü sayfası en güncel sürümü `/api/menu` adresinden okur. Blob boşsa `data/menu.json` kullanılır.
* Görseller (logo, kapak, banner) tarayıcıda 1600 px sınırına küçülür, WebP olur ve Blob alanına yüklenir.

## Ortam değişkenleri (Vercel, Settings, Environment Variables)

| Ad | Açıklama |
| --- | --- |
| `ADMIN_PASSWORD` | Yönetim paneli şifresi. Değiştirince yeniden dağıtım yapın. |
| `BLOB_READ_WRITE_TOKEN` | Blob alanı projeye bağlanınca otomatik oluşur. |

## Yerelde çalıştırma

```bash
npm install
npx vercel dev
```

## QR kodlarını yeniden üretme

```bash
pip install reportlab
python3 tools/make_qr.py https://tatlici.vercel.app
node tools/render_png.mjs
```
