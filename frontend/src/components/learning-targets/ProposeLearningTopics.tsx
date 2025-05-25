import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Chip,
  Divider,
  Alert,
  Paper,
  IconButton
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/Info';
import { useLearningTargetsStore } from '../../store/useLearningTargetsStore';
import { ProposedTopic } from '../../types/learning-target.types';

interface ProposeLearningTopicsProps {
  open: boolean;
  onClose: () => void;
  courseId: string;
}

// Mock function to simulate AI suggesting topics
const mockAiSuggestTopics = async (context: string, existingTopics: string[]): Promise<ProposedTopic[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Return mock data
  return [
    { tempId: 'topic1', name: 'JavaScript Closures', relevance: 'Yüksek', details: 'JavaScript içinde fonksiyonlar ve kapsam konularıyla ilgili önemli bir kavram.' },
    { tempId: 'topic2', name: 'ES6 Arrow Functions', relevance: 'Orta', details: 'Modern JavaScript sözdizimi için temel bir özellik.' },
    { tempId: 'topic3', name: 'Event Loop', relevance: 'Yüksek', details: 'JavaScript\'in asenkron doğasını anlamak için temel bir kavram.' },
    { tempId: 'topic4', name: 'Promise Chaining', relevance: 'Orta', details: 'Asenkron işlemleri sıralı bir şekilde işlemek için kullanılır.' },
    { tempId: 'topic5', name: 'Async/Await Pattern', relevance: 'Yüksek', details: 'Modern JavaScript\'te asenkron kod yazmanın en temiz yolu.' }
  ];
};

// Mock function to simulate confirming topics and creating learning targets
const mockConfirmTopics = async (courseId: string, selectedTopics: ProposedTopic[]): Promise<void> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // In a real implementation, this would call the backend API
  console.log('Confirmed topics:', { courseId, selectedTopics });
};

