import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/Button'; // Corrected Casing
import { LuRefreshCw, LuSparkles } from 'react-icons/lu';
import { QuizGenerationPreferences, DocumentTopics, QuizMode, Topics, SubTopic } from '@/types/quiz'; // Ensure these types are correctly defined

interface PreferencesFormProps {
  preferences: QuizGenerationPreferences;
  handlePreferenceChange: (key: keyof QuizGenerationPreferences, value: any) => void;
  useTimeLimit: boolean;
  handleUseTimeLimitChange: (checked: boolean) => void;
  timeLimit?: number;
  handleTimeLimitInputChange: (value: string) => void;
  documentTopics: DocumentTopics | null;
  selectedTopics: string[]; // Should be string[] of main topic names/keys
  handleTopicSelectionChange: (topicName: string) => void;
  subTopicStates: Record<string, boolean>; // Keyed by sub-topic name
  handleSubTopicToggle: (subTopicName: string, mainTopicName: string) => void;
  isLoadingTopics: boolean;
  reloadDocumentText?: () => void;
  quizMode: QuizMode;
}

const PreferencesForm: React.FC<PreferencesFormProps> = ({
  preferences,
  handlePreferenceChange,
  useTimeLimit,
  handleUseTimeLimitChange,
  timeLimit,
  handleTimeLimitInputChange,
  documentTopics,
  selectedTopics,
  handleTopicSelectionChange,
  subTopicStates,
  handleSubTopicToggle,
  isLoadingTopics,
  reloadDocumentText,
  quizMode,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-2 text-gray-700 dark:text-gray-300">Quiz Preferences</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Customize the quiz to your needs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="question-count" className="text-gray-700 dark:text-gray-300">Number of Questions</Label>
          <Input
            id="question-count"
            type="number"
            min="1"
            max="50" // Example max
            value={preferences.questionCount}
            onChange={(e) => handlePreferenceChange('questionCount', parseInt(e.target.value, 10) || 1)}
            className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
          />
        </div>
        <div>
          <Label htmlFor="difficulty" className="text-gray-700 dark:text-gray-300">Difficulty Level</Label>
          <Select
            value={preferences.difficulty}
            onValueChange={(value) => handlePreferenceChange('difficulty', value as 'easy' | 'medium' | 'hard' | 'mixed')}
          >
            <SelectTrigger id="difficulty" className="w-full mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
              <SelectValue placeholder="Select difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
              <SelectItem value="mixed">Mixed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="time-limit-toggle"
          checked={useTimeLimit}
          onCheckedChange={handleUseTimeLimitChange}
        />
        <Label htmlFor="time-limit-toggle" className="text-gray-700 dark:text-gray-300">Enable Time Limit (minutes)</Label>
      </div>
      {useTimeLimit && (
        <div>
          <Input
            id="time-limit-value"
            type="number"
            min="1"
            value={timeLimit === undefined ? '' : String(timeLimit) }
            onChange={(e) => handleTimeLimitInputChange(e.target.value)}
            placeholder="e.g., 30"
            className="w-full md:w-1/2 mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
          />
        </div>
      )}

      {quizMode === 'manual' && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300">Select Topics & Sub-Topics</h4>
            {reloadDocumentText && (
                <Button variant="outline" size="sm" onClick={reloadDocumentText} disabled={isLoadingTopics}>
                    {isLoadingTopics ? <LuSparkles className="animate-spin mr-2" /> : <LuRefreshCw className="mr-2 h-4 w-4" />}
                    Refresh Topics
                </Button>
            )}
          </div>
          {isLoadingTopics && <p className="text-blue-500 flex items-center"><LuSparkles className="animate-spin mr-2" />Loading topics...</p>}
          {!isLoadingTopics && !documentTopics && (
            <p className="text-orange-500">No topics loaded. Please ensure a document source is provided in Step 1 and topics have been processed.</p>
          )}
          {!isLoadingTopics && documentTopics && Object.keys(documentTopics.topics).length === 0 && (
            <p className="text-orange-500">No topics were found in the document. Try a different document or AI Curated mode.</p>
          )}
          {documentTopics && Object.keys(documentTopics.topics).length > 0 && (
            <Accordion type="multiple" className="w-full space-y-1">
              {Object.entries(documentTopics.topics).map(([topicKey, mainTopicData]) => {
                // Ensure mainTopicData and its properties are valid before accessing
                const currentMainTopicName = mainTopicData?.name || topicKey;
                const currentMainTopicId = mainTopicData?.id || topicKey;

                return (
                  <AccordionItem value={currentMainTopicId} key={currentMainTopicId} className="border dark:border-gray-700 rounded-md">
                    <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-t-md">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id={`main-topic-${currentMainTopicId}`}
                          checked={selectedTopics.includes(currentMainTopicName)}
                          onCheckedChange={() => handleTopicSelectionChange(currentMainTopicName)}
                          onClick={(e: React.MouseEvent) => e.stopPropagation()} // Prevent accordion toggle
                        />
                        <span className="font-medium text-gray-700 dark:text-gray-300">{currentMainTopicName}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 py-3 border-t dark:border-gray-600 bg-gray-50 dark:bg-gray-700/30 rounded-b-md">
                      {mainTopicData?.subTopics && mainTopicData.subTopics.length > 0 ? (
                        <ul className="space-y-2">
                          {mainTopicData.subTopics.map((subTopic: SubTopic) => {
                            const subTopicId = subTopic.id || subTopic.name;
                            return (
                              <li key={subTopicId} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`sub-topic-${subTopicId}`}
                                  checked={!!subTopicStates[subTopic.name]}
                                  onCheckedChange={() => handleSubTopicToggle(subTopic.name, currentMainTopicName)}
                                />
                                <Label htmlFor={`sub-topic-${subTopicId}`} className="text-sm font-normal text-gray-600 dark:text-gray-400">
                                  {subTopic.name}
                                </Label>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No sub-topics available.</p>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </div>
      )}
    </div>
  );
};

export default PreferencesForm;