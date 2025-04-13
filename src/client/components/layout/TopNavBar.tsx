  import { AppBar, Toolbar, IconButton, Typography, Box, Button } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useRouter } from '../../router';
import { NavItem } from '../../components/layout/types';
import { LastUpdateIndicator } from './LastUpdateIndicator';

interface TopNavBarProps {
  navItems: NavItem[];
  isStandalone?: boolean;
  onDrawerToggle: () => void;
}

export const TopNavBar = ({ navItems, isStandalone, onDrawerToggle }: TopNavBarProps) => {
  const { currentPath, navigate } = useRouter();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <AppBar 
      position="sticky" 
      component="nav"
      sx={{
        // Improve iOS standalone experience
        ...(isStandalone && {
          WebkitBackdropFilter: 'blur(10px)',
          backdropFilter: 'blur(10px)',
        })
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={onDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
            sx={{ display: { xs: 'none', sm: 'block' } }}
          >
            SPA Router
          </Typography>
        </Box>

        {/* Center section with navigation on desktop */}
        <Box sx={{ display: { xs: 'none', sm: 'block' }, flexGrow: 0 }}>
          {navItems.map((item) => (
            <Button 
              key={item.path} 
              sx={{ 
                color: '#fff',
                backgroundColor: currentPath === item.path ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                },
                mx: 0.5
              }}
              startIcon={item.icon}
              onClick={() => handleNavigation(item.path)}
            >
              {item.label}
            </Button>
          ))}
        </Box>
        
        {/* Last update indicator - always on the right side */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <LastUpdateIndicator />
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default TopNavBar;
