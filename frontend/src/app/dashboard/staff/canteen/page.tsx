'use client';

import React from 'react';
import RoleBasedNavigation from '@/components/RoleBasedNavigation';
import StaffCanteenOrders from '@/components/StaffCanteenOrders';

export default function CanteenStaffPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex">
      <RoleBasedNavigation currentPage="/dashboard/staff/canteen" />
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-white mb-6">Canteen Staff - Order Management</h1>
        <StaffCanteenOrders />
      </div>
    </div>
  );
}