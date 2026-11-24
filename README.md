# Waypoint — Travel Planner

Waypoint is a responsive travel-planning workspace built with React, Vite, Tailwind CSS, Express and MongoDB/Mongoose. Its visual direction is editorial and calm: warm off-white surfaces, forest-green accents, spacious cards, clear typography and responsive navigation.

## Features

- Dashboard with trip, destination and budget summaries
- Create, edit, search and delete trips
- Destination management with geocoding and an interactive Leaflet/OpenStreetMap map
- Day-wise itinerary with activity times and estimated/actual costs
- Server-calculated budget totals, remaining balance, category totals and utilization
- Groq-powered travel assistant and itinerary generator, with clearly labeled deterministic fallbacks
- Trip-linked PDF, JPG, PNG and DOCX uploads (8 MB maximum) stored locally
- Responsive layout, accessible focus states, loading/empty/error states and confirmations

## Requirements

- Node.js 18+
- MongoDB Atlas or a local MongoDB server
- A Groq API key for live AI responses (optional; demo fallback works without it)
- Internet access for OpenStreetMap tiles and place geocoding

## Run locally

### 1. Backend

```bash
cd backend
cp .env.example .env
```

On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp`.

Edit `backend/.env`:

```env
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-host>/waypoint?retryWrites=true&w=majority
LLM_API_KEY=your_groq_api_key
LLM_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL=openai/gpt-oss-20b
UPLOAD_DIR=uploads
```

Then run:

```bash
npm install
npm run dev
```

### 2. Frontend (new terminal)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

If MongoDB is not configured or cannot be reached, the backend reports `demo-memory` mode and data resets when the server restarts. Check `http://localhost:5000/api/health` to confirm the database mode.

## Free integrations

- **Maps:** Leaflet + OpenStreetMap tiles; no Google Maps API key required. Place lookup uses the public Nominatim service only when a user saves a destination. Requests are cached and paced; follow the provider's usage policy.
- **AI:** Groq's OpenAI-compatible Chat Completions API. Configure `LLM_API_KEY`, `LLM_BASE_URL`, and `LLM_MODEL`. Without a key or if the provider is unavailable, the app returns an explicitly labeled demo response.
- **Uploads:** Files are stored in `backend/uploads/`; metadata is stored in MongoDB. This is suitable for a local demo, not durable production hosting. For deployment, use persistent disk or object storage.

## API overview

- `GET /api/health`
- `GET/POST /api/trips`
- `GET/PUT/DELETE /api/trips/:id`
- `POST/DELETE /api/trips/:id/destinations`
- `POST/PUT/DELETE /api/trips/:id/activities`
- `GET /api/trips/:id/budget`
- `GET /api/places/geocode?q=...`
- `POST /api/ai/chat`
- `POST /api/ai/generate-itinerary`
- `GET/POST /api/trips/:id/documents`
- `DELETE /api/trips/document/:id`

## Architecture

- `frontend/src`: React pages, reusable components, styles and Axios client
- `backend/src/routes`: REST endpoints and request validation
- `backend/src/models`: Mongoose trip and document schemas
- `backend/src/services`: persistence adapter and server-side budget calculations

## Important limitations

- This interview MVP does not implement user authentication or multi-user authorization.
- Uploaded documents are local files; back up `backend/uploads/` and use persistent storage when deploying.
- OpenStreetMap/Nominatim are community services with usage policies and availability limits.
- AI-generated itineraries are suggestions. Verify prices, opening hours, transport and safety details independently.
- Never commit `.env` or expose API credentials in frontend code.
