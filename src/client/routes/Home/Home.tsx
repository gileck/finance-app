import React from 'react';
import { Container, Box } from '@mui/material';
import { Dashboard } from '@/client/components/dashboard/Dashboard';

export const Home = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 0 }}>
        <Dashboard />
      </Box>
    </Container>
  );
};

export default Home;
