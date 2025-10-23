/**
 * Mistral AI API Client for UpMindX
 * Generates contextual questions based on video content
 */

interface MistralConfig {
  apiKey: string;
  baseURL?: string;
  model?: string;
}

interface QuestionGenerationRequest {
  videoTitle: string;
  videoDescription: string;
  techStack: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  userLevel?: number;
  userPreferences?: string[];
  previousQuestions?: string[];
}

interface ContentGenerationRequest {
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  format: 'explanation' | 'tutorial' | 'tips' | 'summary';
  userContext?: {
    currentLevel: number;
    completedTopics: string[];
    strugglingAreas: string[];
    learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  };
  maxLength?: number;
}

interface LearningPathRequest {
  goalTopic: string;
  currentLevel: 'beginner' | 'intermediate' | 'advanced';
  targetLevel: 'intermediate' | 'advanced' | 'expert';
  timeframe: string; // e.g., '2 weeks', '1 month'
  availableTime: string; // e.g., '30 minutes daily'
  userHistory: {
    completedTopics: string[];
    strugglingAreas: string[];
    preferredCategories: string[];
  };
}

interface CoachingRequest {
  userMessage: string;
  context: {
    currentStreak: number;
    recentProgress: any[];
    moodHistory: { date: string; mood: string }[];
    learningGoals: string[];
    currentChallenges: string[];
  };
  coachingStyle: 'encouraging' | 'analytical' | 'supportive';
  sessionType: 'check-in' | 'guidance' | 'motivation' | 'problem-solving';
}

interface GeneratedQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  topic?: string;
  hint?: string;
}

interface GeneratedContent {
  title: string;
  content: string;
  keyPoints: string[];
  nextSteps: string[];
  relatedTopics: string[];
  estimatedReadTime: number;
}

interface LearningPath {
  title: string;
  description: string;
  totalDuration: string;
  milestones: {
    week: number;
    topic: string;
    description: string;
    resources: string[];
    practiceExercises: string[];
    successCriteria: string[];
  }[];
  prerequisites: string[];
  skillsGained: string[];
}

interface CoachingResponse {
  message: string;
  mood: 'encouraging' | 'supportive' | 'motivational' | 'empathetic' | 'analytical';
  actionItems?: string[];
  resources?: string[];
  followUpQuestions?: string[];
  moodAssessment?: 'positive' | 'neutral' | 'concerning';
  recommendedActivities?: string[];
}

interface MistralResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

class MistralAPI {
  private apiKey: string;
  private baseURL: string;
  private model: string;

  constructor(config: MistralConfig) {
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL || 'https://api.mistral.ai/v1';
    this.model = config.model || 'mistral-small-latest';
  }

