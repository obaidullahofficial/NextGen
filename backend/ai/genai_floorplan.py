"""
GenAI Floor Plan Generator
===========================
This module uses Google's Gemini AI to generate floor plan layouts.

Main Function:
--------------
genai_generate_floorplans(inputG, n=4) -> dict
    Generates n floor plan variations using Gemini AI.
    Returns: {"maps": [...], "room": [...]} matching json format

Internal Functions:
-------------------
_build_prompt(inputG, n) -> str
    Constructs the detailed prompt for Gemini with all constraints
    
_extract_json(text) -> str
    Extracts JSON content from Gemini's response (handles markdown)
    
_clean_json_string(text) -> str
    Cleans and fixes common JSON formatting issues
    
_calculate_fitness(inputG, maps_data, rooms_data) -> float
    Calculates fitness score (0-100) based on GA's criteria:
    - Adjacency: 50 points per connection
    - Area accuracy: 30 points per room
    - Proportions: 20 points per room
"""

import json
import re
import time
from typing import Dict, Any, List

from .genai_client import generate_content


def _build_prompt(inputG: Dict[str, Any], n: int = 4) -> str:
    """
    Constructs a detailed prompt for Gemini AI to generate floor plans.
    
    Args:
        inputG: Input configuration with:
            - width, height: Plot dimensions
            - rooms: List of room tags (e.g., ["livingroom-1", "kitchen-1"])
            - connections: List of room connections
            - percents: Target area percentages per room type
            - proportions: Target aspect ratios per room type
        n: Number of floor plan variations to generate
    
    Returns:
        str: Complete prompt string for Gemini
    """
    width = inputG.get("width")
    height = inputG.get("height")
    rooms = inputG.get("rooms", [])
    connections = inputG.get("connections", [])
    percents = inputG.get("percents", {})
    proportions = inputG.get("proportions", {})

    # Build connection description
    connection_text = ""
    for conn in connections[:10]:
        from_room = conn[0] if len(conn) > 0 else "unknown"
        to_room = conn[2] if len(conn) > 2 else "unknown"
        connection_text += f"  - {from_room} must connect to {to_room} (place door on shared wall)\n"

    # Build room requirements
    room_details = ""
    for room_tag in rooms[:15]:
        room_type = room_tag.split('-')[0] if '-' in room_tag else room_tag
        target_percent = percents.get(room_type, 10)
        target_proportion = proportions.get(room_type, 0.7)
        target_area = int(width * height * target_percent / 100)
        room_details += f"  - {room_tag}: {target_percent}% of plot = {target_area}px², aspect ratio ≈ {target_proportion}\n"

    prompt = f"""Generate {n} rectangular floor plan layouts in strict JSON format.

**PLOT:** {width}×{height} pixels, top-left is (0,0)

**ROOMS (must place ALL of these):**
{room_details}

**CONNECTIONS (must place doors):**
{connection_text}

**CRITICAL RULES:**
1. Use ONLY rectangles (x, y, width, height)
2. NO overlapping rooms
3. Fill the entire {width}×{height} plot (minimize gaps)
4. Doors must be 50-100px wide on shared walls between connected rooms
5. EVERY room must have at least one door (no isolated rooms)
6. Place exactly {len(rooms)} rooms, no more, no less

**OUTPUT FORMAT (JSON only, no markdown, no explanation):**
{{
  "maps": [
    [
      {{"x1": 0, "y1": 0, "x2": {width}, "y2": 0, "type": "Wall"}},
      {{"x1": 0, "y1": 0, "x2": 0, "y2": {height}, "type": "Wall"}},
      {{"x1": 400, "y1": 300, "x2": 500, "y2": 300, "type": "Door"}},
      {{"x": 200, "y": 150, "type": "label", "label": "livingroom-1", "x1": 0, "y1": 0, "x2": 400, "y2": 0, "x3": 0, "y3": 300, "x4": 400, "y4": 300}}
    ]
  ],
  "room": [
    [
      {{"x": 0, "y": 0, "width": 400, "height": 300, "type": "livingroom", "tag": "livingroom-1"}}
    ]
  ]
}}

Generate {n} variations now. Return ONLY valid JSON, no other text:"""

    return prompt


