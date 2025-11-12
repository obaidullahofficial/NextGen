// src/pages/user/SocietyPlots.jsx

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/user/Navbar';
import Footer from '../../components/user/Footer';
import { FaMapMarkerAlt, FaStar, FaHome } from 'react-icons/fa';

// Import society images to use in the hero section
import bahria from '../../assets/bahria.png';
import cda from '../../assets/CDA.png';
import ghauri from '../../assets/Ghauri.png';

const SocietyPlots = () => {
    const { societyId } = useParams();
    const navigate = useNavigate();

    // Replicate the societies data to find the matching society
    const societiesData = [
        {
            id: '1',
            name: 'Bahria Town',
            description: 'Bahria Town develops to be the greatest practical real estate developer of all times, with pioneer interest for aviation and engineering, at major business with small-scale amenities.',
            image: bahria,
            rating: 4.8,
            location: 'Rawalpindi/Lahore',
            availablePlots: 85,
        },
        {
            id: '2',
            name: 'CDA',
            description: 'Capital Development Authority: A cornerstone of modern business culture, offering prime locations, advanced operations, and catering to diverse needs with excellence.',
            image: cda,
            rating: 4.6,
            location: 'Islamabad',
            availablePlots: 45,
        },
        {
            id: '3',
            name: 'Ghauri Town',
            description: 'Ghauri Town offers affordable housing with easy accessibility, continuous innovation in infrastructure, and essential amenities for residents.',
            image: ghauri,
            rating: 4.3,
            location: 'Islamabad',
            availablePlots: 120,
        },
    ];

    const currentSociety = societiesData.find(s => s.id === societyId);

    // Sample plot data - replace with API call
    const plots = [
        { id: 'A-101', number: 'A-101', status: 'Available', dimensions: '30 × 60', area: '1,800 sq ft', price: 'PKR 50 Lakh', description: 'Corner plot with park view' },
        { id: 'A-102', number: 'A-102', status: 'Sold', dimensions: '25 × 50', area: '1,250 sq ft', price: 'PKR 45 Lakh', description: 'Main road facing' },
        { id: 'A-104', number: 'A-104', status: 'Sold', dimensions: '25 × 70', area: '1,650 sq ft', price: 'PKR 35 Lakh', description: 'Middle road facing' },
        { id: 'A-105', number: 'A-105', status: 'Available', dimensions: '25 × 70', area: '1,650 sq ft', price: 'PKR 35 Lakh', description: 'Middle road facing' }
    ];

    // Sample reviews data - THIS WAS MISSING
    const reviews = [
        {
            id: 1,
            author: 'Ahmed Khan',
            comment: 'Great society with excellent amenities and a peaceful environment. The process of buying a plot was smooth and transparent.',
            rating: 5,
            date: '2023-10-25'
        },
        {
            id: 2,
            author: 'Sara Ali',
            comment: 'I am very happy with my plot purchase. The staff was helpful and provided all the necessary information.',
            rating: 4,
            date: '2023-09-18'
        },
        {
            id: 3,
            author: 'Usman Javed',
            comment: 'The location is perfect, and the price was reasonable for the plot size. Highly recommended!',
            rating: 5,
            date: '2023-08-01'
        },
    ];

    // Handle case where society is not found
    if (!currentSociety) {
        return (
            <div className="bg-white min-h-screen">
                <Navbar />
                <div className="container mx-auto px-4 py-16 text-center">
                    <h1 className="text-4xl font-bold text-gray-800">Society Not Found</h1>
                    <p className="mt-4 text-lg text-gray-600">The society you are looking for does not exist.</p>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {plots.map((plot) => (
                            <div key={plot.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-xl font-bold text-[#ED7600]">Plot {plot.number}</h3>
                                        <span className={`px-3 py-1 rounded-full text-xs ${
                                            plot.status.trim() === 'Available' ? 'bg-green-100 text-green-800' :
                                            plot.status.trim() === 'Sold' ? 'bg-red-100 text-red-800' :
                                            'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {plot.status}
                                        </span>
                                    </div>
                                    
                                    <div className="space-y-2 mb-4">
                                        <p><span className="font-medium">Dimensions:</span> {plot.dimensions}</p>
                                        <p><span className="font-medium">Area:</span> {plot.area}</p>
                                        <p><span className="font-medium">Price:</span> {plot.price}</p>
                                        <p className="text-gray-600">{plot.description}</p>
                                    </div>
                                    
                                    <button
                                        onClick={() => handleViewPlotDetail(plot.id)}
                                        disabled={plot.status.trim() === 'Sold'}
                                        className={`w-full py-2 px-4 rounded-md font-medium ${
                                            plot.status.trim() === 'Available'
                                                ? 'bg-[#ED7600] hover:bg-[#d96b00] text-white'
                                                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                        }`}
                                    >
                                        {plot.status.trim() === 'Available' ? 'View Plot Detail' : 'Plot Sold'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Reviews Section */}
                <section className="bg-gray-100 py-12 md:py-16">
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="text-center mb-8 md:mb-12">
                            <h2 className="text-3xl font-bold text-[#2F3D57]">Customer Reviews</h2>
                            <p className="text-gray-600 mt-2">Hear what people are saying about {currentSociety.name}.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {reviews.map((review) => (
                                <div key={review.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="flex text-yellow-400">
                                            {Array.from({ length: review.rating }, (_, i) => (
                                                <FaStar key={i} />
                                            ))}
                                        </div>
                                        <span className="text-gray-600 text-sm">{review.date}</span>
                                    </div>
                                    <p className="text-gray-800 italic mb-4">"{review.comment}"</p>
                                    <p className="font-bold text-[#2F3D57]">- {review.author}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default SocietyPlots;