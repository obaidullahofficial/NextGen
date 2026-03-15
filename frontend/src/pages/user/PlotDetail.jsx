import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiPhone, FiMapPin, FiDollarSign, FiHome, FiShield, FiCheckCircle } from 'react-icons/fi';
import { HiOutlineDocumentText, HiOutlineTemplate } from 'react-icons/hi';
import { MdOutlineArchitecture } from 'react-icons/md';
import axios from 'axios';
import plotImage from '../../assets/plot.png';
import Navbar from '../../components/user/Navbar';
import Footer from '../../components/user/Footer';

const API_URL = import.meta.env.VITE_API_URL || '$API_URL';

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };
};

// Helper to generate compliance instructions
const generateComplianceInstructions = (rules) => {
  if (!rules) return [];
  
  const instructions = [];
  
  // Basic building requirements
  instructions.push(`Maximum ground coverage allowed is **${rules.max_ground_coverage}%** of total plot area.`);
  
  // Setback requirements
  const setbacks = [];
  if (rules.front_setback) setbacks.push(`${rules.front_setback}ft from front`);
  if (rules.rear_setback) setbacks.push(`${rules.rear_setback}ft from rear`);
  if (rules.side_setback_left) setbacks.push(`${rules.side_setback_left}ft from left side`);
  if (rules.side_setback_right) setbacks.push(`${rules.side_setback_right}ft from right side`);
  
  if (setbacks.length > 0) {
    instructions.push(`Maintain minimum setbacks: ${setbacks.join(', ')}.`);
  }
  
  // Room count requirements
  const roomCounts = [];
  if (rules.bedrooms > 0) roomCounts.push(`${rules.bedrooms} bedroom${rules.bedrooms > 1 ? 's' : ''}`);
  if (rules.bathrooms > 0) roomCounts.push(`${rules.bathrooms} bathroom${rules.bathrooms > 1 ? 's' : ''}`);
  if (rules.livingRooms > 0) roomCounts.push(`${rules.livingRooms} living room${rules.livingRooms > 1 ? 's' : ''}`);
  if (rules.kitchens > 0) roomCounts.push(`${rules.kitchens} kitchen${rules.kitchens > 1 ? 's' : ''}`);
  if (rules.drawingrooms > 0) roomCounts.push(`${rules.drawingrooms} drawing room${rules.drawingrooms > 1 ? 's' : ''}`);
  
  if (roomCounts.length > 0) {
    instructions.push(`Building must include minimum: ${roomCounts.join(', ')}.`);
  }
  
  // Room area requirements
  const roomAreas = [];
  if (rules.bedroom_area > 0) roomAreas.push(`each bedroom at least ${rules.bedroom_area} sq ft`);
  if (rules.bathroom_area > 0) roomAreas.push(`each bathroom at least ${rules.bathroom_area} sq ft`);
  if (rules.livingroom_area > 0) roomAreas.push(`each living room at least ${rules.livingroom_area} sq ft`);
  if (rules.kitchen_area > 0) roomAreas.push(`each kitchen at least ${rules.kitchen_area} sq ft`);
  if (rules.drawingroom_area > 0) roomAreas.push(`each drawing room at least ${rules.drawingroom_area} sq ft`);
  
  if (roomAreas.length > 0) {
    instructions.push(`Room size requirements: ${roomAreas.join(', ')}.`);
  }
  
  // Outdoor space requirements
  const outdoorSpaces = [];
  if (rules.gardens > 0 && rules.garden_area > 0) {
    outdoorSpaces.push(`${rules.gardens} garden${rules.gardens > 1 ? 's' : ''} (${rules.garden_area} sq ft each)`);
  }
  if (rules.carporches > 0 && rules.carporch_area > 0) {
    outdoorSpaces.push(`${rules.carporches} car porch${rules.carporches > 1 ? 'es' : ''} (${rules.carporch_area} sq ft each)`);
  }
  
  if (outdoorSpaces.length > 0) {
    instructions.push(`Outdoor space requirements: ${outdoorSpaces.join(', ')}.`);
  }
  
  // Room connection requirements
  if (rules.roomConnections && rules.roomConnections.length > 0) {
    const connections = rules.roomConnections.map(conn => 
      `${conn.from?.replace('-', ' ')?.toUpperCase()} must connect to ${conn.to?.replace('-', ' ')?.toUpperCase()}`
    ).filter(conn => conn && !conn.includes('undefined'));
    
    if (connections.length > 0) {
      instructions.push(`Room connectivity: ${connections.join(', ')}.`);
    }
  }
  
  // Building type
  if (rules.building_type_allowed) {
    instructions.push(`Only **${rules.building_type_allowed}** building type is permitted.`);
  }
  
  // Additional rules
  if (rules.additional_rules && rules.additional_rules.length > 0) {
    rules.additional_rules.forEach(rule => {
      instructions.push(`${rule}`);
    });
  }
  
  return instructions;
};

