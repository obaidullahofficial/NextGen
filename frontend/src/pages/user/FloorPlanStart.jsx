import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/user/Navbar';
import Footer from '../../components/user/Footer';
import TemplateGallery from '../../components/user/TemplateGallery';
import { MdOutlineArrowBack } from 'react-icons/md';

const FloorPlanStart = () => {
  const { societyId, plotId } = useParams();
  const navigate = useNavigate();

  const handleSelectTemplate = (template) => {
    // Store template data and navigate to customization page directly
    localStorage.setItem('currentFloorPlan', JSON.stringify({
      id: template._id,
      _id: template._id,
      projectName: template.template_name || template.project_name,
      rooms: template.room_data || template.floor_plan_data?.rooms || [],
      walls: template.floor_plan_data?.walls || [],
      doors: template.floor_plan_data?.doors || [],
      plotDimensions: template.dimensions || { width: template.plot_x || 1000, height: template.plot_y || 1000 },
      mapData: template.floor_plan_data?.mapData || [],
      constraints: template.constraints || {},
      isTemplate: true,
      templateName: template.template_name
    }));
    navigate('/floor-plan/customize');
  };

  const handleGenerateNew = () => {
    // Clear any previous template and go to generate
    localStorage.removeItem('selectedTemplate');
    navigate(`/user/society/${societyId}/plot/${plotId}/generate`, {
      state: { useTemplate: false }
    });
  };

  const handleBack = () => {
    navigate(`/user/society/${societyId}/plots`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <div className="flex-grow container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <MdOutlineArrowBack size={20} />
          <span>Back to Plots</span>
        </button>

        <TemplateGallery
          societyId={societyId}
          onSelectTemplate={handleSelectTemplate}
          onGenerateNew={handleGenerateNew}
        />
      </div>

      <Footer />
    </div>
  );
};

export default FloorPlanStart;