  /**
   * Generate contextual questions based on video content
   */
  async generateQuestions(request: QuestionGenerationRequest): Promise<GeneratedQuestion[]> {
    const prompt = this.buildPrompt(request);
    
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`Mistral API error: ${response.status} ${response.statusText}`);
      }

      const data: MistralResponse = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from Mistral API');
      }

      const content = data.choices[0].message.content;
      return this.parseQuestions(content);
    } catch (error) {
      console.error('Error generating questions:', error);
      // Fallback to mock questions
      return this.generateFallbackQuestions(request);
    }
  }

  /**
   * Generate personalized learning content
   */
  async generateContent(request: ContentGenerationRequest): Promise<GeneratedContent> {
    const prompt = this.buildContentPrompt(request);
    
    try {
      const response = await this.callMistralAPI(prompt, 1500);
      return this.parseContent(response);
    } catch (error) {
      console.error('Error generating content:', error);
      return this.generateFallbackContent(request);
    }
  }

  /**
   * Create personalized learning paths
   */
  async generateLearningPath(request: LearningPathRequest): Promise<LearningPath> {
    const prompt = this.buildLearningPathPrompt(request);
    
    try {
      const response = await this.callMistralAPI(prompt, 2000);
      return this.parseLearningPath(response);
    } catch (error) {
      console.error('Error generating learning path:', error);
      return this.generateFallbackLearningPath(request);
    }
  }

  /**
   * Provide AI coaching responses
   */
  async generateCoachingResponse(request: CoachingRequest): Promise<CoachingResponse> {
    const prompt = this.buildCoachingPrompt(request);
    
    try {
      const response = await this.callMistralAPI(prompt, 800);
      return this.parseCoachingResponse(response);
    } catch (error) {
      console.error('Error generating coaching response:', error);
      return this.generateFallbackCoachingResponse(request);
    }
  }

  /**
   * Analyze user progress and provide insights
   */
  async analyzeProgress(userProgress: any): Promise<{
    insights: string[];
    recommendations: string[];
    nextGoals: string[];
    strengths: string[];
    improvementAreas: string[];
  }> {
    const prompt = this.buildProgressAnalysisPrompt(userProgress);
    
    try {
      const response = await this.callMistralAPI(prompt, 1000);
      return this.parseProgressAnalysis(response);
    } catch (error) {
      console.error('Error analyzing progress:', error);
      return this.generateFallbackProgressAnalysis();
    }
  }

  private async callMistralAPI(prompt: string, maxTokens: number = 1000): Promise<string> {
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      throw new Error(`Mistral API error: ${response.status} ${response.statusText}`);
    }

    const data: MistralResponse = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from Mistral API');
    }

    return data.choices[0].message.content;
  }

  private buildPrompt(request: QuestionGenerationRequest): string {
    const difficultyDesc = {
      beginner: 'basic concepts and fundamentals',
      intermediate: 'practical application and deeper understanding',
      advanced: 'complex scenarios and expert-level knowledge'
    };

    return `Generate 3 educational questions for a ${request.difficulty} level video about "${request.videoTitle}".

Video Description: ${request.videoDescription}
Tech Stack: ${request.techStack.join(', ')}
Category: ${request.category}
Difficulty: ${difficultyDesc[request.difficulty]}

Requirements:
- Questions should test understanding of the video content
- Include 4 multiple choice options per question (A, B, C, D)
- Mark the correct answer
- Provide a brief explanation for the correct answer
- Make questions engaging and practical
- Focus on ${request.difficulty} level concepts

Return the response in this exact JSON format:
{
  "questions": [
    {
      "question": "Your question here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Brief explanation of why this is correct"
    }
  ]
}`;
  }

  private parseQuestions(content: string): GeneratedQuestion[] {
    try {
      // Extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        throw new Error('Invalid response format');
      }

      return parsed.questions.map((q: any) => ({
        question: q.question,
        options: q.options || [],
        correctAnswer: q.correctAnswer || 0,
        explanation: q.explanation || 'No explanation provided'
      }));
    } catch (error) {
      console.error('Error parsing questions:', error);
      throw new Error('Failed to parse questions from AI response');
    }
  }

  private generateFallbackQuestions(request: QuestionGenerationRequest): GeneratedQuestion[] {
    // Enhanced fallback questions based on video content
    const questions: GeneratedQuestion[] = [];
    
    if (request.category === 'coding') {
      questions.push({
        question: `What is a key benefit of using ${request.techStack[0]} in development?`,
        options: [
          'Faster development time',
          'Better performance',
          'Cross-platform compatibility',
          'All of the above'
        ],
        correctAnswer: 3,
        explanation: 'Modern frameworks typically offer multiple benefits including speed, performance, and cross-platform capabilities.'
      });
    } else if (request.category === 'career') {
      questions.push({
        question: 'What is most important when building your professional network?',
        options: [
          'Having many connections',
          'Building genuine relationships',
          'Only connecting with senior people',
          'Focusing solely on your industry'
        ],
        correctAnswer: 1,
        explanation: 'Quality relationships built on mutual value and genuine interest are more valuable than quantity.'
      });
    } else if (request.category === 'startup') {
      questions.push({
        question: 'What should be the primary focus in early startup stages?',
        options: [
          'Raising lots of funding',
          'Building a perfect product',
          'Finding product-market fit',
          'Hiring many employees'
        ],
        correctAnswer: 2,
        explanation: 'Product-market fit is crucial for startup success and should be the primary focus before scaling.'
      });
    }

    return questions.length > 0 ? questions : [{
      question: `Based on the video "${request.videoTitle}", what is the most important takeaway?`,
      options: [
        'Understanding the basic concepts',
        'Implementing best practices',
        'Avoiding common mistakes',
        'All of the above'
      ],
      correctAnswer: 3,
      explanation: 'Good educational content typically covers concepts, practices, and common pitfalls.'
    }];
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // Advanced AI Prompt Builders
  private buildContentPrompt(request: ContentGenerationRequest): string {
    const contextInfo = request.userContext ? `
User Context:
- Current Level: ${request.userContext.currentLevel}/10
- Completed Topics: ${request.userContext.completedTopics.join(', ')}
- Struggling Areas: ${request.userContext.strugglingAreas.join(', ')}
- Learning Style: ${request.userContext.learningStyle}` : '';

    return `Generate ${request.format} content about "${request.topic}" at ${request.difficulty} level.${contextInfo}

Requirements:
- Make it engaging and practical
- Include key takeaways
- Suggest next steps
- Recommend related topics
- Keep under ${request.maxLength || 800} words

Return JSON format:
{
  "title": "Content title",
  "content": "Main content here",
  "keyPoints": ["Key point 1", "Key point 2"],
  "nextSteps": ["Step 1", "Step 2"],
  "relatedTopics": ["Topic 1", "Topic 2"],
  "estimatedReadTime": 5
}`;
  }

  private buildLearningPathPrompt(request: LearningPathRequest): string {
    return `Create a personalized learning path for "${request.goalTopic}".

User Profile:
- Current Level: ${request.currentLevel}
- Target Level: ${request.targetLevel}
- Timeframe: ${request.timeframe}
- Available Time: ${request.availableTime}
- Completed Topics: ${request.userHistory.completedTopics.join(', ')}
- Struggling Areas: ${request.userHistory.strugglingAreas.join(', ')}
- Preferred Categories: ${request.userHistory.preferredCategories.join(', ')}

Return JSON format:
{
  "title": "Learning Path Title",
  "description": "Brief description",
  "totalDuration": "4 weeks",
  "milestones": [
    {
      "week": 1,
      "topic": "Foundation Topics",
      "description": "Build core understanding",
      "resources": ["Resource 1", "Resource 2"],
      "practiceExercises": ["Exercise 1"],
      "successCriteria": ["Can do X", "Understands Y"]
    }
  ],
  "prerequisites": ["Prerequisite 1"],
  "skillsGained": ["Skill 1", "Skill 2"]
}`;
  }

  private buildCoachingPrompt(request: CoachingRequest): string {
    const moodTrend = request.context.moodHistory.slice(0, 3).map(m => m.mood).join(', ');
    
    return `Act as an ${request.coachingStyle} AI learning coach. This is a ${request.sessionType} session.

User Message: "${request.userMessage}"

Context:
- Current Streak: ${request.context.currentStreak} days
- Recent Mood Trend: ${moodTrend}
- Learning Goals: ${request.context.learningGoals.join(', ')}
- Current Challenges: ${request.context.currentChallenges.join(', ')}

Respond appropriately with encouragement, guidance, or support. Return JSON format:
{
  "message": "Your coaching response",
  "mood": "encouraging",
  "actionItems": ["Action 1", "Action 2"],
  "resources": ["Resource suggestion"],
  "followUpQuestions": ["Follow-up question"],
  "moodAssessment": "positive",
  "recommendedActivities": ["Activity suggestion"]
}`;
  }

  private buildProgressAnalysisPrompt(userProgress: any): string {
    return `Analyze this user's learning progress and provide insights:

${JSON.stringify(userProgress, null, 2)}

Return detailed analysis in JSON format:
{
  "insights": ["Key insight 1", "Key insight 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "nextGoals": ["Goal 1", "Goal 2"],
  "strengths": ["Strength 1", "Strength 2"],
  "improvementAreas": ["Area 1", "Area 2"]
}`;
  }

  // Advanced Response Parsers
  private parseContent(response: string): GeneratedContent {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch![0]);
      return {
        title: parsed.title || 'Generated Content',
        content: parsed.content || '',
        keyPoints: parsed.keyPoints || [],
        nextSteps: parsed.nextSteps || [],
        relatedTopics: parsed.relatedTopics || [],
        estimatedReadTime: parsed.estimatedReadTime || 5,
      };
    } catch (error) {
      throw new Error('Failed to parse content response');
    }
  }

  private parseLearningPath(response: string): LearningPath {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch![0]);
      return {
        title: parsed.title || 'Learning Path',
        description: parsed.description || '',
        totalDuration: parsed.totalDuration || '4 weeks',
        milestones: parsed.milestones || [],
        prerequisites: parsed.prerequisites || [],
        skillsGained: parsed.skillsGained || [],
      };
    } catch (error) {
      throw new Error('Failed to parse learning path response');
    }
  }

  private parseCoachingResponse(response: string): CoachingResponse {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch![0]);
      return {
        message: parsed.message || 'I\'m here to help you succeed!',
        mood: parsed.mood || 'supportive',
        actionItems: parsed.actionItems || [],
        resources: parsed.resources || [],
        followUpQuestions: parsed.followUpQuestions || [],
        moodAssessment: parsed.moodAssessment || 'neutral',
        recommendedActivities: parsed.recommendedActivities || [],
      };
    } catch (error) {
      throw new Error('Failed to parse coaching response');
    }
  }

  private parseProgressAnalysis(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      return JSON.parse(jsonMatch![0]);
    } catch (error) {
      throw new Error('Failed to parse progress analysis');
    }
  }

  // Fallback Generators
  private generateFallbackContent(request: ContentGenerationRequest): GeneratedContent {
    return {
      title: `Understanding ${request.topic}`,
      content: `This is a ${request.difficulty} level overview of ${request.topic}. Let's explore the key concepts and practical applications.`,
      keyPoints: [`Key concept of ${request.topic}`, 'Practical applications', 'Best practices'],
      nextSteps: ['Practice the concepts', 'Build a project', 'Join a community'],
      relatedTopics: ['Related topic 1', 'Related topic 2'],
      estimatedReadTime: 3,
    };
  }

  private generateFallbackLearningPath(request: LearningPathRequest): LearningPath {
    return {
      title: `${request.goalTopic} Mastery Path`,
      description: `A structured path to master ${request.goalTopic}`,
      totalDuration: request.timeframe,
      milestones: [
        {
          week: 1,
          topic: 'Foundations',
          description: 'Build strong fundamentals',
          resources: ['Online tutorials', 'Documentation'],
          practiceExercises: ['Basic exercises'],
          successCriteria: ['Understand core concepts'],
        },
      ],
      prerequisites: ['Basic understanding of programming'],
      skillsGained: [request.goalTopic],
    };
  }

  private generateFallbackCoachingResponse(request: CoachingRequest): CoachingResponse {
    return {
      message: 'I understand what you\'re going through. Let\'s work on this together step by step.',
      mood: 'supportive',
      actionItems: ['Take a small step today', 'Focus on progress over perfection'],
      resources: ['Learning resources'],
      followUpQuestions: ['How are you feeling about your progress?'],
      moodAssessment: 'neutral',
      recommendedActivities: ['Take a short break', 'Review your goals'],
    };
  }

  private generateFallbackProgressAnalysis(): any {
    return {
      insights: ['You\'re making steady progress', 'Consistency is your strength'],
      recommendations: ['Keep up the good work', 'Consider challenging yourself more'],
      nextGoals: ['Set a new learning milestone', 'Explore advanced topics'],
      strengths: ['Consistent learning habits', 'Good completion rate'],
      improvementAreas: ['Time management', 'Deep focus sessions'],
    };
  }
}

// Singleton instance
let mistralInstance: MistralAPI | null = null;

export function initializeMistral(apiKey: string): void {
  mistralInstance = new MistralAPI({ apiKey });
}

export function getMistralClient(): MistralAPI | null {
  return mistralInstance;
}

export type { 
  QuestionGenerationRequest, 
  GeneratedQuestion, 
  ContentGenerationRequest,
  GeneratedContent,
  LearningPathRequest,
  LearningPath,
  CoachingRequest,
  CoachingResponse
};
export default MistralAPI;
