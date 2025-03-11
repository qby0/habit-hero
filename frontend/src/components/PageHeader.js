import React from 'react';
import { Box, Typography, Divider } from '@mui/material';

const PageHeader = ({ title, icon, description }) => {
  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        {icon && (
          <Box sx={{ mr: 2, color: 'primary.main' }}>
            {icon}
          </Box>
        )}
        <Typography variant="h4" component="h1" fontWeight="bold">
          {title}
        </Typography>
      </Box>
      
      {description && (
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
          {description}
        </Typography>
      )}
      
      <Divider sx={{ mt: 2 }} />
    </Box>
  );
};

export default PageHeader; 