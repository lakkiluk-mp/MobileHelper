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
