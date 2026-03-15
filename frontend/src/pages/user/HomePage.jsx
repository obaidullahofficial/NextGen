import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, useInView, useScroll, useTransform, useSpring } from 'framer-motion';
import { FaBuilding, FaCube, FaClipboardCheck, FaShieldAlt, FaMapMarkerAlt, FaComments, FaBullhorn, FaPhone, FaEye, FaStar, FaRocket, FaArrowRight, FaChevronDown, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import homepagePic1 from '../../assets/homepage-pic1.png';
import homepagePic3 from '../../assets/homepage-pic3.png';
import Navbar from '../../components/user/Navbar';
import Footer from '../../components/user/Footer';
import advertisementAPI from '../../services/advertisementAPI';
import reviewAPI from '../../services/reviewAPI';
import '../../styles/glassmorphism.css';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }
};

const fadeInLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } }
};

const fadeInRight = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: "easeOut" } }
};

// Animated section component with performance optimizations
const AnimatedSection = ({ children, className = "" }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { 
    once: true, 
    margin: "-20px",
    amount: 0.1 // Trigger when 10% of element is visible
  });
  
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={fadeInUp}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Section Counter Component
const SectionCounter = ({ number, total = "04", light = false }) => (
  <div className="absolute left-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-center gap-2 z-20">
    <span className={`text-sm font-bold ${light ? 'text-white' : 'text-[#2F3D57]'}`}>{number}</span>
    <div className={`w-px h-8 ${light ? 'bg-white/30' : 'bg-[#2F3D57]/20'}`}></div>
    <span className={`text-sm ${light ? 'text-white/60' : 'text-gray-400'}`}>{total}</span>
  </div>
);