const ProposeLearningTopics: React.FC<ProposeLearningTopicsProps> = ({
  open,
  onClose,
  courseId
}) => {
  // Context text that will be analyzed by AI
  const [contextText, setContextText] = useState('');
  
  // Track UI state
  const [isLoading, setIsLoading] = useState(false);
  const [proposedTopics, setProposedTopics] = useState<ProposedTopic[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<ProposedTopic[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [step, setStep] = useState<'input' | 'review' | 'success'>('input');
  
  // Get existing topics for the course
  const { targets, fetchTargets } = useLearningTargetsStore();
  const existingTopics = targets
    .filter(target => target.courseId === courseId)
    .map(target => target.topicName);

  const handleContextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContextText(e.target.value);
  };

  const handlePropose = async () => {
    if (!contextText.trim()) {
      setError('Lütfen analiz edilecek bir metin girin.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would call your backend API
      const topics = await mockAiSuggestTopics(contextText, existingTopics);
      setProposedTopics(topics);
      setSelectedTopics([]); // Reset selection
      setStep('review');
    } catch (error) {
      console.error('Error proposing topics:', error);
      setError('Konu önerileri alınırken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopicToggle = (topic: ProposedTopic) => {
    const currentIndex = selectedTopics.findIndex(t => t.tempId === topic.tempId);
    const newSelectedTopics = [...selectedTopics];
    
    if (currentIndex === -1) {
      newSelectedTopics.push(topic);
    } else {
      newSelectedTopics.splice(currentIndex, 1);
    }
    
    setSelectedTopics(newSelectedTopics);
  };

  const handleConfirm = async () => {
    if (selectedTopics.length === 0) {
      setError('Lütfen en az bir konu seçin.');
      return;
    }
    
    setIsConfirming(true);
    setError(null);
    
    try {
      // In a real implementation, this would call your backend API
      await mockConfirmTopics(courseId, selectedTopics);
      setStep('success');
      
      // Refresh learning targets after confirmation
      await fetchTargets('current-user', courseId);
    } catch (error) {
      console.error('Error confirming topics:', error);
      setError('Konular kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleClose = () => {
    // Reset state
    setContextText('');
    setProposedTopics([]);
    setSelectedTopics([]);
    setError(null);
    setStep('input');
    onClose();
  };

  const handleBack = () => {
    setStep('input');
  };

  // Render content based on current step
  const renderContent = () => {
    switch (step) {
      case 'input':
        return (
          <>
            <Typography variant="body1" gutterBottom>
              Ders notlarınızı veya ilgili metni aşağıya yapıştırın. Yapay zeka, bu içeriği analiz ederek öğrenmeniz gereken yeni konuları önerecektir.
            </Typography>
            
            {existingTopics.length > 0 && (
              <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
                <Typography variant="subtitle2" gutterBottom display="flex" alignItems="center">
                  <InfoIcon fontSize="small" sx={{ mr: 1, color: 'info.main' }} />
                  Mevcut Konular ({existingTopics.length})
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {existingTopics.slice(0, 5).map((topic, index) => (
                    <Chip key={index} label={topic} size="small" />
                  ))}
                  {existingTopics.length > 5 && (
                    <Chip label={`+${existingTopics.length - 5} daha`} size="small" />
                  )}
                </Box>
              </Paper>
            )}
            
            <TextField
              label="Analiz Edilecek Metin"
              multiline
              rows={8}
              fullWidth
              value={contextText}
              onChange={handleContextChange}
              placeholder="Ders notları, makale veya ilgili içeriği buraya yapıştırın..."
              variant="outlined"
            />
            
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </>
        );
        
      case 'review':
        return (
          <>
            <Typography variant="body1" gutterBottom>
              Yapay zeka, metin içinde aşağıdaki yeni konuları tespit etti. Öğrenme hedefi olarak eklemek istediklerinizi seçin.
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <List sx={{ width: '100%' }}>
              {proposedTopics.map((topic) => {
                const isSelected = selectedTopics.some(t => t.tempId === topic.tempId);
                
                return (
                  <React.Fragment key={topic.tempId}>
                    <ListItem 
                      alignItems="flex-start"
                      secondaryAction={
                        <IconButton 
                          edge="end" 
                          aria-label="select" 
                          onClick={() => handleTopicToggle(topic)}
                          color={isSelected ? "primary" : "default"}
                        >
                          {isSelected ? <AddCircleOutlineIcon color="primary" /> : <AddCircleOutlineIcon />}
                        </IconButton>
                      }
                    >
                      <ListItemIcon>
                        <Checkbox
                          edge="start"
                          checked={isSelected}
                          tabIndex={-1}
                          disableRipple
                          onChange={() => handleTopicToggle(topic)}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center">
                            <Typography variant="subtitle1">{topic.name}</Typography>
                            {topic.relevance && (
                              <Chip 
                                label={topic.relevance} 
                                size="small" 
                                color={topic.relevance === 'Yüksek' ? 'success' : 'primary'}
                                variant="outlined"
                                sx={{ ml: 1 }}
                              />
                            )}
                          </Box>
                        }
                        secondary={topic.details}
                      />
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                );
              })}
            </List>
            
            {proposedTopics.length === 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Metinde öğrenmeniz gereken yeni konular tespit edilemedi. Farklı bir metin deneyebilir veya manuel olarak öğrenme hedefi ekleyebilirsiniz.
              </Alert>
            )}
          </>
        );
        
      case 'success':
        return (
          <Box textAlign="center" py={2}>
            <Typography variant="h6" color="success.main" gutterBottom>
              Seçilen konular başarıyla öğrenme hedeflerinize eklendi!
            </Typography>
            <Typography variant="body1">
              {selectedTopics.length} yeni öğrenme hedefi oluşturuldu. Öğrenme hedefleri sayfasından bu konuları yönetebilirsiniz.
            </Typography>
          </Box>
        );
    }
  };

  // Render dialog actions based on current step
  const renderActions = () => {
    switch (step) {
      case 'input':
        return (
          <>
            <Button onClick={handleClose}>
              İptal
            </Button>
            <Button 
              onClick={handlePropose} 
              variant="contained" 
              color="primary"
              disabled={isLoading || !contextText.trim()}
            >
              {isLoading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Analiz Ediliyor...
                </>
              ) : (
                'Konuları Öner'
              )}
            </Button>
          </>
        );
        
      case 'review':
        return (
          <>
            <Button onClick={handleBack} disabled={isConfirming}>
              Geri
            </Button>
            <Button 
              onClick={handleConfirm} 
              variant="contained" 
              color="primary"
              disabled={isConfirming || selectedTopics.length === 0}
            >
              {isConfirming ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Kaydediliyor...
                </>
              ) : (
                `${selectedTopics.length} Konuyu Ekle`
              )}
            </Button>
          </>
        );
        
      case 'success':
        return (
          <Button onClick={handleClose} variant="contained" color="primary">
            Tamam
          </Button>
        );
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{ sx: { maxHeight: '90vh' } }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {step === 'input' && 'Yapay Zeka ile Yeni Konular Öner'}
            {step === 'review' && 'Önerilen Konuları İncele'}
            {step === 'success' && 'Konular Eklendi'}
          </Typography>
          <IconButton aria-label="close" onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        {renderContent()}
      </DialogContent>
      
      <DialogActions>
        {renderActions()}
      </DialogActions>
    </Dialog>
  );
};

export default ProposeLearningTopics;
