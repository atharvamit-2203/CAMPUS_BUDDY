"use client";

import React from "react";
import Link from "next/link";

interface CampusMiniMapProps {
  title?: string;
}

const CampusMiniMap: React.FC<CampusMiniMapProps> = ({ title = "Campus Map" }) => {
  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-blue-50 text-blue-600 mr-1">🗺️</span>
          {title}
        </h3>
        <Link
          href="/dashboard/student/campus_navigation"
          className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
        >
          Open Campus Navigation
        </Link>
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <div className="relative h-64 w-full rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,#c7d2fe_1px,transparent_0)] [background-size:24px_24px] opacity-40 rounded-lg"/>
            <div className="relative text-center">
              <div className="text-6xl mb-2">🧭</div>
              <p className="text-gray-600">Mini map preview</p>
              <p className="text-xs text-gray-500">Open Campus Navigation for full experience</p>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="p-3 rounded-lg border border-gray-100 bg-gray-50">
            <div className="text-xs uppercase tracking-wide text-gray-500">Quick Places</div>
            <ul className="mt-2 space-y-2 text-sm text-gray-700">
              <li>• Central Library</li>
              <li>• Main Canteen</li>
              <li>• Sports Complex</li>
              <li>• CS Department</li>
            </ul>
          </div>
          <div className="p-3 rounded-lg border border-gray-100 bg-gray-50">
            <div className="text-xs uppercase tracking-wide text-gray-500">Tip</div>
            <p className="mt-1 text-sm text-gray-700">Use the full Campus Navigation to search places, plan routes and get details.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CampusMiniMap;
