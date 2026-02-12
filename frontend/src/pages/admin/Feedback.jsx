import { useState } from 'react';
import { MessageSquare, Search, Star, ThumbsUp, ThumbsDown, Filter, CheckCircle, Clock, X } from 'lucide-react';

const Feedback = () => {
  const [feedbacks, setFeedbacks] = useState([
    {
      id: 1,
      type: 'complaint',
      user: 'Priya Sharma',
      email: 'priya.s@example.com',
      subject: 'Bus delayed by 45 minutes',
      message: 'Bus 23 was severely delayed today morning. I missed my important meeting. Please improve timing accuracy.',
      busNumber: 'Bus 23',
      route: 'Route A',
      status: 'open',
      rating: 1,
      submittedAt: '2024-02-07 09:30 AM',
      priority: 'high',
    },
    {
      id: 2,
      type: 'suggestion',
      user: 'Arun Kumar',
      email: 'arun.k@example.com',
      subject: 'Add real-time occupancy feature',
      message: 'It would be great if the app could show how crowded each bus is before boarding.',
      busNumber: 'N/A',
      route: 'N/A',
      status: 'in-progress',
      rating: 4,
      submittedAt: '2024-02-07 10:15 AM',
      priority: 'medium',
    },
    {
      id: 3,
      type: 'praise',
      user: 'Lakshmi Iyer',
      email: 'lakshmi.i@example.com',
      subject: 'Excellent service',
      message: 'The driver of Bus 45 was very courteous and helpful. Great experience!',
      busNumber: 'Bus 45',
      route: 'Route B',
      status: 'resolved',
      rating: 5,
      submittedAt: '2024-02-06 02:20 PM',
      priority: 'low',
    },
    {
      id: 4,
      type: 'complaint',
      user: 'Rahul Verma',
      email: 'rahul.v@example.com',
      subject: 'App not showing live location',
      message: 'The GPS tracking seems to be broken. Bus location not updating for the last 2 hours.',
      busNumber: 'Bus 12',
      route: 'Route C',
      status: 'open',
      rating: 2,
      submittedAt: '2024-02-07 11:00 AM',
      priority: 'high',
    },
  ]);

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
          <p className="text-3xl font-bold text-white">342</p>
          <p className="text-gray-400 text-sm mt-2">This month</p>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">Open Issues</p>
            <Clock className="text-red-400" size={24} />
          </div>
          <p className="text-3xl font-bold text-red-400">23</p>
          <p className="text-gray-400 text-sm mt-2">Needs response</p>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">Avg Rating</p>
            <Star className="text-yellow-400 fill-yellow-400" size={24} />
          </div>
          <p className="text-3xl font-bold text-white">4.2</p>
          <p className="text-gray-400 text-sm mt-2">Out of 5.0</p>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">Resolution Rate</p>
            <CheckCircle className="text-green-400" size={24} />
          </div>
          <p className="text-3xl font-bold text-green-400">87%</p>
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
              className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
            <Filter size={20} />
            Filter by Type
          </button>
        </div>
      </div>

      {/* Feedback Cards */}
      <div className="space-y-4">
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
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm">
                    Respond
                  </button>
                  <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm">
                    Mark as Resolved
                  </button>
                </>
              )}
              {feedback.status === 'in-progress' && (
                <>
                  <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm">
                    Mark as Resolved
                  </button>
                  <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm">
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