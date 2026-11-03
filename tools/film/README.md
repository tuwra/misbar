# فيديو درس الآلات

- `script.json`: نص التعليق الصوتي والترجمة لكل مقطع.
- `timeline.json`: النص نفسه مع مدة كل مقطع بعد توليد الصوت (`say -v Majed`).
- `film.html`: صفحة بحجم 1280×720 تشغّل مشاهد المنصة ثلاثية الأبعاد حسب `timeline.json`. انسخها مع `timeline.json` (باسم `film-timeline.json`) إلى `public/` مؤقتًا، وسجّلها بـ Chrome، ثم ادمج الصوت بـ ffmpeg.
