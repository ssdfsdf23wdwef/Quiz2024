import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert
} from '@mui/material';
import { LearningTargetStatus } from '../../types/learning-target.types';
import { useLearningTargetsStore } from '../../store/useLearningTargetsStore';

interface CreateLearningTargetProps {
  open: boolean;
  onClose: () => void;
  courseId?: string;
}

const CreateLearningTarget: React.FC<CreateLearningTargetProps> = ({
  open,
  onClose,
  courseId
}) => {
  const { createTarget } = useLearningTargetsStore();
  
  const [formData, setFormData] = useState({
    topicName: '',
    status: LearningTargetStatus.NOT_STARTED,
    notes: '',
  });
  
  const [errors, setErrors] = useState<{
    topicName?: string;
  }>({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name as string]: value
    });
    
    // Clear validation errors when field is changed
    if (name === 'topicName' && errors.topicName) {
      setErrors({ ...errors, topicName: undefined });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { topicName?: string } = {};
    
    if (!formData.topicName.trim()) {
      newErrors.topicName = 'Konu adı zorunludur';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await createTarget({
        topicName: formData.topicName,
        status: formData.status,
        notes: formData.notes || undefined,
        courseId: courseId,
        isNewTopic: false,
        source: 'manual',
        userId: 'current-user',
      });
      
      handleClose();
    } catch (error) {
      console.error('Error creating learning target:', error);
      setSubmitError('Öğrenme hedefi oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form state
    setFormData({
      topicName: '',
      status: LearningTargetStatus.NOT_STARTED,
      notes: '',
    });
    setErrors({});
    setSubmitError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Yeni Öğrenme Hedefi Ekle</DialogTitle>
        <DialogContent>
          <Box mt={2}>
            {submitError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {submitError}
              </Alert>
            )}
            
            <TextField
              name="topicName"
              label="Konu Adı"
              fullWidth
              value={formData.topicName}
              onChange={handleChange}
              margin="dense"
              error={!!errors.topicName}
              helperText={errors.topicName}
              required
            />
            
            <FormControl fullWidth margin="dense">
              <InputLabel id="status-select-label">Durum</InputLabel>
              <Select
                labelId="status-select-label"
                name="status"
                value={formData.status}
                label="Durum"
                onChange={handleChange}
              >
                <MenuItem value={LearningTargetStatus.NOT_STARTED}>Başlanmadı</MenuItem>
                <MenuItem value={LearningTargetStatus.IN_PROGRESS}>Devam Ediyor</MenuItem>
                <MenuItem value={LearningTargetStatus.COMPLETED}>Tamamlandı</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              name="notes"
              label="Notlar"
              fullWidth
              multiline
              rows={3}
              value={formData.notes}
              onChange={handleChange}
              margin="dense"
              placeholder="Öğrenme hedefi hakkında notlar ekleyin (isteğe bağlı)"
            />
            
            {courseId ? (
              <Typography variant="caption" color="text.secondary">
                Bu öğrenme hedefi seçili ders ile ilişkilendirilecektir.
              </Typography>
            ) : (
              <Typography variant="caption" color="text.secondary">
                Bu öğrenme hedefi herhangi bir ders ile ilişkilendirilmeyecektir.
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={isSubmitting}>
            İptal
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Ekleniyor...' : 'Ekle'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateLearningTarget;
