Архитектура и устройство проекта hmau-vote

Назначение
- Веб‑система для проведения заседаний и голосований: управление пользователями и подразделениями, планирование повестки заседаний, запуск/завершение голосований, вычисление решений по настраиваемым процедурам, экспорт/импорт Excel, трансляция статусов в реальном времени (Socket.IO + PostgreSQL NOTIFY), интеграция с Televic CoCon.

Технологии и запуск
- Frontend: React 19 + Vite 6 (база роутера `/hmau-vote`). Файлы: `hmau-vote/src/*`, статические ресурсы — `hmau-vote/public/*`.
- Backend API: Node.js + Express 5, Socket.IO 4, Prisma ORM 6, PostgreSQL. Главный сервер: `hmau-vote/api/server.cjs`.
- База: PostgreSQL, Prisma‑схема и миграции: `hmau-vote/prisma/`.
- Документация API: Swagger UI (`/api-docs`) и статическая Apidoc (`/docs`).
- Запуск
  - Dev (SPA + прокси на API): в одном терминале `npm run api`, в другом `npm run dev`. Прокси `/api` и `/socket.io` на `http://localhost:5000` настроен в `vite.config.js`.
  - Prod API через pm2: конфиг `hmau-vote/ecosystem.config.cjs` (порт по env `PORT`, в примере 5001). SPA собирается в `dist/` (`npm run build`), отдаётся Nginx’ом (пример — `hmau-vote/ect/default`).
- Важные переменные окружения
  - Prisma/DB: `hmau-vote/env` содержит `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/voting?schema=public`.
  - Vite optional: `VITE_API_BASE` (если приложения/проксирование не на одном origin; в dev прокси покрывает).

Структура проекта (главные директории)
- `hmau-vote/api/` — backend
  - `server.cjs` — точка входа API и Socket.IO; регистрация маршрутов, LISTEN/NOTIFY PostgreSQL, мост к CoCon.
  - `root/*.cjs` — маршруты по разделам: аутентификация, пользователи, подразделения, заседания, повестка, голосование, процедуры/шаблоны голосования, Excel, привязки устройств, Televic, Swagger и пр.
- `hmau-vote/src/` — frontend React
  - `pages/*.jsx` — экраны (пользователи/подразделения/заседания/консоль/экран/отчёт и пр.).
  - `components/*.jsx|*.css` — модальные окна, выпадающие списки и т.д.
  - `utils/api.js` — REST‑клиент.
- `hmau-vote/prisma/` — схема и миграции; локальные файлы БД (если использовался sqlite) и миграции для PostgreSQL.
- `hmau-vote/public/` — ресурсы (css, js, изображения, шрифты), favicon и т.п.
- `hmau-vote/doc/` — собранная статическая документация Apidoc (отдаётся как `/docs`).
- Прочее: `ecosystem.config.cjs` (pm2), `vite.config.js` (Vite + прокси), `env` (строка подключения), `apidoc.json`, `eslint.config.js`, `jest.config.json`.

Backend: сервер, события, маршруты
- Сервер: `hmau-vote/api/server.cjs:1`
  - Express + HTTP + Socket.IO. CORS со списком `allowedOrigins`.
  - Prisma подключается один раз и прокидывается в `req.prisma` middleware.
  - Подписка PostgreSQL LISTEN на каналы: `vote_result_channel`, `meeting_status_channel`, `user_status_channel`. Обработчик `pgClient.on('notification', ...)` парсит JSON и вещает через Socket.IO события:
    - vote_result_channel → `new-vote-result` (при статусе PENDING), `vote-ended` (ENDED), `vote-applied` (APPLIED), `vote-cancelled` (CANCELLED).
    - meeting_status_channel → `meeting-status-changed` и, если статус COMPLETED, `meeting-ended`. Также используются уведомления `agenda-item-updated` с флагами `activeIssue`/`completed`.
    - user_status_channel → `user-status-changed { userId, isOnline }`.
  - На старте выполняются сервисные задачи: нормализация процедур голосования (миграция старого формата `tokens/op` в новый `elements/operator`), гарантируется наличие системного подразделения «👥Приглашенные», создаётся вспомогательная таблица `UserExtraDivision` (см. раздел «Данные и связи»).
  - Роуты монтируются из `api/root/*.cjs` (см. ниже).
  - Отдаёт статическую документацию `/docs` из `hmau-vote/doc` и Swagger UI на `/api-docs`.
  - Доп. endpoint ручного завершения голосования: `POST /api/vote-results/:agendaItemId/end` — принудительно подводит итоги последнего `VoteResult` пункта повестки: считает непроголосовавших, вычисляет «решение» по процедуре, обновляет `VoteResult` (voteStatus=ENDED, decision), снимает флаги `voting/activeIssue/completed` у `AgendaItem`, слать NOTIFY по каналам.

