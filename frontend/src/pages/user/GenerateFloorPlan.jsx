import React, { useState, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { MdOutlineArrowBack, MdClose } from 'react-icons/md';
import Navbar from '../../components/user/Navbar';
import Footer from '../../components/user/Footer';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Modal Component for Saving the Project
const SaveProjectModal = ({ isOpen, onClose, onSave, projectName, setProjectName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex justify-center items-center">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
          <MdClose size={24} />
        </button>
        <h2 className="text-xl font-bold mb-6 text-center text-[#2F3D57]">Save Your Floor Plan</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-1">
              Project Name
            </label>
            <input
              type="text"
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g., Dream House"
              className="w-full p-3 border rounded-md focus:ring-2 focus:ring-[#ED7600] focus:border-transparent transition"
            />
          </div>
          <button
            onClick={onSave}
            disabled={!projectName.trim()}
            className="w-full bg-[#ED7600] hover:bg-[#d46000] text-white py-3 rounded-lg font-medium transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Save as PDF
          </button>
        </div>
      </div>
    </div>
  );
};


const GenerateFloorPlan = () => {
  const { societyId, plotId } = useParams();
  const location = useLocation();
//  const navigate = useNavigate();

  const { plotDimensions } = location.state || { plotDimensions: { x: 30, y: 60 } };
  
  const [constraints, setConstraints] = useState({
    plotX: plotDimensions.x,
    plotY: plotDimensions.y,
    bedrooms: 3,
    bathrooms: 2,
    livingRooms: 1,
    kitchens: 1,
  });

  const [show2DMap, setShow2DMap] = useState(false);
  const [rooms, setRooms] = useState([]);
  
  // State for the save modal
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  
  // Ref for the floor plan container to capture it for PDF
  const floorPlanRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setConstraints(prev => ({
      ...prev,
      [name]: parseInt(value) || 0
    }));
    setShow2DMap(false);
  };
  
  // Simplified room generation for demonstration
  const generateInitialRooms = () => {
     // This function seems complex and specific to your logic, so I'll keep it as is.
     // In a real scenario, you might want a more robust algorithm.
     const newRooms = [];
     const { bedrooms, bathrooms, livingRooms, kitchens } = constraints;

     // Example logic to place rooms in a somewhat organized way
     //let yOffset = 20;

     if (livingRooms > 0) {
        newRooms.push({ id: 'living-1', label: 'Living', type: 'livingroom', x: 130, y: 150 });
     }
     if (kitchens > 0) {
        newRooms.push({ id: 'kitchen-1', label: 'Kitchen', type: 'kitchen', x: 250, y: 250 });
     }
     if (bathrooms > 0) {
        newRooms.push({ id: 'bath-1', label: 'Bath', type: 'bathroom', x: 50, y: 250 });
     }
     if (bedrooms > 0) {
        newRooms.push({ id: 'br-1', label: 'BR1', type: 'bedroom', x: 50, y: 50 });
     }
     if (bedrooms > 1) {
        newRooms.push({ id: 'br-2', label: 'BR2', type: 'bedroom', x: 250, y: 50 });
     }
     // You can add more rooms based on counts
     setRooms(newRooms);
  };


  const handleView2DMap = () => {
    generateInitialRooms();
    setShow2DMap(true);
  };

  const openSaveModal = () => {
    if (!show2DMap) {
      alert("Please generate the map first before saving!");
      return;
    }
    setIsSaveModalOpen(true);
  };

  const handleSaveAsPdf = () => {
    if (!projectName.trim() || !floorPlanRef.current) return;

    const input = floorPlanRef.current;
    
    html2canvas(input, { scale: 2 }) // Increase scale for better quality
      .then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [canvas.width, canvas.height]
        });
        
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`${projectName}.pdf`);
        
        // Close modal and reset
        setIsSaveModalOpen(false);
        setProjectName('');
      })
      .catch(err => {
        console.error("Could not generate PDF", err);
        alert("Sorry, an error occurred while generating the PDF.");
      });
  };

  const loadLayout = () => {
    const savedLayout = localStorage.getItem(`floorPlanLayout-${societyId}-${plotId}`);
    if (savedLayout) {
      const { constraints: savedConstraints, rooms: savedRooms } = JSON.parse(savedLayout);
      setConstraints(savedConstraints);
      setRooms(savedRooms);
      setShow2DMap(true);
      alert('Layout loaded successfully!');
    } else {
      alert('No saved layout found for this plot.');
    }
  };


  return (
    <>
      <SaveProjectModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSaveAsPdf}
        projectName={projectName}
        setProjectName={setProjectName}
      />
      <div className="bg-white min-h-screen text-[#2F3D57] font-sans">
        <div className="sticky top-0 z-40">
          <Navbar />
        </div>

        <div className="w-full max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-[#2F3D57]">Floor Plan Generator</h1>
            <div className="flex gap-4">
              <button
                onClick={openSaveModal}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-all"
              >
                Save Layout
              </button>
              <button
                onClick={loadLayout}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition-all"
              >
                Load Layout
              </button>
            </div>
          </div>
          
          <div className="bg-[#F9FAFB] rounded-xl shadow-lg p-8">
            <div className="flex items-center mb-6">
                <div className="bg-[#ED7600] text-white rounded-full h-8 w-8 flex items-center justify-center font-bold text-lg">1</div>
                <h2 className="text-xl font-bold ml-4">Define Constraints</h2>
            </div>
            
            {/* Main Grid */}
            <div className="grid lg:grid-cols-2 gap-10">
              {/* Left Side - Constraints */}
              <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
                  <h3 className="text-lg font-semibold mb-4 border-b pb-2">Map Constraints</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                          <label className="block text-sm font-medium mb-1">Plot X Dimension (ft)</label>
                          <input type="number" name="plotX" value={constraints.plotX} onChange={handleInputChange} className="w-full p-2 border rounded-md"/>
                      </div>
                      <div>
                          <label className="block text-sm font-medium mb-1">Plot Y Dimension (ft)</label>
                          <input type="number" name="plotY" value={constraints.plotY} onChange={handleInputChange} className="w-full p-2 border rounded-md"/>
                      </div>
                      <div>
                          <label className="block text-sm font-medium mb-1">Bedrooms</label>
                          <input type="number" name="bedrooms" value={constraints.bedrooms} onChange={handleInputChange} className="w-full p-2 border rounded-md"/>
                      </div>
                      <div>
                          <label className="block text-sm font-medium mb-1">Living Rooms</label>
                          <input type="number" name="livingRooms" value={constraints.livingRooms} onChange={handleInputChange} className="w-full p-2 border rounded-md"/>
                      </div>
                      <div>
                          <label className="block text-sm font-medium mb-1">Bathrooms</label>
                          <input type="number" name="bathrooms" value={constraints.bathrooms} onChange={handleInputChange} className="w-full p-2 border rounded-md"/>
                      </div>
                      <div>
                          <label className="block text-sm font-medium mb-1">Kitchens</label>
                          <input type="number" name="kitchens" value={constraints.kitchens} onChange={handleInputChange} className="w-full p-2 border rounded-md"/>
                      </div>
                  </div>
                  <button onClick={handleView2DMap} className="w-full mt-4 bg-[#ED7600] hover:bg-[#d46000] text-white py-3 rounded-lg font-semibold transition-all">
                    Generate Map
                  </button>
              </div>

              {/* Right Side - Room Relationships */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold mb-4 border-b pb-2">Room Relationships</h3>
                   <div ref={floorPlanRef} className="relative w-full h-96 bg-gray-50 border-2 border-dashed rounded-lg flex items-center justify-center">
                      {show2DMap ? (
                          <div className="w-full h-full relative">
                              {/* Central Living Room */}
                              {rooms.find(r => r.type === 'livingroom') && <div className="absolute w-20 h-20 bg-green-300 rounded-full flex items-center justify-center" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>LIVING</div>}
                              
                              {/* Other rooms positioned around */}
                              {rooms.find(r => r.id === 'br-1') && <div className="absolute w-16 h-16 bg-purple-300 rounded-full flex items-center justify-center" style={{ left: '20%', top: '20%' }}>BR1</div>}
                              {rooms.find(r => r.id === 'br-2') && <div className="absolute w-16 h-16 bg-purple-300 rounded-full flex items-center justify-center" style={{ right: '20%', top: '20%' }}>BR2</div>}
                              {rooms.find(r => r.id === 'bath-1') && <div className="absolute w-14 h-14 bg-yellow-300 rounded-full flex items-center justify-center" style={{ left: '30%', bottom: '20%' }}>BATH</div>}
                              {rooms.find(r => r.id === 'kitchen-1') && <div className="absolute w-14 h-14 bg-red-300 rounded-full flex items-center justify-center" style={{ right: '30%', bottom: '20%' }}>KITCHEN</div>}
                              
                              {/* Lines connecting rooms (This is a simplified representation) */}
                              <svg className="absolute w-full h-full top-0 left-0" style={{ zIndex: -1 }}>
                                <line x1="57%" y1="55%" x2="26%" y2="28%" stroke="gray" strokeWidth="2" />
                                <line x1="60%" y1="55%" x2="75%" y2="28%" stroke="gray" strokeWidth="2" />
                                <line x1="55%" y1="60%" x2="35%" y2="78%" stroke="gray" strokeWidth="2" />
                                <line x1="60%" y1="60%" x2="70%" y2="78%" stroke="gray" strokeWidth="2" />
                              </svg>

                          </div>
                      ) : (
                        <p className="text-gray-400">Your map will be generated here</p>
                      )}
                   </div>
                   <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4">
                      <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-purple-400 mr-2"></div>Bedroom</div>
                      <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-green-400 mr-2"></div>Living Room</div>
                      <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-red-400 mr-2"></div>Kitchen</div>
                      <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></div>Bathroom</div>
                   </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default GenerateFloorPlan;
