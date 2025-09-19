import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-white/20">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Page title will be handled by individual pages */}
          <div className="flex-1">
            {/* This space can be used for breadcrumbs or page titles */}
          </div>

          {/* Header actions */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button 
              title="Notifications"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            {/* User menu */}
            <div className="relative group">
              <button 
                title="User menu"
                className="flex items-center space-x-3 p-2 text-gray-700 hover:text-gray-900 hover:bg-white/50 rounded-lg transition-all duration-200"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    A
                  </span>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium">Admin</p>
                  <p className="text-xs text-gray-500 capitalize">administrator</p>
                </div>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown menu */}
              <div className="absolute right-0 mt-2 w-48 bg-white/90 backdrop-blur-md rounded-xl shadow-xl border border-white/20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-2">
                  <div className="px-4 py-2 border-b border-gray-100/50">
                    <p className="text-sm font-medium text-gray-900">Admin</p>
                    <p className="text-xs text-gray-500">admin@dsaprepbot.com</p>
                  </div>
                  
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-white/50 transition-colors rounded-md mx-2 my-1">
                    Profile Settings
                  </button>
                  
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-white/50 transition-colors rounded-md mx-2 my-1">
                    Preferences
                  </button>
                  
                  <div className="border-t border-gray-100/50 mt-2 pt-2">
                    <button 
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50/50 transition-colors rounded-md mx-2 my-1"
                    >
                      System Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;