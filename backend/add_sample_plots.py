"""
Script to add sample plots to the database for testing
"""
import sys
from utils.db import get_db
from models.plot import plot_collection
from models.society_profile import society_profile_collection
from datetime import datetime

def add_sample_plots():
    """Add sample plots for existing societies"""
    try:
        db = get_db()
        plots_col = plot_collection(db)
        societies_col = society_profile_collection(db)
        
        # Get all societies
        societies = list(societies_col.find())
        
        if not societies:
            print("❌ No societies found in database. Please create societies first.")
            return
        
        print(f"✅ Found {len(societies)} societies")
        
        # Sample plot data for each society
        sample_plots = [
            {
                'plot_number': 'A-101',
                'price': '5000000',
                'status': 'available',
                'type': 'Residential Plot',
                'area': '5 Marla',
                'dimension_x': 30,
                'dimension_y': 60,
                'location': 'Block A, Main Boulevard',
                'description': ['Corner plot with park view', 'Near main entrance', 'Ideal for residential construction'],
                'amenities': ['Electricity', 'Water Supply', 'Gas Connection', 'Sewerage'],
            },
            {
                'plot_number': 'A-102',
                'price': '4500000',
                'status': 'available',
                'type': 'Residential Plot',
                'area': '5 Marla',
                'dimension_x': 25,
                'dimension_y': 50,
                'location': 'Block A, Main Road',
                'description': ['Main road facing plot', 'Easy access to commercial area', 'Prime location'],
                'amenities': ['Electricity', 'Water Supply', 'Gas Connection'],
            },
            {
                'plot_number': 'A-103',
                'price': '6500000',
                'status': 'sold',
                'type': 'Residential Plot',
                'area': '7 Marla',
                'dimension_x': 35,
                'dimension_y': 70,
                'location': 'Block A, Park Facing',
                'description': ['Premium location', 'Already sold', 'Park and mosque view'],
                'amenities': ['Electricity', 'Water Supply', 'Gas Connection', 'Sewerage', 'Internet'],
            },
            {
                'plot_number': 'B-201',
                'price': '3500000',
                'status': 'available',
                'type': 'Residential Plot',
                'area': '3 Marla',
                'dimension_x': 20,
                'dimension_y': 45,
                'location': 'Block B, Inner Road',
                'description': ['Affordable option', 'Good for small house', 'Peaceful neighborhood'],
                'amenities': ['Electricity', 'Water Supply'],
            },
            {
                'plot_number': 'B-202',
                'price': '8500000',
                'status': 'available',
                'type': 'Residential Plot',
                'area': '10 Marla',
                'dimension_x': 40,
                'dimension_y': 80,
                'location': 'Block B, Corner Plot',
                'description': ['Large corner plot', 'Two side open', 'Excellent for luxury house'],
                'amenities': ['Electricity', 'Water Supply', 'Gas Connection', 'Sewerage', 'Internet', 'Security'],
            },
            {
                'plot_number': 'C-301',
                'price': '5500000',
                'status': 'available',
                'type': 'Commercial Plot',
                'area': '4 Marla',
                'dimension_x': 25,
                'dimension_y': 60,
                'location': 'Block C, Commercial Area',
                'description': ['Commercial plot', 'High traffic area', 'Ideal for shop or office'],
                'amenities': ['Electricity', 'Water Supply', 'Sewerage', 'Internet', 'Parking'],
            },
        ]
        
        added_count = 0
        
        # Add plots for each society
        for society in societies:
            society_id = str(society['_id'])
            society_name = society.get('society_name') or society.get('name', 'Unknown')
            
            print(f"\n📍 Adding plots for society: {society_name} (ID: {society_id})")
            
            # Check if plots already exist for this society
            existing_plots = plots_col.count_documents({'societyId': society_id})
            
            if existing_plots > 0:
                print(f"   ⚠️  Society already has {existing_plots} plots. Skipping...")
                continue
            
            # Add sample plots for this society
            for plot_data in sample_plots:
                plot_doc = {
                    'plot_number': plot_data['plot_number'],
                    'societyId': society_id,
                    'price': plot_data['price'],
                    'status': plot_data['status'],
                    'type': plot_data['type'],
                    'area': plot_data['area'],
                    'dimension_x': plot_data['dimension_x'],
                    'dimension_y': plot_data['dimension_y'],
                    'location': plot_data['location'],
                    'description': plot_data['description'],
                    'amenities': plot_data['amenities'],
                    'image': None,
                    'seller': {},
                    'created_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow()
                }
                
                result = plots_col.insert_one(plot_doc)
                print(f"   ✅ Added plot: {plot_data['plot_number']} - {plot_data['status']}")
                added_count += 1
        
        print(f"\n🎉 Successfully added {added_count} plots to the database!")
        print(f"📊 Total plots in database: {plots_col.count_documents({})}")
        
    except Exception as e:
        print(f"❌ Error adding sample plots: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    print("=" * 60)
    print("Adding Sample Plots to Database")
    print("=" * 60)
    add_sample_plots()
    print("=" * 60)
