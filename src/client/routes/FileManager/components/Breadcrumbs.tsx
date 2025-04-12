import React from 'react';
import { 
  Box, 
  Button,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';

interface BreadcrumbsProps {
  breadcrumbs: string[];
  onNavigate: (index: number) => void;
}

export const Breadcrumbs = ({ breadcrumbs, onNavigate }: BreadcrumbsProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 2, 
        flexWrap: 'wrap',
        overflowX: 'auto'
      }}
    >
      <Button 
        startIcon={<HomeIcon />} 
        onClick={() => onNavigate(-1)}
        size={isMobile ? 'small' : 'medium'}
        sx={{ mr: 1 }}
      >
        Root
      </Button>
      
      {breadcrumbs.map((crumb, index) => (
        <React.Fragment key={index}>
          <Typography variant="body2" sx={{ mx: 1 }}>/</Typography>
          <Button 
            onClick={() => onNavigate(index)}
            size={isMobile ? 'small' : 'medium'}
          >
            {crumb}
          </Button>
        </React.Fragment>
      ))}
    </Box>
  );
};
