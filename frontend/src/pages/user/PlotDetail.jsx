import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiPhone } from 'react-icons/fi';
import { HiOutlineDocumentText, HiOutlineTemplate } from 'react-icons/hi';
import { MdOutlineArchitecture } from 'react-icons/md';
import plotImage from '../../assets/plot.png';
import Navbar from '../../components/user/Navbar';
import Footer from '../../components/user/Footer';

const PlotDetail = () => {
  const { societyId, plotId } = useParams();
  const navigate = useNavigate();

  // Sample data - replace with API call using societyId and plotId
  const plotData = {
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
    navigate(`/generate-floor-plan/${societyId}/${plotId}`);
  };


  const handleViewCompliance = () => {
    navigate(`/societies/${societyId}/compliance`);
  };

  const handleViewTemplates = () => {
    navigate(`/societies/${societyId}/templates`);
  };

  //const handleViewTemplates = () => {
    //navigate(`/societies/${societyId}/templates`);
  //};

  return (
    <div className="bg-white min-h-screen text-[#2F3D57] font-sans">
      <div className="sticky top-0 z-50">
        <Navbar />
      </div>

      {/* Container */}
      <div className="w-full max-w-[1500px] mx-auto px-4 py-10">
        <button 
          onClick={() => navigate(-1)} 
          className="mb-6 flex items-center text-[#ED7600] hover:text-[#d46000]"
        >
          <span className="mr-2">←</span> Back to Plots
        </button>
        
        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="md:col-span-2 bg-[#F9FAFB] rounded-xl shadow-md p-6 space-y-6">
            {/* Image */}
            <div className="h-[280px] rounded-md overflow-hidden bg-gray-200">
              <img
                src={plotData.image}
                alt={`Plot ${plotData.id}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/400x220?text=Plot+Image";
                }}
              />
            </div>

            {/* Plot Info */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-[#ED7600] font-semibold text-sm">Plot ID: {plotData.id}</p>
                <h2 className="text-2xl font-bold">{plotData.price}</h2>
              </div>
              <div className="text-sm text-gray-600 space-y-4">
                <div>
                  <p className="uppercase text-xs font-medium">Status</p>
                  <p className={`font-semibold text-base ${
                    plotData.status === 'Available' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {plotData.status}
                  </p>
                </div>
                <div>
                  <p className="uppercase text-xs font-medium">Type</p>
                  <p className="font-semibold text-base text-[#2F3D57]">{plotData.type}</p>
                </div>
                <div>
                  <p className="uppercase text-xs font-medium">Area</p>
                  <p className="font-semibold text-base text-[#2F3D57]">{plotData.area}</p>
                </div>
                <div>
                  <p className="uppercase text-xs font-medium">Dimensions</p>
                  <p className="font-semibold text-base text-[#2F3D57]">
                    {plotData.dimension_x} ft x {plotData.dimension_y} ft
                  </p>
                </div>
                <div>
                  <p className="uppercase text-xs font-medium">Location</p>
                  <p className="font-semibold text-base text-[#2F3D57]">{plotData.location}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-lg p-5 text-[#2F3D57]">
              <h3 className="text-[#ED7600] text-xl font-semibold mb-2">Description</h3>
              <ul className="text-sm space-y-2 list-disc list-inside leading-6">
                {plotData.description.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Seller Contact */}
            <div className="bg-[#F1F3F7] p-5 rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold text-[#ED7600] mb-3">Contact Seller</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs uppercase text-gray-500">Name</p>
                  <p className="font-medium">{plotData.seller.name}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500">Phone</p>
                  <div className="flex items-center gap-2">
                    <FiPhone className="text-[#ED7600]" />
                    <p className="font-medium">{plotData.seller.phone}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500">Available</p>
                  <p className="font-medium">{plotData.seller.availability}</p>
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div className="bg-[#F1F3F7] p-5 rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold text-[#ED7600] mb-3">Amenities</h3>
              <ul className="list-disc list-inside text-sm text-[#2F3D57] space-y-1">
                {plotData.amenities.map((amenity, index) => (
                  <li key={index}>{amenity}</li>
                ))}
              </ul>
            </div>

            {/* Buttons Section */}
            <div className="space-y-4">
              <button 
                onClick={handleGenerateFloorPlan}
                className="w-full flex items-center gap-2 justify-center bg-[#ED7600] hover:bg-[#d46000] text-white py-2.5 rounded-lg text-sm font-medium transition-all"
              >
                <MdOutlineArchitecture className="text-lg" />
                Generate Floor Plan
              </button>
              <button 
                onClick={handleViewCompliance}
                className="w-full flex items-center gap-2 justify-center bg-[#2F3D57] hover:bg-[#1f2c42] text-white py-2.5 rounded-lg text-sm font-medium transition-all"
              >
                <HiOutlineDocumentText className="text-lg" />
                Compliance Rules
              </button>
              <button
                onClick={handleViewTemplates}
                className="w-full flex items-center gap-2 justify-center bg-[#ED7600] hover:bg-[#d46000] text-white py-2.5 rounded-lg text-sm font-medium transition-all"
              >
                <HiOutlineTemplate className="text-lg" />
                Approved Templates
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PlotDetail;