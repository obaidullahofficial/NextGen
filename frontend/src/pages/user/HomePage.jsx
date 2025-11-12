import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBuilding, FaCube, FaClipboardCheck, FaShieldAlt, FaMapMarkerAlt, FaComments, FaBullhorn, FaPhone, FaEye, FaStar } from 'react-icons/fa';
import homepagePic1 from '../../assets/homepage-pic1.png';
import homepagePic3 from '../../assets/homepage-pic3.png';
import Navbar from '../../components/user/Navbar';
import Footer from '../../components/user/Footer';
import advertisementAPI from '../../services/advertisementAPI';

const HomePage = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [advertisement, setAdvertisement] = useState(null); // Holds ad content
  const [showPopup, setShowPopup] = useState(false);
  const [featuredAds, setFeaturedAds] = useState([]);
  const [randomAd, setRandomAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAd, setSelectedAd] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [allAds, setAllAds] = useState([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [popupCycleInterval, setPopupCycleInterval] = useState(null);
  const allAdsRef = useRef([]); // Ref to store current ads for interval access

  const slides = [
    { image: homepagePic1, alt: "Modern architectural design 1" },
    { image: homepagePic3, alt: "Modern architectural design 3" }
  ];

  // Handle navigation to floor plan generator
  const handleGenerateNow = () => {
    navigate('/floor-plan/generate');
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  // Simulate receiving an advertisement from admin
  useEffect(() => {
    setTimeout(() => {
      setAdvertisement({
        title: "Special Offer!",
      });
      setShowPopup(true);
    }, 3000); // Show ad 3 seconds after load
  }, []);

  // Fetch featured advertisements
  useEffect(() => {
    const fetchFeaturedAds = async () => {
      try {
        setLoading(true);
        const result = await advertisementAPI.getFeaturedAdvertisements(3);
        if (result.success) {
          setFeaturedAds(result.data || []);
        } else {
          console.error('Failed to fetch featured ads:', result.error);
        }
      } catch (error) {
        console.error('Error fetching featured ads:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedAds();
  }, []);

  // Fetch random advertisement for popup
  useEffect(() => {
    let cycleInterval; // Declare variable in scope
    let popupTimeout; // Declare timeout variable

    const fetchAllAdsForPopup = async () => {
      try {
        const result = await advertisementAPI.getAllAdvertisements({ 
          status: 'active',
          per_page: 20 // Get more ads for cycling
        });
        
        if (result.success && result.data && result.data.length > 0) {
          setAllAds(result.data);
          allAdsRef.current = result.data; // Store in ref for interval access
          
          // Set initial advertisement
          const firstAd = result.data[0];
          setRandomAd(firstAd);
          
          setAdvertisement({
            id: firstAd._id,
            title: `${firstAd.society_name} - ${firstAd.location}`,
            message: firstAd.description,
            contact: firstAd.contact_number,
            priceStart: firstAd.price_start,
            plotSizes: firstAd.plot_sizes,
            facilities: typeof firstAd.facilities === 'string' 
              ? firstAd.facilities.split(',').map(f => f.trim()).filter(f => f)
              : (Array.isArray(firstAd.facilities) ? firstAd.facilities : [])
          });
          
          // Show popup after 3 seconds
          popupTimeout = setTimeout(() => {
            setShowPopup(true);
          }, 3000);

          // Start cycling through ads every 15 seconds
          cycleInterval = setInterval(() => {
            setCurrentAdIndex(prevIndex => {
              const nextIndex = (prevIndex + 1) % allAdsRef.current.length;
              const nextAd = allAdsRef.current[nextIndex];
              
              setRandomAd(nextAd);
              setAdvertisement({
                id: nextAd._id,
                title: `${nextAd.society_name} - ${nextAd.location}`,
                message: nextAd.description,
                contact: nextAd.contact_number,
                priceStart: nextAd.price_start,
                plotSizes: nextAd.plot_sizes,
                facilities: typeof nextAd.facilities === 'string' 
                  ? nextAd.facilities.split(',').map(f => f.trim()).filter(f => f)
                  : (Array.isArray(nextAd.facilities) ? nextAd.facilities : [])
              });
              
              return nextIndex;
            });
          }, 15000); // Change ad every 15 seconds

          setPopupCycleInterval(cycleInterval);
        }
      } catch (error) {
        console.error('Error fetching ads for popup:', error);
        // Fallback to static ad
        popupTimeout = setTimeout(() => {
          setAdvertisement({
            title: "Special Offer!",
            message: "Get 20% off on your first 3D plan conversion.",
          });
          setShowPopup(true);
        }, 3000);
      }
    };

    fetchAllAdsForPopup();

    // Cleanup interval and timeout on component unmount
    return () => {
      if (cycleInterval) {
        clearInterval(cycleInterval);
      }
      if (popupTimeout) {
        clearTimeout(popupTimeout);
      }
    };
  }, []); // Empty dependency array - only run once on mount

  // Handle contact click
  const handleContactClick = async (adId) => {
    if (adId) {
      await advertisementAPI.incrementContactCount(adId);
    }
  };

  // Handle view click
  const handleViewClick = async (adId) => {
    if (adId) {
      await advertisementAPI.incrementViewCount(adId);
      
      // Find the ad and show details - check both featured ads and random ad
      let adToShow = featuredAds.find(ad => ad._id === adId);
      
      // If not found in featured ads, check if it matches the random ad
      if (!adToShow && randomAd && randomAd._id === adId) {
        adToShow = randomAd;
      }
      
      if (adToShow) {
        setSelectedAd(adToShow);
        setShowDetailModal(true);
      }
    }
  };

  // Navigate to next ad in popup
  const goToNextAd = () => {
    if (allAds.length > 1) {
      const nextIndex = (currentAdIndex + 1) % allAds.length;
      setCurrentAdIndex(nextIndex);
      const nextAd = allAds[nextIndex];
      
      setRandomAd(nextAd);
      setAdvertisement({
        id: nextAd._id,
        title: `${nextAd.society_name} - ${nextAd.location}`,
        message: nextAd.description,
        contact: nextAd.contact_number,
        priceStart: nextAd.price_start,
        plotSizes: nextAd.plot_sizes,
        facilities: typeof nextAd.facilities === 'string' 
          ? nextAd.facilities.split(',').map(f => f.trim()).filter(f => f)
          : (Array.isArray(nextAd.facilities) ? nextAd.facilities : [])
      });
    }
  };

  // Navigate to previous ad in popup
  const goToPrevAd = () => {
    if (allAds.length > 1) {
      const prevIndex = currentAdIndex === 0 ? allAds.length - 1 : currentAdIndex - 1;
      setCurrentAdIndex(prevIndex);
      const prevAd = allAds[prevIndex];
      
      setRandomAd(prevAd);
      setAdvertisement({
        id: prevAd._id,
        title: `${prevAd.society_name} - ${prevAd.location}`,
        message: prevAd.description,
        contact: prevAd.contact_number,
        priceStart: prevAd.price_start,
        plotSizes: prevAd.plot_sizes,
        facilities: typeof prevAd.facilities === 'string' 
          ? prevAd.facilities.split(',').map(f => f.trim()).filter(f => f)
          : (Array.isArray(prevAd.facilities) ? prevAd.facilities : [])
      });
    }
  };

  const features = [
    { icon: FaBuilding, title: "Society Selection", description: "Explore various societies and their guidelines to find your perfect match" },
    { icon: FaCube, title: "2D to 3D Modelling", description: "Convert your 2D floor plans into impressive 3D models" },
    { icon: FaClipboardCheck, title: "Building Guidelines", description: "Access detailed building codes and requirements for each society" },
    { icon: FaShieldAlt, title: "Compliance Check", description: "Verify your design against society guidelines for approval" },
    { icon: FaMapMarkerAlt, title: "Plot Selection", description: "Choose the perfect plot size and location for your dream project" },
    { icon: FaComments, title: "Feedback System", description: "Provide your valuable feedback to help us improve" }
  ];

  return (
    <div className="min-h-screen bg-[#2F3D57] text-white flex flex-col relative">
      {/* Navbar */}
      <div className="fixed w-full top-0 z-50">
        <Navbar />
      </div>

      {/* Main content */}
      <div className="flex-grow pt-16">
        {/* Hero Section */}
        <div className="container mx-auto px-6 py-35 flex flex-col md:flex-row items-center justify-between">
          <div className="md:w-1/2 mb-12 md:mb-0 pl-12 md:pl-20 lg:pl-28 xl:pl-36">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              <div className="block">You Dream It.</div>
              <div className="block text-[#ED7600]">We Design It.</div>
              <div className="block">You Own It.</div>
            </h1>
            <p className="text-lg text-gray-300 mb-8">
              NextGenArchitect: Your AI-Powered Gateway to<br />
              Custom Floor Plans & Seamless Plot Purchasing
            </p>
            <button 
              onClick={handleGenerateNow}
              className="px-8 py-3 bg-[#ED7600] text-white rounded-lg text-lg font-semibold hover:bg-[#D56900] transition-colors"
            >
              Generate Now
            </button>
          </div>

          {/* Slideshow */}
          <div className="md:w-1/2">
            <div className="relative w-full max-w-md mx-auto h-[400px] overflow-hidden rounded-lg">
              <div className="relative h-full w-full">
                {slides.map((slide, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-all duration-500 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                  >
                    <img src={slide.image} alt={slide.alt} className="w-full h-full object-contain" />
                  </div>
                ))}
              </div>

              {/* Slide indicators */}
              <div className="flex justify-center mt-4 space-x-3">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-3 h-3 rounded-full transition-all ${index === currentSlide ? 'bg-[#ED7600] w-6' : 'bg-gray-400'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white py-20 px-6">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-[#2F3D57] leading-tight">
                Platform Features
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Everything you need to design, validate, and approve your architectural project
              </p>
              <div className="w-24 h-1 bg-[#ED7600] mx-auto mt-6 rounded-full"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <div key={index} className="bg-gray-50 p-8 rounded-2xl border border-gray-200 shadow-lg">
                    <div className="w-16 h-16 bg-[#ED7600] rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                      <IconComponent className="text-white text-2xl" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-[#2F3D57]">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed text-lg">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Featured Advertisements Section */}
        <div className="bg-gray-50 py-20 px-6">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-[#2F3D57] leading-tight">
                Featured Properties
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Discover premium plots and societies available for your dream project
              </p>
              <div className="w-24 h-1 bg-[#ED7600] mx-auto mt-6 rounded-full"></div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#ED7600]"></div>
              </div>
            ) : featuredAds.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredAds.map((ad) => (
                  <div key={ad._id} className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                    <div className="p-8">
                      {/* Featured Badge */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="bg-[#ED7600] text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center">
                          <FaStar className="mr-1" />
                          Featured
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          ad.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {ad.status === 'active' ? 'Available' : 'Not Available'}
                        </span>
                      </div>

                      {/* Society Name and Location */}
                      <h3 className="text-2xl font-bold text-[#2F3D57] mb-2">{ad.society_name}</h3>
                      <div className="flex items-center text-gray-600 mb-4">
                        <FaMapMarkerAlt className="mr-2 text-[#ED7600]" />
                        <span className="text-lg">{ad.location}</span>
                      </div>

                      {/* Plot Sizes */}
                      {ad.plot_sizes && ad.plot_sizes.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-semibold text-[#2F3D57] mb-2">Available Plot Sizes:</h4>
                          <div className="flex flex-wrap gap-2">
                            {ad.plot_sizes.map((size, index) => (
                              <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                                {size}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Price Range */}
                      <div className="mb-4">
                        <div className="text-2xl font-bold text-[#ED7600]">
                          {ad.price_end 
                            ? `PKR ${(ad.price_start / 100000).toFixed(1)} - ${(ad.price_end / 100000).toFixed(1)} Lacs`
                            : `Starting from PKR ${(ad.price_start / 100000).toFixed(1)} Lacs`
                          }
                        </div>
                        {ad.installments_available && (
                          <span className="text-green-600 text-sm font-medium">Installments Available</span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-gray-600 mb-6 line-clamp-3">{ad.description}</p>

                      {/* Facilities */}
                      {ad.facilities && (
                        <div className="mb-6">
                          <h4 className="font-semibold text-[#2F3D57] mb-2">Facilities:</h4>
                          <div className="bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm">
                            {typeof ad.facilities === 'string' ? ad.facilities : ad.facilities.join(', ')}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex space-x-3">
                        <button
                          onClick={() => {
                            handleViewClick(ad._id);
                            // You can add navigation to detailed view here
                          }}
                          className="flex-1 bg-[#2F3D57] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#1e2a3a] transition-colors flex items-center justify-center"
                        >
                          <FaEye className="mr-2" />
                          View Details
                        </button>
                        <button
                          onClick={() => {
                            handleContactClick(ad._id);
                            if (ad.contact_number) {
                              window.open(`tel:${ad.contact_number}`, '_self');
                            }
                          }}
                          className="flex-1 bg-[#ED7600] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#D56900] transition-colors flex items-center justify-center"
                        >
                          <FaPhone className="mr-2" />
                          Contact
                        </button>
                      </div>

                     
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="text-6xl text-gray-300 mb-4">
                  <FaBuilding />
                </div>
                <h3 className="text-2xl font-bold text-gray-500 mb-2">No Featured Properties Available</h3>
                <p className="text-gray-400">Check back later for exciting property opportunities!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Advertisement Details Modal */}
      {showDetailModal && selectedAd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="relative">
              {/* Modal Header */}
              <div className="bg-[#2F3D57] text-white p-6 rounded-t-2xl">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="absolute top-4 right-4 text-white hover:text-gray-300 text-2xl font-bold"
                >
                  ✖
                </button>
                <h2 className="text-3xl font-bold mb-2">{selectedAd.society_name}</h2>
                <div className="flex items-center text-[#ED7600]">
                  <FaMapMarkerAlt className="mr-2" />
                  <span className="text-xl">{selectedAd.location}</span>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Column */}
                  <div>
                    {/* Price Information */}
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold text-[#2F3D57] mb-3">Price Information</h3>
                      <div className="bg-[#ED7600] text-white p-4 rounded-lg">
                        <div className="text-2xl font-bold">
                          {selectedAd.price_end 
                            ? `PKR ${(selectedAd.price_start / 100000).toFixed(1)} - ${(selectedAd.price_end / 100000).toFixed(1)} Lacs`
                            : `Starting from PKR ${(selectedAd.price_start / 100000).toFixed(1)} Lacs`
                          }
                        </div>
                        {selectedAd.installments_available && (
                          <div className="mt-2 text-sm bg-white bg-opacity-20 px-3 py-1 rounded">
                            ✓ Installments Available
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Plot Sizes */}
                    {selectedAd.plot_sizes && selectedAd.plot_sizes.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-xl font-bold text-[#2F3D57] mb-3">Available Plot Sizes</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {selectedAd.plot_sizes.map((size, index) => (
                            <div key={index} className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg text-center font-medium">
                              {size}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Contact Information */}
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-[#2F3D57] mb-3">Contact Information</h3>
                      <div className="bg-gray-100 p-4 rounded-lg">
                        <div className="flex items-center mb-2">
                          <FaPhone className="text-[#ED7600] mr-3" />
                          <span className="text-lg font-semibold">{selectedAd.contact_number}</span>
                        </div>
                        <button
                          onClick={() => {
                            handleContactClick(selectedAd._id);
                            window.open(`tel:${selectedAd.contact_number}`, '_self');
                          }}
                          className="w-full bg-[#ED7600] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#D56900] transition-colors mt-3"
                        >
                          Call Now
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div>
                    {/* Description */}
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-[#2F3D57] mb-3">Description</h3>
                      <p className="text-gray-600 leading-relaxed text-lg">{selectedAd.description}</p>
                    </div>

                    {/* Facilities */}
                    {selectedAd.facilities && (
                      <div className="mb-6">
                        <h3 className="text-xl font-bold text-[#2F3D57] mb-3">Facilities & Amenities</h3>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-gray-700 leading-relaxed">
                            {typeof selectedAd.facilities === 'string' ? selectedAd.facilities : selectedAd.facilities.join(', ')}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Additional Information */}
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-[#2F3D57] mb-3">Additional Information</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Status:</span>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            selectedAd.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {selectedAd.status === 'active' ? 'Available' : 'Not Available'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Possession:</span>
                          <span className="font-medium">{selectedAd.possession_status || 'Available'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Views:</span>
                          <span className="font-medium">{selectedAd.view_count || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Inquiries:</span>
                          <span className="font-medium">{selectedAd.contact_count || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Featured Badge */}
                    {selectedAd.is_featured && (
                      <div className="flex items-center justify-center bg-[#ED7600] text-white p-3 rounded-lg">
                        <FaStar className="mr-2" />
                        <span className="font-bold">Featured Property</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end space-x-4">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      handleContactClick(selectedAd._id);
                      window.open(`tel:${selectedAd.contact_number}`, '_self');
                    }}
                    className="px-6 py-3 bg-[#ED7600] text-white rounded-lg font-semibold hover:bg-[#D56900] transition-colors flex items-center"
                  >
                    <FaPhone className="mr-2" />
                    Contact Seller
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Advertisement Icon */}
      <div className="fixed bottom-6 right-6 z-50">
        {showPopup && advertisement && (
          <div className="bg-white text-[#2F3D57] p-6 rounded-2xl shadow-2xl w-80 mb-3 relative border-2 border-[#ED7600]">
            {/* Header with navigation */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                {allAds.length > 1 && (
                  <>
                    <button
                      onClick={goToPrevAd}
                      className="p-1 bg-gray-200 hover:bg-gray-300 rounded-full text-[#2F3D57] transition-colors"
                      title="Previous Ad"
                    >
                      ←
                    </button>
                    <span className="text-xs text-gray-500">
                      {currentAdIndex + 1} of {allAds.length}
                    </span>
                    <button
                      onClick={goToNextAd}
                      className="p-1 bg-gray-200 hover:bg-gray-300 rounded-full text-[#2F3D57] transition-colors"
                      title="Next Ad"
                    >
                      →
                    </button>
                  </>
                )}
              </div>
              <button
                onClick={() => setShowPopup(false)}
                className="text-gray-500 hover:text-gray-800 text-xl font-bold"
              >
                ✖
              </button>
            </div>

            {/* Ad indicators */}
            {allAds.length > 1 && (
              <div className="flex justify-center mb-4 space-x-1">
                {allAds.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentAdIndex(index);
                      const selectedAd = allAds[index];
                      setRandomAd(selectedAd);
                      setAdvertisement({
                        id: selectedAd._id,
                        title: `${selectedAd.society_name} - ${selectedAd.location}`,
                        message: selectedAd.description,
                        contact: selectedAd.contact_number,
                        priceStart: selectedAd.price_start,
                        plotSizes: selectedAd.plot_sizes,
                        facilities: typeof selectedAd.facilities === 'string' 
                          ? selectedAd.facilities.split(',').map(f => f.trim()).filter(f => f)
                          : (Array.isArray(selectedAd.facilities) ? selectedAd.facilities : [])
                      });
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentAdIndex ? 'bg-[#ED7600] w-4' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            )}
            
            <div>
              <h3 className="font-bold text-xl mb-3 text-[#2F3D57]">{advertisement.title}</h3>
              <p className="text-gray-700 mb-4 text-sm leading-relaxed">{advertisement.message}</p>
              
              {advertisement.contact && (
                <div className="mb-3">
                  <div className="flex items-center text-[#ED7600] font-semibold">
                    <FaPhone className="mr-2" />
                    <span>{advertisement.contact}</span>
                  </div>
                </div>
              )}

              {advertisement.priceStart && (
                <div className="mb-3">
                  <div className="text-lg font-bold text-[#ED7600]">
                    Starting from PKR {(advertisement.priceStart / 100000).toFixed(1)} Lacs
                  </div>
                </div>
              )}

              {advertisement.plotSizes && advertisement.plotSizes.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-[#2F3D57] mb-2 text-sm">Plot Sizes:</h4>
                  <div className="flex flex-wrap gap-1">
                    {advertisement.plotSizes.slice(0, 3).map((size, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        {size}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {advertisement.facilities && advertisement.facilities.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-[#2F3D57] mb-2 text-sm">Facilities:</h4>
                  <div className="flex flex-wrap gap-1">
                    {advertisement.facilities.slice(0, 4).map((facility, index) => (
                      <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                        {facility}
                      </span>
                    ))}
                    {advertisement.facilities.length > 4 && (
                      <span className="text-[#ED7600] text-xs font-medium">
                        +{advertisement.facilities.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex space-x-2 mt-4">
                <button
                  onClick={() => {
                    if (advertisement.id) {
                      handleViewClick(advertisement.id);
                    }
                    setShowPopup(false);
                  }}
                  className="flex-1 bg-[#2F3D57] text-white py-2 px-3 rounded-lg text-sm font-semibold hover:bg-[#1e2a3a] transition-colors"
                >
                  View Details
                </button>
                <button
                  onClick={() => {
                    if (advertisement.id) {
                      handleContactClick(advertisement.id);
                    }
                    if (advertisement.contact) {
                      window.open(`tel:${advertisement.contact}`, '_self');
                    }
                    setShowPopup(false);
                  }}
                  className="flex-1 bg-[#ED7600] text-white py-2 px-3 rounded-lg text-sm font-semibold hover:bg-[#D56900] transition-colors"
                >
                  Contact Now
                </button>
              </div>

             
            </div>
          </div>
        )}

        {/* Always visible message icon with ad count badge */}
        <div className="relative">
          <button
            onClick={() => setShowPopup(true)}
            className="bg-[#ED7600] p-4 rounded-full shadow-lg hover:bg-[#D56900] transition-colors"
          >
            <FaBullhorn className="text-white text-2xl" />
          </button>
          
          {allAds.length > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
              {allAds.length}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default HomePage;
