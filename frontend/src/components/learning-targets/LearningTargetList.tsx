import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Grid, Chip, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { useLearningTargetsStore } from '../../store/useLearningTargetsStore';
import { LearningTarget, LearningTargetStatus } from '../../types/learning-target.types';
import LearningTargetCard from './LearningTargetCard';

interface LearningTargetListProps {
  courseId?: string;
}

const LearningTargetList: React.FC<LearningTargetListProps> = ({ courseId }) => {
  const { 
    targets, 
    isLoading, 
    error, 
    fetchTargets, 
    setSelectedCourseId 
  } = useLearningTargetsStore();
  
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    // Set the course ID in the store
    if (courseId) {
      setSelectedCourseId(courseId);
    } else {
      setSelectedCourseId(null);
    }
    
    // Fetch targets for the current user
    fetchTargets('current-user', courseId);
  }, [fetchTargets, courseId, setSelectedCourseId]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={2} bgcolor="error.light" borderRadius={1} color="error.contrastText">
        <Typography variant="body1">{error}</Typography>
      </Box>
    );
  }

  if (targets.length === 0) {
    return (
      <Box p={4} textAlign="center">
        <Typography variant="h6" color="textSecondary">
          Henüz öğrenme hedefi bulunmuyor.
        </Typography>
        <Typography variant="body2" color="textSecondary" mt={1}>
          Yeni bir öğrenme hedefi eklemek için "Yeni Hedef Ekle" butonuna tıklayın.
        </Typography>
      </Box>
    );
  }

  // Filter targets based on selected status
  const filteredTargets = statusFilter === 'all'
    ? targets
    : targets.filter(target => target.status === statusFilter);

  const groupedByStatus = {
    [LearningTargetStatus.NOT_STARTED]: filteredTargets.filter(t => t.status === LearningTargetStatus.NOT_STARTED),
    [LearningTargetStatus.IN_PROGRESS]: filteredTargets.filter(t => t.status === LearningTargetStatus.IN_PROGRESS),
    [LearningTargetStatus.COMPLETED]: filteredTargets.filter(t => t.status === LearningTargetStatus.COMPLETED),
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Öğrenme Hedefleri</Typography>
        
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="status-filter-label">Durum Filtresi</InputLabel>
            <Select
              labelId="status-filter-label"
              value={statusFilter}
              label="Durum Filtresi"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">Tümü</MenuItem>
              <MenuItem value={LearningTargetStatus.NOT_STARTED}>Başlanmadı</MenuItem>
              <MenuItem value={LearningTargetStatus.IN_PROGRESS}>Devam Ediyor</MenuItem>
              <MenuItem value={LearningTargetStatus.COMPLETED}>Tamamlandı</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {statusFilter === 'all' ? (
        // Display grouped by status when showing all
        <>
          {Object.entries(groupedByStatus).map(([status, statusTargets]) => (
            statusTargets.length > 0 && (
              <Box key={status} mb={4}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Typography variant="h6" mr={2}>
                    {status === LearningTargetStatus.NOT_STARTED && 'Başlanmadı'}
                    {status === LearningTargetStatus.IN_PROGRESS && 'Devam Ediyor'}
                    {status === LearningTargetStatus.COMPLETED && 'Tamamlandı'}
                  </Typography>
                  <Chip 
                    label={statusTargets.length} 
                    size="small" 
                    color={
                      status === LearningTargetStatus.NOT_STARTED ? 'default' : 
                      status === LearningTargetStatus.IN_PROGRESS ? 'primary' : 
                      'success'
                    }
                  />
                </Box>
                <Grid container spacing={2}>
                  {statusTargets.map((target) => (
                    <Grid item xs={12} sm={6} md={4} key={target.id}>
                      <LearningTargetCard target={target} />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )
          ))}
        </>
      ) : (
        // Display flat list when filtered
        <Grid container spacing={2}>
          {filteredTargets.map((target) => (
            <Grid item xs={12} sm={6} md={4} key={target.id}>
              <LearningTargetCard target={target} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default LearningTargetList;
