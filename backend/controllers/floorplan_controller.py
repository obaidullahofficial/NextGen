from flask import request, jsonify
from ai.floorplan_ai import GA_driver
from ai.genai_floorplan import genai_generate_floorplans
from models.floorplan import floorplan_collection
from utils.db import get_db
from datetime import datetime
from bson.objectid import ObjectId
import traceback

def generate_floorplan():
    """Generate floor plan using AI algorithm (GA or GenAI) with automatic compliance rules"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['width', 'height', 'connects']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        # **NEW: Fetch and apply compliance rules if plot_id is provided**
        compliance_rules = None
        if data.get('plot_id'):
            from controllers.compliance_controller import ComplianceController
            compliance_rules, message = ComplianceController.get_compliance_for_floorplan(data['plot_id'])
            
            if compliance_rules:
                print(f"[Compliance] Applying compliance rules for plot: {message}")
                # Store compliance in response to show user
                data['compliance_applied'] = compliance_rules
            else:
                print(f"[Compliance] No compliance rules found: {message}")
        
        # Extract data with defaults - matching GA_driver parameters exactly
        width = int(data.get('width', 1000))
        height = int(data.get('height', 1000))
        connects = data.get('connects', [])
        
        # Room proportions (aspect ratios) - matching GA_driver parameter names
        kitchen_p = float(data.get('kitchen_p', 0.7))
        living_p = float(data.get('living_p', 0.8))
        drawing_p = float(data.get('drawing_p', 0.8))
        car_p = float(data.get('car_p', 0.6))
        bath_p = float(data.get('bath_p', 0.8))
        bed_p = float(data.get('bed_p', 0.7))
        gar_p = float(data.get('gar_p', 0.5))
        
        # Room area percentages - matching GA_driver parameter names  
        kitchen_per = float(data.get('kitchen_per', 15))
        living_per = float(data.get('living_per', 25))
        drawing_per = float(data.get('drawing_per', 20))
        car_per = float(data.get('car_per', 10))
        bath_per = float(data.get('bath_per', 8))
        bed_per = float(data.get('bed_per', 20))
        gar_per = float(data.get('gar_per', 2))
        
        print(f"Generating floor plan with dimensions: {width}x{height}")
        print(f"Connections: {len(connects)}")
        
        # Check if user requested GenAI instead of GA
        use_genai = data.get('use_genai', False)
        
        if use_genai:
            print("Using GenAI (Gemini) for floor plan generation...")
            
            # Build input structure matching the GA format
            from ai.floorplan_ai import getRooms, getConnectionList
            Roms = getRooms(connects)
            conns = getConnectionList(connects)
            
            inputG = {
                "width": width,
                "height": height,
                "connections": conns,
                "rooms": Roms,
                "percents": {
                    "livingroom": float(living_per),
                    "kitchen": float(kitchen_per),
                    "bedroom": float(bed_per),
                    "bathroom": float(bath_per),
                    "carporch": float(car_per),
                    "garden": float(gar_per),
                    "drawingroom": float(drawing_per)
                },
                "proportions": {
                    "livingroom": float(living_p),
                    "kitchen": float(kitchen_p),
                    "bedroom": float(bed_p),
                    "bathroom": float(bath_p),
                    "carporch": float(car_p),
                    "garden": float(gar_p),
                    "drawingroom": float(drawing_p)
                }
            }
            
            # Request 4-5 floorplans from GenAI
            num_plans = data.get('num_plans', 5)  # Allow user to specify how many
            result = genai_generate_floorplans(inputG, n=num_plans)
            
            if 'error' in result:
                return jsonify({
                    'success': False,
                    'error': result['error'],
                    'raw_response': result.get('raw', None)
                }), 500
            
            return jsonify({
                'success': True,
                'data': result,
                'floor_plans': result.get('maps', []),
                'room_data': result.get('room', []),
                'message': f'Generated {len(result.get("maps", []))} floor plan variations using GenAI',
                'generator': 'genai'
            })
        
        # Original GA-based generation
        print("Using Genetic Algorithm for floor plan generation...")
        
        # Call the AI algorithm
        result = GA_driver(
            connects=connects,
            width=width,
            height=height,
            kitchen_p=kitchen_p,
            living_p=living_p,
            drawing_p=drawing_p,
            car_p=car_p,
            bath_p=bath_p,
            bed_p=bed_p,
            gar_p=gar_p,
            kitchen_per=kitchen_per,
            living_per=living_per,
            drawing_per=drawing_per,
            car_per=car_per,
            bath_per=bath_per,
            bed_per=bed_per,
            gar_per=gar_per
        )
        
        if 'error' in result:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 500
        
        # Include compliance rules in response if available
        response_data = {
            'success': True,
            'data': result,  # Return the full result from GA_driver
            'floor_plans': result.get('maps', []),
            'room_data': result.get('room', []),
            'message': f'Generated {len(result.get("maps", []))} floor plan variations'
        }
        
        if compliance_rules:
            response_data['compliance'] = compliance_rules
            response_data['message'] += f' (Compliance rules applied for {compliance_rules.get("marla_size")} plot)'
        
        return jsonify(response_data)
        
    except ValueError as e:
        return jsonify({
            'success': False,
            'error': f'Invalid input data: {str(e)}'
        }), 400
    except Exception as e:
        print(f"Error generating floor plan: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': 'Internal server error during floor plan generation'
        }), 500

def save_floorplan():
    """Save generated floor plan to database"""
    try:
        data = request.get_json()
        
        print(f"\n{'='*60}")
        print(f"💾 SAVE FLOOR PLAN REQUEST")
        print(f"User ID: {data.get('user_id', 'N/A')}")
        print(f"Society ID: {data.get('society_id', 'N/A')}")
        print(f"Project Name: {data.get('project_name', 'N/A')}")
        print(f"{'='*60}\n")
        
        # Validate required fields
        required_fields = ['user_id', 'floor_plan_data', 'project_name']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        # Get user info to determine society_id for subadmin visibility
        user_id = data['user_id']
        db = get_db()
        
        # Check if user is subadmin and get their society_id
        society_id = data.get('society_id')
        if not society_id:
            # Try to get society_id from user's society profile (if subadmin)
            from models.society_profile import society_profile_collection
            society_profiles = society_profile_collection(db)
            user_society = society_profiles.find_one({'user_id': user_id})
            if user_society:
                society_id = str(user_society['_id'])
                print(f"🏢 Found society_id for subadmin: {society_id}")
        
        # Create floor plan document
        floorplan_doc = {
            'user_id': user_id,
            'society_id': society_id,  # Will be set if user is subadmin or provided
            'project_name': data['project_name'],
            'floor_plan_data': data['floor_plan_data'],
            'room_data': data.get('room_data', []),
            'constraints': data.get('constraints', {}),
            'dimensions': {
                'width': data.get('width', 1000),
                'height': data.get('height', 1000)
            },
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'is_favorite': False,
            'tags': data.get('tags', []),
            'creator_type': 'subadmin' if society_id else 'user'  # Track creator type
        }
        
        # Save to database
        collection = floorplan_collection(db)
        result = collection.insert_one(floorplan_doc)
        
        return jsonify({
            'success': True,
            'floorplan_id': str(result.inserted_id),
            'message': 'Floor plan saved successfully'
        })
        
    except Exception as e:
        print(f"Error saving floor plan: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to save floor plan'
        }), 500

def get_society_floorplans():
    """Get all floor plans for a society (for subadmin view)"""
    try:
        user_id = request.args.get('user_id')
        print(f"\n{'='*60}")
        print(f"🏢 GET SOCIETY FLOOR PLANS - Subadmin User ID: {user_id}")
        print(f"{'='*60}")
        
        if not user_id:
            return jsonify({
                'success': False,
                'error': 'User ID is required'
            }), 400
        
        db = get_db()
        
        # Get the subadmin's society profile to find society_id
        society_collection = db['society_profiles']
        society = society_collection.find_one({'user_id': user_id})
        
        print(f"📋 Society profile found: {society is not None}")
        if society:
            print(f"🏘️ Society Name: {society.get('name', 'N/A')}")
            print(f"🆔 Society ID: {str(society['_id'])}")
        
        if not society:
            print("⚠️ No society found for this user")
            return jsonify({
                'success': True,
                'floorplans': [],
                'count': 0
            })
        
        society_id = str(society['_id'])
        
        # Get all floor plans where society_id matches OR user_id is the subadmin
        collection = floorplan_collection(db)
        query = {
            '$or': [
                {'society_id': society_id},
                {'user_id': user_id}
            ]
        }
        print(f"🔍 Query: {query}")
        
        floorplans = list(collection.find(query).sort('created_at', -1))
        print(f"📊 Found {len(floorplans)} floor plans")
        
        for i, plan in enumerate(floorplans):
            print(f"  {i+1}. Project: {plan.get('project_name', 'N/A')}, Society ID: {plan.get('society_id', 'None')}, User ID: {plan.get('user_id', 'None')}")
        
        # Convert ObjectId to string and format data
        for plan in floorplans:
            plan['_id'] = str(plan['_id'])
            plan['id'] = str(plan['_id'])
            if 'is_favorite' not in plan:
                plan['is_favorite'] = False
            if 'tags' not in plan:
                plan['tags'] = []
            if 'room_data' not in plan and 'floor_plan_data' in plan:
                plan['room_data'] = plan['floor_plan_data'].get('rooms', [])
            
            # Extract dimensions and room counts
            if 'dimensions' in plan:
                plan['plot_x'] = plan['dimensions'].get('width', 0)
                plan['plot_y'] = plan['dimensions'].get('height', 0)
            elif 'floor_plan_data' in plan and isinstance(plan['floor_plan_data'], dict):
                plot_dims = plan['floor_plan_data'].get('plotDimensions', {})
                plan['plot_x'] = plot_dims.get('width', 0)
                plan['plot_y'] = plot_dims.get('height', 0)
            
            # Count rooms by type
            rooms = plan.get('room_data', [])
            room_counts = {}
            for room in rooms:
                room_type = room.get('type', 'unknown')
                room_counts[room_type] = room_counts.get(room_type, 0) + 1
            
            plan['bedrooms'] = room_counts.get('bedroom', 0)
            plan['bathrooms'] = room_counts.get('bathroom', 0)
            plan['living_rooms'] = room_counts.get('livingroom', 0)
            plan['kitchens'] = room_counts.get('kitchen', 0)
            plan['name'] = plan.get('project_name', 'Unnamed Floor Plan')
        
        return jsonify({
            'success': True,
            'floorplans': floorplans,
            'count': len(floorplans)
        })
        
    except Exception as e:
        print(f"Error getting society floor plans: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve floor plans'
        }), 500

def get_user_floorplans():
    """Get all floor plans for a specific user"""
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({
                'success': False,
                'error': 'User ID is required'
            }), 400
        
        # Query database - include all fields for proper display
        db = get_db()
        collection = floorplan_collection(db)
        floorplans = list(collection.find(
            {'user_id': user_id}
        ).sort('created_at', -1))
        
        # Convert ObjectId to string and format data
        for plan in floorplans:
            plan['_id'] = str(plan['_id'])
            # Ensure all required fields exist with defaults
            if 'is_favorite' not in plan:
                plan['is_favorite'] = False
            if 'tags' not in plan:
                plan['tags'] = []
            if 'room_data' not in plan and 'floor_plan_data' in plan:
                plan['room_data'] = plan['floor_plan_data'].get('rooms', [])
        
        return jsonify({
            'success': True,
            'floor_plans': floorplans,
            'count': len(floorplans)
        })
        
    except Exception as e:
        print(f"Error getting floor plans: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve floor plans'
        }), 500

def get_floorplan_details():
    """Get detailed floor plan data"""
    try:
        floorplan_id = request.args.get('floorplan_id')
        if not floorplan_id:
            return jsonify({
                'success': False,
                'error': 'Floor plan ID is required'
            }), 400
        
        # Query database
        db = get_db()
        collection = floorplan_collection(db)
        floorplan = collection.find_one({'_id': ObjectId(floorplan_id)})
        
        if not floorplan:
            return jsonify({
                'success': False,
                'error': 'Floor plan not found'
            }), 404
        
        # Convert ObjectId to string
        floorplan['_id'] = str(floorplan['_id'])
        
        return jsonify({
            'success': True,
            'floor_plan': floorplan
        })
        
    except Exception as e:
        print(f"Error getting floor plan details: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve floor plan details'
        }), 500

def delete_floorplan():
    """Delete a floor plan"""
    try:
        floorplan_id = request.args.get('floorplan_id')
        user_id = request.args.get('user_id')
        
        if not floorplan_id or not user_id:
            return jsonify({
                'success': False,
                'error': 'Floor plan ID and user ID are required'
            }), 400
        
        # Delete from database
        db = get_db()
        collection = floorplan_collection(db)
        result = collection.delete_one({
            '_id': ObjectId(floorplan_id),
            'user_id': user_id
        })
        
        if result.deleted_count == 0:
            return jsonify({
                'success': False,
                'error': 'Floor plan not found or unauthorized'
            }), 404
        
        return jsonify({
            'success': True,
            'message': 'Floor plan deleted successfully'
        })
        
    except Exception as e:
        print(f"Error deleting floor plan: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to delete floor plan'
        }), 500

def update_floorplan():
    """Update floor plan details"""
    try:
        data = request.get_json()
        
        print(f"\n{'='*60}")
        print(f"📝 UPDATE FLOOR PLAN REQUEST")
        print(f"Data received: {data}")
        print(f"{'='*60}\n")
        
        floorplan_id = data.get('floorplan_id')
        user_id = data.get('user_id')
        
        if not floorplan_id or not user_id:
            print(f"❌ Missing required fields - floorplan_id: {floorplan_id}, user_id: {user_id}")
            return jsonify({
                'success': False,
                'error': 'Floor plan ID and user ID are required'
            }), 400
        
        # Convert floorplan_id to string if it's an integer
        floorplan_id = str(floorplan_id)
        print(f"🔍 Searching for floor plan ID: {floorplan_id}, User ID: {user_id}")
        
        # Prepare update data
        update_data = {
            'updated_at': datetime.utcnow()
        }
        
        # Optional fields to update
        if 'project_name' in data:
            update_data['project_name'] = data['project_name']
        if 'is_favorite' in data:
            update_data['is_favorite'] = data['is_favorite']
        if 'tags' in data:
            update_data['tags'] = data['tags']
        if 'floor_plan_data' in data:
            update_data['floor_plan_data'] = data['floor_plan_data']
            print(f"📊 Updating floor_plan_data with rooms: {len(data['floor_plan_data'].get('rooms', []))}")
            print(f"📊 mapData items: {len(data['floor_plan_data'].get('mapData', []))}")
        if 'room_data' in data:
            update_data['room_data'] = data['room_data']
            print(f"📊 Updating room_data with {len(data['room_data'])} rooms")
        
        # Update in database
        db = get_db()
        collection = floorplan_collection(db)
        
        # Try to query by ObjectId first, if that fails, query by integer id field
        result = None
        try:
            print(f"🔍 Trying ObjectId query...")
            result = collection.update_one(
                {'_id': ObjectId(floorplan_id), 'user_id': user_id},
                {'$set': update_data}
            )
            print(f"✅ ObjectId query - matched: {result.matched_count}, modified: {result.modified_count}")
        except Exception as e:
            print(f"⚠️ ObjectId query failed: {str(e)}")
            # If ObjectId conversion fails, try with integer id
            try:
                print(f"🔍 Trying integer ID query...")
                floorplan_id_int = int(floorplan_id)
                result = collection.update_one(
                    {'id': floorplan_id_int, 'user_id': user_id},
                    {'$set': update_data}
                )
                print(f"✅ Integer ID query - matched: {result.matched_count}, modified: {result.modified_count}")
            except Exception as e2:
                print(f"❌ Integer ID query also failed: {str(e2)}")
                return jsonify({
                    'success': False,
                    'error': 'Invalid floor plan ID format'
                }), 400
        
        if result and result.matched_count == 0:
            print(f"❌ Floor plan not found")
            return jsonify({
                'success': False,
                'error': 'Floor plan not found or unauthorized'
            }), 404
        
        print(f"✅ Floor plan updated successfully")
        return jsonify({
            'success': True,
            'message': 'Floor plan updated successfully'
        })
        
    except Exception as e:
        print(f"❌ Error updating floor plan: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': f'Failed to update floor plan: {str(e)}'
        }), 500

def update_floorplan_with_ga():
    """Update floor plan using genetic algorithm optimization"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if 'floorPlanData' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing floorPlanData field'
            }), 400
        
        floor_plan_data = data['floorPlanData']
        user_updates = data.get('userUpdates', {})
        
        # Extract current room data and apply user modifications
        rooms = floor_plan_data.get('rooms', [])
        
        # Apply user updates to rooms
        for room_id, updates in user_updates.items():
            for room in rooms:
                if str(room.get('id')) == str(room_id):
                    if 'x' in updates:
                        room['x'] = updates['x']
                    if 'y' in updates:
                        room['y'] = updates['y']
                    if 'width' in updates:
                        room['width'] = updates['width']
                    if 'height' in updates:
                        room['height'] = updates['height']
        
        # Use genetic algorithm to optimize the layout
        try:
            # Prepare parameters for GA optimization
            plot_width = floor_plan_data.get('plot_width', 1000)
            plot_height = floor_plan_data.get('plot_height', 1000)
            
            # Convert rooms to GA format
            room_tags = []
            connects = []
            
            for room in rooms:
                room_tags.append(room.get('name', 'room'))
            
            # Create simple connections between adjacent rooms
            for i in range(len(room_tags) - 1):
                connects.append({
                    'from_tag': room_tags[i],
                    'to_tag': room_tags[i + 1]
                })
            
            # Run genetic algorithm optimization
            optimized_result = GA_driver(
                width=plot_width,
                height=plot_height,
                connects=connects,
                room_tags=room_tags,
                max_generations=20,  # Reduced for faster response
                population_size=15   # Reduced for faster response
            )
            
            if optimized_result:
                # Update the floor plan with optimized layout
                optimized_floor_plan = {
                    **floor_plan_data,
                    'rooms': optimized_result.get('rooms', rooms),
                    'fitness': optimized_result.get('fitness', 0),
                    'last_updated': datetime.utcnow().isoformat(),
                    'optimization_applied': True
                }
                
                return jsonify({
                    'success': True,
                    'optimizedFloorPlan': optimized_floor_plan,
                    'message': 'Floor plan optimized successfully'
                })
            else:
                # Return original with user updates if GA fails
                updated_floor_plan = {
                    **floor_plan_data,
                    'rooms': rooms,
                    'last_updated': datetime.utcnow().isoformat()
                }
                
                return jsonify({
                    'success': True,
                    'optimizedFloorPlan': updated_floor_plan,
                    'message': 'User updates applied (optimization skipped)'
                })
                
        except Exception as ga_error:
            print(f"GA optimization error: {str(ga_error)}")
            # Return user updates even if GA fails
            updated_floor_plan = {
                **floor_plan_data,
                'rooms': rooms,
                'last_updated': datetime.utcnow().isoformat()
            }
            
            return jsonify({
                'success': True,
                'optimizedFloorPlan': updated_floor_plan,
                'message': 'User updates applied (optimization failed)'
            })
        
    except Exception as e:
        print(f"Error updating floor plan with GA: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': 'Failed to update floor plan with genetic algorithm'
        }), 500

