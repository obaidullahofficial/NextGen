import { useState } from "react";
import { FaThumbsUp, FaThumbsDown, FaTrash, FaFlag } from "react-icons/fa";
import { Search, Filter } from "lucide-react";

const reviewsData = [
  {
    id: 1,
    society: "Bahria Town",
    rating: 5,
    date: "12 Mar 2025",
    text: "Amazing community with great amenities. The management is very responsive and the common areas are always clean.",
    likes: 24,
    dislikes: 2,
    status: "Published",
    user: {
      name: "Obaidullah ",
      avatar: "src/assets/Images/avatar.jpg",
    },
  },
  {
    id: 2,
    society: "CDA",
    rating: 1,
    date: "28 Feb 2025",
    text: "Terrible experience. The management does not respond to maintenance requests in a timely manner. Would not recommend.",
    likes: 45,
    dislikes: 8,
    status: "Reported",
    user: {
      name: "Aliya Saqib",
      avatar: "src/assets/Images/avatar.jpg",
    },
  },
  {
    id: 3,
    society: "Central Plaza Commercial Complex",
    rating: 4,
    date: "15 Mar 2025",
    text: "Great location for business. The facilities are top-notch and the security is excellent.",
    likes: 12,
    dislikes: 3,
    status: "Published",
    user: {
      name: "Aashfa Noor",
      avatar: "src/assets/Images/avatar.jpg",
    },
  },
];

const StatusBadge = ({ status }) => {
  const color =
    status === "Published"
      ? "bg-green-100 text-green-800"
      : "bg-yellow-100 text-yellow-800";
  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${color}`}>
      {status}
    </span>
  );
};

const RatingStars = ({ count }) => {
  return (
    <div className="text-yellow-500 mb-1">
      {Array.from({ length: count }, (_, i) => (
        <span key={i}>★</span>
      ))}
      {Array.from({ length: 5 - count }, (_, i) => (
        <span key={i} className="text-gray-300">
          ★
        </span>
      ))}
    </div>
  );
};

export default function ReviewManagement() {
  const [reviews] = useState(reviewsData);
  const [search, setSearch] = useState("");

  const filteredReviews = reviews.filter(
    (r) =>
      r.society.toLowerCase().includes(search.toLowerCase()) ||
      r.text.toLowerCase().includes(search.toLowerCase()) ||
      r.user.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-1">Review Management</h1>
      <p className="text-gray-500 mb-6">
        Monitor and moderate user reviews about societies.
      </p>

      {/* Search Bar */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search reviews..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>
        <button
          aria-label="Filter reviews"
          className="p-2 border rounded-md hover:bg-gray-100"
          title="Filter"
        >
          <Filter size={20} />
        </button>
      </div>

      <div className="space-y-4">
        {filteredReviews.length > 0 ? (
          filteredReviews.map((review) => (
            <div key={review.id} className="border p-4 rounded-lg bg-white">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h2 className="font-semibold text-lg mb-1">{review.society}</h2>
                  <RatingStars count={review.rating} />
                  <p className="text-sm text-gray-500 mb-2">{review.date}</p>
                  <p className="text-sm mb-2">{review.text}</p>
                  <div className="flex space-x-4 text-gray-600 text-sm">
                    <div className="flex items-center gap-1">
                      <FaThumbsUp /> {review.likes}
                    </div>
                    <div className="flex items-center gap-1">
                      <FaThumbsDown /> {review.dislikes}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <StatusBadge status={review.status} />
                  <div className="flex items-center space-x-2">
                    {review.user.avatar ? (
                      <img
                        src={review.user.avatar}
                        alt={review.user.name}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center font-semibold">
                        {review.user.name.charAt(0)}
                      </div>
                    )}
                    <span className="text-sm font-medium">{review.user.name}</span>
                  </div>
                  <div className="flex space-x-2 text-[#2f3d57]">
                    <FaFlag className="cursor-pointer hover:opacity-70" />
                    <FaTrash className="cursor-pointer hover:opacity-70" />
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 mt-10">
            No reviews match your search.
          </p>
        )}
      </div>
    </div>
  );
}