- Простые служебные маршруты
  - `GET /api/health` — health‑check
  - `GET /api/test` — тестовый роут, возвращает `{message:'привет'}`

- Аутентификация: `hmau-vote/api/root/auth.cjs:1`
  - `POST /api/login` — email+password; неадмина нельзя залогинить вторично, если `isOnline=true`. При успехе ставит `isOnline=true`.
  - `POST /api/logout` — по email ставит `isOnline=false`.
  - Используется флаг `isAdmin` в записи пользователя. Токенов/сессий нет, хранение паролей — в явном виде (см. Примечания).

- Пользователи: `hmau-vote/api/root/users.cjs:1`
  - `GET /api/users` — список пользователей с названием подразделения и массивом `divisionIds` (основное + дополнительные). В ответе также `isOnline`.
  - `POST /api/users` — создать (поддерживает `divisionId` и/или массив `divisionIds`, из которых первое — основное, остальные — дополнительные).
  - `PUT /api/users/:id` — обновить поля; поддерживает замену множеств подразделений через `divisionIds` (вспомогательная таблица синхронизируется).
  - `DELETE /api/users/:id` — удалить.
  - `POST /api/users/:id/disconnect` — принудительный оффлайн пользователя; дополнительно публикуется `pg_notify('user_status_channel', ...)`.

- Подразделения: `hmau-vote/api/root/divisions.cjs:1`
  - `GET /api/divisions` — список подразделений с `userCount`. Системное «Приглашенные» хранится без эмодзи в базе, в выдаче может отображаться как «👥Приглашенные». Защита от дубликатов.
  - `POST /api/divisions` — создать; `PUT /api/divisions/:id` — переименовать; `DELETE /api/divisions/:id` — удалить. Системное удалять/переименовывать нельзя.

- Заседания: `hmau-vote/api/root/meetings.cjs:1`
  - `GET /api/meetings` — все неархивные заседания с краткой информацией и списком подразделений.
  - `GET /api/meetings/archived` — архив.
  - `GET /api/meetings/:id` — детали с повесткой.
  - `POST /api/meetings` — создать: name, start/end, список divisionIds, повестка (`agendaItems`), статус WAITING/неархив.
  - `PUT /api/meetings/:id` — обновление (включая замену повестки/подразделений); при некоторых изменениях «хвосты» голосований/голосов по пунктам очищаются транзакцией.
  - `DELETE /api/meetings/:id` — каскадная зачистка `Vote`/`VoteResult` по всем пунктам, затем удаление повестки и заседания.
  - `POST /api/meetings/:id/archive` — перевод в архив.

- Повестка заседания: `hmau-vote/api/root/agenda-items.cjs:1`
  - `GET /api/meetings/:id/agenda-items` — все элементы повестки данного заседания (с докладчиком, ссылкой, флагами `voting/completed/activeIssue`).
  - `POST /api/meetings/:id/agenda-items` — создать пункт.
  - `PUT /api/meetings/:id/agenda-items/:itemId` — обновить; если `activeIssue=true`, остальные пункты этого заседания автоматически получают `activeIssue=false` (транзакция из двух шагов: сброс остальным + апдейт текущего).
  - `DELETE /api/meetings/:id/agenda-items/:itemId` — удалить.

