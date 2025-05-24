import { TopicDetectionService } from '../src/ai/services/topic-detection.service';
export declare class ExampleUsage {
    private readonly topicDetectionService;
    constructor(topicDetectionService: TopicDetectionService);
    exampleDetectNewTopics(): Promise<string[]>;
    exampleWithEmptyExistingTopics(): Promise<string[]>;
    exampleWithManyExistingTopics(): Promise<string[]>;
}
export declare class LessonController {
    private readonly topicDetectionService;
    constructor(topicDetectionService: TopicDetectionService);
    addNewLessonContent(lessonId: string, newContent: string): Promise<{
        success: boolean;
        message: string;
        newTopics: string[];
    }>;
    private getExistingTopicsForLesson;
    private addTopicsToLesson;
}