def generate_floorplan_variations():
    """Generate variations of existing floor plan using genetic algorithm"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if 'basePlan' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing basePlan field'
            }), 400
        
        base_plan = data['basePlan']
        variation_count = data.get('variationCount', 3)
        mutation_rate = data.get('mutationRate', 0.1)
        crossover_rate = data.get('crossoverRate', 0.7)
        
        # Extract base plan data
        plot_width = base_plan.get('plot_width', 1000)
        plot_height = base_plan.get('plot_height', 1000)
        rooms = base_plan.get('rooms', [])
        
        if not rooms:
            return jsonify({
                'success': False,
                'error': 'Base plan has no rooms'
            }), 400
        
        # Convert to GA format
        room_tags = [room.get('name', 'room') for room in rooms]
        
        # Create connections based on room proximity
        connects = []
        for i, room1 in enumerate(rooms):
            for j, room2 in enumerate(rooms[i+1:], i+1):
                # Check if rooms are adjacent (simple heuristic)
                distance = ((room1.get('x', 0) - room2.get('x', 0))**2 + 
                           (room1.get('y', 0) - room2.get('y', 0))**2)**0.5
                if distance < max(plot_width, plot_height) * 0.3:  # 30% of plot dimension
                    connects.append({
                        'from_tag': room1.get('name', 'room'),
                        'to_tag': room2.get('name', 'room')
                    })
        
        # Generate multiple variations
        variations = []
        
        for i in range(variation_count):
            try:
                # Run GA with slight variations in parameters
                variation_result = GA_driver(
                    width=plot_width,
                    height=plot_height,
                    connects=connects,
                    room_tags=room_tags,
                    max_generations=15 + (i * 5),  # Vary generations
                    population_size=12 + (i * 3),  # Vary population
                    mutation_rate=mutation_rate + (i * 0.02),  # Slight variation
                    crossover_rate=crossover_rate - (i * 0.05)  # Slight variation
                )
                
                if variation_result:
                    variation = {
                        'id': f"{base_plan.get('id', 'base')}_var_{i+1}",
                        'plot_width': plot_width,
                        'plot_height': plot_height,
                        'rooms': variation_result.get('rooms', []),
                        'fitness': variation_result.get('fitness', 0),
                        'created_at': datetime.utcnow().isoformat(),
                        'is_variation': True,
                        'parent_id': base_plan.get('id'),
                        'variation_parameters': {
                            'mutation_rate': mutation_rate + (i * 0.02),
                            'crossover_rate': crossover_rate - (i * 0.05),
                            'generations': 15 + (i * 5)
                        }
                    }
                    variations.append(variation)
                    
            except Exception as var_error:
                print(f"Error generating variation {i+1}: {str(var_error)}")
                continue
        
        if not variations:
            return jsonify({
                'success': False,
                'error': 'Failed to generate any variations'
            }), 500
        
        return jsonify({
            'success': True,
            'variations': variations,
            'count': len(variations),
            'message': f'Generated {len(variations)} variations successfully'
        })
        
    except Exception as e:
        print(f"Error generating floor plan variations: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': 'Failed to generate floor plan variations'
        }), 500