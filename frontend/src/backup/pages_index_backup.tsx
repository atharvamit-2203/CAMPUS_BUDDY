// BACKUP: Original Pages Router content moved here to prevent routing conflicts
// This is the original content from src/pages/index.tsx
// Moved to prevent App Router/Pages Router conflicts

import Link from "next/link";

export function HomePageLegacy() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                Campus Connect
              </h1>
            </div>
            <div className="flex space-x-4">
              <Link 
                href="/student/dashboard" 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
              >
                Student Portal
              </Link>
              <Link 
                href="/faculty/dashboard" 
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 px-4 py-2 rounded-lg transition duration-200"
              >
                Faculty Portal
              </Link>
              <Link 
                href="/organization" 
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 px-4 py-2 rounded-lg transition duration-200"
              >
                Organization Portal
              </Link>
            </div>
          </div>
        </div>
      </nav>
      {/* Rest of content... */}
    </div>
  );
}
