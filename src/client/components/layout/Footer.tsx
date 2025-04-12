import { Box, Container, Typography } from '@mui/material';

interface FooterProps {
  isStandalone?: boolean;
}

export const Footer = ({ isStandalone }: FooterProps) => {
  return (
    <Box component="footer" sx={{ 
      py: 3, 
      px: 2, 
      mt: 'auto', 
      backgroundColor: (theme) => theme.palette.grey[200],
      // Ensure footer is above the home indicator on iOS
      ...(isStandalone && {
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)'
      }),
      // Hide footer on mobile devices since we have bottom navigation
      display: { xs: 'none', sm: 'block' }
    }}>
      <Container maxWidth="sm">
        <Typography variant="body2" color="text.secondary" align="center">
          {new Date().getFullYear()} Custom SPA Router Example
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;