- Голосование: `hmau-vote/api/root/vote.cjs:1`
  - `POST /api/vote` — записать голос по `agendaItemId` (по email пользователя). Обновляет счётчики в актуальном VoteResult пункта (если есть).
  - `POST /api/vote-by-result` — записать/обновить голос в рамках конкретного `voteResultId` (транзакция): один голос на пользователя/результат. После обновления пересчитываются агрегаты и публикуется `NOTIFY vote_result_channel`.
  - `POST /api/start-vote` — старт голосования для `agendaItemId`: отмечает пункт как `voting=true`, создаёт `VoteResult` (PENDING), публикует NOTIFY. По таймеру (`duration` сек) завершает: считает не проголосовавших, вычисляет «решение» по процедуре (см. «Процедуры и вычисление решения»), ставит `voteStatus=ENDED`, снимает `voting` у пункта, публикует NOTIFY.
  - `GET /api/vote-results/:agendaItemId` — последний результат для пункта.
  - `GET /api/vote-results?meetingId=...` — все результаты заседания (фильтр по meetingId опционален).
  - `POST /api/vote-results/:id/apply` — применить результат (меняет статус, публикует `vote-applied`).
  - `POST /api/vote-results/:id/cancel` — отменить результат (меняет статус, публикует `vote-cancelled`).

- Процедуры/шаблоны голосования:
  - Процедуры: `hmau-vote/api/root/vote-procedures.cjs:1` — CRUD по `/api/vote-procedures`, JSON‑поле `conditions`, поле `resultIfTrue` (текст итогового «положительного» решения).
  - Шаблоны: `hmau-vote/api/root/vote-templates.cjs:1` — CRUD по `/api/vote-templates` (названия для пресетов вопросов и т.д.).

- Привязки устройств: `hmau-vote/api/root/device-links.cjs:1`
  - CRUD по `/api/device-links`. Уникальность `userId` и `deviceId` обеспечивает связь «1 пользователь ↔ 1 устройство».

- Excel импорт/экспорт
  - Пользователи: `hmau-vote/api/root/excel.cjs:1`
    - `GET /api/users/excel/export` — файл `users.xlsx` (листы Users/Divisions, в Users — валидация выбора подразделения из Divisions).
    - `POST /api/users/excel/import` — загрузка Excel, создание/обновление пользователей и подразделений. Пароли новых пользователей выставляются как `"123"` (см. Примечания).
  - Заседания: `hmau-vote/api/root/meetings-excel.cjs:1`
    - `GET /api/meetings/excel/export-template` — шаблон `meeting_template.xlsx` (MeetingTemplate + справочники Divisions/Speakers с выпадающими списками).
    - `POST /api/meetings/excel/import` — создание заседания по шаблону (валидации имён подразделений/докладчиков, уникальность номеров вопросов и названия заседания).

- Televic CoCon интеграция
  - WS‑namespace `/cocon-connector`: сервер держит список подключений; умеет отправлять команду коннектору и ждать результата (корреляция по UUID/таймаут). Relay событий типа `vote-cast` в `POST /api/vote-by-result`.
  - HTTP‑мосты: `/api/coconagenda/GetAllDelegates`, `/api/coconagenda/GetDelegatesOnSeats` — пробрасывают команды в активное WS‑подключение коннектора.
  - Привязка пользователей к внешним делегатам: `hmau-vote/api/root/televic.cjs:1` — `/api/televic/links` (список), `/api/televic/link` (POST), `/api/televic/link/:userId` (DELETE).

