"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import withAuth from '../../components/withAuth';

const DashboardPage = () => {
  const { user } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState('Inactive');

  // This is a placeholder for fetching the user's subscription status
  useEffect(() => {
    // In a real app, you would fetch this from your backend
    // For now, we'll just simulate it.
    if (user) {
      // Simulate fetching status
      // setSubscriptionStatus('Active'); 
    }
  }, [user]);

  const handleSubscribe = async () => {
    const token = await user.getIdToken();
    const response = await fetch('http://localhost:8080/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const { url } = await response.json();
    window.location.href = url;
  };

  return (
    <div>
      <h1>Dashboard</h1>
      
      {/* Section 1: Status */}
      <div>
        <h2>Subscription Status</h2>
        <p style={{ color: subscriptionStatus === 'Active' ? 'green' : 'red' }}>
          {subscriptionStatus}
        </p>
        {subscriptionStatus !== 'Active' && (
          <button onClick={handleSubscribe}>Subscribe</button>
        )}
      </div>

      {/* Section 2: Connect */}
      <div>
        <h2>Connect Accounts</h2>
        <a href="http://localhost:8080/auth/login">
          <button>Connect Google Calendar</button>
        </a>
      </div>

      {/* Section 3: Usage */}
      <div>
        <h2>Usage</h2>
        <p>Voice Commands Used This Month: 0</p>
        {/* Placeholder for chart */}
        <div style={{ height: '200px', border: '1px solid #ccc', marginTop: '10px' }}>
          Chart Placeholder
        </div>
      </div>
    </div>
  );
};

export default withAuth(DashboardPage);
