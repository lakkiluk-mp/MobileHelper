# MobileHelper

Тренажёр к JS-собесу. Карточка — это код, прогон, короткий ответ и теория только этой задачи. Без входа приложение работает целиком. Вход нужен, чтобы прогресс переехал на второе устройство.

Веб крутится как раньше. Телефон — отдельный клиент в `apps/mobile`: те же карточки и правила, офлайн с первой сборки. План — в [docs/plan.md](docs/plan.md).

## Запуск

```bash
npm install
npm run dev
```

Проверки: `npm test`, `npm run typecheck`, `npm run build`.

Телефон: `npm run mobile` из корня, или `npm run android` / `npm run build:apk` в `apps/mobile`.

## Сервер и релиз APK

Бэкенд и Postgres крутятся в Dokploy (проект `etalon`) на `https://etalon.offerist-ai.ru`, compose — `docker-compose.dokploy.yml`. Деплой — из ветки `main`.

Новая APK: поднять `version` в `apps/mobile/app.json`, затем

```bash
cd apps/mobile
npm run release:apk
```

Скрипт собирает APK, копирует его на сервер и заменяет файл в контейнере. Актуальная сборка всегда по ссылке `https://etalon.offerist-ai.ru/download/apk`. Нужен SSH до `polotno-stage` (другой хост — `RELEASE_SSH_HOST`).
