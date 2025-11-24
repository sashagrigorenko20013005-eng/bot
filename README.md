GlowSalon MiniApp — Client prototype
====================================

Что внутри:
- index.html — основной SPA интерфейс
- styles.css — стили с эффектами и тёмной темой
- app.js — логика приложения, хранение данных в localStorage (mock DB)

Как запустить:
1. Распакуй zip и открой index.html в браузере (достаточно статического хоста).
2. Это mock-приложение — пока без бекэнда. Данные в localStorage (seed) — можно очистить в консоли.

Где интегрировать бекэнд:
- В app.js места помечены комментариями; нужно заменить обращения к DB.get/put на fetch к API:
  - GET /services
  - GET /masters
  - GET /work_templates
  - GET /appointments?user_id=...
  - POST /appointments (создание — сервер обязан сделать транзакционную проверку)
  - POST /notifications/send (для отправки напоминаний) ...

Дальше можно попросить генерацию:
- CREATE TABLE DDL (готово) — я могу предоставить SQL процедуры/триггеры
- Серверный пример на Node.js/Express для подключения к MySQL
- CI/CD или хостинг (Netlify, Vercel)