Процедуры и вычисление решения
- Модель: `VoteProcedure` хранит `conditions` (JSON) и `resultIfTrue`.
  - Поддерживаются два формата условий:
    1) Старый: массив блоков с `tokens` и `op` (где `tokens` — смешанные «селекторы/числа/проценты/операторы»).
    2) Новый: блоки с `elements` и `operator` (elements — массив строк‑операторов и объектов `{ value, type }`).
  - При старте сервера выполняется нормализация: старые блоки конвертируются в `elements` и сохраняются.
- Оценка выражений
  - Контекст голосования: `totalParticipants`, `totalOnlineParticipants`, `totalVotes` (FOR+AGAINST+ABSTAIN), `votesFor`, `votesAgainst`, `votesAbstain`, `votesAbsent`.
  - Селекторы в выражениях сопоставляются числам из контекста; поддерживаются арифметические и логические операторы, скобки и связки блоков (`AND/OR/XOR/ANDNOT`, а также русские эквиваленты «И/ИЛИ/И‑НЕ»).
  - Общая схема: каждый блок — булево выражение; блоки последовательно объединяются оператором предыдущего блока. Если финальное значение истинно — ответ `resultIfTrue`, иначе — противоположный (если `resultIfTrue=Принято`, то «Не принято», иначе наоборот).
  - Жёсткое безопасное правило: если «За=0 и Против=0» и «Воздержались>0» (или совсем нет голосов) — решение «Не принято».

Данные и связи (Prisma)
- Схема: `hmau-vote/prisma/schema.prisma:1`. Основные модели и поля:
  - User: `id`, `email` (unique), `password`, `name`, `phone?`, `isAdmin`, `divisionId?` → Division, `meetings` (M2M через `_MeetingParticipants`), `votes` (1‑ко‑многим), `agendaItems` (как докладчик), `isOnline`, `deviceLink?` (1‑к‑1 DeviceLink), `televicExternalId?` (unique), `createdAt/updatedAt`.
  - Division: `id`, `name`, `users[]`, `meetings[]` (M2M через `_MeetingDivisions`), даты.
  - Meeting: `id`, `name`, `startTime/endTime`, `status` (WAITING|IN_PROGRESS|COMPLETED), `divisions[]` (M2M), `participants[]` (M2M), `agendaItems[]`, `voteResults[]`, `isArchived`, даты.
  - AgendaItem: `id`, `number`, `title`, `speakerId?` → User, `meetingId` → Meeting, `link?`, `votes[]`, `voteResults[]`, флаги `voting/completed/activeIssue`, даты.
  - VoteResult: `id`, `agendaItemId` → AgendaItem, `meetingId?` → Meeting, `question`, `votesFor/Against/Abstain/Absent`, `createdAt`, `duration?`, `voteStatus` (TEXT: PENDING/ENDED/APPLIED/CANCELLED), `votes[]` (обратная связь), `procedureId?` → VoteProcedure, `decision?`, `voteType` (OPEN|CLOSED).
  - Vote: `id`, `userId` → User, `agendaItemId` → AgendaItem, `voteResultId?` → VoteResult, `choice` (FOR|AGAINST|ABSTAIN), `createdAt`.
  - VoteProcedure: `id`, `name`, `conditions` (JSONB), `resultIfTrue`, даты, `voteResults[]`.
  - VoteTemplate: `id`, `title`, даты.
  - DeviceLink: `id`, `userId` (unique) → User, `deviceId` (unique), даты.
- Вспомогательные таблицы (Prisma создаёт автоматически)
  - `_MeetingDivisions(A,B)` — M2M Meeting↔Division.
  - `_MeetingParticipants(A,B)` — M2M Meeting↔User.
- Доп. таблица для множественной принадлежности пользователя к подразделениям
  - `UserExtraDivision(id, userId, divisionId)` — создаётся и поддерживается кодом (см. `server.cjs` и `users.cjs`). В `server.cjs` закладываются ограничения FK и уникальность пары (`userId`,`divisionId`); в `users.cjs` есть упрощённое создание таблицы для совместимости. В API `GET /api/users` объединяет `divisionId` (основное) и записи из `UserExtraDivision`.

