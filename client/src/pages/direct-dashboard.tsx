import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import UserDashboard from './user-dashboard';

/**
 * This component provides direct access to the user dashboard
 * without going through the standard authentication flow.
 * This is useful for testing when session cookies are not working properly.
 */
const DirectDashboard = () => {
  const [, setLocation] = useLocation();
  
  // Set up direct access authentication
  useEffect(() => {
    // Store authentication state in localStorage
    localStorage.setItem('tvtantrum_auth', JSON.stringify({
      isLoggedIn: true,
      userId: '7', // Default to user ID 7 (Haseeb) for testing
      timestamp: new Date().toISOString()
    }));
    
    // Notify user about direct access
    console.log('Direct dashboard access enabled');
  }, []);
  
  return (
    <div className="container mx-auto p-4">
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6" role="alert">
        <p className="font-bold">Direct Dashboard Access</p>
        <p>You are viewing the dashboard in direct access mode. This bypasses normal authentication.</p>
      </div>
      
      <UserDashboard />
    </div>
  );
};

export default DirectDashboard;