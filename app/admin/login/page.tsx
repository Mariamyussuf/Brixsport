"use client";

import React from 'react';
import AdminLoginForm from '@/components/logger/admin/AdminLoginForm';

export default function AdminLoginPage() {


  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxkZWZzPjxwYXR0ZXJuIGlkPSJwYXR0ZXJuIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHBhdHRlcm5UcmFuc2Zvcm09InJvdGF0ZSg0NSkiPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjAuNSIgZmlsbD0iI2ZmZmZmZiIgZmlsbC1vcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjcGF0dGVybikiLz48L3N2Zz4=')] opacity-20"></div>
      
      <div className="relative w-full max-w-md">
        {/* Logo/Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-red-600 to-red-800 mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">BrixSports Admin</h1>
          <p className="text-gray-300">Secure administrative platform</p>
        </div>
        
        {/* Login Card */}
        <div className="bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-700/50 p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-1">Administrator Access</h2>
            <p className="text-gray-400 text-sm">Enter your credentials to continue</p>
          </div>
          
          <AdminLoginForm />
        </div>
        
        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} BrixSports. All rights reserved.
          </p>
          <div className="mt-2 flex justify-center space-x-4">
            <a href="#" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Privacy</a>
            <a href="#" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Terms</a>
            <a href="#" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Support</a>
          </div>
        </div>
      </div>
    </div>
  );
}