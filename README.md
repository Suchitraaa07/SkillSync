# SkillSync AI - Internship Readiness & Smart Apply Assistant

Production-ready full-stack project with:
- AI-powered resume + job analysis
- Skill gap engine and explainable readiness score
- Personalized learning roadmap
- Future readiness simulator
- Opportunity fit heatmap
- AI interview simulator
- Chrome Smart Apply extension
- Gamification + application tracker

## Monorepo Structure

```text
SkillSync/
  backend/
    src/
      config/
      controllers/
      middleware/
      models/
      routes/
      services/
      utils/
      server.js
    sample-data/
    .env.example
    package.json
  frontend/
    src/
      app/
        dashboard/
        skill-gap/
        roadmap/
        resume-optimizer/
        interview-simulator/
        applications/
        login/
        signup/
      components/
      lib/
    .env.example
    package.json
  extension/
    manifest.json
    content.js
    popup.html
    popup.js
```

## 1. Setup

### Prerequisites
- Node.js 20+
- MongoDB running locally or cloud URI

### Backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### Frontend
```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Frontend: http://localhost:3000
Backend: http://localhost:5000

## 2. Required Environment Variables

### backend/.env
- `PORT=5000`
- `MONGODB_URI=mongodb://127.0.0.1:27017/skillsync`
- `JWT_SECRET=replace_with_secure_secret`
- `OPENAI_API_KEY=` (optional, enables richer explanations)
- `CORS_ORIGIN=http://localhost:3000`

### frontend/.env.local
- `NEXT_PUBLIC_API_URL=http://localhost:5000`

## 3. API Endpoints

Auth:
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`

Core:
- `POST /upload-resume` (multipart: `resume`)
- `POST /analyze-job` (`description` or `url`)
- `GET /skill-gap`
- `GET /readiness-score`
- `GET /roadmap`
- `POST /simulate-future` (`skillsToLearn`)
- `POST /interview`

Bonus:
- `GET /fit-heatmap`
- `GET /resume-optimize`
- `GET /applications`
- `POST /applications`
- `PATCH /applications/:id`

Extension API:
- `POST /extension/analyze`

## 4. Sample Test Data

Use files in `backend/sample-data/`:
- `job-description.txt`
- `resume-sample.txt`
- `interview-answers.json`

## 5. Chrome Extension Setup

1. Open Chrome -> Extensions -> Developer Mode -> Load unpacked.
2. Select `extension/` folder.
3. Open popup and set backend URL (`http://localhost:5000`).
4. Visit LinkedIn or Internshala job page.
5. Click:
   - `Analyze This Job` for fit score + missing skills
   - `Smart Autofill Fields` to assist form answers (user reviews and submits)

## 6. Deployment Notes

- Frontend can deploy on Vercel.
- Backend can deploy on Render/Railway/Fly.io.
- Use MongoDB Atlas for production database.
- Set `CORS_ORIGIN` to your deployed frontend URL.
