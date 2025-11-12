# 🧪 Quick Testing Guide

## Test Scenario: Compare GA vs GenAI

### Prerequisites

```powershell
# 1. Ensure backend is running
cd backend
python app.py

# 2. Ensure frontend is running
cd frontend
npm run dev

# 3. Verify API key is set
# Check backend/.env contains:
# GEMINI_API_KEY=your_key_here
```

---

## Test Case 1: Simple 3-Room Layout

### Configuration

```
Plot Size: 1000 × 1000
Rooms:
  - Living Room (30%)
  - Kitchen (20%)
  - Bedroom (25%)
Connections:
  - Living Room ↔ Kitchen
  - Living Room ↔ Bedroom
```

### Test with Genetic Algorithm

1. Click **"Generate with Genetic Algorithm 🧬"** (Green button)
2. **Expected**:
   - ⏱️ Takes 2-5 seconds
   - ✅ Spinner shows on GREEN button only
   - ✅ Generates 5 variations
   - ✅ Colors: Living=blue, Kitchen=orange, Bedroom=purple
   - ✅ Labels appear at room centers
   - ✅ Rooms are rectangular and fill the plot
   - ✅ Thumbnail previews show clearly

### Test with Gemini AI

1. Click **"Generate with Gemini AI ✨"** (Purple button)
2. **Expected**:
   - ⏱️ Takes 10-30 seconds
   - ✅ Spinner shows on PURPLE button only
   - ✅ Generates 5 variations
   - ✅ Colors: Living=blue, Kitchen=orange, Bedroom=purple (same as GA)
   - ✅ Labels appear at room centers
   - ✅ Rooms are mostly rectangular
   - ✅ Thumbnail previews show clearly

### Comparison Checklist

| Feature     | GA          | GenAI       | Status |
| ----------- | ----------- | ----------- | ------ |
| Speed       | 2-5s        | 10-30s      | ✅     |
| Colors      | Perfect     | Perfect     | ✅     |
| Labels      | Perfect     | Perfect     | ✅     |
| Room shape  | Rectangular | Rectangular | ✅     |
| Space usage | 95-100%     | 85-95%      | ✅     |
| Variation   | Moderate    | High        | ✅     |

---

## Test Case 2: Complex 6-Room Layout

### Configuration

```
Plot Size: 1200 × 1200
Rooms:
  - Living Room (25%)
  - Kitchen (15%)
  - Bedroom 1 (18%)
  - Bedroom 2 (18%)
  - Bathroom (8%)
  - Garden (12%)
Connections:
  - Living Room ↔ Kitchen
  - Living Room ↔ Bedroom 1
  - Kitchen ↔ Bathroom
  - Bedroom 1 ↔ Bedroom 2
  - Living Room ↔ Garden
```

### Test with Both Engines

1. Test GA first (should complete in ~3-5s)
2. Test GenAI second (should complete in ~15-30s)
3. Compare results

### Expected Results

```
✅ Both engines generate valid floor plans
✅ All 6 rooms appear with correct colors
✅ Labels are clearly visible
✅ Doors appear between connected rooms
✅ No overlapping rooms
✅ Plot space is well-utilized
```

---

## Test Case 3: Error Handling

### Test 503 Overload (GenAI)

1. Click Gemini AI button multiple times quickly
2. **Expected**:
   - First request processes
   - May get 503 error
   - **Auto-retry** happens (see console logs)
   - Eventually succeeds or shows clear error message

### Test Invalid Configuration

```
Plot Size: 1000 × 1000
Rooms:
  - Living Room (50%)
  - Kitchen (40%)
  - Bedroom (30%)
  Total: 120% ❌ (exceeds 100%)
```

**Expected**:

- ✅ Both buttons disabled
- ✅ Red warning message: "Total area exceeds 100%"

---

## Test Case 4: Loading States

### Objective: Verify only clicked button shows loading

#### Test Steps

1. Configure any valid floor plan
2. Click **Genetic Algorithm** button
3. **Observe**:

   - ✅ GREEN button shows spinner
   - ✅ PURPLE button stays normal (not disabled, no spinner)
   - ✅ After 2-5s, GREEN button returns to normal
   - ✅ Floor plans appear

4. Click **Gemini AI** button
5. **Observe**:
   - ✅ PURPLE button shows spinner
   - ✅ GREEN button stays normal (not disabled, no spinner)
   - ✅ After 10-30s, PURPLE button returns to normal
   - ✅ Floor plans appear

---

## Test Case 5: Visual Consistency

### Objective: Ensure GenAI output looks identical to GA output

1. Generate with GA → Note the colors and layout
2. Generate with GenAI → Compare

### Expected Colors (Should Match Exactly)

```
livingroom   → Light Blue (#e3f2fd)
kitchen      → Light Orange (#fff3e0)
bedroom      → Light Purple (#f3e5f5)
bathroom     → Light Green (#e8f5e8)
carporch     → Light Yellow-Green (#f1f8e9)
garden       → Light Green (#e8f5e8)
drawingroom  → Light Pink (#fce4ec)
```

### Verification Steps

