# Velora — Task Planner & CRM Board

Full-stack SaaS приложение для управления задачами в стиле Kanban-доски с поддержкой рабочих пространств, командной работы и аналитики.

![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688?style=flat&logo=fastapi)
![React](https://img.shields.io/badge/React-18.2-61DAFB?style=flat&logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat&logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker)

## Возможности

- **Аутентификация** — регистрация и вход с JWT-токенами
- **Рабочие пространства** — создание, управление, переключение между workspace
- **Командная работа** — приглашение участников по email, роли owner/member
- **Kanban-доска** — колонки, задачи с drag-and-drop, приоритеты, дедлайны
- **Поиск и фильтрация** — по названию, приоритету, статусу, наличию дедлайна
- **Аналитика** — статистика по задачам, распределение по приоритетам и колонкам
- **Адаптивный UI** — тёмная тема, glassmorphism, neon-градиенты

## Стек технологий

### Backend
| Технология | Версия | Назначение |
|---|---|---|
| FastAPI | 0.104 | Web-фреймворк |
| SQLAlchemy | 2.0 | ORM (async) |
| PostgreSQL | 16 | База данных |
| asyncpg | — | Async драйвер PostgreSQL |
| Alembic | — | Миграции БД |
| python-jose | — | JWT-токены |
| passlib + bcrypt | — | Хеширование паролей |
| Pydantic | 2.5 | Валидация данных |
| Pytest | — | Тестирование |

### Frontend
| Технология | Версия | Назначение |
|---|---|---|
| React | 18.2 | UI-библиотека |
| React Router | 6.21 | Маршрутизация |
| Vite | 5.0 | Сборщик |
| Tailwind CSS | 3.4 | Стилизация |
| Lucide React | — | Иконки |
| Nginx | — | Веб-сервер (production) |

## Структура проекта

```
Velora/
├── client/                    # Frontend (React)
│   ├── src/
│   │   ├── components/        # UI-компоненты
│   │   │   ├── auth/          # ProtectedRoute
│   │   │   ├── board/         # Компоненты доски
│   │   │   ├── layout/        # Sidebar, AppLayout
│   │   │   └── ui/            # Toast, Modal, Loader
│   │   ├── context/           # AuthContext, WorkspaceContext, ToastContext
│   │   ├── pages/             # Landing, Login, Register, Dashboard, Board, Analytics, Settings
│   │   ├── services/          # API-клиент
│   │   └── styles/            # Глобальные стили
│   ├── Dockerfile
│   └── nginx.conf
│
├── server/                    # Backend (FastAPI)
│   ├── app/
│   │   ├── api/
│   │   │   ├── dependencies.py    # DI (Dependency Injection)
│   │   │   └── routes/            # auth, users, workspaces, invitations, boards
│   │   ├── core/                  # config, security, database, exceptions
│   │   ├── models/                # SQLAlchemy модели (7 таблиц)
│   │   ├── repositories/         # Слой доступа к данным
│   │   ├── schemas/               # Pydantic схемы
│   │   ├── services/              # Бизнес-логика
│   │   └── main.py
│   ├── alembic/                   # Миграции
│   ├── tests/                     # Pytest тесты
│   ├── Dockerfile
│   └── requirements.txt
│
└── docker-compose.yml
```

## Архитектура backend

Чистая слоистая архитектура:

```
Routes (API) → Services (бизнес-логика) → Repositories (БД) → Models (SQLAlchemy)
     ↑                  ↑                        ↑
  Schemas          Exceptions               AsyncSession
 (Pydantic)
```

**Модели БД:** User, Workspace, WorkspaceMember, Board, Column, Task, Invitation

## API Endpoints

### Auth (`/api/auth`)
| Метод | Путь | Описание |
|---|---|---|
| POST | `/register` | Регистрация |
| POST | `/login` | Вход |

### Users (`/api/users`)
| Метод | Путь | Описание |
|---|---|---|
| GET | `/me` | Профиль |
| PATCH | `/me` | Обновить профиль |
| DELETE | `/me` | Удалить аккаунт |

### Workspaces (`/api/workspaces`)
| Метод | Путь | Описание |
|---|---|---|
| GET | `/` | Список workspace |
| POST | `/` | Создать workspace |
| PATCH | `/{id}` | Обновить |
| DELETE | `/{id}` | Удалить |
| GET | `/{id}/members` | Участники |
| DELETE | `/{id}/members/{user_id}` | Удалить участника |

### Invitations (`/api/invitations`)
| Метод | Путь | Описание |
|---|---|---|
| POST | `/workspace/{id}` | Пригласить по email |
| POST | `/accept` | Принять приглашение |
| POST | `/decline` | Отклонить приглашение |
| GET | `/my` | Мои входящие приглашения |
| GET | `/workspace/{id}` | Приглашения workspace |

### Board (`/api/workspaces/{id}/board`)
| Метод | Путь | Описание |
|---|---|---|
| GET | `/` | Получить доску |
| POST | `/columns` | Создать колонку |
| PATCH | `/columns/{id}` | Обновить колонку |
| DELETE | `/columns/{id}` | Удалить колонку |
| PUT | `/columns/reorder` | Переставить колонки |
| POST | `/columns/{id}/tasks` | Создать задачу |
| PATCH | `/tasks/{id}` | Обновить задачу |
| DELETE | `/tasks/{id}` | Удалить задачу |
| PUT | `/tasks/{id}/move` | Переместить задачу |
| GET | `/tasks/search` | Поиск задач |
| GET | `/analytics` | Аналитика |

## Запуск

### Docker (рекомендуется)

```bash
docker compose up --build
```

После запуска:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **Swagger docs:** http://localhost:8000/docs

### Переменные окружения

Задаются в `docker-compose.yml` или через `.env`:

| Переменная | Значение по умолчанию | Описание |
|---|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://velora:velora_secret@postgres:5432/velora_db` | Подключение к БД |
| `SECRET_KEY` | `your-super-secret-key-change-in-production` | Секрет для JWT |
| `ALGORITHM` | `HS256` | Алгоритм JWT |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | Время жизни токена (мин) |
| `CORS_ORIGINS` | `http://localhost:3000` | Разрешённые origins |
| `INVITATION_EXPIRE_HOURS` | `72` | Срок действия приглашения (ч) |

### Локальная разработка

**Backend:**
```bash
cd server
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd client
npm install
npm run dev
```

## Тесты

```bash
cd server
pytest
```

Тесты используют SQLite in-memory и покрывают:
- Регистрация и авторизация
- CRUD рабочих пространств
- Создание задач
- Система приглашений
- Контроль доступа

## Лицензия

MIT
