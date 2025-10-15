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
}

interface GeneratedQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
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
}

// Singleton instance
let mistralInstance: MistralAPI | null = null;

export function initializeMistral(apiKey: string): void {
  mistralInstance = new MistralAPI({ apiKey });
}

export function getMistralClient(): MistralAPI | null {
  return mistralInstance;
}

export type { QuestionGenerationRequest, GeneratedQuestion };
export default MistralAPI;
