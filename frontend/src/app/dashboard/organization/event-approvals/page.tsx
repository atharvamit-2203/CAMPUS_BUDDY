'use client';

import React, { useState } from 'react';
import RoleBasedNavigation from '@/components/RoleBasedNavigation';
import EventApprovalRequest from '@/components/EventApprovalRequest';
import EventApprovalList from '@/components/EventApprovalList';
import { Send, FileText } from 'lucide-react';

export default function EventApprovalsPage() {
  const [activeTab, setActiveTab] = useState<'request' | 'list'>('list');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRequestSuccess = () => {
    setActiveTab('list');
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex">
      <RoleBasedNavigation currentPage="/dashboard/organization/event-approvals" />
      
      <div className="flex-1 p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Event Approvals</h1>
          <p className="text-gray-400">Request admin approval for large events and track their status</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'list'
                ? 'bg-blue-600 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            <FileText className="w-5 h-5" />
            My Requests
          </button>
          <button
            onClick={() => setActiveTab('request')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'request'
                ? 'bg-blue-600 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            <Send className="w-5 h-5" />
            New Request
          </button>
        </div>

        {/* Content */}
        {activeTab === 'request' ? (
          <EventApprovalRequest onSuccess={handleRequestSuccess} />
        ) : (
          <EventApprovalList key={refreshKey} isAdmin={false} />
        )}
      </div>
    </div>
  );
}
