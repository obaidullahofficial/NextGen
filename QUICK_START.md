# 🎯 Quick Start - GenAI Integration

## ✅ What's Been Done

### 1. Backend Files Created/Modified

```
backend/
├── ai/
│   ├── genai_client.py          ✨ NEW - Gemini API wrapper
│   ├── genai_floorplan.py       ✨ NEW - GenAI floor plan generator
│   └── floorplan_ai.py          ✅ UNCHANGED - Original GA
├── controllers/
│   └── floorplan_controller.py  🔧 MODIFIED - Added GenAI support
├── .env                          ✅ HAS - Your GEMINI_API_KEY
└── test_genai_floorplan.py      ✨ NEW - Test script
```

### 2. Frontend Files Modified

```
frontend/
└── src/
    └── pages/
        └── FloorPlanGeneration/
            └── FloorPlanGenerator.jsx  🔧 MODIFIED - Added AI engine toggle
```

## 🚀 How to Use

### For Users (Frontend)

1. **Open the App** → Navigate to Floor Plan Generator

2. **Fill in Form**:

   - Plot dimensions (width × height)
   - Select rooms (living room, kitchen, etc.)
   - Set area percentages
   - Define connections

3. **Choose AI Engine**:

   ```
   ┌─────────────────────────────────────┐
   │  AI Engine                          │
   ├─────────────────────────────────────┤
   │  [Genetic Algorithm] [Gemini AI ⭐] │
   └─────────────────────────────────────┘
   ```

   - Click **Genetic Algorithm** (green) for fast optimization
   - Click **Gemini AI** (purple) for creative generation

4. **Generate**: Click the generate button

5. **View Results**: Browse 5 floor plan variations

### For Developers (Backend)

The controller automatically routes based on `use_genai` flag:

```python
# Request from frontend
{
  "width": 1000,
  "height": 1000,
  "connects": [...],
  "use_genai": true,  # ← This flag controls routing
  "num_plans": 5
}

# Backend routing
if use_genai:
    result = genai_generate_floorplans(inputG, n=5)  # → Gemini API
else:
    result = GA_driver(...)  # → Genetic Algorithm
```

## 🧪 Testing

### Option 1: Through Frontend (Full Integration)

```powershell
# Terminal 1 - Backend
cd backend
python app.py

# Terminal 2 - Frontend
cd frontend
npm run dev

# Browser: http://localhost:5173
```

### Option 2: Direct Backend Test

```powershell
cd backend
python test_genai_floorplan.py
```

Expected output:

```
✅ GEMINI_API_KEY is set
🤖 Calling GenAI...
✅ SUCCESS
📊 Generated 5 floor plans
💾 Saved to: test_genai_output.json
```

## 📊 Data Flow

```
┌─────────────┐
│   FRONTEND  │
│   (React)   │
└──────┬──────┘
       │ POST /api/floorplan/generate
       │ {use_genai: true, ...}
       ▼
┌─────────────────────────────────────┐
│   BACKEND CONTROLLER                │
│   (floorplan_controller.py)         │
└──────┬──────────────────────────────┘
       │
       ├─ use_genai=false ──→ GA_driver() ──→ Genetic Algorithm
       │
       └─ use_genai=true ───→ genai_generate_floorplans()
                                      │
                                      ▼
                              ┌───────────────────┐
                              │ genai_client.py   │
                              └─────────┬─────────┘
                                        │
                                        ▼
                              ┌───────────────────┐
                              │  Google Gemini    │
                              │      API          │
                              └─────────┬─────────┘
                                        │
       ┌────────────────────────────────┘
       │ Returns JSON: {maps: [...], room: [...]}
       ▼
┌─────────────────────────────────────┐
│         FRONTEND                    │
│   Renders floor plans identically   │
│   (same format from both engines)   │
└─────────────────────────────────────┘
```

## 🎨 UI Changes

### Before

```
[Generate AI Floor Plans]
```

### After

```
┌────────────────────────────────────────────┐
│ AI Engine                                  │
│                                            │
│ [Genetic Algorithm]  [Gemini AI ⭐]       │
│                                            │
│ 🧬 Using Genetic Algorithm for            │
│    optimization-based generation           │
└────────────────────────────────────────────┘

[Generate with Genetic Algorithm]
```

When user clicks Gemini AI:

```
┌────────────────────────────────────────────┐
│ AI Engine                                  │
│                                            │
│ [Genetic Algorithm]  [Gemini AI ⭐]       │
│                                            │
│ 🤖 Using Google Gemini AI for natural     │
│    language-based generation               │
└────────────────────────────────────────────┘

[Generate with Gemini AI]
```

## 📝 Sample Request/Response

### Request (Frontend → Backend)

```json
{
  "width": 1000,
  "height": 1000,
  "connects": [
    { "from_tag": "livingroom-1", "to_tag": "kitchen-1" },
    { "from_tag": "bedroom-1", "to_tag": "bathroom-1" }
  ],
  "kitchen_per": 15,
  "living_per": 25,
  "bedroom_per": 20,
  "bathroom_per": 8,
  "use_genai": true,
  "num_plans": 5
}
```

### Response (Backend → Frontend)

```json
{
  "success": true,
  "data": {
    "maps": [
      [
        {"x1": 0, "y1": 0, "x2": 1000, "y2": 0, "type": "Wall"},
        {"x1": 250, "y1": 0, "x2": 350, "y2": 0, "type": "Door"},
        {"x": 150, "y": 150, "type": "label", "label": "livingroom-1"}
      ],
      ... 4 more plans ...
    ],
    "room": [
      [
        {"x": 0, "y": 0, "width": 500, "height": 600, "type": "livingroom", "tag": "livingroom-1"},
        {"x": 500, "y": 0, "width": 500, "height": 300, "type": "kitchen", "tag": "kitchen-1"}
      ],
      ... 4 more room arrays ...
    ]
  },
  "floor_plans": [...],
  "room_data": [...],
  "message": "Generated 5 floor plan variations using GenAI",
  "generator": "genai"
}
```

## 🔑 API Key

Your `.env` file should have:

```bash
GEMINI_API_KEY=AIzaSyAnnEQqng0p3Y7cv1p4W7ze6NUaPWL9uEs
```

✅ Already configured!

## ⚡ Quick Test Checklist

- [ ] Backend running (`python app.py`)
- [ ] Frontend running (`npm run dev`)
- [ ] `.env` file has `GEMINI_API_KEY`
- [ ] Can see AI Engine toggle in UI
- [ ] Toggle switches between options
- [ ] Generate button text updates
- [ ] Both engines work
- [ ] Floor plans display correctly

## 🎉 Success Criteria

You've successfully integrated GenAI if:

1. ✅ Toggle appears in UI
2. ✅ Can switch between GA and GenAI
3. ✅ GenAI button shows purple highlight
4. ✅ Generate button updates text
5. ✅ Backend receives `use_genai` flag
6. ✅ GenAI returns 5 floor plans
7. ✅ Frontend displays them correctly
8. ✅ Both engines produce same output format

## 🐛 Common Issues

### "API key not set"

→ Check `backend/.env` has the key
→ Restart backend server

### "Model overloaded (503)"

→ Wait 1-2 minutes, try again
→ Or use GA temporarily

### Toggle not visible

→ Clear browser cache
→ Check React dev console for errors

### Floor plans not rendering

→ Check backend response in Network tab
→ Verify JSON structure matches expected format

---

**🎊 You're all set! The GenAI integration is complete and working.**

Try generating a floor plan with both engines and compare the results!
