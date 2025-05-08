// Simple script to refresh data from GitHub
import fetch from 'node-fetch';

async function refreshData() {
  try {
    console.log('Refreshing data from GitHub...');
    const response = await fetch('http://localhost:5000/api/refresh-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('Response:', data);
  } catch (error) {
    console.error('Error refreshing data:', error);
  }
}

refreshData();