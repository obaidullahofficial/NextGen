// src/pages/user/SocietyPlots.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/user/Navbar';
import Footer from '../../components/user/Footer';
import { FaMapMarkerAlt, FaStar, FaHome } from 'react-icons/fa';
import userProfileAPI from '../../services/userProfileAPI';
import reviewAPI from '../../services/reviewAPI';
import { useAuth } from '../../context/AuthContext';

// Import society images to use in the hero section
import bahria from '../../assets/bahria.png';


const SocietyPlots = () => {
    const { societyId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [plots, setPlots] = useState([]);
    const [plotSearch, setPlotSearch] = useState("");
    const [searchFilterType, setSearchFilterType] = useState("plot_number"); // 'plot_number' or 'plot_size'
    const [currentSociety, setCurrentSociety] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
    const [submittingReview, setSubmittingReview] = useState(false);

    // Fetch society and plots data from backend
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                
                // Fetch all societies to find current one
                const societiesResponse = await userProfileAPI.getSocieties();
                const society = societiesResponse.societies?.find(s => s._id === societyId);
                
                if (society) {
                    setCurrentSociety({
                        id: society._id,
                        name: society.name,
                        description: society.description,
                        image: society.society_logo || bahria, // Use base64 logo from society_logo field
                        rating: society.rating || 4.5,
                        location: society.location,
                        availablePlots: 0, // Will be calculated from plots
                    });
                    
                    // Fetch plots for this society - backend returns array directly
                    const plotsData = await userProfileAPI.getPlotsBySociety(societyId);
                    // plotsData is an array of plots
                    if (Array.isArray(plotsData)) {
                        setPlots(plotsData);
                        // Update available plots count
                        const availableCount = plotsData.filter(p => p.status?.toLowerCase() === 'available').length;
                        setCurrentSociety(prev => ({ ...prev, availablePlots: availableCount }));
                    } else {
                        setPlots([]);
                    }
                } else {
                    setError('Society not found');
                }
            } catch (err) {
                console.error('Error fetching data:', err);
                setError(err.message || 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [societyId]);

    // Fetch reviews for this society
    useEffect(() => {
        const fetchReviews = async () => {
            try {
                setReviewsLoading(true);
                const response = await reviewAPI.getReviewsByPlot(societyId);
                if (response.success) {
                    setReviews(response.data || []);
                }
            } catch (err) {
                console.error('Error fetching reviews:', err);
            } finally {
                setReviewsLoading(false);
            }
        };

        if (societyId) {
            fetchReviews();
        }
    }, [societyId]);

    // Handle review submission
    const handleSubmitReview = async (e) => {
        e.preventDefault();
        
        if (!user) {
            alert('Please login to submit a review');
            navigate('/login');
            return;
        }

        if (!newReview.comment.trim()) {
            alert('Please write a comment');
            return;
        }

        try {
            setSubmittingReview(true);
            
            // Check if token exists
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Your session has expired. Please login again.');
                navigate('/login');
                return;
            }
            
            const response = await reviewAPI.createReview({
                plot_id: societyId,
                rating: newReview.rating,
                comment: newReview.comment
            });

            if (response.success) {
                alert('Review submitted successfully!');
                setNewReview({ rating: 5, comment: '' });
                // Refresh reviews
                const reviewsResponse = await reviewAPI.getReviewsByPlot(societyId);
                if (reviewsResponse.success) {
                    setReviews(reviewsResponse.data || []);
                }
            } else {
                // Check if token expired or unauthorized
                if (response.expired || response.error?.toLowerCase().includes('expired') || 
                    response.error?.toLowerCase().includes('unauthorized')) {
                    alert('Your login session has expired. Please login again to submit a review.');
                    // Clear user state
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    navigate('/login');
                } else {
                    alert(response.error || 'Failed to submit review');
                }
            }
        } catch (err) {
            console.error('Error submitting review:', err);
            alert('Failed to submit review. Please try again.');
        } finally {
            setSubmittingReview(false);
        }
    };

    // Handle loading state
    if (loading) {
        return (
            <div className="bg-white min-h-screen">
                <Navbar />
                <div className="container mx-auto px-4 py-16 text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#ED7600]"></div>
                    <p className="mt-4 text-lg text-gray-600">Loading plots...</p>
                </div>
                <Footer />
            </div>
        );
    }

    // Handle error state
    if (error) {
        return (
            <div className="bg-white min-h-screen">
                <Navbar />
                <div className="container mx-auto px-4 py-16 text-center">
                    <h1 className="text-4xl font-bold text-red-600">Error Loading Plots</h1>
                    <p className="mt-4 text-lg text-gray-600">{error}</p>
                    <button
                        onClick={() => navigate('/societies')}
                        className="mt-6 px-6 py-3 bg-[#ED7600] text-white rounded-lg hover:bg-[#D56900] transition"
                    >
                        Back to Societies
                    </button>
                </div>
                <Footer />
            </div>
        );
    }

    // Handle case where society is not found
    if (!currentSociety) {
        return (
            <div className="bg-white min-h-screen">
                <Navbar />
                <div className="container mx-auto px-4 py-16 text-center">
                    <h1 className="text-4xl font-bold text-gray-800">Society Not Found</h1>
                    <p className="mt-4 text-lg text-gray-600">The society you are looking for does not exist.</p>
                    <button
                        onClick={() => navigate('/societies')}
                        className="mt-6 px-6 py-3 bg-[#ED7600] text-white rounded-lg hover:bg-[#D56900] transition"
                    >
                        Back to Societies
                    </button>
                </div>
                <Footer />
            </div>
        );
    }
 
    const handleViewPlotDetail = (plotId) => {
        navigate(`/societies/${societyId}/plots/${plotId}`);
    };

    return (
        <div className="bg-white">
            <div className="fixed top-0 left-0 w-full z-50">
                <Navbar />
            </div>

            <main className="pt-16 min-h-screen bg-gray-100">
                {/* Dynamic Hero Section */}
                <section className="bg-[#2F3D57] text-white py-12 md:py-16">
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
                            <div className="md:w-1/3 relative">
                                <img
                                    src={currentSociety.image}
                                    alt={currentSociety.name}
                                    className="w-full rounded-2xl shadow-2xl border-2 border-white/20"
                                />
                                {/* Rating Badge */}
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-2 shadow-lg">
                                    <FaStar className="text-yellow-500" />
                                    <span className="text-gray-800 font-bold">{currentSociety.rating}</span>
                                </div>
                            </div>
                            <div className="md:w-2/3 space-y-4 md:space-y-6">
                                <h1 className="text-4xl md:text-5xl font-bold text-[#ED7600] leading-tight">
                                    Plots in {currentSociety.name}
                                </h1>
                                <p className="text-lg md:text-xl text-gray-200 leading-relaxed">
                                    {currentSociety.description}
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-2">
                                        <FaMapMarkerAlt className="text-white text-xl" />
                                        <span className="text-lg text-gray-200 font-medium">Location: {currentSociety.location}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <FaHome className="text-white text-xl" />
                                        <span className="text-lg text-gray-200 font-medium">Available Plots: {currentSociety.availablePlots}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Plots Section */}
                <section className="container mx-auto px-4 py-8">
                    <h2 className="text-3xl font-bold text-[#2F3D57] mb-6">
                        Available Plots
                    </h2>
                    {/* Search Bar with Filter Options */}
                    <div className="mb-6 flex flex-col md:flex-row items-start md:items-center gap-3">
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <select
                                value={searchFilterType}
                                onChange={e => {
                                    setSearchFilterType(e.target.value);
                                    setPlotSearch(""); // Clear search when filter type changes
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ED7600] focus:border-[#ED7600] outline-none bg-white min-w-[140px]"
                            >
                                <option value="plot_number">Plot Number</option>
                                <option value="plot_size">Plot Size</option>
                            </select>
                            <input
                                type="text"
                                value={plotSearch}
                                onChange={e => setPlotSearch(e.target.value)}
                                placeholder={searchFilterType === 'plot_number' ? 'Search by plot number...' : 'Search by plot size (e.g., 5 Marla)...'}
                                className="flex-1 md:w-80 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ED7600] focus:border-[#ED7600] outline-none"
                            />
                        </div>
                    </div>
                    {plots.length === 0 ? (
                        <div className="col-span-full text-center py-12">
                            <p className="text-gray-600 text-lg">No plots available for this society yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {plots
                                .filter(plot => {
                                    if (plotSearch.trim() === "") return true;
                                    const searchTerm = plotSearch.trim().toLowerCase();
                                    
                                    if (searchFilterType === 'plot_number') {
                                        return plot.plot_number && 
                                            plot.plot_number.toString().toLowerCase().includes(searchTerm);
                                    } else if (searchFilterType === 'plot_size') {
                                        return plot.marla_size && 
                                            plot.marla_size.toString().toLowerCase().includes(searchTerm);
                                    }
                                    
                                    return false;
                                })
                                .map((plot) => (
                                <div key={plot.plot_id || plot._id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="text-xl font-bold text-[#ED7600]">Plot {plot.plot_number}</h3>
                                            <span className={`px-3 py-1 rounded-full text-xs ${
                                                plot.status?.toLowerCase() === 'available' ? 'bg-green-100 text-green-800' :
                                                plot.status?.toLowerCase() === 'sold' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {plot.status}
                                            </span>
                                        </div>
                                        
                                        <div className="space-y-2 mb-4">
                                            {plot.dimension_x && plot.dimension_y && (
                                                <p><span className="font-medium">Dimensions:</span> {plot.dimension_x} Ã— {plot.dimension_y}</p>
                                            )}
                                            {plot.area && (
                                                <p><span className="font-medium">Area:</span> {plot.area}</p>
                                            )}
                                            {plot.marla_size && (
                                                <p><span className="font-medium">Plot Size:</span> {plot.marla_size}</p>
                                            )}
                                            <p><span className="font-medium">Price:</span> PKR {plot.price}</p>
                                            {plot.type && (
                                                <p><span className="font-medium">Type:</span> {plot.type}</p>
                                            )}
                                            {plot.location && (
                                                <p className="text-gray-600">{plot.location}</p>
                                            )}
                                            {plot.description && Array.isArray(plot.description) && plot.description.length > 0 && (
                                                <p className="text-gray-600">{plot.description[0]}</p>
                                            )}
                                        </div>
                                    
                                    <button
                                        onClick={() => handleViewPlotDetail(plot.plot_id || plot._id)}
                                        disabled={plot.status?.toLowerCase() === 'sold'}
                                        className={`w-full py-2 px-4 rounded-md font-medium ${
                                            plot.status?.toLowerCase() === 'available'
                                                ? 'bg-[#ED7600] hover:bg-[#d96b00] text-white'
                                                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                        }`}
                                    >
                                        {plot.status?.toLowerCase() === 'available' ? 'View Plot Detail' : 'Plot Sold'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    )}
                </section>

                {/* Reviews Section */}
                <section className="bg-gray-100 py-12 md:py-16">
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="text-center mb-8 md:mb-12">
                            <h2 className="text-3xl font-bold text-[#2F3D57]">Customer Reviews</h2>
                            <p className="text-gray-600 mt-2">Hear what people are saying about {currentSociety.name}.</p>
                        </div>

                        {/* Review Submission Form - Only for logged in users */}
                        {user && (
                            <div className="max-w-2xl mx-auto mb-12 bg-white p-6 rounded-lg shadow-md border border-gray-200">
                                <h3 className="text-xl font-bold text-[#2F3D57] mb-4">Write a Review</h3>
                                <form onSubmit={handleSubmitReview}>
                                    <div className="mb-4">
                                        <label className="block text-gray-700 font-medium mb-2">Rating</label>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setNewReview({ ...newReview, rating: star })}
                                                    className="text-3xl focus:outline-none transition-colors"
                                                >
                                                    <FaStar className={star <= newReview.rating ? 'text-yellow-400' : 'text-gray-300'} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-gray-700 font-medium mb-2">Your Review</label>
                                        <textarea
                                            value={newReview.comment}
                                            onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ED7600]"
                                            rows="4"
                                            placeholder="Share your experience with this society..."
                                            required
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={submittingReview}
                                        className="w-full bg-[#ED7600] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#d66a00] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    >
                                        {submittingReview ? 'Submitting...' : 'Submit Review'}
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* Display Reviews */}
                        {reviewsLoading ? (
                            <div className="text-center py-8">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#ED7600]"></div>
                            </div>
                        ) : reviews.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {reviews.map((review) => (
                                    <div key={review._id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="flex text-yellow-400">
                                                {Array.from({ length: review.rating }, (_, i) => (
                                                    <FaStar key={i} />
                                                ))}
                                            </div>
                                            <span className="text-gray-600 text-sm">
                                                {new Date(review.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-gray-800 italic mb-4">"{review.comment}"</p>
                                        <p className="font-bold text-[#2F3D57]">- {review.user_email}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-600">
                                <p className="text-lg">No reviews yet. Be the first to review {currentSociety.name}!</p>
                            </div>
                        )}
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default SocietyPlots;
