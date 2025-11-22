#!/usr/bin/env python3
"""
Test script for GenAI floor plan generation.

This script tests the GenAI integration by:
1. Creating sample input data (room connections, percentages, proportions)
2. Calling genai_generate_floorplans()
3. Validating the output format
4. Printing a summary of the generated floor plans

Run this from the backend directory:
  python test_genai_floorplan.py
"""

import os
import sys
import json

# Ensure we can import from ai module
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ai.genai_floorplan import genai_generate_floorplans


def create_sample_input():
    """Create sample input data matching GA_driver format."""
    
    # Sample room connections (from_tag, from_type, to_tag, to_type)
    connects = [
        {"from_tag": "livingroom-1", "to_tag": "kitchen-1"},
        {"from_tag": "livingroom-1", "to_tag": "bedroom-1"},
        {"from_tag": "kitchen-1", "to_tag": "bathroom-1"},
        {"from_tag": "bedroom-1", "to_tag": "bathroom-1"}
    ]
    
    # Extract rooms and connections
    from ai.floorplan_ai import getRooms, getConnectionList
    rooms = getRooms(connects)
    connections = getConnectionList(connects)
    
    # Build input dict
    inputG = {
        "width": 1000,
        "height": 1000,
        "rooms": rooms,
        "connections": connections,
        "percents": {
            "livingroom": 30,
            "kitchen": 20,
            "bedroom": 25,
            "bathroom": 15,
            "carporch": 0,
            "garden": 0,
            "drawingroom": 10
        },
        "proportions": {
            "livingroom": 0.8,
            "kitchen": 0.7,
            "bedroom": 0.75,
            "bathroom": 0.6,
            "carporch": 0.6,
            "garden": 0.5,
            "drawingroom": 0.8
        }
    }
    
    return inputG


def validate_output(result):
    """Validate that the output has the correct structure."""
    
    if "error" in result:
        print(f"❌ ERROR: {result['error']}")
        if "raw" in result:
            print(f"\nRaw response preview:\n{result['raw'][:500]}...")
        if "parsed" in result:
            print(f"\nParsed data:\n{json.dumps(result['parsed'], indent=2)[:500]}...")
        return False
    
    if "maps" not in result or "room" not in result:
        print("❌ ERROR: Missing 'maps' or 'room' keys in result")
        print(f"Result keys: {result.keys()}")
        return False
    
    maps = result["maps"]
    rooms = result["room"]
    
    if not isinstance(maps, list) or not isinstance(rooms, list):
        print("❌ ERROR: 'maps' and 'room' must be arrays")
        return False
    
    if len(maps) == 0:
        print("❌ ERROR: No floor plans generated")
        return False
    
    if len(maps) != len(rooms):
        print(f"⚠️  WARNING: maps length ({len(maps)}) != rooms length ({len(rooms)})")
    
    print(f"✅ Generated {len(maps)} floor plan(s)")
    
    # Validate each floor plan
    for i, (map_data, room_data) in enumerate(zip(maps, rooms)):
        if not isinstance(map_data, list):
            print(f"❌ Floor plan {i+1}: map_data is not an array")
            continue
        
        if not isinstance(room_data, list):
            print(f"❌ Floor plan {i+1}: room_data is not an array")
            continue
        
        # Count walls, doors, labels
        walls = [item for item in map_data if isinstance(item, dict) and item.get("type") == "Wall"]
        doors = [item for item in map_data if isinstance(item, dict) and item.get("type") == "Door"]
        labels = [item for item in map_data if isinstance(item, dict) and item.get("type") == "label"]
        
        print(f"\n📐 Floor Plan {i+1}:")
        print(f"   - Walls: {len(walls)}")
        print(f"   - Doors: {len(doors)}")
        print(f"   - Labels: {len(labels)}")
        print(f"   - Rooms: {len(room_data)}")
        
        # Validate room data structure
        for j, room in enumerate(room_data[:3]):  # Show first 3 rooms
            if isinstance(room, dict):
                has_coords = all(k in room for k in ["x", "y", "width", "height"])
                has_label = "tag" in room or "label" in room
                status = "✅" if (has_coords and has_label) else "⚠️"
                print(f"   {status} Room {j+1}: {room.get('tag', room.get('label', 'unknown'))}")
    
    return True


def main():
    print("=" * 60)
    print("Testing GenAI Floor Plan Generation")
    print("=" * 60)
    
    # Check if API key is set
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("\n❌ ERROR: GEMINI_API_KEY not set!")
        print("Set it in your environment or in backend/.env")
        print("\nPowerShell: $env:GEMINI_API_KEY = \"your-key-here\"")
        return 1
    
    print(f"\n✅ GEMINI_API_KEY is set (length: {len(api_key)})")
    
    # Create sample input
    print("\n📝 Creating sample input data...")
    inputG = create_sample_input()
    print(f"   - Plot: {inputG['width']}x{inputG['height']}")
    print(f"   - Rooms: {len(inputG['rooms'])}")
    print(f"   - Connections: {len(inputG['connections'])}")
    
    # Generate floor plans
    print("\n🤖 Calling GenAI to generate floor plans...")
    print("   (This may take 10-30 seconds...)")
    
    try:
        result = genai_generate_floorplans(inputG, n=4)
    except Exception as e:
        print(f"\n❌ Exception during generation: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    # Validate output
    print("\n" + "=" * 60)
    print("Validation Results")
    print("=" * 60)
    
    success = validate_output(result)
    
    if success:
        print("\n" + "=" * 60)
        print("✅ TEST PASSED - GenAI integration is working!")
        print("=" * 60)
        
        # Save sample output
        output_file = "test_genai_output.json"
        with open(output_file, "w") as f:
            json.dump(result, f, indent=2)
        print(f"\n💾 Sample output saved to: {output_file}")
        
        return 0
    else:
        print("\n" + "=" * 60)
        print("❌ TEST FAILED - See errors above")
        print("=" * 60)
        return 1


if __name__ == "__main__":
    sys.exit(main())
