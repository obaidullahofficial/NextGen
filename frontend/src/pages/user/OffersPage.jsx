import React, { useState, useEffect } from 'react';
import Navbar from '../../components/user/Navbar';
import Footer from '../../components/user/Footer';
import advertisementAPI from '../../services/advertisementAPI';
import { FaMapMarkerAlt, FaTag, FaCalendarAlt } from 'react-icons/fa';

const OffersPage = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, featured
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchOffers();
  }, [filter]);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      let response;
      
      if (filter === 'featured') {
        // Fetch only featured advertisements
        response = await advertisementAPI.getFeaturedAdvertisements(50);
      } else if (filter === 'active') {
        // Fetch only active advertisements
        response = await advertisementAPI.getAllAdvertisements({ status: 'active' });
      } else {
        // Fetch all advertisements from database
        response = await advertisementAPI.getAllAdvertisements();
      }
      
      if (response.success) {
        setOffers(response.data || []);
      } else {
        console.error('Failed to fetch offers:', response.error);
        setOffers([]);
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleOfferClick = (offer) => {
    setSelectedOffer(offer);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOffer(null);
  };

  return (
    <div className="bg-white min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#2F3D57] to-[#1E2936] text-white py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Special <span className="text-[#ED7600]">Offers</span> & Deals
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
            Discover exclusive promotions, discounts, and featured properties from top societies
          </p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-wrap gap-4 justify-center mb-8">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-2 rounded-full font-medium transition-colors ${
              filter === 'all'
                ? 'bg-[#ED7600] text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Offers
          </button>
          <button
            onClick={() => setFilter('featured')}
            className={`px-6 py-2 rounded-full font-medium transition-colors ${
              filter === 'featured'
                ? 'bg-[#ED7600] text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Featured
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-6 py-2 rounded-full font-medium transition-colors ${
              filter === 'active'
                ? 'bg-[#ED7600] text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Active Deals
          </button>
        </div>

        {/* Offers Grid */}
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#ED7600]"></div>
            <p className="mt-4 text-gray-600">Loading offers...</p>
          </div>
        ) : offers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offers.map((offer) => (
              <div
                key={offer._id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all border border-gray-200 overflow-hidden"
              >
                {/* Header with Featured Badge and Status */}
                <div className="relative">
                  {offer.is_featured && (
                    <div className="absolute top-3 left-3 bg-[#ED7600] text-white text-xs font-bold px-3 py-1 rounded-md flex items-center z-10">
                      â­ Featured
                    </div>
                  )}
                  {offer.status && (
                    <div className={`absolute top-3 right-3 text-xs font-semibold px-3 py-1 rounded-md z-10 ${
                      offer.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  {/* Title */}
                  <h3 className="text-xl font-bold text-[#2F3D57] mb-2">
                    {offer.title}
                  </h3>

                  {/* Location */}
                  {offer.location && (
                    <div className="flex items-center text-sm text-[#ED7600] mb-3">
                      <FaMapMarkerAlt className="mr-1" />
                      <span>{offer.location}</span>
                    </div>
                  )}

                  {/* Available Plot Sizes */}
                  {offer.plot_sizes && offer.plot_sizes.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-gray-700 mb-1">Available Plot Sizes:</p>
                      <div className="flex flex-wrap gap-2">
                        {offer.plot_sizes.map((size, idx) => (
                          <span key={idx} className="bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full">
                            {size}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Price Information */}
                  {(offer.price_range || offer.price) && (
                    <div className="bg-[#ED7600] text-white p-3 rounded-lg mb-3">
                      <p className="text-lg font-bold">
                        {offer.price_range || offer.price}
                      </p>
                      {offer.installment_available && (
                        <p className="text-xs mt-1">Installments Available</p>
                      )}
                    </div>
                  )}

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {offer.description || 'for sale by bhai'}
                  </p>

                  {/* Facilities */}
                  {offer.facilities && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-700 mb-1">Facilities:</p>
                      <div className="bg-gray-50 px-3 py-2 rounded text-xs text-gray-600">
                        {offer.facilities}
                      </div>
                    </div>
                  )}

                  {/* Additional Information */}
                  <div className="mb-4 text-xs text-gray-500 space-y-1">
                    {offer.possession && <p><strong>Possession:</strong> {offer.possession}</p>}
                    {offer.views !== undefined && <p><strong>Views:</strong> {offer.views}</p>}
                    {offer.inquiries !== undefined && <p><strong>Inquiries:</strong> {offer.inquiries}</p>}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOfferClick(offer)}
                      className="flex-1 bg-[#2F3D57] text-white text-center py-2 rounded-lg font-semibold hover:bg-[#1E2936] transition-colors flex items-center justify-center"
                    >
                      ðŸ‘ï¸ View Details
                    </button>
                    {offer.contact_info && (
                      <a
                        href={`mailto:${offer.contact_info}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 bg-[#ED7600] text-white text-center py-2 rounded-lg font-semibold hover:bg-[#d66a00] transition-colors flex items-center justify-center"
                      >
                        ðŸ“ž Contact
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <FaTag className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Offers Available</h3>
            <p className="text-gray-600">
              Check back later for exciting deals and promotions!
            </p>
          </div>
        )}
      </div>

      {/* Offer Details Modal */}
      {showModal && selectedOffer && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div 
            className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-[#2F3D57]">Offer Details</h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 text-3xl font-bold leading-none"
              >
                Ã—
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Featured Badge */}
              {selectedOffer.is_featured && (
                <div className="inline-block bg-[#ED7600] text-white text-sm font-bold px-4 py-1 rounded-full mb-4">
                  FEATURED OFFER
                </div>
              )}

              {/* Image */}
              {selectedOffer.image_url && (
                <div className="mb-6 rounded-lg overflow-hidden">
                  <img
                    src={selectedOffer.image_url.startsWith('http') 
                      ? selectedOffer.image_url 
                      : `https://nextgen-ta95.onrender.com${selectedOffer.image_url}`}
                    alt={selectedOffer.title}
                    className="w-full h-64 object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Title */}
              <h3 className="text-2xl font-bold text-[#2F3D57] mb-4">
                {selectedOffer.title}
              </h3>

              {/* Description */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-700 mb-2">Description</h4>
                <p className="text-gray-600 whitespace-pre-line">
                  {selectedOffer.description || 'No description provided.'}
                </p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {selectedOffer.location && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center text-gray-700 mb-1">
                      <FaMapMarkerAlt className="mr-2 text-[#ED7600]" />
                      <span className="font-semibold">Location</span>
                    </div>
                    <p className="text-gray-600 ml-6">{selectedOffer.location}</p>
                  </div>
                )}

                {selectedOffer.status && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center text-gray-700 mb-1">
                      <FaTag className="mr-2 text-[#ED7600]" />
                      <span className="font-semibold">Status</span>
                    </div>
                    <p className="text-gray-600 ml-6 capitalize">{selectedOffer.status}</p>
                  </div>
                )}

                {selectedOffer.start_date && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center text-gray-700 mb-1">
                      <FaCalendarAlt className="mr-2 text-[#ED7600]" />
                      <span className="font-semibold">Start Date</span>
                    </div>
                    <p className="text-gray-600 ml-6">{formatDate(selectedOffer.start_date)}</p>
                  </div>
                )}

                {selectedOffer.end_date && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center text-gray-700 mb-1">
                      <FaCalendarAlt className="mr-2 text-[#ED7600]" />
                      <span className="font-semibold">Valid Until</span>
                    </div>
                    <p className="text-gray-600 ml-6">{formatDate(selectedOffer.end_date)}</p>
                  </div>
                )}
              </div>

              {/* Additional Info */}
              {selectedOffer.additional_info && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-700 mb-2">Additional Information</h4>
                  <p className="text-gray-600 whitespace-pre-line">
                    {selectedOffer.additional_info}
                  </p>
                </div>
              )}

              {/* Contact Button */}
              {selectedOffer.contact_info && (
                <a
                  href={`mailto:${selectedOffer.contact_info}`}
                  className="block w-full bg-[#ED7600] text-white text-center py-3 rounded-lg font-semibold hover:bg-[#d66a00] transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  Contact: {selectedOffer.contact_info}
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default OffersPage;
