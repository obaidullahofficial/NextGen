import { useState, useEffect } from "react";
import { FaThumbsUp, FaThumbsDown, FaTrash, FaFlag, FaEdit, FaPlus } from "react-icons/fa";
import { Search, Filter, X, Save, MapPin, User, Calendar, Star, Eye, Building } from "lucide-react";
import reviewAPI from "../../services/reviewAPI";

// Status badge component with enhanced styling
const StatusBadge = ({ status }) => {
  const statusColors = {
    'Published': 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300',
    'Pending': 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-300',
    'Reported': 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-300',
    'Hidden': 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300'
  };
  
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[status] || statusColors['Pending']} shadow-sm`}
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {status || 'Pending'}
    </span>
  );
};

// Enhanced rating stars component
const RatingStars = ({ count, size = 16 }) => {
  return (
    <div className="flex items-center space-x-1">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={size}
          className={`${i < count ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
        />
      ))}
      <span className="ml-2 text-xs text-gray-600 font-medium">({count}/5)</span>
    </div>
  );
};

// Modal component for Create/Edit Review
function ReviewModal({ isOpen, onClose, review, onSave, isEdit = false }) {
  const [formData, setFormData] = useState({
    plot_id: '',
    rating: 5,
    comment: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (review && isEdit) {
      setFormData({
        plot_id: review.plot_id || '',
        rating: review.rating || 5,
        comment: review.comment || ''
      });
    } else {
      setFormData({
        plot_id: '',
        rating: 5,
        comment: ''
      });
    }
  }, [review, isEdit, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let result;
      if (isEdit) {
        result = await reviewAPI.updateReview(review._id, formData);
      } else {
        result = await reviewAPI.createReview(formData);
      }

      if (result.success) {
        onSave(result.data);
        onClose();
      } else {
        setError(result.error || `Failed to ${isEdit ? 'update' : 'create'} review`);
      }
    } catch (err) {
      console.error(`Error ${isEdit ? 'updating' : 'creating'} review:`, err);
      setError(err.message || `Failed to ${isEdit ? 'update' : 'create'} review. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'rating' ? parseInt(value) : value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100">
        <div className="p-8">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-xl ${isEdit ? 'bg-blue-100' : 'bg-green-100'}`}>
                {isEdit ? <FaEdit className="text-blue-600" size={24} /> : <FaPlus className="text-green-600" size={24} />}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {isEdit ? 'Edit Review' : 'Create New Review'}
                </h2>
                <p className="text-gray-600 mt-1">
                  {isEdit ? 'Update the review information below' : 'Fill in the details to create a new review'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
            >
              <X className="text-gray-500" size={24} />
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="flex items-center text-xs font-semibold text-gray-700 mb-2">
                <Building className="mr-2 text-gray-500" size={16} />
                Plot ID *
              </label>
              <input
                type="text"
                name="plot_id"
                value={formData.plot_id}
                onChange={handleChange}
                required
                disabled={isEdit}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="Enter plot ID"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-xs font-semibold text-gray-700 mb-2">
                <Star className="mr-2 text-gray-500" size={16} />
                Rating *
              </label>
              <select
                name="rating"
                value={formData.rating}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value={5}>⭐⭐⭐⭐⭐ Excellent (5)</option>
                <option value={4}>⭐⭐⭐⭐☆ Good (4)</option>
                <option value={3}>⭐⭐⭐☆☆ Average (3)</option>
                <option value={2}>⭐⭐☆☆☆ Poor (2)</option>
                <option value={1}>⭐☆☆☆☆ Terrible (1)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-xs font-semibold text-gray-700 mb-2">
                <Eye className="mr-2 text-gray-500" size={16} />
                Comment *
              </label>
              <textarea
                name="comment"
                value={formData.comment}
                onChange={handleChange}
                required
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                placeholder="Write your review comment here..."
              />
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-semibold shadow-lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>{isEdit ? 'Update Review' : 'Create Review'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ReviewManagement() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedReview, setSelectedReview] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch all reviews on component mount
  const fetchReviews = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await reviewAPI.getAllReviews();
      
      if (result.success) {
        setReviews(result.data || []);
      } else {
        setError(result.error || 'Failed to fetch reviews');
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError(err.message || 'Failed to fetch reviews. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Delete review function
  const deleteReview = async (reviewId, reviewComment) => {
    if (window.confirm(`Are you sure you want to delete this review? This action cannot be undone.`)) {
      try {
        const result = await reviewAPI.deleteReview(reviewId);

        if (result.success) {
          alert('Review deleted successfully');
          fetchReviews(); // Refresh the list
        } else {
          alert(result.error || 'Failed to delete review');
        }
      } catch (err) {
        console.error('Error deleting review:', err);
        alert(err.message || 'Failed to delete review. Please try again.');
      }
    }
  };

  // Handle create review
  const handleCreateReview = () => {
    setSelectedReview(null);
    setShowCreateModal(true);
  };

  // Handle edit review
  const handleEditReview = (review) => {
    setSelectedReview(review);
    setShowEditModal(true);
  };

  // Handle save (create/update)
  const handleSaveReview = (savedReview) => {
    fetchReviews(); // Refresh the list
    alert(`Review ${showEditModal ? 'updated' : 'created'} successfully!`);
  };

  // Close modals
  const closeModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedReview(null);
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchReviews();
  }, []);

  // Filter reviews based on search
  const filteredReviews = reviews.filter((review) =>
    (review.comment || '').toLowerCase().includes(search.toLowerCase()) ||
    (review.plot_id || '').toLowerCase().includes(search.toLowerCase()) ||
    (review.user_email || '').toLowerCase().includes(search.toLowerCase()) ||
    (review._id || '').toLowerCase().includes(search.toLowerCase())
  );

  const reviewsPerPage = 6;
  const totalPages = Math.ceil(filteredReviews.length / reviewsPerPage);
  const displayedReviews = filteredReviews.slice(
    (currentPage - 1) * reviewsPerPage,
    currentPage * reviewsPerPage
  );

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };

  return (
    <div className="w-full min-min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Review Management</h1>
          <p className="text-base text-gray-600">
            Monitor and moderate user reviews about plots and properties.
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-xs font-semibold">Total Reviews</p>
                <p className="text-2xl font-bold text-blue-800">{reviews.length}</p>
              </div>
              <div className="bg-blue-200 p-3 rounded-xl">
                <Eye className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl border border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-xs font-semibold">High Rated</p>
                <p className="text-2xl font-bold text-green-800">
                  {reviews.filter(review => review.rating >= 4).length}
                </p>
              </div>
              <div className="bg-green-200 p-3 rounded-xl">
                <FaThumbsUp className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-2xl border border-yellow-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 text-xs font-semibold">Average Rating</p>
                <p className="text-2xl font-bold text-yellow-800">
                  {reviews.length > 0 ? 
                    (reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length).toFixed(1) 
                    : '0.0'
                  }
                </p>
              </div>
              <div className="bg-yellow-200 p-3 rounded-xl">
                <Star className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-2xl border border-red-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-xs font-semibold">Low Rated</p>
                <p className="text-2xl font-bold text-red-800">
                  {reviews.filter(review => review.rating <= 2).length}
                </p>
              </div>
              <div className="bg-red-200 p-3 rounded-xl">
                <FaThumbsDown className="text-red-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Actions Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">All Reviews</h2>
            <p className="text-gray-600 mt-1">Manage all user reviews and their ratings</p>
          </div>
          <button
            onClick={handleCreateReview}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl font-semibold"
          >
            <FaPlus size={16} />
            <span>Add New Review</span>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center space-x-3 shadow-sm">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by comment, plot ID, or user email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <span className="text-base text-gray-600 font-medium">Loading reviews...</span>
            </div>
          </div>
        )}

        {/* Reviews Grid */}
        {!loading && (
          <div className="space-y-6">
            {displayedReviews.length === 0 ? (
              <div className="text-center py-16">
                <Eye className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No reviews found</h3>
                <p className="text-gray-500">
                  {search ? 'Try adjusting your search criteria or create a new review.' : 'Get started by creating your first review.'}
                </p>
              </div>
            ) : (
              displayedReviews.map((review) => (
                <div key={review._id} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                            {review.user_email ? review.user_email.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{review.user_email || 'Unknown User'}</div>
                            <div className="text-xs text-gray-500">Plot ID: {review.plot_id || 'N/A'}</div>
                          </div>
                        </div>
                        <StatusBadge status={review.status || 'Pending'} />
                      </div>
                      
                      <div className="mb-4">
                        <RatingStars count={review.rating || 0} size={20} />
                      </div>
                      
                      <p className="text-gray-700 mb-4 leading-relaxed">
                        {review.comment || 'No comment provided'}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="flex items-center">
                            <Calendar className="mr-1" size={14} />
                            {formatDate(review.created_at)}
                          </div>
                          <div className="flex items-center">
                            <Building className="mr-1" size={14} />
                            ID: {review._id?.slice(-8) || 'N/A'}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditReview(review)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 group"
                            title="Edit Review"
                          >
                            <FaEdit size={16} className="group-hover:scale-110 transition-transform duration-200" />
                          </button>
                          <button
                            onClick={() => deleteReview(review._id, review.comment)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 group"
                            title="Delete Review"
                          >
                            <FaTrash size={16} className="group-hover:scale-110 transition-transform duration-200" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-xs font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Previous
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors duration-200 ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-xs font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Create Modal */}
        <ReviewModal
          isOpen={showCreateModal}
          onClose={closeModals}
          review={null}
          onSave={handleSaveReview}
          isEdit={false}
        />

        {/* Edit Modal */}
        <ReviewModal
          isOpen={showEditModal}
          onClose={closeModals}
          review={selectedReview}
          onSave={handleSaveReview}
          isEdit={true}
        />
      </div>
    </div>
  );
}
