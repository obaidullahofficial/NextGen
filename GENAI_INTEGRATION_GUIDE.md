# GenAI Integration Guide

## Overview

Your floor plan generator now supports **TWO AI engines**:

1. **Genetic Algorithm (GA)** - Original optimization-based approach
2. **Gemini AI** - New GenAI-powered natural language approach

## Architecture

```
Frontend (React)
    ↓ (user selects AI engine via toggle)
    ↓
Backend Controller (Flask)
    ├→ Genetic Algorithm (floorplan_ai.py)
    └→ Gemini AI (genai_floorplan.py → genai_client.py → Google API)
```

## Files Modified/Created

### Backend

- ✅ `backend/ai/genai_client.py` - Wrapper for Google Gemini API calls
- ✅ `backend/ai/genai_floorplan.py` - GenAI floor plan generator with structured prompts
- ✅ `backend/controllers/floorplan_controller.py` - Updated to handle `use_genai` flag
- ✅ `backend/.env` - Contains your `GEMINI_API_KEY`

### Frontend

- ✅ `frontend/src/pages/FloorPlanGeneration/FloorPlanGenerator.jsx` - Added AI engine toggle

## How It Works

### 1. Frontend Flow

1. User fills out floor plan form (dimensions, rooms, connections)
2. User selects AI engine using the toggle:
   - **Genetic Algorithm** (Green button)
   - **Gemini AI** (Purple button with star ⭐)
3. User clicks "Generate with [Selected Engine]"
4. Frontend sends request with `use_genai: true/false` flag

### 2. Backend Flow

#### Option A: Genetic Algorithm (use_genai: false)

```python
# In floorplan_controller.py
result = GA_driver(
    connects=connects,
    width=width,
    height=height,
    # ... other params
)
```

#### Option B: Gemini AI (use_genai: true)

```python
# In floorplan_controller.py
inputG = {
    "width": width,
    "height": height,
    "connections": conns,
    "rooms": Roms,
    "percents": {...},
    "proportions": {...}
}

result = genai_generate_floorplans(inputG, n=5)
```

### 3. GenAI Prompt Structure

The system builds a detailed prompt that includes:

- Plot dimensions and total area
- Room list with target area percentages
- Adjacency requirements (which rooms should connect)
- Aspect ratio constraints
- Strict JSON schema for output format
- Example output structure

Example prompt snippet:

```
Generate 5 DIVERSE and REALISTIC floor plan layouts.

PLOT SPECIFICATIONS:
- Plot dimensions: 1000 × 1000 pixels
- Total plot area: 1000000 square pixels

ROOMS TO PLACE:
  - livingroom-1: target area = 25% of plot, aspect ratio ≈ 0.8
  - kitchen-1: target area = 15% of plot, aspect ratio ≈ 0.7
  ...

ADJACENCY REQUIREMENTS:
  - livingroom-1 must be adjacent to kitchen-1
  - bedroom-1 must be adjacent to bathroom-1
  ...

OUTPUT FORMAT (STRICT JSON ONLY):
{
  "maps": [
    [
      {"x1": 0, "y1": 0, "x2": 1000, "y2": 0, "type": "Wall"},
      {"x1": 250, "y1": 0, "x2": 350, "y2": 0, "type": "Door"},
      {"x": 150, "y": 150, "type": "label", "label": "livingroom-1", ...}
    ],
    ... 4 more floor plans ...
  ],
  "room": [
    [
      {"x": 100, "y": 100, "width": 200, "height": 200, "type": "livingroom", "tag": "livingroom-1"}
    ],
    ... 4 more room arrays ...
  ]
}
```

## Testing

### 1. Start Backend

```powershell
cd backend
python app.py
```

### 2. Start Frontend

```powershell
cd frontend
npm run dev
```

### 3. Test in Browser

1. Go to http://localhost:5173 (or your Vite dev server URL)
2. Navigate to Floor Plan Generator
3. Fill in plot dimensions and select rooms
4. **Switch between AI engines** using the toggle
5. Click "Generate with [Selected Engine]"
6. View generated floor plans