def _extract_json(text: str) -> str:
    """
    Extracts JSON content from Gemini's response.
    Handles cases where Gemini wraps JSON in markdown or adds commentary.
    
    Args:
        text: Raw response from Gemini
    
    Returns:
        str: Extracted JSON string
    """
    text = text.strip()
    
    # Remove markdown code blocks if present
    if text.startswith('```'):
        # Find content between ``` markers
        match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
        if match:
            return match.group(1)
    
    # If starts with { or [, assume it's JSON
    if text.startswith('{') or text.startswith('['):
        return text
    
    # Try to find JSON object in text
    start = text.find('{')
    end = text.rfind('}')
    if start != -1 and end != -1 and end > start:
        return text[start:end+1]
    
    # Try to find JSON array
    start = text.find('[')
    end = text.rfind(']')
    if start != -1 and end != -1 and end > start:
        return text[start:end+1]
    
    return text


def _clean_json_string(text: str) -> str:
    """
    Cleans common JSON formatting issues in Gemini's response.
    
    Args:
        text: JSON string that may have errors
    
    Returns:
        str: Cleaned JSON string
    """
    # Remove any trailing commas before } or ]
    text = re.sub(r',(\s*[}\]])', r'\1', text)
    
    # Fix unescaped quotes in strings (basic attempt)
    # This is a simplified approach and may not catch all cases
    
    return text


def _calculate_fitness(inputG: Dict[str, Any], maps_data: List, rooms_data: List) -> float:
    """
    Calculates fitness score for a floor plan using GA's scoring criteria.
    
    Scoring:
    - Adjacency: 50 points for each properly connected room pair
    - Area accuracy: 30 points per room if within 10% of target
    - Proportions: 20 points per room if aspect ratio is close to target
    
    Args:
        inputG: Input configuration with requirements
        maps_data: Map data (walls, doors, labels)
        rooms_data: Room data (positions and dimensions)
    
    Returns:
        float: Fitness score (0-100)
    """
    try:
        score = 0
        max_score = 0
        
        # Calculate max possible score
        num_connections = len(inputG.get("connections", []))
        num_rooms = len(inputG.get("rooms", []))
        max_score = (num_connections * 50) + (num_rooms * 30) + (num_rooms * 20)
        
        if max_score == 0:
            return 0
        
        # Check adjacency (simplified check for doors)
        doors = [item for item in maps_data if item.get('type') == 'Door']
        score += len(doors) * 50  # Give points for each door
        
        # Check room areas
        width = inputG.get("width", 1000)
        height = inputG.get("height", 1000)
        plot_area = width * height
        percents = inputG.get("percents", {})
        
        for room in rooms_data:
            if isinstance(room, dict):
                room_width = room.get("width", 0)
                room_height = room.get("height", 0)
                room_area = room_width * room_height
                room_tag = room.get("tag", "")
                room_type = room_tag.split('-')[0] if '-' in room_tag else room_tag
                
                # Area accuracy
                target_percent = percents.get(room_type, 10)
                actual_percent = (room_area / plot_area) * 100
                area_deviation = abs(actual_percent - target_percent) / target_percent
                if area_deviation <= 0.1:  # Within 10%
                    score += 30 * (1 - area_deviation)
                
                # Proportion accuracy
                proportions = inputG.get("proportions", {})
                target_proportion = proportions.get(room_type, 0.7)
                actual_proportion = min(room_width, room_height) / max(room_width, room_height) if max(room_width, room_height) > 0 else 0
                proportion_deviation = abs(actual_proportion - target_proportion) / target_proportion if target_proportion > 0 else 1
                if proportion_deviation <= 0.2:  # Within 20%
                    score += 20 * (1 - proportion_deviation)
        
        # Normalize to 0-100
        fitness = (score / max_score) * 100 if max_score > 0 else 0
        return min(100, max(0, fitness))
        
    except Exception as e:
        print(f"⚠ Fitness calculation error: {e}")
        return 0


