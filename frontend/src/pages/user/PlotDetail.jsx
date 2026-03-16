import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiPhone, FiMapPin, FiDollarSign, FiHome, FiShield, FiCheckCircle, FiEye, FiDownload, FiX } from 'react-icons/fi';
import { HiOutlineDocumentText, HiOutlineTemplate } from 'react-icons/hi';
import { MdOutlineArchitecture } from 'react-icons/md';
import axios from 'axios';
import plotImage from '../../assets/plot.png';
import Navbar from '../../components/user/Navbar';
import Footer from '../../components/user/Footer';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
  const [showPdfViewer, setShowPdfViewer] = useState(false);

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
      '10 Marla Residential Plot – Street 13',
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

  const parseApprovedFloorplanJson = () => {
    if (!displayData?.json_template) {
      return null;
    }

    try {
      const parsed = typeof displayData.json_template === 'string'
        ? JSON.parse(displayData.json_template)
        : displayData.json_template;

      const floorData = parsed.floor_plan_data || parsed.floorPlanData || parsed;

      return {
        ...parsed,
        ...floorData,
        rooms: parsed.room_data || floorData.rooms || parsed.rooms || [],
        walls: floorData.walls || parsed.walls || [],
        doors: floorData.doors || parsed.doors || [],
        windows: floorData.windows || parsed.windows || [],
        mapData: floorData.mapData || parsed.mapData || [],
        plotWidth: floorData.plotWidth || parsed.plotWidth || 1000,
        plotHeight: floorData.plotHeight || parsed.plotHeight || 1000,
        actualLength: floorData.actualLength || parsed.actualLength || Number(displayData.dimension_x) || 55,
        actualWidth: floorData.actualWidth || parsed.actualWidth || Number(displayData.dimension_y) || 25,
      };
    } catch (error) {
      console.error('[PlotDetail] Failed to parse approved floorplan JSON:', error);
      return null;
    }
  };

  const handleViewApprovedFloorplan = () => {
    const floorPlan = parseApprovedFloorplanJson();
    if (!floorPlan) {
      alert('Approved floorplan JSON is not available or invalid.');
      return;
    }

    navigate('/floor-plan/customize', {
      state: {
        floorPlan,
        fromPlotDetail: true
      }
    });
  };

  const handleDownloadPdf = () => {
    if (!displayData?.pdf_template) return;

    const link = document.createElement('a');
    link.href = displayData.pdf_template;
    link.download = `approved-floorplan-${displayData.plot_number || plotId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const hasApprovedFloorplanJson = Boolean(displayData?.json_template);
  const hasApprovedFloorplanPdf = Boolean(displayData?.pdf_template);
  
  console.log('[PlotDetail] Displaying data:', displayData);
  
  // Format price if it exists
  const formattedPrice = displayData.price 
    ? (typeof displayData.price === 'number' ? `PKR ${(displayData.price / 100000).toFixed(1)} Lakh` : displayData.price)
    : 'Contact for Price';

  if (loading) {
    return (
      <div className="bg-white min-h-screen text-[#2F3D57] font-sans flex flex-col">
        <div className="sticky top-0 z-50">
          <Navbar />
        </div>
        <div className="flex-grow flex items-center justify-center">
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
    <div className="bg-white min-h-screen text-[#2F3D57] font-sans flex flex-col">
      <div className="sticky top-0 z-50">
        <Navbar />
      </div>

      {/* Dashboard Container Wrapper */}
      <div className="w-full max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow bg-gray-50/50">
        
        {/* Debug indicator */}
        {!plotData && (
           <div className="mb-6 p-4 bg-yellow-100 border border-yellow-300 rounded-xl text-sm text-yellow-800 flex items-center gap-3">
             <span className="text-xl">⚠️</span> 
             <span className="font-medium">Displaying sample data - unable to load plot details from server.</span>
           </div>
        )}

        {/* Dashboard Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                Plot {displayData.plot_number || displayData.plot_id || plotId}
              </h1>
              <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                displayData.status === 'Available' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'
              }`}>
                {displayData.status}
              </span>
            </div>
            <p className="text-gray-500 flex items-center gap-2 font-medium">
              <FiMapPin className="text-[#ED7600] text-lg" />
              {societyData ? `${societyData.name}${societyData.location ? `, ${societyData.location}` : ''}` : 'Location details unavailable'}
            </p>
          </div>
          
          <div className="flex items-center">
            <div className="bg-orange-50 px-6 py-3 border border-orange-100 rounded-xl text-right">
              <span className="text-xs text-orange-600 font-bold uppercase tracking-wider mb-1 block">Asking Price</span>
              <span className="text-2xl font-black text-[#ED7600]">{formattedPrice}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN - MAIN INFO (8 Cols) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Image & Quick Stats Banner */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="h-[350px] md:h-[450px] rounded-xl overflow-hidden bg-gray-100 relative group">
                <img
                  src={displayData.image || plotImage}
                  alt={`Plot ${displayData.plot_number || plotId}`}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = plotImage;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent opacity-80"></div>
                <div className="absolute bottom-6 left-6 flex gap-3">
                  <div className="bg-black/40 backdrop-blur-md text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 border border-white/20">
                    <FiHome className="text-lg" /> {displayData.type}
                  </div>
                  <div className="bg-[#ED7600]/90 backdrop-blur-md text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg border border-orange-400">
                    {displayData.marla_size || displayData.area}
                  </div>
                </div>
              </div>

              {/* Key Dimensions Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-orange-50 transition-colors">
                  <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Plot Size</p>
                  <p className="text-lg font-extrabold text-gray-900">{displayData.marla_size || displayData.area}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-orange-50 transition-colors">
                  <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Dimensions</p>
                  <p className="text-lg font-extrabold text-gray-900">{displayData.dimension_x}' × {displayData.dimension_y}'</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-orange-50 transition-colors">
                  <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Property Type</p>
                  <p className="text-lg font-extrabold text-gray-900 truncate">{displayData.type}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-orange-50 transition-colors">
                  <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Compliance</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    {complianceRules ? (
                      <span className="text-green-600 bg-green-100 px-2 py-0.5 rounded text-sm font-bold flex items-center gap-1 w-max"><FiCheckCircle /> Verified</span>
                    ) : (
                      <span className="text-gray-500 bg-gray-200 px-2 py-0.5 rounded text-sm font-bold flex items-center gap-1 w-max"><FiX /> Pending</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Description Card */}
            {displayData.description && displayData.description.length > 0 && (
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3 pb-4 border-b border-gray-100">
                   <div className="p-2 bg-orange-100 rounded-lg text-[#ED7600]">
                     <HiOutlineDocumentText className="text-2xl" /> 
                   </div>
                   Overview & Features
                </h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayData.description.map((item, index) => (
                    <li key={index} className="flex flex-start gap-3 text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <FiCheckCircle className="text-[#ED7600] text-lg flex-shrink-0 mt-0.5" />
                      <span className="leading-relaxed font-medium text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Compliance Rules Dashboard Style */}
            {complianceRules && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-[#2F3D57] to-[#1f2b40] p-8 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
                     <MdOutlineArchitecture className="text-9xl" />
                  </div>
                  <div className="relative z-10 flex items-center gap-4 mb-2">
                    <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                      <FiShield className="text-orange-400 text-3xl" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">Building Regulations</h3>
                      <p className="text-sm text-gray-300 font-medium mt-1">Official construction constraints for {complianceRules.marla_size} plots</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-8 bg-gray-50/50">
                  {/* Quick Reference Mini Cards */}
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Crucial Constraints</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                      <p className="text-xs text-gray-500 font-bold mb-1">Max Ground Coverage</p>
                      <p className="text-2xl font-black text-gray-900">{complianceRules.max_ground_coverage}%</p>
                    </div>
                    <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                      <p className="text-xs text-gray-500 font-bold mb-1">Front Setback</p>
                      <p className="text-2xl font-black text-gray-900">{complianceRules.front_setback} ft</p>
                    </div>
                    <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                      <p className="text-xs text-gray-500 font-bold mb-1">Rear Setback</p>
                      <p className="text-2xl font-black text-gray-900">{complianceRules.rear_setback} ft</p>
                    </div>
                    <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                      <p className="text-xs text-gray-500 font-bold mb-1">Building Type</p>
                      <p className="text-base font-black text-gray-900 truncate" title={complianceRules.building_type_allowed}>{complianceRules.building_type_allowed}</p>
                    </div>
                  </div>

                  {/* Detailed Instructions */}
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Detailed Instructions</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {generateComplianceInstructions(complianceRules).map((instruction, index) => (
                      <div key={index} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-orange-100 shadow-sm hover:border-orange-300 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-orange-600 font-bold text-sm">{index + 1}</span>
                        </div>
                        <p className="text-sm text-gray-700 font-medium">
                          {instruction.split('**').map((part, i) => 
                              i % 2 === 1 ? <span key={i} className="font-bold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded mx-0.5">{part}</span> : part
                            )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* RIGHT COLUMN - SIDEBAR (4 Cols) */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Action Center */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-28">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 pb-4 border-b border-gray-100">
                <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                  <HiOutlineTemplate className="text-xl" /> 
                </div>
                Architectural Actions
              </h3>
              
              <div className="space-y-4">
                <button 
                  onClick={handleGenerateFloorPlan}
                  className="w-full flex items-center justify-between group bg-[#ED7600] hover:bg-[#d46000] text-white py-4 px-5 rounded-xl font-bold transition-all shadow-md shadow-orange-200"
                >
                  <span className="flex items-center gap-3"><MdOutlineArchitecture className="text-2xl" /> Generate Floor Plan</span>
                  <span className="bg-white/20 p-1.5 rounded-lg group-hover:translate-x-1 transition-transform">→</span>
                </button>

                <button
                  onClick={handleViewApprovedFloorplan}
                  disabled={!hasApprovedFloorplanJson}
                  className={`w-full flex items-center justify-between py-4 px-5 rounded-xl font-bold transition-all shadow-sm ${
                    hasApprovedFloorplanJson
                      ? 'bg-[#2F3D57] hover:bg-[#1f2b40] text-white'
                      : 'bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-200'
                  }`}
                >
                  <span className="flex items-center gap-3"><FiEye className="text-xl" /> View Base Template</span>
                  {hasApprovedFloorplanJson && <FiCheckCircle className="text-green-400" />}
                </button>

                <button
                  onClick={handleDownloadPdf}
                  disabled={!hasApprovedFloorplanPdf}
                  className={`w-full flex items-center justify-between py-4 px-5 rounded-xl font-bold transition-all shadow-sm ${
                    hasApprovedFloorplanPdf
                      ? 'bg-white border-2 border-green-600 text-green-700 hover:bg-green-50'
                      : 'bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-200'
                  }`}
                >
                  <span className="flex items-center gap-3"><FiDownload className="text-xl" /> Download PDF Map</span>
                  {hasApprovedFloorplanPdf && <FiCheckCircle className="text-green-600" />}
                </button>

                {(!hasApprovedFloorplanJson || !hasApprovedFloorplanPdf) && (
                  <div className="mt-6 p-4 bg-amber-50 border border-amber-100 text-amber-800 rounded-xl text-sm font-medium leading-relaxed flex gap-3">
                    <span className="text-amber-500 text-lg mt-0.5">⚠️</span>
                    <p>Specific approved template files have not been uploaded for this block yet.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Society Details Card */}
            {societyData && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 pb-4 border-b border-gray-100">
                   <div className="p-1.5 bg-gray-100 rounded-lg text-gray-600">
                     <FiMapPin className="text-xl" /> 
                   </div>
                   Society Details
                </h3>
                
                <div className="space-y-4">
                  <div className="pb-4 border-b border-gray-50 flex justify-between gap-4">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Estate</p>
                    <p className="font-bold text-gray-900 text-right">{societyData.name}</p>
                  </div>
                  
                  {societyData.contact_name && (
                    <div className="pb-4 border-b border-gray-50 flex justify-between gap-4">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Contact</p>
                      <div className="flex items-center gap-2 text-gray-900 font-bold bg-gray-50 px-3 py-1.5 rounded-lg">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">
                          {societyData.contact_name.charAt(0).toUpperCase()}
                        </div>
                        {societyData.contact_name}
                      </div>
                    </div>
                  )}
                  
                  {societyData.contact_number && (
                    <div className="pb-4 border-b border-gray-50 flex justify-between gap-4">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Phone</p>
                      <a href={`tel:${societyData.contact_number}`} className="flex items-center gap-2 text-[#ED7600] font-bold hover:underline">
                        <FiPhone /> {societyData.contact_number}
                      </a>
                    </div>
                  )}
                  
                  {societyData.location && (
                    <div className="pt-2">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Address</p>
                      <p className="text-gray-700 text-sm leading-relaxed font-medium bg-gray-50 p-3 rounded-lg border border-gray-100">{societyData.location}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Amenities */}
            {societyData?.amenities && societyData.amenities.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-5 pb-4 border-b border-gray-100">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {societyData.amenities.map((amenity, index) => (
                    <span key={index} className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors cursor-default">
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PlotDetail;