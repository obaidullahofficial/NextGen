import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../../components/user/Navbar';
import Footer from '../../components/user/Footer';
import { FaMapMarkerAlt, FaHome, FaStar, FaChevronRight, FaSearch, FaFilter, FaBuilding, FaUsers, FaShieldAlt, FaArrowRight, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { getAllSocietyProfiles } from '../../services/societyService.js';
import reviewAPI from '../../services/reviewAPI';

import societiesImg from '../../assets/Societies.png';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" } 
  }
};

const Societies = () => {
  const navigate = useNavigate();
  const [societies, setSocieties] = useState([]);
  const [filteredSocieties, setFilteredSocieties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('name');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSociety, setSelectedSociety] = useState(null);
  const [platformStats, setPlatformStats] = useState({ totalUsers: 0, totalReviews: 0 });

  useEffect(() => {
    const fetchSocieties = async () => {
      try {
        const response = await getAllSocietyProfiles();
        setSocieties(response.data || []);
        setFilteredSocieties(response.data || []);
        setLoading(false);
        
        // Fetch platform stats
        const statsResponse = await reviewAPI.getPlatformStats();
        if (statsResponse.success) {
          setPlatformStats(statsResponse.data);
        }
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

  // Calculate real-time stats
  const totalPlots = societies.reduce((acc, s) => acc + (s.totalPlots || 0), 0);
  const totalAvailable = societies.reduce((acc, s) => acc + (s.availablePlots || 0), 0);
  const verificationRate = totalPlots > 0 ? Math.round((totalAvailable / totalPlots) * 100) : 100;
  
  // Stats data with real-time values
  const stats = [
    { icon: FaBuilding, value: societies.length > 0 ? `${societies.length}+` : '0', label: 'Premium Societies' },
    { icon: FaHome, value: totalPlots > 0 ? `${totalPlots}+` : '0', label: 'Total Plots' },
    { icon: FaUsers, value: platformStats.totalUsers > 0 ? `${platformStats.totalUsers}+` : '0', label: 'Happy Customers' },
    { icon: FaShieldAlt, value: `${verificationRate}%`, label: 'Verified Properties' }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#2F3D57] text-white">
      <div className="sticky top-0 z-50">
        <Navbar />
      </div>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '30px 30px'
          }}></div>
          
          {/* Gradient Orbs */}
          <motion.div 
            className="absolute top-20 left-10 w-72 h-72 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, rgba(237,118,0,0.3) 0%, transparent 70%)' }}
            animate={{ scale: [1, 1.2, 1], x: [0, 20, 0] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div 
            className="absolute bottom-10 right-10 w-96 h-96 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)' }}
            animate={{ scale: [1.1, 1, 1.1] }}
            transition={{ duration: 10, repeat: Infinity }}
          />

          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
              {/* Left Content */}
              <motion.div 
                className="lg:w-1/2 space-y-8"
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
              >
                <motion.div variants={fadeInUp}>
                  <span className="inline-block px-4 py-2 bg-[#ED7600]/20 text-[#ED7600] rounded-full text-sm font-semibold mb-4 border border-[#ED7600]/30">
                    Premium Housing Solutions
                  </span>
                </motion.div>
                
                <motion.h1 
                  className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight"
                  variants={fadeInUp}
                >
                  <span className="text-white">Discover Your</span>
                  <br />
                  <span className="text-[#ED7600]">Dream Society</span>
                </motion.h1>
                
                <motion.p 
                  className="text-lg md:text-xl text-gray-300 leading-relaxed max-w-lg"
                  variants={fadeInUp}
                >
                  Explore premium housing societies with world-class amenities, 
                  perfect locations, and verified properties tailored to your lifestyle.
                </motion.p>
                
                {/* Search Bar */}
                <motion.div 
                  className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-2xl"
                  variants={fadeInUp}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                      <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={filterType === 'name' ? 'Search by society name...' : 'Search by city...'}
                        className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#ED7600] focus:border-transparent transition-all"
                      />
                    </div>
                    
                    {/* Filter Button */}
                    <div className="relative">
                      <motion.button 
                        onClick={() => setShowFilters(!showFilters)}
                        className="p-4 bg-[#ED7600] hover:bg-[#d96b00] rounded-xl transition-all shadow-lg shadow-orange-500/20"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <FaFilter className="text-white text-lg" />
                      </motion.button>
                      
                      <AnimatePresence>
                        {showFilters && (
                          <motion.div 
                            className="absolute right-0 mt-2 w-48 bg-[#1e2a3e] rounded-xl shadow-2xl border border-white/10 overflow-hidden z-20"
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                          >
                            <button
                              onClick={() => { setFilterType('name'); setShowFilters(false); }}
                              className={`w-full px-4 py-3 text-left text-white hover:bg-[#ED7600] transition-colors flex items-center gap-2 ${filterType === 'name' ? 'bg-[#ED7600]' : ''}`}
                            >
                              <FaBuilding className="text-sm" /> Society Name
                            </button>
                            <button
                              onClick={() => { setFilterType('city'); setShowFilters(false); }}
                              className={`w-full px-4 py-3 text-left text-white hover:bg-[#ED7600] transition-colors flex items-center gap-2 ${filterType === 'city' ? 'bg-[#ED7600]' : ''}`}
                            >
                              <FaMapMarkerAlt className="text-sm" /> City/Location
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  
                  {/* Quick filter tags */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {['Islamabad', 'Lahore', 'Karachi', 'Multan'].map((city) => (
                      <button
                        key={city}
                        onClick={() => { setFilterType('city'); setSearchTerm(city); }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          searchTerm === city 
                            ? 'bg-[#ED7600] text-white' 
                            : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                        }`}
                      >
                        {city}
                      </button>
                    ))}
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="px-3 py-1.5 rounded-full text-xs font-medium bg-red-500/20 text-red-300 hover:bg-red-500/30 flex items-center gap-1"
                      >
                        <FaTimes className="text-[10px]" /> Clear
                      </button>
                    )}
                  </div>
                </motion.div>
              </motion.div>
              
              {/* Right Image */}
              <motion.div 
                className="lg:w-1/2"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <div className="relative">
                  {/* Main Image */}
                  <motion.div
                    className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.4 }}
                  >
                    <img
                      src={societiesImg}
                      alt="Premium Societies"
                      className="w-full h-[400px] lg:h-[500px] object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#2F3D57]/80 via-transparent to-transparent"></div>
                    
                    {/* Floating Stats Card */}
                    <motion.div 
                      className="absolute bottom-6 left-6 right-6 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white/60 text-sm">Available Now</p>
                          <p className="text-white font-bold text-lg">{filteredSocieties.length} Societies</p>
                        </div>
                        <motion.button
                          onClick={() => document.getElementById('societies-grid').scrollIntoView({ behavior: 'smooth' })}
                          className="px-4 py-2 bg-[#ED7600] rounded-lg text-white font-medium flex items-center gap-2"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Explore <FaArrowRight className="text-sm" />
                        </motion.button>
                      </div>
                    </motion.div>
                  </motion.div>
                  
                  {/* Decorative Elements */}
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#ED7600]/20 rounded-xl -z-10"></div>
                  <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-white/5 rounded-xl -z-10"></div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 bg-white/5 border-y border-white/10">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
            >
              {stats.map((stat, index) => {
                const IconComponent = stat.icon;
                return (
                  <motion.div 
                    key={index}
                    className="text-center"
                    variants={fadeInUp}
                  >
                    <div className="w-14 h-14 bg-[#ED7600]/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <IconComponent className="text-[#ED7600] text-xl" />
                    </div>
                    <p className="text-2xl md:text-3xl font-bold text-white">{stat.value}</p>
                    <p className="text-gray-400 text-sm">{stat.label}</p>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* Societies Cards Section */}
        <section id="societies-grid" className="container mx-auto px-4 md:px-6 py-16 md:py-24">
          <motion.div 
            className="text-center mb-12 md:mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <span className="inline-block px-4 py-2 bg-[#ED7600]/10 text-[#ED7600] rounded-full text-sm font-semibold mb-4">
              Our Properties
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">Choose Your Perfect Society</h2>
            <div className="w-20 md:w-24 h-1 bg-[#ED7600] mx-auto rounded-full"></div>
            <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
              Explore our curated selection of premium housing societies across Pakistan
            </p>
          </motion.div>
          
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <motion.div 
                className="w-16 h-16 border-4 border-[#ED7600]/30 border-t-[#ED7600] rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
            >
              {Array.isArray(filteredSocieties) && filteredSocieties.length > 0 ? (
                filteredSocieties.map((society) => (
                  <motion.div
                    key={society._id}
                    className="group bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-[#ED7600]/50 transition-all duration-500"
                    variants={cardVariants}
                    whileHover={{ y: -8, scale: 1.01 }}
                  >
                    <div className="flex flex-col md:flex-row h-full">
                      {/* Image Section */}
                      <div className="md:w-2/5 relative overflow-hidden">
                        <motion.img
                          src={society.society_logo || societiesImg}
                          alt={society.name || 'Society'}
                          className="w-full h-56 md:h-full object-cover"
                          whileHover={{ scale: 1.1 }}
                          transition={{ duration: 0.6 }}
                          onError={(e) => { e.target.src = societiesImg; }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#2F3D57]/50 md:block hidden"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#2F3D57]/80 to-transparent md:hidden"></div>
                        
                        {/* Price Badge */}
                        <motion.div 
                          className="absolute bottom-4 left-4 bg-[#ED7600] rounded-lg px-3 py-1.5 shadow-lg"
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <span className="text-white font-bold text-sm">
                            {society.price_range || 'Contact for Price'}
                          </span>
                        </motion.div>
                      </div>
                      
                      {/* Content Section */}
                      <div className="md:w-3/5 p-6 flex flex-col justify-between">
                        <div>
                          <h3 className="text-xl md:text-2xl font-bold text-white group-hover:text-[#ED7600] transition-colors mb-2">
                            {society.name}
                          </h3>
                          <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                            {society.description || 'Premium housing society with modern amenities and excellent location.'}
                          </p>
                          
                          {/* Info Grid */}
                          <div className="grid grid-cols-3 gap-3 mb-4">
                            <div className="bg-white/5 rounded-lg p-3 text-center border border-white/5">
                              <FaMapMarkerAlt className="text-[#ED7600] mx-auto mb-1" />
                              <p className="text-white font-medium text-sm truncate">{society.location}</p>
                            </div>
                            <div className="bg-white/5 rounded-lg p-3 text-center border border-white/5">
                              <FaHome className="text-[#ED7600] mx-auto mb-1" />
                              <p className="text-white font-medium text-sm">{society.totalPlots || 0} Plots</p>
                            </div>
                            <div className="bg-white/5 rounded-lg p-3 text-center border border-white/5">
                              <FaStar className="text-[#ED7600] mx-auto mb-1" />
                              <p className="text-white font-medium text-sm">{society.availablePlots || 0} Avail</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-3">
                          <motion.button 
                            onClick={() => navigate(`/societies/${society._id}/plots`)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#ED7600] hover:bg-[#d96b00] text-white font-semibold rounded-xl transition-all shadow-lg shadow-orange-500/20"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            View Plots <FaChevronRight className="text-xs" />
                          </motion.button>
                          <motion.button 
                            onClick={() => setSelectedSociety(society)}
                            className="px-4 py-3 border border-white/20 hover:border-[#ED7600] hover:bg-[#ED7600]/10 text-white font-semibold rounded-xl transition-all"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            Details
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full text-center py-16">
                  <FaBuilding className="text-6xl text-white/20 mx-auto mb-4" />
                  <p className="text-xl text-gray-400">No societies found matching your criteria</p>
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="mt-4 px-6 py-2 bg-[#ED7600] text-white rounded-lg hover:bg-[#d96b00] transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-b from-transparent to-[#1e2a3e]">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div 
              className="max-w-4xl mx-auto text-center bg-white/5 backdrop-blur-md rounded-3xl p-10 md:p-16 border border-white/10 relative overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#ED7600]/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
              
              <div className="relative z-10">
                <motion.span 
                  className="inline-block px-4 py-2 bg-[#ED7600]/20 text-[#ED7600] rounded-full text-sm font-semibold mb-6"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  Start Your Journey
                </motion.span>
                
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
                  Ready to Find Your <span className="text-[#ED7600]">Perfect Plot?</span>
                </h2>
                
                <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
                  Join thousands of satisfied customers who found their dream home through our platform. 
                  Start designing your floor plan today!
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <motion.button 
                    onClick={() => navigate('/floor-plan/generate')}
                    className="px-8 py-4 bg-[#ED7600] hover:bg-[#d96b00] text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Design Floor Plan <FaArrowRight />
                  </motion.button>
                  <motion.button 
                    className="px-8 py-4 border-2 border-white/30 hover:border-[#ED7600] hover:bg-[#ED7600]/10 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Contact Expert
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Society Detail Modal */}
      <AnimatePresence>
        {selectedSociety && (
          <motion.div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedSociety(null)}
          >
            <motion.div 
              className="bg-[#2F3D57] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <img 
                  src={selectedSociety.society_logo || societiesImg} 
                  alt={selectedSociety.name}
                  className="w-full h-64 object-cover"
                />
                <button 
                  onClick={() => setSelectedSociety(null)}
                  className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
                >
                  <FaTimes className="text-white" />
                </button>
                <div className="absolute bottom-4 left-4 bg-[#ED7600] px-4 py-2 rounded-lg">
                  <span className="text-white font-bold">{selectedSociety.price_range || 'Contact for Price'}</span>
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-2xl font-bold text-white mb-2">{selectedSociety.name}</h3>
                <p className="text-gray-400 mb-6">{selectedSociety.description || 'Premium housing society with modern amenities.'}</p>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <FaMapMarkerAlt className="text-[#ED7600] text-xl mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Location</p>
                    <p className="text-white font-semibold">{selectedSociety.location}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <FaHome className="text-[#ED7600] text-xl mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Total Plots</p>
                    <p className="text-white font-semibold">{selectedSociety.totalPlots || 0}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <FaStar className="text-[#ED7600] text-xl mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Available</p>
                    <p className="text-white font-semibold">{selectedSociety.availablePlots || 0}</p>
                  </div>
                </div>
                
                <motion.button 
                  onClick={() => navigate(`/societies/${selectedSociety._id}/plots`)}
                  className="w-full py-4 bg-[#ED7600] hover:bg-[#d96b00] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  View All Plots <FaChevronRight />
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default Societies;
