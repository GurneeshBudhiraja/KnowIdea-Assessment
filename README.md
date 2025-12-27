# KnowIdea Gmail Plugin

A Chrome extension that integrates AI-powered email composition assistance directly into Gmail.

---

## 📁 Project Structure

```
knowidea-assessment/
├── backend/          # Express.js API server
└── extension/        # Chrome extension (WXT + React)
```

---

## 🔧 Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** (comes with Node.js)
- **Google Chrome** browser
- **Gemini API Key** (for AI features)

---

## 🚀 Local Setup

### Backend Setup

1. **Navigate to the backend directory:**

   ```bash
   cd backend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Create environment file:**

   Create a `.env` file in the `backend` directory with the following variables:

   ```env
   PORT=3100
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start the development server:**

   ```bash
   npm run dev
   ```

   The server will start at `http://localhost:3100`

5. **Verify the server is running:**

   Open `http://localhost:3100/health` in your browser — you should see:

   ```json
   { "status": "🟢 Server Healthy" }
   ```

---

### Extension Setup

1. **Navigate to the extension directory:**

   ```bash
   cd extension
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start development mode:**

   ```bash
   npm run dev
   ```

   This will build the extension and watch for changes.

4. **Load the extension in Chrome:**

   - Open Chrome and go to `chrome://extensions/`
   - Enable **Developer mode** (toggle in top-right corner)
   - Click **Load unpacked**
   - Select the `extension/dist/chrome-mv3-dev` folder

5. **Build for production:**

   ```bash
   npm run build
   ```

   The production build will be available in `extension/dist/chrome-mv3`

---

## 💡 Usage

1. Make sure the backend server is running on `http://localhost:3100`
2. Open Gmail in Chrome
3. The extension will be available in the side panel
4. Type `@knowidea` in the compose window to trigger AI assistance

---

## 🛠️ Tech Stack

### Backend

- **Express.js** — Web framework
- **TypeScript** — Type safety
- **Google Generative AI** — AI capabilities via Gemini

### Extension

- **WXT** — Modern web extension framework
- **React 19** — UI library
- **TypeScript** — Type safety
- **Tailwind CSS** — Styling

---

## 📝 API Endpoints

| Method | Endpoint         | Description              |
| ------ | ---------------- | ------------------------ |
| GET    | `/`              | Health check             |
| GET    | `/health`        | Health check             |
| POST   | `/ai`            | AI processing endpoint   |
| POST   | `/compose-email` | Email composition helper |
