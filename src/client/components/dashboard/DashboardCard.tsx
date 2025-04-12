import React, { ReactNode } from 'react';
import { Paper, Typography, Box, useTheme } from '@mui/material';

interface DashboardCardProps {
  title: string;
  children: ReactNode;
  height?: string | number;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  icon?: ReactNode;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({ 
  title, 
  children,
  height = 'auto',
  color = 'primary',
  icon
}) => {
  const theme = useTheme();
  
  // Get color from theme based on the color prop
  const getGradient = () => {
    const mainColor = theme.palette[color].main;
    const lightColor = theme.palette[color].light;
    return `linear-gradient(135deg, ${mainColor} 0%, ${lightColor} 100%)`;
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        height,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        overflow: 'hidden',
        transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: 6,
        }
      }}
    >
      <Box 
        sx={{ 
          p: 2,
          background: getGradient(),
          color: theme.palette[color].contrastText,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box display="flex" alignItems="center">
          {icon && <Box mr={1}>{icon}</Box>}
          <Typography 
            variant="h6" 
            component="h2"
            sx={{ 
              fontSize: { xs: '1rem', sm: '1.25rem' },
              fontWeight: 'bold'
            }}
          >
            {title}
          </Typography>
        </Box>
      </Box>
      <Box 
        sx={{ 
          flexGrow: 1,
          p: 2,
          backgroundColor: 'background.paper',
        }}
      >
        {children}
      </Box>
    </Paper>
  );
};