### 4. Test GenAI Directly (Backend Only)

```powershell
cd backend
python test_genai_floorplan.py
```

This will:

- Load your API key from `.env`
- Create sample input data
- Call Gemini API
- Validate the response
- Save output to `test_genai_output.json`

## Output Format

Both AI engines return the **same format**:

```json
{
  "maps": [
    [
      {"x1": 0, "y1": 0, "x2": 1000, "y2": 0, "type": "Wall"},
      {"x1": 100, "y1": 200, "x2": 150, "y2": 200, "type": "Door"},
      {"x": 500, "y": 500, "type": "label", "label": "livingroom-1", ...}
    ],
    ...
  ],
  "room": [
    [
      {"x": 100, "y": 100, "width": 300, "height": 400, "type": "livingroom", "tag": "livingroom-1"}
    ],
    ...
  ]
}
```

### Map Data Objects

- **Wall**: `{x1, y1, x2, y2, type: "Wall"}`
- **Door**: `{x1, y1, x2, y2, type: "Door"}`
- **Label**: `{x, y, type: "label", label: "roomname-1", x1, y1, x2, y2, x3, y3, x4, y4}`

### Room Objects

- `{x, y, width, height, type: "roomtype", tag: "roomtype-1"}`

## API Key Setup

### Get Gemini API Key

1. Go to https://aistudio.google.com/apikey
2. Create a new API key
3. Copy the key

### Set in .env

```bash
# backend/.env
GEMINI_API_KEY=AIza...your_key_here
```

## Troubleshooting

### Error: "GEMINI_API_KEY not set"

- Check `backend/.env` exists
- Verify key is correct format
- Restart backend server

### Error: "503 UNAVAILABLE - Model overloaded"

- Gemini API is temporarily overloaded
- Wait a few minutes and try again
- Or switch to Genetic Algorithm temporarily

### Frontend not sending use_genai flag

- Check browser console for request payload
- Verify toggle button state changes
- Clear browser cache

### GenAI returns invalid JSON

- Check `backend/test_genai_output.json` for raw response
- Model may add commentary - parser should strip it
- Try simplifying the prompt (reduce room count)

### Floor plans not displaying

- Check backend console for response format
- Verify maps/room arrays have correct structure
- Check frontend console for transformation errors

## Performance Comparison

| Feature         | Genetic Algorithm              | Gemini AI                      |
| --------------- | ------------------------------ | ------------------------------ |
| **Speed**       | Fast (1-5 seconds)             | Moderate (5-30 seconds)        |
| **Quality**     | Optimized, mathematical        | Creative, natural              |
| **Consistency** | High (deterministic with seed) | Variable (creative variations) |
| **Scalability** | Handles many rooms well        | Best with < 10 rooms           |
| **Cost**        | Free (local compute)           | API cost (low)                 |
| **Offline**     | ✅ Yes                         | ❌ No (requires internet)      |

## Next Steps

### Potential Enhancements

1. **Hybrid Mode**: Use GA to seed GenAI prompts
2. **Refinement Loop**: Let GenAI refine GA outputs
3. **User Preferences**: Allow natural language input ("make kitchen bigger")
4. **Style Transfer**: Generate in different architectural styles
5. **3D Generation**: Extend to 3D models
6. **Cost Estimation**: Add material/construction costs

### Advanced Features

- Allow user to edit GenAI prompt
- Show prompt used in UI
- Save/load favorite prompts
- Compare GA vs GenAI side-by-side
- Batch generation with variations
- Export to CAD formats

## Support

### If GenAI fails:

- System automatically falls back to error response
- Frontend can handle both success and error cases
- User can switch to GA without losing data

### Logs:

- Backend: Check terminal running `app.py`
- Frontend: Check browser developer console
- Test script: Check `test_genai_output.json`

---

**🎉 Your floor plan generator now has dual AI engines!**

Users can choose the best tool for their needs:

- **GA** for fast, optimized, mathematical layouts
- **GenAI** for creative, natural, diverse designs
