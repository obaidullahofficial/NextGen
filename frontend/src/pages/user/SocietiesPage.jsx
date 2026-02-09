import React, { useEffect, useState } from 'react';
import Navbar from '../../components/user/Navbar';
import Footer from '../../components/user/Footer';
import { FaMapMarkerAlt, FaHome, FaStar, FaChevronRight, FaSearch, FaFilter } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { getAllSocietyProfiles } from '../../services/societyService.js';

import societiesImg from '../../assets/societies.png';

const Societies = () => {
  const navigate = useNavigate();
  const [societies, setSocieties] = useState([]);
  const [filteredSocieties, setFilteredSocieties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('name');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchSocieties = async () => {
      try {
        const response = await getAllSocietyProfiles();
        setSocieties(response.data || []);
        setFilteredSocieties(response.data || []);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch societies:', error);
        setSocieties([]);
        setFilteredSocieties([]);
        setLoading(false);
      }
    };

    fetchSocieties();
  }, []);

  useEffect(() => {
    let filtered = [...societies];

    if (searchTerm.trim()) {
      filtered = filtered.filter(society => {
        if (filterType === 'name') {
          return society.name?.toLowerCase().includes(searchTerm.toLowerCase());
        } else if (filterType === 'city') {
          return society.location?.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return true;
      });
    }

    setFilteredSocieties(filtered);
  }, [searchTerm, filterType, societies]);

  return (
    <div className="min-h-screen flex flex-col bg-[#2F3D57] text-white">
      <div className="sticky top-0 z-50">
        <Navbar />
      </div>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
              <div className="md:w-1/2 space-y-6 md:space-y-8">
                <h1 className="text-4xl md:text-6xl font-bold text-[#ED7600] leading-tight">
                  Discover Your Dream Society
                </h1>
                <p className="text-lg md:text-xl text-gray-200 leading-relaxed">
                  Explore premium housing societies with world-class amenities and perfect locations
                </p>
                
                {/* Search Bar */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/20 shadow-xl">
                  <div className="flex items-center gap-3">
                    {/* Search Input */}
                    <div className="flex-1 relative">
                      <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60" />
                      <input
                        type="text"
                        value={filterType === 'rating' ? '' : searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search societies..."
                        disabled={filterType === 'rating'}
                        className="w-full pl-12 pr-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#ED7600] focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                    
                    {/* Filter Button with Dropdown */}
                    <div className="relative">
                      <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className="p-3 bg-[#ED7600] hover:bg-[#d96b00] rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                      >
                        <FaFilter className="text-white text-lg" />
                      </button>
                      
                      {/* Dropdown Menu */}
                      {showFilters && (
                        <div className="absolute right-0 mt-2 w-48 bg-[#2F3D57] rounded-xl shadow-2xl border border-white/20 overflow-hidden z-10 animate-fadeIn">
                          <button
                            onClick={() => {
                              setFilterType('name');
                              setSearchTerm('');
                              setMinRating(0);
                              setShowFilters(false);
                            }}
                            className={`w-full px-4 py-3 text-left text-white hover:bg-[#ED7600] transition-colors ${filterType === 'name' ? 'bg-[#ED7600]' : ''}`}
                          >
                            Society Name
                          </button>
                          <button
                            onClick={() => {
                              setFilterType('city');
                              setSearchTerm('');
                              setMinRating(0);
                              setShowFilters(false);
                            }}
                            className={`w-full px-4 py-3 text-left text-white hover:bg-[#ED7600] transition-colors ${filterType === 'city' ? 'bg-[#ED7600]' : ''}`}
                          >
                            City/Location
                          </button>
                          {/* Rating filter removed */}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Rating slider removed */}
                </div>
              </div>
              
              <div className="md:w-1/2">
                <div className="relative">
                  <img
                    src={societiesImg}
                    alt="Societies"
                    className="rounded-2xl shadow-2xl w-full max-h-[400px] md:max-h-[500px] object-cover border-2 border-white/20"
                  />
                  <div className="absolute -bottom-3 -right-3 w-16 h-16 md:w-24 md:h-24 bg-[#ED7600] rounded-xl opacity-20"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Societies Cards Section */}
        <section className="container mx-auto px-4 md:px-6 pb-16 md:pb-24">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 md:mb-6">Choose Your Perfect Society</h2>
            <div className="w-20 md:w-24 h-1 bg-[#ED7600] mx-auto rounded-full"></div>
          </div>
          
          {loading ? (
            <div className="text-center text-lg text-gray-200">Loading societies...</div>
          ) : (
            <div className="space-y-8 md:space-y-12">
              {Array.isArray(filteredSocieties) && filteredSocieties.length > 0 ? (
                filteredSocieties.map((society) => (
                  <div
                    key={society._id}
                    className="bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-white/20"
                  >
                    <div className="flex flex-col lg:flex-row">
                      {/* Image Section */}
                      <div className="lg:w-2/5 relative overflow-hidden">
                        <img
                          src={society.society_logo || societiesImg}
                          alt={society.name || 'Society'}
                          className="w-full h-64 md:h-80 lg:h-full object-cover transition-transform duration-700 hover:scale-105"
                          onError={(e) => {
                            e.target.src = societiesImg;
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                        {/* Price Badge */}
                        <div className="absolute bottom-4 md:bottom-6 left-4 md:left-6 bg-[#ED7600]/90 backdrop-blur-sm rounded-full px-3 py-1 md:px-4 md:py-2 shadow-lg">
                          <span className="text-white font-bold text-sm md:text-base">
                            {society.price_range || 'Price on request'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Content Section */}
                      <div className="lg:w-3/5 p-6 md:p-8 lg:p-10">
                        <div className="space-y-4 md:space-y-6">
                          <div className="space-y-2 md:space-y-3">
                            <h3 className="text-2xl md:text-3xl font-bold text-white hover:text-[#ED7600] transition-colors duration-300">
                              {society.name}
                            </h3>
                            <p className="text-gray-200 leading-relaxed text-base md:text-lg">
                              {society.description}
                            </p>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                            <div className="bg-white/5 rounded-xl p-3 md:p-4 border border-white/10 hover:bg-white/10 transition-colors">
                              <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
                                <FaMapMarkerAlt className="text-[#ED7600] text-base md:text-lg" />
                                <span className="text-gray-300 font-medium">Location</span>
                              </div>
                              <span className="text-white font-bold">{society.location}</span>
                            </div>
                            <div className="bg-white/5 rounded-xl p-3 md:p-4 border border-white/10 hover:bg-white/10 transition-colors">
                              <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
                                <FaHome className="text-[#ED7600] text-base md:text-lg" />
                                <span className="text-gray-300 font-medium">Total Plots</span>
                              </div>
                              <span className="text-white font-bold">{society.totalPlots || 0} plots</span>
                            </div>
                            <div className="bg-white/5 rounded-xl p-3 md:p-4 border border-white/10 hover:bg-white/10 transition-colors">
                              <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
                                <FaStar className="text-[#ED7600] text-base md:text-lg" />
                                <span className="text-gray-300 font-medium">Available</span>
                              </div>
                              <span className="text-white font-bold">{society.availablePlots || 0} plots</span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-3 md:pt-4">
                            <button 
                              onClick={() => navigate(`/societies/${society._id}/plots`)}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 md:px-6 md:py-4 bg-[#ED7600] hover:bg-[#d96b00] text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                            >
                              View Plots
                              <FaChevronRight className="text-sm" />
                            </button>
                            <button 
                              className="flex-1 px-4 py-3 md:px-6 md:py-4 border-2 border-white/30 hover:border-[#ED7600] hover:bg-[#ED7600]/10 text-white font-bold rounded-xl transition-all duration-300"
                            >
                              Learn More
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-lg text-gray-200">
                  No societies available at the moment.
                </div>
              )}
            </div>
          )}
        </section>

        {/* Call to Action Section */}
        <section className="py-12 md:py-20 bg-white/5 border-t border-white/20">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <div className="max-w-2xl mx-auto space-y-6 md:space-y-8">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 md:mb-6">
                Ready to Find Your Perfect Plot?
              </h2>
              <div className="w-20 md:w-24 h-1 bg-[#ED7600] mx-auto rounded-full mb-4 md:mb-6"></div>
              <p className="text-lg md:text-xl text-gray-200 leading-relaxed">
                Join thousands of satisfied customers who found their dream home through our platform
              </p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center pt-3 md:pt-4">
                <button 
                  className="px-6 py-3 md:px-8 md:py-4 bg-[#ED7600] hover:bg-[#d96b00] text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Browse All Plots
                </button>
                <button 
                  className="px-6 py-3 md:px-8 md:py-4 border-2 border-white/30 hover:border-[#ED7600] hover:bg-[#ED7600]/10 text-white font-bold rounded-xl transition-all duration-300"
                >
                  Contact Expert
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Societies;