- [x] Click on a room in GA result → Note color
- [x] Click on same room type in GenAI result → Verify same color
- [x] Check label text → Should be identical format (e.g., "livingroom-1")
- [x] Check room boundaries → Should be clean rectangles

---

## Console Log Monitoring

### What to Look For in Browser Console

#### Genetic Algorithm

```
Room configuration: ...
Selected rooms: ...
Connections: ...
Sending data to backend: {use_genai: false}
Backend response: {success: true, generator: undefined}
Maps received: 5
Room data received: 5
Transformed plans: 5
```

#### Gemini AI

```
Room configuration: ...
Selected rooms: ...
Connections: ...
Sending data to backend: {use_genai: true, num_plans: 5}
Backend response: {success: true, generator: "genai"}
Maps received: 5
Room data received: 5
Transformed plans: 5
```

### Backend Console (Terminal)

#### Genetic Algorithm

```
Generating floor plan with dimensions: 1000x1000
Connections: 8
Using Genetic Algorithm for floor plan generation...
Processing 4 rooms: ['livingroom-1', 'kitchen-1', 'bedroom-1', 'bathroom-1']
Generated 5 floor plan variations
```

#### Gemini AI

```
Generating floor plan with dimensions: 1000x1000
Connections: 8
Using GenAI (Gemini) for floor plan generation...
Attempt 1/3: Calling GenAI model gemini-2.0-flash-exp...
✓ Received response (15234 characters)
✓ Successfully parsed JSON response
✓ Generated 5 floor plans successfully
✓ Transformed 20 rooms to GA format
```

---

## Common Issues & Quick Fixes

### Issue: GenAI returns error

```
❌ Error: GenAI call failed: 503 UNAVAILABLE
```

**Solution**:

- Wait 10-30 seconds
- Click "Generate with Gemini AI" again
- If persists after 3 retries, use Genetic Algorithm instead

### Issue: No colors showing

```
Rooms appear but all white/gray
```

**Solution**:

- Check browser console for errors
- Verify room types are correct (livingroom, kitchen, bedroom, etc.)
- Refresh page and try again

### Issue: Labels not visible

```
Colored rooms but no text labels
```

**Solution**:

- Check zoom level (Ctrl+0 to reset)
- Verify label objects in console: `console.log(floorPlanData.mapData)`
- Should see objects with `type: "label"`

### Issue: Both buttons show spinner

```
Both buttons have loading animation simultaneously
```

**Solution**:

- Hard refresh: Ctrl+Shift+R
- Clear cache and reload
- Verify latest code is deployed

---

## Performance Benchmarks

### Target Metrics

```
Genetic Algorithm:
  - Time: 2-5 seconds ✅
  - Success rate: >95% ✅
  - Visual quality: Excellent ✅

Gemini AI:
  - Time: 10-30 seconds ✅
  - Success rate: >85% (with retries) ✅
  - Visual quality: Excellent ✅
```

### Actual Test Results (Record Here)

```
Test Run 1:
  - GA: ___s, Result: Pass/Fail
  - GenAI: ___s, Result: Pass/Fail

Test Run 2:
  - GA: ___s, Result: Pass/Fail
  - GenAI: ___s, Result: Pass/Fail

Test Run 3:
  - GA: ___s, Result: Pass/Fail
  - GenAI: ___s, Result: Pass/Fail
```

---

## Final Verification Checklist

### Before Deployment

- [ ] Test GA with 3-room layout → Pass
- [ ] Test GA with 6-room layout → Pass
- [ ] Test GenAI with 3-room layout → Pass
- [ ] Test GenAI with 6-room layout → Pass
- [ ] Verify colors match between engines → Pass
- [ ] Verify labels appear correctly → Pass
- [ ] Test error handling (invalid config) → Pass
- [ ] Test loading states (independent buttons) → Pass
- [ ] Test API retry logic (503 errors) → Pass
- [ ] Check console for errors → No errors
- [ ] Test on different screen sizes → Pass
- [ ] Test with different browsers → Pass

### Sign-off

```
Tested by: ___________
Date: ___________
Status: Pass / Fail
Notes: ___________
```

---

## Quick Debug Commands

### Check Backend Status

```powershell
# Check if Flask is running
netstat -an | findstr "5000"

# Test endpoint directly
curl http://localhost:5000/api/floorplan/generate -X POST -H "Content-Type: application/json" -d "{\"width\":1000,\"height\":1000,\"connects\":[],\"use_genai\":false}"
```

### Check Frontend Status

```powershell
# Check if Vite is running
netstat -an | findstr "5173"

# Open browser console and run:
# fetch('http://localhost:5000/api/floorplan/generate', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({width:1000,height:1000,connects:[],use_genai:true})}).then(r=>r.json()).then(console.log)
```

### Check Environment

```powershell
# Verify API key is set
cd backend
python -c "from dotenv import load_dotenv; import os; load_dotenv(); print('API Key set:', bool(os.getenv('GEMINI_API_KEY')))"
```

---

**Testing Guide Version**: 1.0
**Last Updated**: October 22, 2025
**Status**: Ready for Testing ✅
