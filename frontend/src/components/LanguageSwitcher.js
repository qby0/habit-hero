import React, { useState } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

// Flag icons for languages
const flags = {
  en: '🇬🇧',
  uk: '🇺🇦',
  ru: '🇷🇺',
  sk: '🇸🇰'
};

const LanguageSwitcher = () => {
  const { t, i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = useState(null);
  
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    handleClose();
  };
  
  const currentLang = i18n.language || 'en';
  
  return (
    <>
      <Button
        aria-controls="language-menu"
        aria-haspopup="true"
        onClick={handleClick}
        color="secondary"
        variant="contained"
        endIcon={<ExpandMoreIcon />}
        sx={{ 
          textTransform: 'none', 
          mr: 2,
          fontSize: '1rem',
          padding: '8px 16px',
          fontWeight: 'bold',
          border: '2px solid #fff',
        }}
      >
        <Typography variant="body1" sx={{ mr: 1, fontWeight: 'bold' }}>
          {flags[currentLang]} {t(`language.${currentLang}`)}
        </Typography>
      </Button>
      
      <Menu
        id="language-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        {Object.keys(flags).map((lng) => (
          <MenuItem 
            key={lng} 
            onClick={() => changeLanguage(lng)}
            selected={currentLang === lng}
          >
            <ListItemIcon sx={{ minWidth: 30, fontSize: '1.25rem' }}>
              {flags[lng]}
            </ListItemIcon>
            <ListItemText primary={t(`language.${lng}`)} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default LanguageSwitcher; 