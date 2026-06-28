# RestArtuz - Premium Interior Materials Catalog

## Production Build - June 2025

### Project Structure
```
RestArtuz-Production/
├── frontend/          # Expo React Native App + Admin Panel
│   ├── app/           # Screens (tabs, admin, product, category)
│   ├── src/           # Components, contexts, hooks, utils
│   └── app.json       # Expo configuration
├── backend/           # FastAPI Python Backend
│   ├── server.py      # Main API server
│   ├── ai_product_analyzer.py  # Gemini AI integration
│   └── requirements.txt
└── docs/              # Documentation
```

### Features
- Premium luxury design (dark mode + gold accents)
- Firebase integration (Auth, Firestore, Storage)
- Gemini AI product description generation
- Multi-language support (UZ, RU, EN)
- Shopping cart with Telegram orders
- Full Admin Panel

### Setup
1. Install frontend: `cd frontend && yarn install`
2. Install backend: `cd backend && pip install -r requirements.txt`
3. Configure Firebase in `frontend/src/config/firebase.ts`
4. Configure Gemini API in `backend/.env`
5. Run: `npx expo start`

### Build
- Android: `eas build -p android`
- iOS: `eas build -p ios`