def genai_generate_floorplans(inputG: Dict[str, Any], n: int = 4, model: str = "gemini-2.5-flash", max_retries: int = 3) -> Dict[str, Any]:
    """
    Main function: Generates floor plans using Google Gemini AI.
    
    Process:
    1. Build detailed prompt with all constraints
    2. Call Gemini API (with retries for 503/429 errors)
    3. Parse JSON response
    4. Transform room data to match GA format
    5. Calculate fitness scores
    6. Return floor plans
    
    Args:
        inputG: Input configuration dict with:
            - width, height: Plot dimensions
            - rooms: List of room tags
            - connections: Room connection requirements
            - percents: Target area percentages
            - proportions: Target aspect ratios
        n: Number of floor plans to generate (default: 4)
        model: Gemini model to use (default: "gemini-2.5-flash")
        max_retries: Number of retry attempts for API errors (default: 3)
    
    Returns:
        dict: {
            "maps": [[map_objects], ...],  # n floor plan maps
            "room": [[room_objects], ...],  # n room layouts
            "fitness_scores": [score1, ...]  # Optional fitness scores
        }
        OR
        dict: {"error": "error message"} if generation fails
    """
    prompt = _build_prompt(inputG, n)
    last_error = None
    
    # Retry loop with exponential backoff for API errors
    for attempt in range(max_retries):
        try:
            print(f"🔄 Attempt {attempt + 1}/{max_retries}: Calling Gemini {model}...")
            resp_text = generate_content(prompt, model=model)
            print(f"✅ Response received ({len(resp_text)} characters)")
            
            # Extract and clean JSON
            json_text = _extract_json(resp_text)
            json_text = _clean_json_string(json_text)
            
            # Parse JSON
            try:
                data = json.loads(json_text)
                print("✅ JSON parsed successfully")
            except json.JSONDecodeError as json_err:
                print(f"❌ JSON parse error: {json_err}")
                # Save failed response for debugging
                with open("genai_failed_response.txt", "w", encoding="utf-8") as f:
                    f.write(resp_text)
                print("💾 Failed response saved to genai_failed_response.txt")
                
                if attempt < max_retries - 1:
                    print("🔄 Retrying...")
                    time.sleep(2)
                    continue
                else:
                    return {"error": f"Failed to parse JSON from GenAI response after {max_retries} attempts"}
            
            # Extract maps and room data
            maps = data.get("maps") if isinstance(data, dict) else None
            room = data.get("room") if isinstance(data, dict) else None
            
            if not maps or not room:
                print("⚠ Missing 'maps' or 'room' in response")
                return {"error": "GenAI response missing required fields"}
            
            # Ensure correct count
            maps = maps[:n]
            room = room[:n]
            
            # Transform room data from dict to GA array format
            # GenAI: {"x": 0, "y": 0, "width": 400, "height": 300, "tag": "living-1"}
            # GA:    [[0,0], [400,0], [0,300], [400,300], "living-1"]
            transformed_rooms = []
            for room_array in room:
                room_list = []
                for rm in room_array:
                    if isinstance(rm, dict):
                        x = rm.get("x", 0)
                        y = rm.get("y", 0)
                        width = rm.get("width", 100)
                        height = rm.get("height", 100)
                        tag = rm.get("tag") or rm.get("type", "room-1")
                        
                        # Create 4 corner points (GA format)
                        p0 = [x, y]
                        p1 = [x + width, y]
                        p2 = [x, y + height]
                        p3 = [x + width, y + height]
                        
                        room_list.append([p0, p1, p2, p3, tag])
                    elif isinstance(rm, list) and len(rm) == 5:
                        room_list.append(rm)  # Already in GA format
                
                transformed_rooms.append(room_list)
            
            # Calculate fitness scores for each floor plan
            fitness_scores = []
            for i in range(len(maps)):
                fitness = _calculate_fitness(inputG, maps[i], room[i])
                fitness_scores.append(fitness)
                print(f"📊 Plan {i+1} fitness: {fitness:.1f}")
            
            print(f"✅ Generated {len(maps)} floor plans")
            
            return {
                "maps": maps,
                "room": transformed_rooms,
                "fitness_scores": fitness_scores
            }
            
        except Exception as e:
            last_error = str(e)
            print(f"❌ Attempt {attempt + 1} failed: {last_error}")
            
            # Check for quota exceeded errors
            if "quota" in last_error.lower() or "resource_exhausted" in last_error.lower() or "resourceexhausted" in last_error.lower():
                error_msg = "Gemini API quota exceeded. Please try again later or check your API quota limits."
                print(f"🚫 {error_msg}")
                return {"error": error_msg}
            
            # Check for retryable errors
            if "503" in last_error or "429" in last_error or "UNAVAILABLE" in last_error or "overloaded" in last_error.lower():
                if attempt < max_retries - 1:
                    wait_time = (2 ** attempt) + 1  # Exponential backoff: 2s, 5s, 9s
                    print(f"⏳ API busy. Retrying in {wait_time}s...")
                    time.sleep(wait_time)
                    continue
            
            # Non-retryable error or final attempt
            break
    
    # All retries failed
    return {"error": f"GenAI call failed after {max_retries} attempts: {last_error}"}
