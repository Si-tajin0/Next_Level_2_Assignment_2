# Issue Tracker API

A collaborative platform for software teams to report bugs, suggest features, and coordinate resolutions.

## Live URL
`https://your-deployment-url.vercel.app`

## Tech Stack
- Node.js
- TypeScript
- Express.js
- PostgreSQL (NeonDB)
- bcrypt
- jsonwebtoken

## Features
- User authentication (signup, login)
- JWT-based authorization
- Role-based access control (contributor, maintainer)
- Issue CRUD operations
- Filter & sort issues

## Database Schema

### users
| Field | Type |
|---|---|
| id | SERIAL PRIMARY KEY |
| name | VARCHAR(100) |
| email | VARCHAR(100) UNIQUE |
| password | VARCHAR(255) |
| role | contributor / maintainer |
| created_at | TIMESTAMP |
| updated_at | TIMESTAMP |

### issues
| Field | Type |
|---|---|
| id | SERIAL PRIMARY KEY |
| title | VARCHAR(150) |
| description | TEXT |
| type | bug / feature_request |
| status | open / in_progress / resolved |
| reporter_id | INTEGER |
| created_at | TIMESTAMP |
| updated_at | TIMESTAMP |

## API Endpoints

### Auth
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | /api/auth/signup | Public | Register user |
| POST | /api/auth/login | Public | Login user |

### Issues
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | /api/issues | Public | Get all issues |
| GET | /api/issues/:id | Public | Get single issue |
| POST | /api/issues | Authenticated | Create issue |
| PATCH | /api/issues/:id | Authenticated | Update issue |
| DELETE | /api/issues/:id | Maintainer only | Delete issue |

## Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/devpulse.git
cd devpulse
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create `.env` file
```env
DATABASE_URL=your_neondb_connection_string
JWT_SECRET=your_jwt_secret
PORT=3000
```

### 4. Run the project
```bash
npm start
```

## Environment Variables
| Variable | Description |
|---|---|
| DATABASE_URL | NeonDB connection string |
| JWT_SECRET | JWT secret key |
| PORT | Server port (default: 3000) |

## Author
Tajin