const PlotDetail = () => {
  const { societyId, plotId } = useParams();
  const navigate = useNavigate();
  const [plotData, setPlotData] = useState(null);
  const [societyData, setSocietyData] = useState(null);
  const [complianceRules, setComplianceRules] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (plotId && societyId) {
      fetchPlotDetails();
    } else {
      setLoading(false);
    }
  }, [plotId, societyId]);

  const fetchPlotDetails = async () => {
    try {
      setLoading(true);
      console.log('[PlotDetail] Fetching plot:', plotId);
      
      // Fetch plot details
      try {
        console.log('[PlotDetail] Fetching plot:', plotId, 'from URL:', `${API_URL}/plots/${plotId}`);
        const plotResponse = await axios.get(`${API_URL}/plots/${plotId}`);
        console.log('[PlotDetail] Plot response:', plotResponse.data);
        
        // Backend returns plot data directly
        const plot = plotResponse.data;
        
        // Ensure we have the plot data
        if (plot && !plot.error) {
          setPlotData(plot);
          console.log('[PlotDetail] Plot data set:', plot);
        } else {
          console.error('[PlotDetail] No valid plot data received');
          setPlotData(null);
        }

        // Fetch society details if we have a society ID
        const societyIdToUse = plot.societyId || societyId;
        if (societyIdToUse) {
          try {
            const societyResponse = await axios.get(`${API_URL}/society-profiles/${societyIdToUse}`, getAuthHeaders());
            console.log('[PlotDetail] Society response:', societyResponse.data);
            setSocietyData(societyResponse.data.data || societyResponse.data.profile);
          } catch (socError) {
            console.log('[PlotDetail] Society not found or error:', socError.message);
          }
        }

        // Fetch compliance rules for this plot
        try {
          const complianceResponse = await axios.get(`${API_URL}/compliance/plot/${plotId}`, getAuthHeaders());
          console.log('[PlotDetail] Compliance response:', complianceResponse.data);
          if (complianceResponse.data.success) {
            setComplianceRules(complianceResponse.data.data);
          }
        } catch (compError) {
          console.log('[PlotDetail] No compliance rules found:', compError.message);
        }
      } catch (plotError) {
        console.error('[PlotDetail] Error fetching plot:', plotError);
        // Use fallback data if API fails
        setPlotData(null);
      }
      
    } catch (error) {
      console.error('[PlotDetail] General error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sample fallback data
  const samplePlotData = {
    id: plotId || 'FD234',
    societyId: societyId || 'BT-1',
    image: plotImage,
    price: 'PKR 50 Lakh',
    status: 'Available',
    type: 'Residential Plot',
    area: '10 Marla',
    dimension_x: 50, // in ft
    dimension_y: 90, // in ft
    location: 'Bahria Town, Islamabad',
    description: [
      'Located in Bahria Enclave Sector P',
      '10 Marla Residential Plot â€“ Street 13',
      'Possession & Utility Charges Paid',
      'Beautiful View & Prime Location',
      'Reasonable Price & Investment Opportunity',
      'Ideal for those seeking a secure and peaceful environment'
    ],
    seller: {
      name: 'Ali Khan',
      phone: '+92 300 1234567',
      availability: '9:00 AM - 7:00 PM'
    },
    amenities: [
      'Gated Community',
      '24/7 Security',
      'Underground Electricity',
      'Water Supply',
      'Green Parks',
      'Mosque Nearby'
    ]
  };

  const handleGenerateFloorPlan = () => {
    // Pass plot data and compliance rules to floor plan generator
    const navigationState = {
      plotData: {
        id: plotData?._id || plotData?.id || plotId,
        marla_size: plotData?.marla_size,
        plot_dimension_x: plotData?.plot_dimension_x,
        plot_dimension_y: plotData?.plot_dimension_y,
        total_plot_area: plotData?.total_plot_area
      },
      complianceRules: complianceRules,
      fromPlotDetail: true
    };
    
    navigate('/floor-plan/generate', { state: navigationState });
  };

  // Use fetched data or fallback to sample data
  const displayData = plotData ? {
    ...plotData,
    // Ensure consistent field names
    id: plotData._id || plotData.id || plotId,
    area: plotData.marla_size || plotData.area,
    // Ensure description is always an array
    description: Array.isArray(plotData.description) 
      ? plotData.description 
      : (plotData.description ? [plotData.description] : []),
  } : samplePlotData;
  
  console.log('[PlotDetail] Displaying data:', displayData);
  
  // Format price if it exists
  const formattedPrice = displayData.price 
    ? (typeof displayData.price === 'number' ? `PKR ${(displayData.price / 100000).toFixed(1)} Lakh` : displayData.price)
    : 'Contact for Price';

  if (loading) {
    return (
      <div className="bg-white min-h-screen text-[#2F3D57] font-sans">
        <div className="sticky top-0 z-50">
          <Navbar />
        </div>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading plot details...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen text-[#2F3D57] font-sans">
      <div className="sticky top-0 z-50">
        <Navbar />
      </div>

      {/* Container */}
      <div className="w-full max-w-[1500px] mx-auto px-4 py-10">
        {/* Debug indicator - remove in production */}
        {!plotData && (
          <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 rounded text-sm text-yellow-800">
            âš ï¸ Displaying sample data - unable to load plot details
          </div>
        )}
        
        <button 
          onClick={() => navigate(-1)} 
          className="mb-6 flex items-center text-[#ED7600] hover:text-[#d46000]"
        >
          <span className="mr-2">â†</span> Back to Plots
        </button>
        
        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="md:col-span-2 bg-[#F9FAFB] rounded-xl shadow-md p-6 space-y-6">
            {/* Image */}
            <div className="h-[280px] rounded-md overflow-hidden bg-gray-200">
              <img
                src={displayData.image || plotImage}
                alt={`Plot ${displayData.plot_number || plotId}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = plotImage;
                }}
              />
            </div>

            {/* Plot Info */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-[#ED7600] font-semibold text-sm">Plot Number: {displayData.plot_number || displayData.plot_id || plotId}</p>
                <h2 className="text-2xl font-bold">{formattedPrice}</h2>
              </div>
              <div className="text-sm text-gray-600 space-y-4">
                <div>
                  <p className="uppercase text-xs font-medium">Status</p>
                  <p className={`font-semibold text-base ${
                    displayData.status === 'Available' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {displayData.status}
                  </p>
                </div>
                <div>
                  <p className="uppercase text-xs font-medium">Type</p>
                  <p className="font-semibold text-base text-[#2F3D57]">{displayData.type}</p>
                </div>
                <div>
                  <p className="uppercase text-xs font-medium">Plot Size</p>
                  <p className="font-semibold text-base text-[#2F3D57]">{displayData.marla_size || displayData.area}</p>
                </div>
                <div>
                  <p className="uppercase text-xs font-medium">Dimensions</p>
                  <p className="font-semibold text-base text-[#2F3D57]">
                    {displayData.dimension_x} ft Ã— {displayData.dimension_y} ft
                  </p>
                </div>
                {societyData && (
                  <div>
                    <p className="uppercase text-xs font-medium">Society</p>
                    <p className="font-semibold text-base text-[#2F3D57]">{societyData.name}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-lg p-5 text-[#2F3D57]">
              <h3 className="text-[#ED7600] text-xl font-semibold mb-2">Description</h3>
              <ul className="text-sm space-y-2 list-disc list-inside leading-6">
                {(displayData.description || []).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            {/* Compliance Rules Section */}
            {complianceRules && (
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-5 border-l-4 border-orange-500">
                <div className="flex items-center gap-2 mb-4">
                  <FiShield className="text-orange-600 text-2xl" />
                  <h3 className="text-xl font-semibold text-gray-800">Building Guidelines & Instructions</h3>
                </div>
                <p className="text-sm text-gray-600 mb-6">
                  Official building compliance requirements for <span className="font-bold text-orange-600">{complianceRules.marla_size}</span> plots in this society
                </p>
                
                {/* Building Instructions */}
                <div className="bg-white rounded-lg p-5 mb-4">
                  <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <HiOutlineDocumentText className="text-orange-600" />
                    Instructions for Building Construction
                  </h4>
                  <ul className="space-y-2 text-sm leading-relaxed">
                    {generateComplianceInstructions(complianceRules).map((instruction, index) => (
                      <li key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-orange-50 transition-colors">
                        <span className="text-orange-600 flex-shrink-0 mt-1">â€¢</span>
                        <div className="flex-1">
                          <p className="text-gray-700 leading-relaxed">
                            {instruction.split('**').map((part, i) => 
                              i % 2 === 1 ? (
                                <span key={i} className="font-bold text-orange-600">{part}</span>
                              ) : (
                                part
                              )
                            )}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Quick Reference Cards */}
                <div className="bg-white rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <FiCheckCircle className="text-green-600" />
                    Quick Reference - Key Requirements
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
                    <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                      <p className="text-orange-600 font-semibold mb-1">Ground Coverage</p>
                      <p className="text-gray-700 font-bold">{complianceRules.max_ground_coverage}% Max</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <p className="text-blue-600 font-semibold mb-1">Front Setback</p>
                      <p className="text-gray-700 font-bold">{complianceRules.front_setback}' Min</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                      <p className="text-green-600 font-semibold mb-1">Rear Setback</p>
                      <p className="text-gray-700 font-bold">{complianceRules.rear_setback}' Min</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                      <p className="text-purple-600 font-semibold mb-1">Building Type</p>
                      <p className="text-gray-700 font-bold">{complianceRules.building_type_allowed}</p>
                    </div>
                    {(complianceRules.bedrooms > 0 || complianceRules.bathrooms > 0) && (
                      <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                        <p className="text-indigo-600 font-semibold mb-1">Rooms Required</p>
                        <p className="text-gray-700 font-bold">
                          {[complianceRules.bedrooms > 0 && `${complianceRules.bedrooms}BR`, 
                            complianceRules.bathrooms > 0 && `${complianceRules.bathrooms}BA`
                          ].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    )}
                    {complianceRules.roomConnections && complianceRules.roomConnections.length > 0 && (
                      <div className="bg-pink-50 rounded-lg p-3 border border-pink-200">
                        <p className="text-pink-600 font-semibold mb-1">Connections</p>
                        <p className="text-gray-700 font-bold">{complianceRules.roomConnections.length} Rules</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Society Contact */}
            {societyData && (
              <div className="bg-[#F1F3F7] p-5 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold text-[#ED7600] mb-3">Contact Society</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs uppercase text-gray-500">Society Name</p>
                    <p className="font-medium">{societyData.name}</p>
                  </div>
                  {societyData.contact_name && (
                    <div>
                      <p className="text-xs uppercase text-gray-500">Contact Person</p>
                      <p className="font-medium">{societyData.contact_name}</p>
                    </div>
                  )}
                  {societyData.contact_number && (
                    <div>
                      <p className="text-xs uppercase text-gray-500">Phone</p>
                      <div className="flex items-center gap-2">
                        <FiPhone className="text-[#ED7600]" />
                        <p className="font-medium">{societyData.contact_number}</p>
                      </div>
                    </div>
                  )}
                  {societyData.location && (
                    <div>
                      <p className="text-xs uppercase text-gray-500">Location</p>
                      <div className="flex items-center gap-2">
                        <FiMapPin className="text-[#ED7600]" />
                        <p className="font-medium">{societyData.location}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Amenities */}
            {societyData?.amenities && societyData.amenities.length > 0 && (
              <div className="bg-[#F1F3F7] p-5 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold text-[#ED7600] mb-3">Society Amenities</h3>
                <ul className="list-disc list-inside text-sm text-[#2F3D57] space-y-1">
                  {societyData.amenities.map((amenity, index) => (
                    <li key={index}>{amenity}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Buttons Section */}
            <div className="space-y-4">
              <button 
                onClick={handleGenerateFloorPlan}
                className="w-full flex items-center gap-2 justify-center bg-[#ED7600] hover:bg-[#d46000] text-white py-3 rounded-lg text-sm font-medium transition-all shadow-md"
              >
                <MdOutlineArchitecture className="text-xl" />
                Generate Floor Plan
              </button>
              
              {complianceRules && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-green-700">
                    <FiCheckCircle className="text-lg" />
                    <p className="text-xs font-medium">
                      Compliance rules available for this plot size
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PlotDetail;