Реальное время: каналы и события
- PostgreSQL NOTIFY
  - vote_result_channel — публикуется сервером при изменениях `VoteResult` (создание/обновление/завершение), слушается и ретранслируется в Socket.IO.
  - meeting_status_channel — публикация сервером при изменениях состояния повестки/заседаний (активность/завершение); клиенты получают `meeting-status-changed` и `agenda-item-updated`.
  - user_status_channel — публикация при смене `isOnline`; клиенты получают `user-status-changed`.
- Socket.IO (namespace по умолчанию)
  - События к клиенту: `new-vote-result`, `vote-ended`, `vote-applied`, `vote-cancelled`, `meeting-status-changed`, `meeting-ended`, `agenda-item-updated`, `user-status-changed`.
  - На фронтенде в `App.jsx` есть подписка, которая в случае `user-status-changed` с `isOnline=false` разлогинивает не‑админа.
- Socket.IO namespace `/cocon-connector` — обмен командами/событиями с мостом CoCon.

Frontend: маршруты и ключевые экраны
- Точка входа: `hmau-vote/src/main.jsx:19` — `BrowserRouter` с `basename="/hmau-vote"`.
- Маршруты в `hmau-vote/src/App.jsx:1`:
  - Авторизация: `/login`.
  - Админ: `/` (дом), `/users`, `/divisions`, `/meetings`, `/meetings/archive`, `/template` (шаблоны голосования), `/vote` (процедуры), `/console` (пульт), `/console/meeting/:id`, `/console/meeting/:id/screen`, `/report/meeting/:id`.
  - Пользователь: `/screen` (экран трансляции), `/user` (личный экран голосования).
  - Защита роутов: RequireAdmin/RequireUser/RequireNonAdmin по объекту в `localStorage('authUser')`.
- REST‑клиент: `hmau-vote/src/utils/api.js:1`
  - Базовые функции: `getUsers`, `createUser`, `updateUser`, `deleteUser`, `disconnectUser`; `getDivisions`, CRUD для `meetings`, повестки, процедур/шаблонов голосования, `startVote`, `endVote`, `submitVote`, `submitVoteByResult`, `getVoteResults`, `login/logout`.
  - Базирование URL: если `path` начинается с `/` и задан `VITE_API_BASE`, он используется; иначе запрос идет на тот же origin (в dev — через прокси Vite).

Сборка и деплой
- Vite: `hmau-vote/vite.config.js:1`
  - `base: '/hmau-vote/'` для корректных путей при размещении под префиксом.
  - Прокси `/api` и `/socket.io` на `http://localhost:5000` в dev.
- PM2: `hmau-vote/ecosystem.config.cjs:1` — запуск API как `hmau-vote-api`, порт через `PORT` (пример — 5001), логи — `hmau-vote/logs/*`.
- Nginx (пример): `hmau-vote/ect/default:1` — статика SPA (в примере путь на другой проект `voting-app/dist` — при деплое скорректировать root), прокси на API/Socket.IO.

Примечания и важные детали
- Пароли пользователей сейчас хранятся в базе в открытом виде и сравниваются как строки (`auth.cjs`). Для продакшна нужен bcrypt/argon2 + токены/сессии.
- Значение `procedureId` по умолчанию в `POST /api/start-vote` — `10`. Если такой процедуры нет, будет ошибка. Рекомендуется хранить/подставлять существующий ID из UI.
- `voteStatus` хранится как TEXT; в коде используются значения `PENDING`/`ENDED`/`APPLIED`/`CANCELLED`.
- Таблица `UserExtraDivision` создаётся кодом; в `server.cjs` добавлены FK и уникальность пары, в `users.cjs` — минимальное создание (без ограничений). Наличие ограничений зависит от того, какая ветка кода выполнялась первой. Рекомендуется привести схему к миграциям Prisma или перенести SQL‑создание в миграции.
- CORS: список разрешённых origin задан константой в `server.cjs`.
- Каналы NOTIFY: публикации часто делаются из приложения, триггеры в схеме БД не определены миграциями (их можно добавить отдельно при необходимости).

