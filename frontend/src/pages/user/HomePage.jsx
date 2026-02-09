import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaBuilding, FaCube, FaClipboardCheck, FaShieldAlt, FaMapMarkerAlt, FaComments, FaBullhorn, FaPhone, FaEye, FaStar } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import homepagePic1 from '../../assets/homepage-pic1.png';
import homepagePic3 from '../../assets/homepage-pic3.png';
import Navbar from '../../components/user/Navbar';
import Footer from '../../components/user/Footer';
import advertisementAPI from '../../services/advertisementAPI';

const HomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
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
        const result = await advertisementAPI.getActiveAdvertisements();
        if (result.success) {
          // Get first 6 active advertisements for the featured section
          setFeaturedAds((result.data || []).slice(0, 6));
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
    let cycleInterval;
    let popupTimeout;

    const fetchAllAdsForPopup = async () => {
      try {
        const result = await advertisementAPI.getActiveAdvertisements(20);
        
        if (result.success && result.data && result.data.length > 0) {
          setAllAds(result.data);
          allAdsRef.current = result.data;
          
          // Set initial advertisement
          const firstAd = result.data[0];
          setRandomAd(firstAd);
          
          setAdvertisement({
            id: firstAd._id,
            title: firstAd.title,
            message: 'Click to learn more',
            image: firstAd.featured_image,
            link: firstAd.link_url
          });
          
          // Show popup after 3 seconds
          popupTimeout = setTimeout(() => {
            setShowPopup(true);
            // Track impression when popup is shown
            if (firstAd._id) {
              advertisementAPI.trackImpression(firstAd._id);
            }
          }, 3000);

          // Start cycling through ads every 15 seconds
          cycleInterval = setInterval(() => {
            setCurrentAdIndex(prevIndex => {
              const nextIndex = (prevIndex + 1) % allAdsRef.current.length;
              const nextAd = allAdsRef.current[nextIndex];
              
              setRandomAd(nextAd);
              setAdvertisement({
                id: nextAd._id,
                title: nextAd.title,
                message: 'Click to learn more',
                image: nextAd.featured_image,
                link: nextAd.link_url
              });
              
              // Track impression for the new ad
              if (nextAd._id) {
                advertisementAPI.trackImpression(nextAd._id);
              }
              
              return nextIndex;
            });
          }, 15000);

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

    return () => {
      if (cycleInterval) {
        clearInterval(cycleInterval);
      }
      if (popupTimeout) {
        clearTimeout(popupTimeout);
      }
    };
  }, []);

  // Handle view click
  const handleViewClick = (adId) => {
    // Find the ad and show details
    let adToShow = featuredAds.find(ad => ad._id === adId);
    
    if (!adToShow && randomAd && randomAd._id === adId) {
      adToShow = randomAd;
    }
    
    if (adToShow) {
      setSelectedAd(adToShow);
      setShowDetailModal(true);
    }
  };

  // Handle ad click - open link
  const handleAdClick = (ad) => {
    if (ad.link_url) {
      window.open(ad.link_url, '_blank');
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
        title: nextAd.title,
        message: 'Click to learn more',
        image: nextAd.featured_image,
        link: nextAd.link_url
      });
      
      // Track impression for manually viewed ad
      if (nextAd._id) {
        advertisementAPI.trackImpression(nextAd._id);
      }
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
        title: prevAd.title,
        message: 'Click to learn more',
        image: prevAd.featured_image,
        link: prevAd.link_url
      });
      
      // Track impression for manually viewed ad
      if (prevAd._id) {
        advertisementAPI.trackImpression(prevAd._id);
      }
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
            {/* Welcome message */}
            {user && (
              <div className="mb-4 p-4 bg-[#1E2936] rounded-lg border border-[#ED7600]">
                <p className="text-sm text-gray-300">Welcome back, <span className="text-[#ED7600] font-semibold">
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user.username || user.email}
                </span>!</p>
              </div>
            )}
            
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
                Featured Advertisements
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Click on any advertisement to visit the website
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
                  <div 
                    key={ad._id} 
                    className="group relative rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer"
                    onClick={() => handleAdClick(ad)}
                  >
                    {/* Advertisement Poster/Banner - Full image only */}
                    <div className="relative w-full h-[400px] overflow-hidden bg-gray-100">
                      {ad.featured_image ? (
                        <img 
                          src={ad.featured_image} 
                          alt={ad.title}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23e5e7eb" width="400" height="400"/%3E%3Ctext fill="%23999" font-size="20" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3EAdvertisement%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                          <FaBullhorn className="text-6xl text-gray-400" />
                        </div>
                      )}
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
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50" onClick={() => setShowDetailModal(false)}>
          <div className="relative max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button
              onClick={() => setShowDetailModal(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 text-3xl font-bold z-10"
            >
              ✖
            </button>
            
            {/* Advertisement Image */}
            {selectedAd.featured_image && (
              <img 
                src={selectedAd.featured_image} 
                alt={selectedAd.title}
                className="w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600"%3E%3Crect fill="%23ddd" width="800" height="600"/%3E%3Ctext fill="%23999" font-size="24" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3EAdvertisement%3C/text%3E%3C/svg%3E';
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Floating Advertisement Icon */}
      <div className="fixed bottom-6 right-6 z-50">
        {showPopup && advertisement && (
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-96 relative border-2 border-[#ED7600] overflow-hidden">
            {/* Header with navigation */}
            <div className="flex items-center justify-between p-4 pb-2">
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
              <div className="flex justify-center px-4 pb-2 space-x-1">
                {allAds.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentAdIndex(index);
                      const selectedAd = allAds[index];
                      setRandomAd(selectedAd);
                      setAdvertisement({
                        id: selectedAd._id,
                        title: selectedAd.title,
                        message: 'Click to learn more',
                        image: selectedAd.featured_image,
                        link: selectedAd.link_url
                      });
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentAdIndex ? 'bg-[#ED7600] w-4' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            )}
            
            {/* Advertisement Image - Full Display */}
            {advertisement.image && (
              <div 
                className="w-full cursor-pointer"
                onClick={() => {
                  if (randomAd) {
                    handleAdClick(randomAd);
                  }
                  setShowPopup(false);
                }}
              >
                <img 
                  src={advertisement.image} 
                  alt={advertisement.title}
                  className="w-full h-auto object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Footer with title and buttons */}
            <div className="p-4 pt-3 bg-gray-50">
              <h3 className="font-bold text-lg mb-2 text-[#2F3D57] line-clamp-1">{advertisement.title}</h3>
              <p className="text-gray-600 mb-3 text-xs">{advertisement.message}</p>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (randomAd) {
                      handleAdClick(randomAd);
                    }
                    setShowPopup(false);
                  }}
                  className="flex-1 bg-[#ED7600] text-white py-2 px-3 rounded-lg text-sm font-semibold hover:bg-[#D56900] transition-colors flex items-center justify-center"
                >
                  <FaBullhorn className="mr-2" />
                  Learn More
                </button>
                <button
                  onClick={() => {
                    if (advertisement.id) {
                      handleViewClick(advertisement.id);
                    }
                    setShowPopup(false);
                  }}
                  className="flex-1 bg-[#2F3D57] text-white py-2 px-3 rounded-lg text-sm font-semibold hover:bg-[#1e2a3a] transition-colors flex items-center justify-center"
                >
                  <FaEye className="mr-2" />
                  View
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Reopen Button */}
        {!showPopup && advertisement && (
          <button
            onClick={() => setShowPopup(true)}
            className="bg-[#ED7600] text-white p-4 rounded-full shadow-lg hover:bg-[#D56900] transition-all duration-300 hover:scale-110"
            title="View Advertisement"
          >
            <FaBullhorn className="text-2xl" />
          </button>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default HomePage;