// Scroll Indicator Component  
const ScrollIndicator = ({ onClick, light = false }) => (
  <motion.div 
    className="absolute bottom-8 left-8 flex flex-col items-center cursor-pointer z-20"
    style={{ position: 'relative' }} // Fix framer-motion positioning warning
    onClick={onClick}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 1 }}
  >
    <motion.div
      animate={{ y: [0, 8, 0] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      <FaChevronDown className={`text-xl ${light ? 'text-white' : 'text-[#2F3D57]'}`} />
    </motion.div>
    <span className={`text-xs mt-2 tracking-widest uppercase ${light ? 'text-white/60' : 'text-[#2F3D57]/60'}`}>Scroll</span>
  </motion.div>
);

const HomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [advertisement, setAdvertisement] = useState(null); // Holds ad content
  const [showPopup, setShowPopup] = useState(false);
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [featuredAds, setFeaturedAds] = useState([]);
  const [randomAd, setRandomAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAd, setSelectedAd] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [allAds, setAllAds] = useState([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [popupCycleInterval, setPopupCycleInterval] = useState(null);
  const allAdsRef = useRef([]); // Ref to store current ads for interval access
  const trackedImpressions = useRef(new Set()); // Track which ads have been tracked
  const [mainView, setMainView] = useState('3d'); // Track which view is in main position
  const [platformStats, setPlatformStats] = useState({ averageRating: 4.8, totalReviews: 150, totalUsers: 1000 });

  // Helper function to track impression only once per ad
  const trackImpressionOnce = (adId) => {
    if (adId && !trackedImpressions.current.has(adId)) {
      trackedImpressions.current.add(adId);
      advertisementAPI.trackImpression(adId);
    }
  };

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

  // Fetch platform stats (average rating, total users)
  useEffect(() => {
    const fetchPlatformStats = async () => {
      try {
        const result = await reviewAPI.getPlatformStats();
        if (result.success || result.data) {
          setPlatformStats(result.data);
        }
      } catch (error) {
        console.error('Error fetching platform stats:', error);
      }
    };
    fetchPlatformStats();
  }, []);

  // Scroll detection for hiding/showing ads
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const isAtTop = scrollPosition < 100; // Consider top if scroll is less than 100px
      
      if (!isAtTop && !isScrolledDown) {
        // User scrolled down - hide popup and pause cycling
        setIsScrolledDown(true);
        setShowPopup(false);
        // Pause the cycling interval
        if (popupCycleInterval) {
          clearInterval(popupCycleInterval);
          setPopupCycleInterval(null);
        }
      } else if (isAtTop && isScrolledDown && initialLoadComplete && advertisement) {
        // User scrolled back to top - show popup and resume cycling
        setIsScrolledDown(false);
        setShowPopup(true);
        // Resume cycling if there are multiple ads
        if (allAds.length > 1 && !popupCycleInterval) {
          const newInterval = setInterval(() => {
            setCurrentAdIndex(prevIndex => {
              const nextIndex = (prevIndex + 1) % allAds.length;
              const nextAd = allAds[nextIndex];
              
              setRandomAd(nextAd);
              setAdvertisement({
                id: nextAd._id,
                title: nextAd.title,
                message: 'Click to learn more',
                image: nextAd.featured_image,
                link: nextAd.link_url
              });
              
              trackImpressionOnce(nextAd._id);
              
              return nextIndex;
            });
          }, 3000);
          setPopupCycleInterval(newInterval);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isScrolledDown, initialLoadComplete, advertisement, popupCycleInterval, allAds]);

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
            setInitialLoadComplete(true);
            // Track impression when popup is shown
            trackImpressionOnce(firstAd._id);
          }, 3000);

          // Start cycling through ads every 3 seconds (only if more than 1 ad)
          if (result.data.length > 1) {
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
                
                // Track impression for the new ad (only once)
                trackImpressionOnce(nextAd._id);
                
                return nextIndex;
              });
            }, 3000);

            setPopupCycleInterval(cycleInterval);
          }
        }
      } catch (error) {
        console.error('Error fetching ads for popup:', error);
        // Fallback to static ad
        popupTimeout = setTimeout(() => {
          setAdvertisement({
            title: "Special Offer!",
            message: "Get 20% off on your first 3D plan conversion.",
            image: "https://via.placeholder.com/600x400/ED7600/ffffff?text=Special+Offer"
          });
          setShowPopup(true);
          setInitialLoadComplete(true);
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

  // Handle closing popup and stopping cycling
  const closePopup = () => {
    setShowPopup(false);
    // Stop the cycling interval when popup is closed
    if (popupCycleInterval) {
      clearInterval(popupCycleInterval);
      setPopupCycleInterval(null);
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
      
      // Track impression for manually viewed ad (only once)
      trackImpressionOnce(nextAd._id);
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
      
      // Track impression for manually viewed ad (only once)
      trackImpressionOnce(prevAd._id);
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

  // Parallax scroll hooks
  const containerRef = useRef(null);
  const section2Ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });
  
  // Section 2 specific scroll progress
  const { scrollYProgress: section2Progress } = useScroll({
    target: section2Ref,
    offset: ["start end", "end start"]
  });
  
  // Smooth spring animations for parallax - softer springs for flowing motion
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, mass: 0.3 });
  const smoothSection2 = useSpring(section2Progress, { stiffness: 80, damping: 25, mass: 0.5 });
  
  // Section 2 TIDY-style transforms - smoother flowing transitions
  const mockupX = useTransform(smoothSection2, [0, 0.15, 0.35, 0.55], ['0%', '0%', '10%', '25%']);
  const mockupScale = useTransform(smoothSection2, [0, 0.15, 0.35, 0.55], [0.85, 1.1, 1.2, 0.95]);
  const mockupWidth = useTransform(smoothSection2, [0, 0.15, 0.35, 0.55], ['75%', '85%', '75%', '55%']);
  // Text reveals from left with smoother easing
  const textX = useTransform(smoothSection2, [0.25, 0.45, 0.55], ['-80%', '-20%', '0%']);
  const textOpacity = useTransform(smoothSection2, [0.25, 0.4, 0.55], [0, 0.5, 1]);
  // Background color transition - smoother gradient
  const section2Bg = useTransform(smoothSection2, [0.1, 0.25, 0.4], ['#ffffff', '#4a5a73', '#2F3D57']);
  
  // Parallax transforms - smoother flowing motion
  const heroY = useTransform(smoothProgress, [0, 0.15, 0.3], [0, -50, -150]);
  const heroOpacity = useTransform(smoothProgress, [0, 0.1, 0.2], [1, 0.7, 0]);
  const mockupY = useTransform(smoothProgress, [0, 0.2, 0.4], [0, -30, -80]);
  const mockupRotate = useTransform(smoothProgress, [0, 0.15, 0.3], [0, -2, -5]);
  const featuresY = useTransform(smoothProgress, [0.2, 0.35, 0.5], [100, 40, 0]);
  const featuresOpacity = useTransform(smoothProgress, [0.2, 0.28, 0.35], [0, 0.5, 1]);
  
  // Hero mockup scale - smoother enlargement as user scrolls
  const heroMockupScale = useTransform(smoothProgress, [0, 0.08, 0.15], [1, 1.15, 1.3]);

  // Scroll to next section
  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-[#f8f9fa] flex flex-col relative">
      {/* Navbar */}
      <div className="fixed w-full top-0 z-50">
        <Navbar />
      </div>

      {/* ===== SECTION 1: HERO WITH 3D MOCKUP ===== */}
      <section className="min-h-screen relative flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#f8f9fa] to-white pt-16">
        {/* Dot Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.4]" style={{
          backgroundImage: 'radial-gradient(circle, #2F3D57 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}></div>
        
        {/* Section Counter */}
        <SectionCounter number="01" />
        
        {/* Scroll Indicator */}
        <ScrollIndicator onClick={() => scrollToSection('mockup-section')} />

        <motion.div 
          className="container mx-auto px-6 flex flex-col lg:flex-row items-center justify-between relative z-10"
          style={{ y: heroY, opacity: heroOpacity }}
        >
          {/* Left Content */}
          <div className="lg:w-1/2 mb-12 lg:mb-0 lg:pr-12">
            {/* Welcome Badge */}
            {user && (
              <motion.div 
                className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-[#2F3D57] rounded-full min-w-fit"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <span className="w-2 h-2 bg-[#ED7600] rounded-full animate-pulse flex-shrink-0"></span>
                <p className="text-sm text-white font-medium whitespace-nowrap">Welcome back, <span className="font-bold">
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user.username || user.email}
                </span></p>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
            >
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-[#2F3D57] leading-[1.1] mb-8">
                <span className="block">You Dream It.</span>
                <span className="block text-[#ED7600]">We Design It.</span>
                <span className="block">You Own It.</span>
              </h1>
            </motion.div>
            
            <motion.p 
              className="text-xl text-gray-600 mb-10 max-w-lg leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
              NextGenArchitect: Your AI-Powered Gateway to
              Custom Floor Plans & Seamless Plot Purchasing
            </motion.p>
            
            <motion.div 
              className="flex flex-wrap gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.25 }}
            >
              <motion.button 
                onClick={handleGenerateNow}
                className="group px-8 py-4 bg-[#ED7600] text-white rounded-full font-semibold text-lg hover:bg-[#d66a00] transition-all shadow-xl shadow-orange-500/20 flex items-center gap-3"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaRocket className="group-hover:animate-bounce" />
                <span>Generate Now</span>
                <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
              </motion.button>
              
              <motion.button 
                onClick={() => navigate('/societies')}
                className="px-8 py-4 bg-transparent border-2 border-[#2F3D57] text-[#2F3D57] rounded-full font-semibold text-lg hover:bg-[#2F3D57] hover:text-white transition-all flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaBuilding />
                <span>Explore Societies</span>
              </motion.button>
            </motion.div>

            {/* Rating Display Section */}
            <motion.div 
              className="mt-16 pt-8 border-t border-gray-200"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-sm text-[#ED7600] font-semibold tracking-wider uppercase mb-3">Trusted by Architects & Homeowners</p>
              <div className="flex items-center gap-4 flex-wrap">
                {/* User avatars */}
                <div className="flex -space-x-2">
                  {[1,2,3,4].map(i => (
                    <div key={i} className={`w-8 h-8 rounded-full border-2 border-white ${
                      i === 1 ? 'bg-[#ED7600]' : 
                      i === 2 ? 'bg-[#2F3D57]' : 
                      i === 3 ? 'bg-[#ED7600]/70' : 'bg-[#2F3D57]/70'
                    } flex items-center justify-center text-white text-xs font-bold`}>
                      {i === 4 ? '+' : ''}
                    </div>
                  ))}
                </div>
                {/* Real-time Rating Display */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const rating = platformStats.averageRating;
                      if (star <= Math.floor(rating)) {
                        return <FaStar key={star} className="text-[#ED7600] text-sm" />;
                      } else if (star === Math.ceil(rating) && rating % 1 !== 0) {
                        return <FaStarHalfAlt key={star} className="text-[#ED7600] text-sm" />;
                      } else {
                        return <FaRegStar key={star} className="text-[#ED7600] text-sm" />;
                      }
                    })}
                  </div>
                  <span className="text-sm font-semibold text-[#2F3D57]">{platformStats.averageRating}</span>
                  <span className="text-sm text-gray-500">({platformStats.totalUsers}+ users)</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right: 3D Perspective Mockup */}
          <div className="lg:w-1/2 relative">
            <motion.div 
              className="relative origin-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              style={{ 
                perspective: '1500px',
                transformStyle: 'preserve-3d',
                scale: heroMockupScale
              }}
            >
              {/* 3D Tilted Device Mockup */}
              <motion.div
                className="relative"
                style={{
                  transform: 'rotateY(-8deg) rotateX(5deg)',
                  transformStyle: 'preserve-3d'
                }}
                animate={{ 
                  rotateY: [-8, -6, -8],
                  rotateX: [5, 3, 5]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                {/* Shadow underneath */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[80%] h-8 bg-black/10 blur-2xl rounded-full"></div>
                
                {/* Main Device Frame */}
                <div className="bg-white rounded-[40px] shadow-2xl p-4 border border-gray-100">
                  {/* Device Header */}
                  <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <span className="text-xs text-gray-400">NextGenArchitect</span>
                    <div className="w-20"></div>
                  </div>
                  
                  {/* Screen Content */}
                  <div className="mt-4 relative overflow-hidden rounded-2xl bg-gray-50">
                    {/* Dashboard Preview */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-semibold text-[#2F3D57]">Dashboard</span>
                        <div className="flex gap-2">
                          {[1,2,3].map(i => (
                            <div key={i} className="w-6 h-6 rounded-full bg-gray-200"></div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Floor Plan Cards Grid - Like TIDY app cards */}
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        {/* Card 1 - 2D Plan */}
                        <motion.div 
                          className="bg-[#2F3D57]/5 border border-[#2F3D57]/20 rounded-xl p-3 cursor-pointer"
                          whileHover={{ scale: 1.05, y: -5 }}
                          onClick={() => setMainView('2d')}
                        >
                          <div className="bg-white rounded-lg p-2 mb-2">
                            <div className="border-2 border-[#2F3D57] rounded h-16 p-1">
                              <div className="bg-[#ED7600]/20 border border-[#2F3D57] h-1/2 mb-0.5"></div>
                              <div className="flex gap-0.5 h-1/2">
                                <div className="bg-[#2F3D57]/10 border border-[#2F3D57] flex-1"></div>
                                <div className="bg-[#2F3D57]/20 border border-[#2F3D57] flex-1"></div>
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-semibold text-[#2F3D57]">2D Plan</span>
                        </motion.div>
                        
                        {/* Card 2 - 3D Model */}
                        <motion.div 
                          className="bg-[#2F3D57]/5 border border-[#2F3D57]/20 rounded-xl p-3 cursor-pointer"
                          whileHover={{ scale: 1.05, y: -5 }}
                          onClick={() => setMainView('3d')}
                        >
                          <div className="bg-white rounded-lg p-2 mb-2 h-16 flex items-center justify-center">
                            <img src={homepagePic3} alt="3D" className="w-full h-full object-contain" />
                          </div>
                          <span className="text-[10px] font-semibold text-[#2F3D57]">3D Model</span>
                        </motion.div>
                        
                        {/* Card 3 - Features */}
                        <motion.div 
                          className="bg-[#ED7600]/10 border border-[#ED7600]/30 rounded-xl p-3 cursor-pointer"
                          whileHover={{ scale: 1.05, y: -5 }}
                          onClick={handleGenerateNow}
                        >
                          <div className="bg-white rounded-lg p-2 mb-2 h-16 flex items-center justify-center">
                            <FaCube className="text-[#ED7600] text-2xl" />
                          </div>
                          <span className="text-[10px] font-semibold text-[#2F3D57]">Try Now</span>
                        </motion.div>
                      </div>
                      
                      {/* Stats Row */}
                      <div className="flex gap-2">
                        <div className="flex-1 bg-white rounded-xl p-3 text-center shadow-sm">
                          <div className="text-lg font-bold text-[#ED7600]">500+</div>
                          <div className="text-[9px] text-gray-500">Floor Plans</div>
                        </div>
                        <div className="flex-1 bg-white rounded-xl p-3 text-center shadow-sm">
                          <div className="text-lg font-bold text-[#2F3D57]">50+</div>
                          <div className="text-[9px] text-gray-500">Societies</div>
                        </div>
                        <div className="flex-1 bg-white rounded-xl p-3 text-center shadow-sm">
                          <div className="text-lg font-bold text-[#ED7600]">1000+</div>
                          <div className="text-[9px] text-gray-500">Users</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Floating Cards Around Device */}
                <motion.div 
                  className="absolute -right-12 top-8 bg-white rounded-xl shadow-xl p-3 w-32"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <FaClipboardCheck className="text-white text-xs" />
                    </div>
                    <span className="text-[10px] font-semibold">Approved</span>
                  </div>
                  <div className="h-1 bg-green-200 rounded-full">
                    <div className="h-full w-full bg-green-500 rounded-full"></div>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="absolute -left-8 bottom-16 bg-white rounded-xl shadow-xl p-3 w-28"
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "linear", delay: 0.3 }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-[#ED7600] rounded-full flex items-center justify-center">
                      <FaRocket className="text-white text-xs" />
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold block">AI Ready</span>
                      <span className="text-[8px] text-gray-400">Instant</span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ===== SECTION 2: 3D MOCKUP PARALLAX SECTION (TIDY-STYLE) ===== */}
      <section ref={section2Ref} id="mockup-section" className="min-h-[200vh] relative">
        {/* Sticky Container with animated background */}
        <motion.div 
          className="sticky top-0 h-screen flex items-center overflow-hidden"
          style={{ backgroundColor: section2Bg }}
        >
          {/* Dot Grid */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }}
          />
          
          {/* Subtle Gradient Orbs */}
          <motion.div 
            className="absolute top-20 right-20 w-48 h-48 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(237,118,0,0.15) 0%, transparent 70%)' }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-20 left-20 w-64 h-64 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)' }}
            animate={{ scale: [1.1, 1, 1.1] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Section Counter */}
          <SectionCounter number="02" light />
          
          {/* Scroll Indicator */}
          <ScrollIndicator onClick={() => scrollToSection('features-section')} light />

          <div className="container mx-auto px-6 relative z-10 flex items-center justify-center">
            {/* Left Side - Text Content (appears on scroll) - Absolute positioned */}
            <motion.div 
              className="absolute left-6 lg:left-12 w-[35%] pr-8 hidden lg:block z-20"
              style={{ x: textX, opacity: textOpacity }}
            >
              <motion.span 
                className="inline-block px-4 py-2 bg-[#ED7600]/20 text-[#ED7600] rounded-full text-sm font-semibold mb-6"
              >
                AI-Powered Design
              </motion.span>
              
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 tracking-tight">
                <span className="block text-white">CREATE FLOOR PLANS,</span>
                <span className="block text-[#ED7600]">VISUALIZE IN 3D,</span>
                <span className="block text-white">CHECK COMPLIANCE.</span>
              </h2>
              
              <p className="text-base text-gray-300 mb-8 leading-relaxed">
                Move beyond simple sketches. Visualize your
                dream home and check compliance instantly
                with our AI-powered platform.
              </p>
              
              <div className="flex flex-col gap-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#ED7600] rounded-lg flex items-center justify-center">
                    <FaCube className="text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">3D Visualization</p>
                    <p className="text-sm text-gray-400">One-click 3D rendering</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <FaClipboardCheck className="text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Compliance Check</p>
                    <p className="text-sm text-gray-400">Instant verification</p>
                  </div>
                </div>
              </div>
              
              <motion.button
                onClick={handleGenerateNow}
                className="px-8 py-4 bg-[#ED7600] text-white rounded-full font-semibold shadow-xl shadow-orange-500/30 flex items-center gap-3"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaRocket />
                Start Designing Now
                <FaArrowRight />
              </motion.button>
            </motion.div>
            
            {/* Right Side - Floor Plan Mockup (starts centered, enlarges, then moves right) */}
            <motion.div 
              className="w-full flex items-center justify-center"
              style={{ 
                x: mockupX,
                scale: mockupScale,
                width: mockupWidth,
                margin: '0 auto'
              }}
            >
              <motion.div
                className="relative w-full max-w-2xl"
                style={{ perspective: '1500px' }}
              >
                {/* Dramatic Light Rays */}
                <div className="absolute -top-32 -right-32 w-96 h-96 opacity-30 pointer-events-none">
                  <div className="absolute inset-0 bg-[#ED7600] rounded-full blur-[50px]"></div>
                </div>
                <div className="absolute -bottom-20 -left-20 w-64 h-64 opacity-20 pointer-events-none">
                  <div className="absolute inset-0 bg-[#2F3D57] rounded-full blur-[40px]"></div>
                </div>

                {/* Floating Info Cards */}
                <motion.div 
                  className="absolute -left-16 top-[20%] bg-white rounded-2xl shadow-xl p-4 z-30 hidden lg:block border border-gray-100 animate-float-slow"
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#ED7600] to-[#FF9933] rounded-xl flex items-center justify-center">
                      <FaCube className="text-white text-sm" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#2F3D57]">3D Ready</p>
                      <p className="text-xs text-gray-500">One-click render</p>
                    </div>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="absolute -right-12 top-[25%] bg-white rounded-2xl shadow-xl p-4 z-30 hidden lg:block border border-gray-100 animate-float-slower"
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.5 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#2F3D57] to-[#4a5d7a] rounded-xl flex items-center justify-center">
                      <FaClipboardCheck className="text-white text-sm" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#2F3D57]">Compliant</p>
                      <p className="text-xs text-gray-500">Auto-verified</p>
                    </div>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="absolute -right-8 bottom-[20%] bg-gradient-to-br from-[#2F3D57] to-[#1e2a3e] rounded-2xl shadow-xl p-4 z-30 hidden lg:block animate-float-delayed-3"
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.6 }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const rating = platformStats.averageRating;
                      if (star <= Math.floor(rating)) {
                        return <FaStar key={star} className="text-[#ED7600] text-sm" />;
                      } else if (star === Math.ceil(rating) && rating % 1 !== 0) {
                        return <FaStarHalfAlt key={star} className="text-[#ED7600] text-sm" />;
                      } else {
                        return <FaRegStar key={star} className="text-[#ED7600] text-sm" />;
                      }
                    })}
                    <span className="text-sm text-white font-bold ml-1">{platformStats.averageRating}</span>
                  </div>
                  <p className="text-xs text-white/70">{platformStats.totalUsers}+ Happy Users</p>
                </motion.div>

                {/* Main Floor Plan Card */}
                <motion.div
                  className="relative bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
                  initial={{ opacity: 0, y: 30, rotateX: 5 }}
                  whileInView={{ opacity: 1, y: 0, rotateX: 1 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  viewport={{ once: true, margin: "-5%" }}
                  whileHover={{ y: -2, scale: 1.005 }}
                  style={{ transformStyle: 'preserve-3d', boxShadow: '0 25px 60px -15px rgba(0,0,0,0.15)' }}
                >
                  {/* Shadow Layer */}
                  <div className="absolute -bottom-4 left-[5%] right-[5%] h-8 bg-black/10 blur-xl rounded-full -z-10"></div>
                  
                  {/* Floor Plan Content */}
                  <div className="p-6 bg-gradient-to-b from-gray-50 to-white">
                    {/* Interactive Floor Plan Grid */}
                    <div className="grid grid-cols-3 gap-3">
                      {/* Main Room - Living Room */}
                      <motion.div 
                        className="col-span-2 relative bg-gradient-to-br from-[#ED7600]/15 to-[#ED7600]/5 rounded-xl p-4 h-36 flex items-center justify-center border-2 border-[#2F3D57] cursor-pointer overflow-hidden group"
                        whileHover={{ scale: 1.01, boxShadow: "0 8px 25px rgba(237,118,0,0.12)" }}
                        transition={{ duration: 0.2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleGenerateNow}
                      >
                        <motion.div 
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12"
                          animate={{ x: ['-200%', '200%'] }}
                          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
                        />
                        <span className="text-base font-bold text-[#2F3D57] relative z-10">LIVING ROOM</span>
                        <motion.div className="absolute bottom-2 right-2 bg-[#ED7600] text-white text-[9px] px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity font-medium"
                          style={{ position: 'relative' }} // Fix framer-motion positioning
                        >
                          Click to design
                        </motion.div>
                      </motion.div>
                      
                      {/* Side Column */}
                      <div className="space-y-3">
                        <motion.div 
                          className="relative bg-gradient-to-br from-[#2F3D57]/10 to-[#2F3D57]/5 rounded-xl p-2 h-[66px] flex items-center justify-center border-2 border-[#2F3D57] cursor-pointer"
                          style={{ position: 'relative' }} // Fix framer-motion positioning
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleGenerateNow}
                        >
                          <span className="text-xs font-bold text-[#2F3D57]">BEDROOM</span>
                        </motion.div>
                        <motion.div 
                          className="relative bg-gradient-to-br from-[#2F3D57]/15 to-[#2F3D57]/5 rounded-xl p-2 h-[66px] flex items-center justify-center border-2 border-[#2F3D57] cursor-pointer"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleGenerateNow}
                        >
                          <span className="text-xs font-bold text-[#2F3D57]">BATH</span>
                        </motion.div>
                      </div>
                      
                      {/* Bottom Row */}
                      <motion.div 
                        className="relative bg-gradient-to-br from-[#2F3D57]/8 to-transparent rounded-xl p-3 flex items-center justify-center border-2 border-[#2F3D57] cursor-pointer"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleGenerateNow}
                      >
                        <span className="text-xs font-bold text-[#2F3D57]">KITCHEN</span>
                      </motion.div>
                      <motion.div 
                        className="relative bg-gradient-to-br from-[#ED7600]/10 to-transparent rounded-xl p-3 flex items-center justify-center border-2 border-[#2F3D57] cursor-pointer"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleGenerateNow}
                      >
                        <span className="text-xs font-bold text-[#2F3D57]">DINING</span>
                      </motion.div>
                      <motion.div 
                        className="relative bg-gradient-to-br from-[#ED7600]/8 to-transparent rounded-xl p-3 flex items-center justify-center border-2 border-[#ED7600] border-dashed cursor-pointer group"
                        whileHover={{ scale: 1.02, borderStyle: 'solid' }}
                        transition={{ duration: 0.2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleGenerateNow}
                      >
                        <span className="text-xs font-bold text-[#ED7600] flex items-center gap-1">
                          <span className="text-sm">+</span> ADD
                        </span>
                      </motion.div>
                    </div>
                    
                    {/* Dimension Labels */}
                    <div className="flex justify-between mt-4 px-2">
                      <span className="text-xs text-gray-400 font-medium">40 Ã— 60 ft</span>
                      <span className="text-xs text-[#ED7600] font-semibold">2400 sq.ft</span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
            
            {/* Mobile Text (always visible on mobile) */}
            <div className="absolute bottom-8 left-0 right-0 text-center lg:hidden px-6">
              <motion.button
                onClick={handleGenerateNow}
                className="px-6 py-3 bg-[#ED7600] text-white rounded-full font-semibold shadow-xl shadow-orange-500/30 flex items-center gap-2 mx-auto"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaRocket />
                Start Designing
                <FaArrowRight />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ===== SECTION 3: FEATURES ===== */}
      <section id="features-section" className="min-h-screen relative py-24 bg-[#f8f9fa] overflow-hidden">
        {/* Dot Grid */}
        <div className="absolute inset-0 opacity-[0.3]" style={{
          backgroundImage: 'radial-gradient(circle, #2F3D57 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}></div>
        
        {/* Section Counter */}
        <SectionCounter number="03" />
        
        {/* Scroll Indicator */}
        <ScrollIndicator onClick={() => scrollToSection('ads-section')} />
          
          <div className="container mx-auto relative z-10">
            <AnimatedSection className="text-center mb-16">
              <motion.span 
                className="inline-block px-4 py-2 bg-[#ED7600]/10 text-[#ED7600] rounded-full text-sm font-semibold mb-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                What We Offer
              </motion.span>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-[#2F3D57] leading-tight">
                Platform <span className="text-gradient">Features</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Everything you need to design, validate, and approve your architectural project
              </p>
              <div className="w-24 h-1 bg-gradient-to-r from-[#ED7600] to-[#FF9933] mx-auto mt-6 rounded-full"></div>
            </AnimatedSection>

            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
            >
              {features.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <motion.div 
                    key={index} 
                    className="group relative bg-white p-8 rounded-3xl border border-gray-100 shadow-lg hover:shadow-2xl transition-all duration-500"
                    variants={scaleIn}
                    whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  >
                    {/* Hover gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#ED7600]/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    <div className="relative z-10">
                      <motion.div 
                        className="w-16 h-16 bg-gradient-to-br from-[#ED7600] to-[#FF9933] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-orange-500/20"
                        whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.5 } }}
                      >
                        <IconComponent className="text-white text-2xl" />
                      </motion.div>
                      <h3 className="text-2xl font-bold mb-4 text-[#2F3D57] group-hover:text-[#ED7600] transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed text-lg">{feature.description}</p>
                    </div>
                    
                    {/* Animated border on hover */}
                    <div className="absolute inset-0 rounded-3xl border-2 border-transparent group-hover:border-[#ED7600]/30 transition-colors duration-500"></div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
      </section>

      {/* ===== SECTION 4: FEATURED ADVERTISEMENTS ===== */}
      <section id="ads-section" className="min-h-screen relative py-24 bg-[#2F3D57] overflow-hidden">
        {/* Dot Grid */}
        <div className="absolute inset-0 opacity-[0.15]" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}></div>
        
        {/* Section Counter */}
        <SectionCounter number="04" light />
        
        {/* Background decoration */}
        <div className="absolute top-20 right-0 w-96 h-96 bg-[#ED7600]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-0 w-72 h-72 bg-[#FF9933]/10 rounded-full blur-3xl"></div>
          
          <div className="container mx-auto relative z-10">
            <AnimatedSection className="text-center mb-16">
              <motion.span 
                className="inline-block px-4 py-2 bg-[#ED7600]/20 text-[#ED7600] rounded-full text-sm font-semibold mb-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                Discover Properties
              </motion.span>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white leading-tight">
                Featured <span className="text-[#ED7600]">Advertisements</span>
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Click on any advertisement to visit the website
              </p>
              <div className="w-24 h-1 bg-gradient-to-r from-[#ED7600] to-[#FF9933] mx-auto mt-6 rounded-full"></div>
            </AnimatedSection>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <motion.div 
                  className="w-16 h-16 border-4 border-white/20 border-t-[#ED7600] rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              </div>
            ) : featuredAds.length > 0 ? (
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={staggerContainer}
              >
                {featuredAds.map((ad, index) => (
                  <motion.div 
                    key={ad._id} 
                    className="group relative rounded-3xl shadow-lg overflow-hidden cursor-pointer bg-white"
                    variants={scaleIn}
                    whileHover={{ y: -8, transition: { duration: 0.3 } }}
                    onClick={() => handleAdClick(ad)}
                  >
                    {/* Gradient border on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#ED7600] to-[#FF9933] rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-sm scale-105"></div>
                    
                    {/* Advertisement Poster/Banner */}
                    <div className="relative w-full h-[400px] overflow-hidden bg-gray-50 rounded-3xl">
                      {ad.featured_image ? (
                        <motion.img 
                          src={ad.featured_image} 
                          alt={ad.title}
                          className="w-full h-full object-contain transition-transform duration-500"
                          whileHover={{ scale: 1.05 }}
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23e5e7eb" width="400" height="400"/%3E%3Ctext fill="%23999" font-size="20" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3EAdvertisement%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                          <FaBullhorn className="text-6xl text-gray-400" />
                        </div>
                      )}
                      
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
                        <motion.span 
                          className="px-6 py-2 bg-white/90 backdrop-blur-sm rounded-full text-[#2F3D57] font-semibold flex items-center gap-2"
                          initial={{ y: 20, opacity: 0 }}
                          whileHover={{ y: 0, opacity: 1 }}
                        >
                          <FaEye /> View Details
                        </motion.span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                className="text-center py-20"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="text-6xl text-white/30 mb-4 flex justify-center">
                  <FaBuilding />
                </div>
                <h3 className="text-2xl font-bold text-white/70 mb-2">No Featured Properties Available</h3>
                <p className="text-gray-400">Check back later for exciting property opportunities!</p>
              </motion.div>
            )}
          </div>
      </section>

      {/* ===== CALL TO ACTION SECTION ===== */}
      <section className="relative py-32 bg-gradient-to-b from-[#2F3D57] via-[#3d4f6f] to-white overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full"
            style={{
              background: 'linear-gradient(135deg, #ED7600 0%, transparent 70%)',
              filter: 'blur(80px)',
              opacity: 0.3
            }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 6, repeat: Infinity }}
          />
          <motion.div 
            className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full"
            style={{
              background: 'linear-gradient(135deg, #FF9933 0%, transparent 70%)',
              filter: 'blur(60px)',
              opacity: 0.2
            }}
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
        </div>
        
        <div className="container mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-8">
              Are you ready to take the first step and<br />
              <span className="text-[#ED7600]">start your journey today?</span>
            </h2>
            <motion.button
              onClick={handleGenerateNow}
              className="px-10 py-5 bg-[#ED7600] text-white rounded-full font-semibold text-lg shadow-2xl shadow-orange-500/30 hover:bg-[#d66a00] transition-all"
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Advertisement Details Modal */}
      {showDetailModal && selectedAd && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50" onClick={() => setShowDetailModal(false)}>
          <div className="relative max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button
              onClick={() => setShowDetailModal(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 text-3xl font-bold z-10"
            >
              âœ–
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
          <motion.div 
            className="relative max-w-lg w-80 overflow-hidden"
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 30, duration: 0.4 }}
          >
            {/* Glassmorphism container with advanced backdrop */}
            <div className="relative bg-gradient-to-br from-white/95 via-white/90 to-white/85 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 overflow-hidden">
              
              {/* Animated background particles */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                  className="absolute -top-12 -right-12 w-24 h-24 bg-gradient-to-br from-[#ED7600]/20 to-[#FF9933]/20 rounded-full blur-xl"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3],
                    rotate: [0, 180, 360]
                  }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                  className="absolute -bottom-8 -left-8 w-20 h-20 bg-gradient-to-br from-blue-500/15 to-purple-500/15 rounded-full blur-xl"
                  animate={{ 
                    scale: [1, 1.3, 1],
                    opacity: [0.2, 0.5, 0.2],
                    rotate: [360, 180, 0]
                  }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                />
              </div>

              {/* Premium gradient top border */}
              <div className="absolute top-0 left-0 right-0">
                <div className="h-1 bg-gradient-to-r from-transparent via-[#ED7600] to-[#FF9933]"></div>
                <motion.div 
                  className="h-0.5 bg-gradient-to-r from-[#FFD700] via-[#FF9933] to-[#ED7600]"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
              </div>
              
              {/* Header with navigation */}
              <div className="flex items-center justify-between p-5 pb-3 relative z-10">
                <div className="flex items-center space-x-3">
                  {allAds.length > 1 && (
                    <>
                      <motion.button
                        onClick={goToPrevAd}
                        className="group relative overflow-hidden p-2.5 bg-gradient-to-r from-gray-100/80 to-gray-50/80 hover:from-[#ED7600] hover:to-[#FF9933] rounded-xl text-[#2F3D57] hover:text-white transition-all duration-500 backdrop-blur-sm border border-gray-200/50"
                        title="Previous Ad"
                        whileHover={{ scale: 1.02, rotateY: -3 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <motion.span
                          className="block"
                          whileHover={{ x: -2 }}
                          transition={{ duration: 0.2 }}
                        >
                          â†
                        </motion.span>
                        <div className="absolute inset-0 bg-gradient-to-r from-[#ED7600]/10 to-[#FF9933]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </motion.button>
                      
                      <div className="px-3 py-1.5 bg-gradient-to-r from-[#f8f9fa]/80 to-[#e9ecef]/80 rounded-full backdrop-blur-sm border border-gray-200/30">
                        <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ED7600] to-[#FF9933]">
                          {currentAdIndex + 1} / {allAds.length}
                        </span>
                      </div>
                      
                      <motion.button
                        onClick={goToNextAd}
                        className="group relative overflow-hidden p-2.5 bg-gradient-to-r from-gray-100/80 to-gray-50/80 hover:from-[#ED7600] hover:to-[#FF9933] rounded-xl text-[#2F3D57] hover:text-white transition-all duration-500 backdrop-blur-sm border border-gray-200/50"
                        title="Next Ad"
                        whileHover={{ scale: 1.02, rotateY: 3 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <motion.span
                          className="block"
                          whileHover={{ x: 2 }}
                          transition={{ duration: 0.2 }}
                        >
                          â†’
                        </motion.span>
                        <div className="absolute inset-0 bg-gradient-to-r from-[#ED7600]/10 to-[#FF9933]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </motion.button>
                    </>
                  )}
                </div>
                
                <motion.button
                  onClick={closePopup}
                  className="group relative overflow-hidden p-2.5 bg-gradient-to-r from-red-50/80 to-red-100/80 hover:from-red-500 hover:to-red-600 rounded-xl text-red-400 hover:text-white transition-all duration-500 backdrop-blur-sm border border-red-200/30"
                  whileHover={{ 
                    scale: 1.05, 
                    rotate: 90,
                    boxShadow: "0 0 20px rgba(239, 68, 68, 0.4)"
                  }}
                  whileTap={{ scale: 0.9 }}
                >
                  <span className="relative z-10 text-sm font-bold">âœ•</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-red-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </motion.button>
              </div>

              {/* Premium Ad indicators */}
              {allAds.length > 1 && (
                <div className="flex justify-center px-5 pb-4 space-x-2">
                  {allAds.map((_, index) => (
                    <motion.button
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
                      className={`relative overflow-hidden rounded-full transition-all duration-500 ${
                        index === currentAdIndex 
                          ? 'h-2.5 w-8 bg-gradient-to-r from-[#ED7600] via-[#FF9933] to-[#FFD700] shadow-lg shadow-orange-500/40' 
                          : 'h-2 w-2 bg-gradient-to-r from-gray-300/60 to-gray-400/60 hover:from-gray-400/80 hover:to-gray-500/80 backdrop-blur-sm'
                      }`}
                      whileHover={{ 
                        scale: index === currentAdIndex ? 1.05 : 1.3,
                        boxShadow: index === currentAdIndex ? "0 0 15px rgba(237, 118, 0, 0.6)" : "0 0 10px rgba(156, 163, 175, 0.4)"
                      }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {index === currentAdIndex && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent rounded-full"
                          initial={{ x: "-100%" }}
                          animate={{ x: "100%" }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        />
                      )}
                    </motion.button>
                  ))}
                </div>
              )}
              
              {/* Premium Advertisement Image Container */}
              {advertisement.image && (
                <motion.div 
                  className="relative w-full cursor-pointer overflow-hidden mx-4 mb-4 rounded-2xl bg-gradient-to-br from-gray-50/50 to-gray-100/50 backdrop-blur-sm border border-white/30"
                  onClick={() => {
                    if (randomAd) {
                      handleAdClick(randomAd);
                    }
                    closePopup();
                  }}
                  whileHover={{ 
                    scale: 1.02, 
                    rotateY: 1,
                    boxShadow: "0 25px 50px rgba(0, 0, 0, 0.15)"
                  }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  {/* Image glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#ED7600]/5 via-transparent to-[#FF9933]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <img 
                    src={advertisement.image} 
                    alt={advertisement.title}
                    className="w-full h-48 object-cover rounded-2xl relative z-10"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  
                  {/* Hover overlay */}
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-2xl flex items-center justify-center"
                    whileHover={{ opacity: 1 }}
                  >
                    <motion.div 
                      className="text-white text-sm font-semibold bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full"
                      initial={{ y: 10, opacity: 0 }}
                      whileHover={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      Click to explore â†’
                    </motion.div>
                  </motion.div>
                </motion.div>
              )}

              {/* Premium Footer with enhanced styling */}
              <div className="relative p-4 pt-3">
                {/* Background glow */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-50/80 via-white/60 to-transparent backdrop-blur-sm" />
                
                <div className="relative z-10">
                  <motion.h3 
                    className="font-bold text-lg mb-3 text-transparent bg-clip-text bg-gradient-to-r from-[#2F3D57] via-[#1e2a3a] to-[#2F3D57] break-words hyphens-auto leading-tight"
                    style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    {advertisement.title}
                  </motion.h3>
                  
                  <motion.p 
                    className="text-gray-600 mb-4 text-sm leading-relaxed"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    {advertisement.message}
                  </motion.p>

                  <div className="flex gap-3">
                    <motion.button
                      onClick={() => {
                        if (randomAd) {
                          handleAdClick(randomAd);
                        }
                        closePopup();
                      }}
                      className="group relative overflow-hidden flex-1 bg-gradient-to-r from-[#ED7600] to-[#FF9933] hover:from-[#FF9933] hover:to-[#FFD700] text-white py-2.5 px-4 rounded-2xl text-sm font-bold transition-all duration-500 flex items-center justify-center gap-2 border border-orange-200/30"
                      whileHover={{ 
                        scale: 1.02,
                        boxShadow: "0 10px 25px rgba(237, 118, 0, 0.4)",
                        rotateX: -2
                      }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                    >
                      {/* Button glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <motion.div
                        whileHover={{ rotate: 15, scale: 1.1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <FaBullhorn />
                      </motion.div>
                      <span className="relative z-10">Learn More</span>
                      
                      {/* Animated border */}
                      <motion.div
                        className="absolute inset-0 rounded-2xl border-2 border-white/30 opacity-0 group-hover:opacity-100"
                        initial={{ scale: 1.1 }}
                        whileHover={{ scale: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    </motion.button>
                    
                    <motion.button
                      onClick={() => {
                        if (advertisement.id) {
                          handleViewClick(advertisement.id);
                        }
                        closePopup();
                      }}
                      className="group relative overflow-hidden flex-1 bg-gradient-to-r from-[#2F3D57] to-[#1e2a3a] hover:from-[#1e2a3a] hover:to-[#0f1419] text-white py-2.5 px-4 rounded-2xl text-sm font-bold transition-all duration-500 flex items-center justify-center gap-2 border border-gray-500/20"
                      whileHover={{ 
                        scale: 1.02,
                        boxShadow: "0 10px 25px rgba(47, 61, 87, 0.4)",
                        rotateX: -2
                      }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                    >
                      {/* Button glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <FaEye />
                      </motion.div>
                      <span className="relative z-10">View Details</span>
                      
                      {/* Animated border */}
                      <motion.div
                        className="absolute inset-0 rounded-2xl border-2 border-white/20 opacity-0 group-hover:opacity-100"
                        initial={{ scale: 1.1 }}
                        whileHover={{ scale: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Enhanced Reopen Button */}
        {!showPopup && advertisement && (
          <motion.button
            onClick={() => setShowPopup(true)}
            className="group relative overflow-hidden bg-gradient-to-br from-[#ED7600] via-[#FF9933] to-[#FFD700] text-white p-5 rounded-3xl shadow-xl hover:shadow-2xl border-2 border-white/20 backdrop-blur-sm"
            title="View Premium Advertisements"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            whileHover={{ 
              scale: 1.1, 
              rotate: 5,
              boxShadow: "0 20px 40px rgba(237, 118, 0, 0.4)"
            }}
            whileTap={{ scale: 0.9 }}
            transition={{ 
              type: "spring", 
              stiffness: 200, 
              damping: 15,
              duration: 0.6 
            }}
          >
            {/* Animated pulse rings */}
            <motion.span 
              className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#ED7600] to-[#FF9933] opacity-30"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.span 
              className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#FF9933] to-[#FFD700] opacity-20"
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            />
            
            {/* Glowing border effect */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 via-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Icon with enhanced animation */}
            <motion.div
              className="relative z-10"
              whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
              transition={{ duration: 0.5 }}
            >
              <FaBullhorn className="text-2xl drop-shadow-lg" />
            </motion.div>
            
            {/* Floating notification badge */}
            <motion.div
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white shadow-lg"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.2 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 500, damping: 15 }}
            >
              {allAds.length || 1}
            </motion.div>
            
            {/* Sparkle effect */}
            <motion.div
              className="absolute top-2 right-2 w-1 h-1 bg-white rounded-full"
              animate={{ 
                opacity: [0, 1, 0],
                scale: [0, 1, 0]
              }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
            />
          </motion.button>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default HomePage;
