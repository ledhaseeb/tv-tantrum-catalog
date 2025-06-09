import { useState } from "react";

export default function AdminDashboardSimple() {
  const [message] = useState("Admin Dashboard is working!");

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          TV Tantrum Admin Dashboard
        </h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-lg text-green-600">{message}</p>
          
          <div className="mt-4">
            <h2 className="text-xl font-semibold mb-2">Status</h2>
            <p>Component is loading successfully</p>
            <p>Route is working: /admin/dashboard</p>
            <p>No authentication issues</p>
          </div>
          
          <div className="mt-6">
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Test Button
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}