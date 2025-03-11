import React from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography
} from '@mui/material';
import {
  FitnessCenter as FitnessIcon,
  Favorite as HealthIcon,
  Work as ProductivityIcon,
  School as LearningIcon,
  AttachMoney as FinanceIcon,
  People as RelationshipsIcon,
  SelfImprovement as MindfulnessIcon,
  Category as OtherIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const FilterMenu = ({ anchorEl, open, onClose, selectedCategory, onCategoryChange }) => {
  const { t } = useTranslation();
  
  // Категории привычек
  const categories = [
    { id: 'all', label: t('habits.categories.all'), icon: <FilterIcon /> },
    { id: 'fitness', label: t('habits.categories.fitness'), icon: <FitnessIcon /> },
    { id: 'health', label: t('habits.categories.health'), icon: <HealthIcon /> },
    { id: 'productivity', label: t('habits.categories.productivity'), icon: <ProductivityIcon /> },
    { id: 'learning', label: t('habits.categories.learning'), icon: <LearningIcon /> },
    { id: 'finance', label: t('habits.categories.finance'), icon: <FinanceIcon /> },
    { id: 'relationships', label: t('habits.categories.relationships'), icon: <RelationshipsIcon /> },
    { id: 'mindfulness', label: t('habits.categories.mindfulness'), icon: <MindfulnessIcon /> },
    { id: 'other', label: t('habits.categories.other'), icon: <OtherIcon /> }
  ];
  
  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      PaperProps={{
        sx: {
          mt: 1,
          width: 220,
          maxHeight: 300,
          overflow: 'auto',
        },
      }}
    >
      <Typography variant="subtitle2" sx={{ px: 2, py: 1, fontWeight: 'bold' }}>
        {t('dashboard.filter')}
      </Typography>
      <Divider />
      
      {categories.map((category) => (
        <MenuItem
          key={category.id}
          onClick={() => {
            onCategoryChange(category.id);
            onClose();
          }}
          selected={selectedCategory === category.id}
        >
          <ListItemIcon>{category.icon}</ListItemIcon>
          <ListItemText>{category.label}</ListItemText>
        </MenuItem>
      ))}
    </Menu>
  );
};

export default FilterMenu; 