Участники заседаний: местоположение и доверенности
- При создании заседания для каждого участника задаётся местоположение (location): `SITE` (Сайт) или `HALL` (Зал).
- Модель `ParticipantLocation` хранит связь участника с заседанием и его местоположение.
- Модель `Proxy` хранит доверенности: `fromUserId` (кто передал) → `toUserId` (кому передал).
- API endpoint `GET /api/meetings/:id/participants` возвращает полную информацию об участниках:
  - `location` — местоположение участника (SITE/HALL)
  - `proxy` — информация о переданной доверенности (если есть): `{toUserId, toUserName}`
  - `receivedProxies` — массив полученных доверенностей: `[{fromUserId, fromUserName}, ...]`
  - `voteWeight` — вес голоса (1 + количество полученных доверенностей)
- Страница управления заседанием (`/hmau-vote/console/meeting/:id` — [ControlMeetingPage.jsx](src/pages/ControlMeetingPage.jsx:676))
  - Показывает список участников с местоположением: "Петров (Зал)" или "Иванов (Сайт)"
  - Под именем участника мелким текстом показывается: "(по доверенности: ФИО)" — если передал доверенность
  - И/или "(по доверенности от: ФИО1, ФИО2)" — если получил доверенности
  - Счётчик перед таблицей: "Всего участников: X | В сети: Y"
  - Статус онлайн обновляется в реальном времени через Socket.IO событие `user-status-changed`

- **ВАЖНО: Архитектура проектов hmau-vote и voting-app**
  - В системе существует ДВА проекта: `/var/www/voting-app` (старый) и `/var/www/hmau-vote` (новый).
  - Nginx проксирует `/api/*` на порт 5000, где запущен API из `/var/www/voting-app/api/server.cjs` (PM2 процесс `voting-api`).
  - Фронтенд hmau-vote (`/hmau-vote/*`) обращается к API из voting-app, а НЕ к своему локальному API на порту 3002.
  - **При правке API endpoints для фронтенда hmau-vote нужно править файлы в `/var/www/voting-app/api/root/`, а не в `/var/www/hmau-vote/api/root/`**.
  - После изменений в voting-app API нужно перезапускать: `pm2 restart voting-api` (НЕ hmau-vote-api).
  - Процесс hmau-vote-api на порту 3002 в текущей конфигурации НЕ используется фронтендом.

Файлы‑опоры (быстрые ссылки)
- Сервер и каналы: `hmau-vote/api/server.cjs:300`
- Пользователи: `hmau-vote/api/root/users.cjs:1`
- Подразделения: `hmau-vote/api/root/divisions.cjs:1`
- Заседания: `hmau-vote/api/root/meetings.cjs:1`
- Повестка: `hmau-vote/api/root/agenda-items.cjs:1`
- Голосование: `hmau-vote/api/root/vote.cjs:1`
- Процедуры: `hmau-vote/api/root/vote-procedures.cjs:1`
- Шаблоны: `hmau-vote/api/root/vote-templates.cjs:1`
- Excel (пользователи): `hmau-vote/api/root/excel.cjs:1`
- Excel (заседания): `hmau-vote/api/root/meetings-excel.cjs:1`
- Televic: `hmau-vote/api/root/televic.cjs:1`
- Схема БД: `hmau-vote/prisma/schema.prisma:1`

Как использовать этот документ
- Для добавления новых функций: найдите соответствующий раздел API/страницу UI и соответствующие модели Prisma. Сверьтесь с событиями реального времени и каналами NOTIFY.
- Для правок БД: измените `schema.prisma`, добавьте миграцию и обновите участки кода, где есть «сырой» SQL (`UserExtraDivision`, NOTIFY).
- Для интеграций: используйте namespace `/cocon-connector` (см. функции `findConnectorSocket` и `dispatchCommand` в `server.cjs`).

