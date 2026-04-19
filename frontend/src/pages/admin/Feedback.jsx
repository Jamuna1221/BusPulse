import { useEffect, useMemo, useState } from 'react';
import { MessageSquare, Search, Star, ThumbsUp, ThumbsDown, Filter, CheckCircle, Clock, X } from 'lucide-react';
import { adminFeedbackAPI } from "../../config/api";

const Feedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const loadFeedbacks = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await adminFeedbackAPI.getAll({ limit: 400, search, type: typeFilter });
      setFeedbacks((res.data || []).map((f) => ({
        ...f,
        submittedAt: new Date(f.submittedAt).toLocaleString(),
      })));
    } catch (e) {
      setError(e.message || "Failed to load feedback.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(loadFeedbacks, 250);
    return () => clearTimeout(t);
  }, [search, typeFilter]);

  const stats = useMemo(() => {
    const total = feedbacks.length;
    const open = feedbacks.filter((f) => f.status === "open").length;
    const resolved = feedbacks.filter((f) => f.status === "resolved").length;
    const avgRating = total > 0
      ? (feedbacks.reduce((s, f) => s + (Number(f.rating) || 0), 0) / total).toFixed(1)
      : "0.0";
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
    return { total, open, avgRating, resolutionRate };
  }, [feedbacks]);

  const updateStatus = async (feedback, status) => {
    try {
      await adminFeedbackAPI.updateStatus(feedback.id, status, feedback.priority);
      await loadFeedbacks();
    } catch (e) {
      setError(e.message || "Failed to update feedback.");
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'complaint':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'suggestion':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'praise':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-red-500/20 text-red-400';
      case 'in-progress':
        return 'bg-orange-500/20 text-orange-400';
      case 'resolved':
        return 'bg-green-500/20 text-green-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-400';
      case 'medium':
        return 'text-orange-400';
      case 'low':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Customer Feedback</h1>
          <p className="text-gray-400 mt-1">Manage complaints, suggestions, and praise</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">Total Feedback</p>
            <MessageSquare className="text-blue-400" size={24} />
          </div>
          <p className="text-3xl font-bold text-white">{stats.total}</p>
          <p className="text-gray-400 text-sm mt-2">This month</p>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">Open Issues</p>
            <Clock className="text-red-400" size={24} />
          </div>
          <p className="text-3xl font-bold text-red-400">{stats.open}</p>
          <p className="text-gray-400 text-sm mt-2">Needs response</p>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">Avg Rating</p>
            <Star className="text-yellow-400 fill-yellow-400" size={24} />
          </div>
          <p className="text-3xl font-bold text-white">{stats.avgRating}</p>
          <p className="text-gray-400 text-sm mt-2">Out of 5.0</p>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">Resolution Rate</p>
            <CheckCircle className="text-green-400" size={24} />
          </div>
          <p className="text-3xl font-bold text-green-400">{stats.resolutionRate}%</p>
          <p className="text-gray-400 text-sm mt-2">Within 24 hours</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by user, subject, or bus number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-lg">
            <Filter size={20} />
            Filter by Type
          </button>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
          >
            <option value="all">All</option>
            <option value="complaint">Complaint</option>
            <option value="suggestion">Suggestion</option>
            <option value="praise">Praise</option>
          </select>
        </div>
      </div>

      {/* Feedback Cards */}
      <div className="space-y-4">
        {loading && <div className="text-gray-400 text-sm">Loading feedback...</div>}
        {!loading && error && <div className="text-red-400 text-sm">{error}</div>}
        {feedbacks.map((feedback) => (
          <div key={feedback.id} className="bg-slate-800 rounded-xl border border-slate-700 p-6 hover:border-slate-600 transition-all">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-3 py-1 rounded-lg text-sm font-medium capitalize border ${getTypeColor(feedback.type)}`}>
                    {feedback.type === 'praise' && '👍'} 
                    {feedback.type === 'complaint' && '⚠️'} 
                    {feedback.type === 'suggestion' && '💡'} 
                    {' '}{feedback.type}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(feedback.status)}`}>
                    {feedback.status.replace('-', ' ')}
                  </span>
                  <span className={`text-sm font-medium ${getPriorityColor(feedback.priority)}`}>
                    Priority: {feedback.priority}
                  </span>
                </div>
                <h3 className="text-white font-bold text-lg mb-1">{feedback.subject}</h3>
                <p className="text-gray-400 text-sm">Feedback #{feedback.id}</p>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    className={i < feedback.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}
                  />
                ))}
              </div>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-6 mb-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                  {feedback.user.split(' ').map(n => n[0]).join('')}
                </div>
                <span className="text-white">{feedback.user}</span>
              </div>
              <span className="text-gray-400">{feedback.email}</span>
              <span className="text-gray-500">{feedback.submittedAt}</span>
            </div>

            {/* Message */}
            <div className="mb-4 p-4 bg-slate-700/50 rounded-lg">
              <p className="text-gray-300">{feedback.message}</p>
            </div>

            {/* Related Info */}
            {feedback.busNumber !== 'N/A' && (
              <div className="flex items-center gap-4 mb-4 text-sm">
                <div>
                  <span className="text-gray-400">Bus: </span>
                  <span className="text-white font-medium">{feedback.busNumber}</span>
                </div>
                <div>
                  <span className="text-gray-400">Route: </span>
                  <span className="text-white font-medium">{feedback.route}</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t border-slate-700">
              {feedback.status === 'open' && (
                <>
                  <button onClick={() => updateStatus(feedback, "in-progress")} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm">
                    Respond
                  </button>
                  <button onClick={() => updateStatus(feedback, "resolved")} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm">
                    Mark as Resolved
                  </button>
                </>
              )}
              {feedback.status === 'in-progress' && (
                <>
                  <button onClick={() => updateStatus(feedback, "resolved")} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm">
                    Mark as Resolved
                  </button>
                  <button onClick={() => updateStatus(feedback, "in-progress")} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm">
                    Add Note
                  </button>
                </>
              )}
              {feedback.status === 'resolved' && (
                <span className="flex items-center gap-2 text-green-400 text-sm">
                  <CheckCircle size={16} />
                  Resolved
                </span>
              )}
              <button className="ml-auto px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm">
                View Full Thread
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Feedback;