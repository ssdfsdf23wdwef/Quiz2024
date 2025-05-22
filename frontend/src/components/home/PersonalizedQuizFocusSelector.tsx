import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PersonalizedQuizFocus } from '@/types/quiz'; // Ensure this type is correctly defined and exported

interface PersonalizedQuizFocusSelectorProps {
  personalizedQuizFocus: PersonalizedQuizFocus;
  setPersonalizedQuizFocus: (value: PersonalizedQuizFocus) => void;
}

const PersonalizedQuizFocusSelector: React.FC<PersonalizedQuizFocusSelectorProps> = ({
  personalizedQuizFocus,
  setPersonalizedQuizFocus,
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="personalized-focus" className="text-gray-700 dark:text-gray-300">
        Personalized Quiz Focus
      </Label>
      <Select
        value={personalizedQuizFocus}
        onValueChange={(value) => setPersonalizedQuizFocus(value as PersonalizedQuizFocus)}
      >
        <SelectTrigger id="personalized-focus" className="w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
          <SelectValue placeholder="Select focus area" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="weaknesses">Focus on Weaknesses</SelectItem>
          <SelectItem value="strengths">Reinforce Strengths</SelectItem>
          <SelectItem value="new_topics">Explore New Topics</SelectItem>
          <SelectItem value="comprehensive">Comprehensive Review</SelectItem>
        </SelectContent>
      </Select>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Tailor the quiz to target specific learning goals.
      </p>
    </div>
  );
};

export default PersonalizedQuizFocusSelector;