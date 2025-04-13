import { useState, useEffect, useCallback } from 'react';
import { Typography, Tooltip, Box } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { getLastUpdate } from '@/apis/cardItems/client';

// Helper function to format time difference
const formatTimeSince = (dateString: string): string => {
  const lastUpdate = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - lastUpdate.getTime();
  
  // Convert to minutes, hours, days
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 60) {
    return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  }
};

export const LastUpdateIndicator = () => {
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [formattedTime, setFormattedTime] = useState<string>('');
  
  // Fetch data and update the formatted time
  const updateData = useCallback(async () => {
    try {
      // Fetch the latest update time
      const response = await getLastUpdate();
      if (response.data?.lastUpdate) {
        const newLastUpdate = response.data.lastUpdate;
        setLastUpdate(newLastUpdate);
        
        // Update the formatted time
        setFormattedTime(formatTimeSince(newLastUpdate));
      }
    } catch (error) {
      console.error('Error fetching last update time:', error);
    }
  }, []);
  
  // Set up a single interval to fetch data and update the display
  useEffect(() => {
    // Initial fetch and update
    updateData();
    
    // Set up interval to run every minute (60000ms)
    const intervalId = setInterval(updateData, 60000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [updateData]);
  
  if (!lastUpdate) return null;
  
  return (
    <Tooltip title={`Last updated: ${new Date(lastUpdate).toLocaleString()}`}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        color: 'rgba(255, 255, 255, 0.7)',
        '&:hover': {
          color: 'white'
        }
      }}>
        <AccessTimeIcon fontSize="small" sx={{ mr: 0.5 }} />
        <Typography variant="caption">
          {formattedTime}
        </Typography>
      </Box>
    </Tooltip>
  );
};
