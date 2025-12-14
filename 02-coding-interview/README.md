# CodeStream - Online Collaborative Coding Platform

CodeStream is a real-time collaborative coding interview platform featuring code execution and avatar-based presence.

## Prerequisites

- Node.js (v18+)
- npm

## Installation

1. Install root dependencies (for E2E tests):
   ```bash
   npm install
   ```
2. Install Server dependencies:
   ```bash
   cd server
   npm install
   ```
3. Install Client dependencies:
   ```bash
   cd client
   npm install
   ```

## Running the Application

To run the application locally, you need to start both the server and the client.

### 1. Start the Backend Server
In the `server` directory:
```bash
npm run dev
```
Runs on `http://localhost:3001`.

### 2. Start the Frontend Client
In the `client` directory:
```bash
npm run dev
```
Runs on `http://localhost:5173`.

## Testing

The application includes Backend, Frontend, and End-to-End (E2E) tests.

### Backend Tests (Integration/Unit)
Located in `server/tests/`.
```bash
cd server
npm test
```

### Frontend Tests (Unit/Component)
Located in `client/src/components/`.
```bash
cd client
npm test
```

### End-to-End Tests
Located in `e2e/`.  
Required: Ensure Playwright browsers are installed:
```bash
npx playwright install
```

To run E2E tests (automatically starts client/server):
```bash
npm run test:e2e
```
To run with UI:
```bash
npm run test:e2e:ui
```
