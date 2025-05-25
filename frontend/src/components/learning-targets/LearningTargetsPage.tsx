import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Breadcrumbs, Link, Divider, Tabs, Tab } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { useParams, useNavigate } from 'react-router-dom';
import LearningTargetList from './LearningTargetList';
import CreateLearningTarget from './CreateLearningTarget';
import ProposeLearningTopics from './ProposeLearningTopics';
import { LearningTargetStatus } from '../../types/learning-target.types';
import { useLearningTargetsStore } from '../../store/useLearningTargetsStore';

const LearningTargetsPage: React.FC = () => {
  // Type assertion for useParams since we don't have actual type definitions yet
  const { courseId } = useParams() as { courseId?: string };
  const navigate = useNavigate();
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [proposeDialogOpen, setProposeDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<LearningTargetStatus | 'all'>('all');
  
  const { 
    fetchTargets, 
    targets, 
    getTargetsByStatus 
  } = useLearningTargetsStore();
  
  // Fetch targets when component mounts or courseId changes
  useEffect(() => {
    fetchTargets('current-user', courseId);
  }, [fetchTargets, courseId]);
  
  // Count targets by status
  const countByStatus = {
    [LearningTargetStatus.NOT_STARTED]: getTargetsByStatus(LearningTargetStatus.NOT_STARTED).length,
    [LearningTargetStatus.IN_PROGRESS]: getTargetsByStatus(LearningTargetStatus.IN_PROGRESS).length,
    [LearningTargetStatus.COMPLETED]: getTargetsByStatus(LearningTargetStatus.COMPLETED).length,
  };
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: LearningTargetStatus | 'all') => {
    setActiveTab(newValue);
  };
  
  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* Header with breadcrumbs */}
      <Box mb={4}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 1 }}>
          <Link 
            color="inherit" 
            href="#" 
            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.preventDefault();
              navigate('/dashboard');
            }}
          >
            Ana Sayfa
          </Link>
          {courseId ? (
            <>
              <Link 
                color="inherit" 
                href="#" 
                onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  e.preventDefault();
                  navigate('/courses');
                }}
              >
                Dersler
              </Link>
              <Typography color="text.primary">Ders Adı</Typography>
            </>
          ) : (
            <Typography color="text.primary">Öğrenme Hedefleri</Typography>
          )}
        </Breadcrumbs>
        
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" component="h1">
            {courseId ? 'Ders Öğrenme Hedefleri' : 'Tüm Öğrenme Hedefleri'}
          </Typography>
          
          <Box>
            {courseId && (
              <Button
                variant="outlined"
                startIcon={<AutoFixHighIcon />}
                onClick={() => setProposeDialogOpen(true)}
                sx={{ mr: 2 }}
              >
                AI ile Konu Öner
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Yeni Hedef Ekle
            </Button>
          </Box>
        </Box>
        
        {courseId && (
          <Typography variant="body1" color="text.secondary">
            Bu sayfada, seçili ders için öğrenme hedeflerinizi görüntüleyebilir, yeni hedefler ekleyebilir ve mevcut hedefleri yönetebilirsiniz.
          </Typography>
        )}
      </Box>
      
      {/* Stats cards */}
      <Paper elevation={1} sx={{ mb: 4, p: 2 }}>
        <Box display="flex" justifyContent="space-around" alignItems="center">
          <Box textAlign="center" p={2}>
            <Typography variant="h6" color="text.secondary">Toplam Hedef</Typography>
            <Typography variant="h3">{targets.length}</Typography>
          </Box>
          <Divider orientation="vertical" flexItem />
          <Box textAlign="center" p={2}>
            <Typography variant="h6" color="error.main">Başlanmadı</Typography>
            <Typography variant="h3">{countByStatus[LearningTargetStatus.NOT_STARTED]}</Typography>
          </Box>
          <Divider orientation="vertical" flexItem />
          <Box textAlign="center" p={2}>
            <Typography variant="h6" color="primary.main">Devam Ediyor</Typography>
            <Typography variant="h3">{countByStatus[LearningTargetStatus.IN_PROGRESS]}</Typography>
          </Box>
          <Divider orientation="vertical" flexItem />
          <Box textAlign="center" p={2}>
            <Typography variant="h6" color="success.main">Tamamlandı</Typography>
            <Typography variant="h3">{countByStatus[LearningTargetStatus.COMPLETED]}</Typography>
          </Box>
        </Box>
      </Paper>
      
      {/* Tabs for filtering */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          aria-label="learning target status tabs"
        >
          <Tab label="Tümü" value="all" />
          <Tab 
            label={`Başlanmadı (${countByStatus[LearningTargetStatus.NOT_STARTED]})`} 
            value={LearningTargetStatus.NOT_STARTED} 
          />
          <Tab 
            label={`Devam Ediyor (${countByStatus[LearningTargetStatus.IN_PROGRESS]})`} 
            value={LearningTargetStatus.IN_PROGRESS} 
          />
          <Tab 
            label={`Tamamlandı (${countByStatus[LearningTargetStatus.COMPLETED]})`} 
            value={LearningTargetStatus.COMPLETED} 
          />
        </Tabs>
      </Box>
      
      {/* Learning targets list */}
      {activeTab === 'all' ? (
        <LearningTargetList courseId={courseId} />
      ) : (
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {activeTab === LearningTargetStatus.NOT_STARTED && 'Başlanmamış Hedefler'}
            {activeTab === LearningTargetStatus.IN_PROGRESS && 'Devam Eden Hedefler'}
            {activeTab === LearningTargetStatus.COMPLETED && 'Tamamlanmış Hedefler'}
          </Typography>
          
          <Box>
            {getTargetsByStatus(activeTab).map(target => (
              <Box key={target.id} mb={2}>
                {/* You could create a simplified card for this view */}
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6">{target.topicName}</Typography>
                  {target.notes && (
                    <Typography variant="body2" color="text.secondary">
                      {target.notes}
                    </Typography>
                  )}
                </Paper>
              </Box>
            ))}
            
            {getTargetsByStatus(activeTab).length === 0 && (
              <Box p={4} textAlign="center">
                <Typography variant="body1" color="text.secondary">
                  Bu durumda hedef bulunmuyor.
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      )}
      
      {/* Dialogs */}
      <CreateLearningTarget
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        courseId={courseId}
      />
      
      {courseId && (
        <ProposeLearningTopics
          open={proposeDialogOpen}
          onClose={() => setProposeDialogOpen(false)}
          courseId={courseId}
        />
      )}
    </Box>
  );
};

export default LearningTargetsPage;
