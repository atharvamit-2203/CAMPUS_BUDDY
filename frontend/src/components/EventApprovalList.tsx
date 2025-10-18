'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, Users, FileText, CheckCircle, XCircle, Clock, AlertCircle, Eye, Trash2 } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ApprovalRequest {
  id: number;
  organization_name: string;
  event_name: string;
  event_type: string;
  event_description: string;
  start_date: string;
  end_date: string;
  venue: string;
  expected_attendees: number;
  budget_required: number;
  resources_needed: string;
  materials_needed: string;
  staff_required: number;
  volunteers_required: number;
  additional_notes: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  submitted_by_name: string;
  submitted_at: string;
  reviewed_by_name?: string;
  reviewed_at?: string;
  review_notes?: string;
}

interface EventApprovalListProps {
  isAdmin?: boolean;
  onRefresh?: () => void;
}

export default function EventApprovalList({ isAdmin = false, onRefresh }: EventApprovalListProps) {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewAction, setReviewAction] = useState<'approved' | 'rejected'>('approved');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [selectedStatus]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const statusParam = selectedStatus !== 'all' ? `?status=${selectedStatus}` : '';
      const response = await fetch(`${API}/events/approval-requests${statusParam}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (response.ok) {
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (requestId: number) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API}/events/approval-requests/${requestId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (response.ok) {
        setSelectedRequest(data);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error('Error fetching request details:', error);
    }
  };

  const handleReview = (request: ApprovalRequest, action: 'approved' | 'rejected') => {
    setSelectedRequest(request);
    setReviewAction(action);
    setReviewNotes('');
    setShowReviewModal(true);
  };

  const submitReview = async () => {
    if (!selectedRequest) return;

    try {
      setActionLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API}/events/approval-requests/${selectedRequest.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: reviewAction,
          review_notes: reviewNotes
        })
      });

      if (response.ok) {
        setShowReviewModal(false);
        fetchRequests();
        if (onRefresh) onRefresh();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (requestId: number) => {
    if (!confirm('Are you sure you want to cancel this request?')) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API}/events/approval-requests/${requestId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchRequests();
        if (onRefresh) onRefresh();
      }
    } catch (error) {
      console.error('Error cancelling request:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      approved: 'bg-green-500/20 text-green-400 border-green-500/50',
      rejected: 'bg-red-500/20 text-red-400 border-red-500/50',
      cancelled: 'bg-gray-500/20 text-gray-400 border-gray-500/50'
    };

    const icons = {
      pending: <Clock className="w-4 h-4" />,
      approved: <CheckCircle className="w-4 h-4" />,
      rejected: <XCircle className="w-4 h-4" />,
      cancelled: <AlertCircle className="w-4 h-4" />
    };

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${styles[status as keyof typeof styles]}`}>
        {icons[status as keyof typeof icons]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'pending', 'approved', 'rejected'].map(status => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              selectedStatus === status
                ? 'bg-blue-600 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            {status !== 'all' && (
              <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {requests.filter(r => r.status === status).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
          <FileText className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400">No requests found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {requests.map(request => (
            <div
              key={request.id}
              className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl border border-white/10 p-6 hover:border-white/20 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-white">{request.event_name}</h3>
                    {getStatusBadge(request.status)}
                  </div>
                  <p className="text-gray-400 text-sm">{request.organization_name}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    Submitted by {request.submitted_by_name} on {new Date(request.submitted_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center gap-2 text-gray-300">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span className="text-sm">
                    {new Date(request.start_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span className="text-sm">{request.expected_attendees} attendees</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <span className="text-sm">₹{request.budget_required.toLocaleString()}</span>
                </div>
                <div className="text-gray-300">
                  <span className="text-sm font-medium">{request.event_type}</span>
                </div>
              </div>

              <p className="text-gray-400 text-sm mb-4 line-clamp-2">{request.event_description}</p>

              <div className="flex gap-3">
                <button
                  onClick={() => handleViewDetails(request.id)}
                  className="flex-1 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-colors flex items-center justify-center gap-2 border border-blue-500/30"
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </button>

                {isAdmin && request.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleReview(request, 'approved')}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReview(request, 'rejected')}
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </>
                )}

                {!isAdmin && request.status === 'pending' && (
                  <button
                    onClick={() => handleCancel(request.id)}
                    className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors flex items-center justify-center gap-2 border border-red-500/30"
                  >
                    <Trash2 className="w-4 h-4" />
                    Cancel
                  </button>
                )}
              </div>

              {request.reviewed_by_name && request.review_notes && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-gray-400 text-sm">
                    <span className="font-medium">Admin Notes:</span> {request.review_notes}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    Reviewed by {request.reviewed_by_name} on {request.reviewed_at ? new Date(request.reviewed_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl border border-white/20 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10 sticky top-0 bg-slate-900 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">{selectedRequest.event_name}</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              {getStatusBadge(selectedRequest.status)}
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Event Details</h3>
                <div className="space-y-2 text-gray-300">
                  <p><span className="text-gray-400">Organization:</span> {selectedRequest.organization_name}</p>
                  <p><span className="text-gray-400">Type:</span> {selectedRequest.event_type}</p>
                  <p><span className="text-gray-400">Venue:</span> {selectedRequest.venue || 'Not specified'}</p>
                  <p><span className="text-gray-400">Dates:</span> {new Date(selectedRequest.start_date).toLocaleDateString()} - {new Date(selectedRequest.end_date).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                <p className="text-gray-300">{selectedRequest.event_description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Attendees</h3>
                  <p className="text-3xl font-bold text-blue-400">{selectedRequest.expected_attendees}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Budget</h3>
                  <p className="text-3xl font-bold text-green-400">₹{selectedRequest.budget_required.toLocaleString()}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Staff</h3>
                  <p className="text-2xl font-bold text-purple-400">{selectedRequest.staff_required || 0}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Volunteers</h3>
                  <p className="text-2xl font-bold text-orange-400">{selectedRequest.volunteers_required || 0}</p>
                </div>
              </div>

              {selectedRequest.resources_needed && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Resources Needed</h3>
                  <p className="text-gray-300">{selectedRequest.resources_needed}</p>
                </div>
              )}

              {selectedRequest.materials_needed && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Materials Needed</h3>
                  <p className="text-gray-300">{selectedRequest.materials_needed}</p>
                </div>
              )}

              {selectedRequest.additional_notes && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Additional Notes</h3>
                  <p className="text-gray-300">{selectedRequest.additional_notes}</p>
                </div>
              )}

              {selectedRequest.review_notes && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-400 mb-2">Admin Review</h3>
                  <p className="text-gray-300">{selectedRequest.review_notes}</p>
                  <p className="text-gray-500 text-sm mt-2">
                    By {selectedRequest.reviewed_by_name} on {selectedRequest.reviewed_at ? new Date(selectedRequest.reviewed_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl border border-white/20 max-w-lg w-full">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-2xl font-bold text-white">
                {reviewAction === 'approved' ? 'Approve' : 'Reject'} Request
              </h2>
              <p className="text-gray-400 mt-1">{selectedRequest.event_name}</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Review Notes {reviewAction === 'rejected' && <span className="text-red-400">*</span>}
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={
                    reviewAction === 'approved'
                      ? 'Optional: Add any notes or conditions...'
                      : 'Please explain the reason for rejection...'
                  }
                  required={reviewAction === 'rejected'}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowReviewModal(false)}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitReview}
                  disabled={actionLoading || (reviewAction === 'rejected' && !reviewNotes.trim())}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors text-white ${
                    reviewAction === 'approved'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {actionLoading ? 'Processing...' : `Confirm ${reviewAction === 'approved' ? 'Approval' : 'Rejection'}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
