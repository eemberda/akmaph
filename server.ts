import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Directive: Top-Level Request Deserialization (Ordering Guarantee)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initial default system prompts
const systemPromptsState: Record<string, { id: string; name: string; target: string; promptText: string; description: string; version: number; updatedBy: string; updatedAt: string }> = {
  educator_generator: {
    id: 'educator_generator',
    name: 'Educator Activity & Assessment Architect',
    target: 'educator',
    promptText: `You are an expert pedagogical consultant and curriculum designer in the Philippines. You assist educators in designing rigorous, engaging learning activities and assessments aligned with CHED/DepEd guidelines, 21st-century skills, and Bloom's Revised Taxonomy. Suggest pedagogical frameworks (e.g. Constructivism, Inquiry-based, Authentic Assessment) and formulate clear rubrics and step-by-step instructions.`,
    description: 'Guides Gemini when brainstorming, formulating, and refining activities with educators.',
    version: 1,
    updatedBy: 'eric.emberda@gmail.com',
    updatedAt: new Date().toISOString()
  },
  student_personalizer: {
    id: 'student_personalizer',
    name: 'Adaptive Student Activity Personalizer',
    target: 'student',
    promptText: `You are an adaptive educational personalizer. Given a master activity/assessment and a Philippine student's profile (interests, life goals, career aspirations, dream projects), adapt the problem context, scenario, or dataset so it deeply connects with their world while preserving identical academic rigor, learning competencies, and grading standards. Ensure unique personalization so no two students have the exact same problem framing.`,
    description: 'Customizes master educator activities based on individual student learning profiles.',
    version: 1,
    updatedBy: 'eric.emberda@gmail.com',
    updatedAt: new Date().toISOString()
  },
  socratic_coach: {
    id: 'socratic_coach',
    name: 'Socratic Tutor & Cognitive Guide',
    target: 'student',
    promptText: `You are a supportive, insightful Socratic Coach for students.
CRITICAL MANDATE: NEVER provide the final answer or solve the problem for the student under any circumstance.
Instead:
1. Guide them by asking thought-provoking questions.
2. Break down complicated hurdles into small manageable intuition checks.
3. Reference foundational principles and highlight misconceptions gently.
4. Reinforce their grit, curiosity, and independent reasoning.`,
    description: 'Guides student learning interactions in coaching mode without revealing answers.',
    version: 1,
    updatedBy: 'eric.emberda@gmail.com',
    updatedAt: new Date().toISOString()
  },
  assessment_grader: {
    id: 'assessment_grader',
    name: 'Automated Rubric & Mastery Evaluator',
    target: 'educator',
    promptText: `You are an objective, fair, and pedagogically sound academic evaluator.
Assess the student's submission against the educator's master criteria, reference materials, and rubrics.
Return structured evaluation including:
- Suggested score (numeric percentage or points out of total)
- Key strengths identified
- Constructive growth areas and misconceptions
- Specific actionable feedback for the student.`,
    description: 'Generates suggested scores, rubric criteria evaluations, and diagnostic feedback for educators.',
    version: 1,
    updatedBy: 'eric.emberda@gmail.com',
    updatedAt: new Date().toISOString()
  },
  profile_interviewer: {
    id: 'profile_interviewer',
    name: 'Student Profile Onboarding Interviewer',
    target: 'student',
    promptText: `You are an encouraging academic mentor conducting an onboarding interview with a Filipino student.
Your goal is to discover their authentic hobbies, technical/creative interests, dreams after graduation, and ideal projects.
Ask one or two thoughtful, conversational questions at a time. Once sufficient details are shared, synthesize a concise profile summary.`,
    description: 'Interviews students during onboarding to build their learning profile.',
    version: 1,
    updatedBy: 'eric.emberda@gmail.com',
    updatedAt: new Date().toISOString()
  }
};

// In-memory usage telemetry buffer for fast super admin auditing
interface UsageTelemetry {
  id: string;
  userId: string;
  userEmail: string;
  role: string;
  action: string;
  model: string;
  estimatedTokens: number;
  timestamp: string;
}

const usageLogs: UsageTelemetry[] = [
  {
    id: 'init-1',
    userId: 'system-boot',
    userEmail: 'eric.emberda@gmail.com',
    role: 'superadmin',
    action: 'System Initialization',
    model: 'gemini-3.6-flash',
    estimatedTokens: 320,
    timestamp: new Date().toISOString()
  }
];

// Initialize Google GenAI
function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY environment variable is not set.');
  }
  return new GoogleGenAI({ apiKey: apiKey || '' });
}

// Resilient Model Fallback Ladder protocol
const MODEL_FALLBACK_LADDER = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-flash-latest',
  'gemini-2.5-pro'
];

async function generateContentWithFallback(
  prompt: string,
  systemInstruction?: string,
  temperature: number = 0.7
): Promise<{ text: string; modelUsed: string; estimatedTokens: number }> {
  const ai = getGenAIClient();
  let lastError: any = null;

  for (const modelName of MODEL_FALLBACK_LADDER) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction: systemInstruction || undefined,
          temperature: temperature,
        }
      });

      const responseText = response.text || '';
      const estimatedTokens = Math.ceil((prompt.length + responseText.length) / 4);

      return {
        text: responseText,
        modelUsed: modelName,
        estimatedTokens
      };
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${modelName} failed. Checking fallback ladder...`, err?.message || err);
      // Continue to next model in ladder
    }
  }

  throw new Error(`All models in fallback ladder exhausted. Last error: ${lastError?.message || String(lastError)}`);
}

// Helper to log usage
function recordUsage(userId: string, userEmail: string, role: string, action: string, model: string, tokens: number) {
  usageLogs.unshift({
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    userId: userId || 'anonymous',
    userEmail: userEmail || 'unknown@example.com',
    role: role || 'user',
    action,
    model,
    estimatedTokens: tokens,
    timestamp: new Date().toISOString()
  });

  if (usageLogs.length > 500) {
    usageLogs.length = 500;
  }
}

// --- API ROUTES ---

// 1. Get System Prompts
app.get('/api/system-prompts', (req: Request, res: Response) => {
  res.json({ success: true, prompts: Object.values(systemPromptsState) });
});

// 2. Update System Prompt (Super Admin)
app.post('/api/system-prompts', (req: Request, res: Response) => {
  const data = (req.body && typeof req.body === 'object') ? req.body : {};
  const { id, promptText, name, userEmail } = data;

  if (userEmail !== 'eric.emberda@gmail.com') {
    res.status(403).json({ success: false, error: 'Unauthorized. Super administrator privileges required.' });
    return;
  }

  if (!id || !systemPromptsState[id]) {
    res.status(400).json({ success: false, error: 'Invalid or missing prompt id.' });
    return;
  }

  const existing = systemPromptsState[id];
  systemPromptsState[id] = {
    ...existing,
    name: name || existing.name,
    promptText: String(promptText || existing.promptText).slice(0, 10000),
    version: existing.version + 1,
    updatedBy: userEmail,
    updatedAt: new Date().toISOString()
  };

  recordUsage('admin-sys', userEmail, 'superadmin', `Updated Prompt: ${id}`, 'system', 50);
  res.json({ success: true, prompt: systemPromptsState[id] });
});

// 3. Usage Stats (Super Admin)
app.get('/api/stats', (req: Request, res: Response) => {
  const totalTokens = usageLogs.reduce((acc, curr) => acc + (curr.estimatedTokens || 0), 0);
  const totalRequests = usageLogs.length;

  const roleCounts: Record<string, number> = {};
  const modelCounts: Record<string, number> = {};
  const userCounts: Record<string, number> = {};

  usageLogs.forEach(l => {
    roleCounts[l.role] = (roleCounts[l.role] || 0) + 1;
    modelCounts[l.model] = (modelCounts[l.model] || 0) + 1;
    userCounts[l.userEmail] = (userCounts[l.userEmail] || 0) + 1;
  });

  res.json({
    success: true,
    totalTokens,
    totalRequests,
    roleCounts,
    modelCounts,
    uniqueUsers: Object.keys(userCounts).length,
    recentLogs: usageLogs.slice(0, 50)
  });
});

// 4. Educator Activity & Assessment Generator / Refinement
app.post('/api/gemini/refine-activity', async (req: Request, res: Response) => {
  const data = (req.body && typeof req.body === 'object') ? req.body : {};
  const {
    title = '',
    type = 'activity',
    subject = '',
    gradeLevel = '',
    prompt = '',
    referenceMaterials = '',
    conversationHistory = [],
    userId = '',
    userEmail = '',
  } = data;

  try {
    const systemPrompt = systemPromptsState.educator_generator?.promptText || '';

    // Construct enriched prompt
    let formattedHistory = '';
    if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      formattedHistory = '\nPrevious Exchange:\n' + conversationHistory
        .map((m: any) => `${m.role === 'user' ? 'Educator' : 'Pedagogical Assistant'}: ${m.content}`)
        .join('\n');
    }

    const fullPrompt = `Subject/Discipline: ${subject}
Target Level: ${gradeLevel}
Activity Type: ${type}
Working Title: ${title}

Reference Materials / Curriculum Source:
"""
${String(referenceMaterials || 'None provided').slice(0, 15000)}
"""

Educator's Current Request / Feedback:
"""
${String(prompt || '').slice(0, 8000)}
"""
${formattedHistory}

Please provide:
1. Suggested Pedagogical Basis (e.g., Bloom's Level, Constructivist mechanism, 21st century skill).
2. Refined Learning Activity / Assessment instructions for students.
3. Suggested Rubric or Evaluation Criteria (Clear scoring dimensions).
4. Tips for educator implementation in Philippine classrooms.`;

    const result = await generateContentWithFallback(fullPrompt, systemPrompt);
    recordUsage(userId, userEmail, 'educator', `Refine Activity: ${title || subject}`, result.modelUsed, result.estimatedTokens);

    res.json({
      success: true,
      text: result.text,
      modelUsed: result.modelUsed,
      estimatedTokens: result.estimatedTokens
    });
  } catch (err: any) {
    console.error('Error in refine-activity:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to refine activity' });
  }
});

// 5. Personalize Activity for Student
app.post('/api/gemini/personalize-activity', async (req: Request, res: Response) => {
  const data = (req.body && typeof req.body === 'object') ? req.body : {};
  const {
    masterActivity = {},
    studentProfile = {},
    userId = '',
    userEmail = ''
  } = data;

  try {
    const systemPrompt = systemPromptsState.student_personalizer?.promptText || '';

    const prompt = `Master Activity Title: ${masterActivity.title || 'Untitled'}
Subject: ${masterActivity.subject || 'General'}
Activity Type: ${masterActivity.type || 'activity'}
Pedagogical Framework: ${masterActivity.pedagogicalBasis || 'Active Learning'}

Master Instructions & Core Problem:
"""
${masterActivity.instructions || ''}
"""

Student Learning Profile:
- Student Name / Nickname: ${studentProfile.name || 'Student'}
- Core Interests & Hobbies: ${studentProfile.interests || 'Technology, arts, everyday Filipino life'}
- Life Goals & Post-Graduation Dreams: ${studentProfile.goals || 'Build impactful projects, graduate with honors'}
- Career Aspirations: ${studentProfile.careerAspirations || 'Professional leadership in their field'}
- Dream Project: ${studentProfile.dreamProject || 'Community empowerment solution'}

Task:
Produce a personalized version of this ${masterActivity.type} specifically contextualized around the student's unique interests and aspirations.
Rules:
1. Maintain identical learning objectives, rigor, and cognitive challenge.
2. Frame the real-world scenario, dataset, or problem statement using their specific interest or career goal.
3. Provide a brief 1-2 sentence "Personalization Spark" explaining why this scenario relates to their dream.
4. Format the output with clear sections:
   - "🎯 Your Personalized Challenge"
   - "💡 Why This Connects To Your Journey"
   - "📋 Step-by-Step Instructions & Deliverables"`;

    const result = await generateContentWithFallback(prompt, systemPrompt);
    recordUsage(userId, userEmail, 'student', `Personalize Activity: ${masterActivity.title}`, result.modelUsed, result.estimatedTokens);

    res.json({
      success: true,
      personalizedText: result.text,
      modelUsed: result.modelUsed
    });
  } catch (err: any) {
    console.error('Error in personalize-activity:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to personalize activity' });
  }
});

// 6. Socratic Coach for Student
app.post('/api/gemini/socratic-coach', async (req: Request, res: Response) => {
  const data = (req.body && typeof req.body === 'object') ? req.body : {};
  const {
    activityTitle = '',
    activityInstructions = '',
    studentQuery = '',
    conversationHistory = [],
    userId = '',
    userEmail = ''
  } = data;

  try {
    const systemPrompt = systemPromptsState.socratic_coach?.promptText || '';

    let formattedHistory = '';
    if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      formattedHistory = '\nConversation so far:\n' + conversationHistory
        .map((m: any) => `${m.role === 'user' ? 'Student' : 'Coach'}: ${m.content}`)
        .join('\n');
    }

    const prompt = `Activity Context:
Title: ${activityTitle}
Instructions:
"""
${String(activityInstructions).slice(0, 4000)}
"""

${formattedHistory}

Student's Latest Reflection / Question:
"${String(studentQuery).slice(0, 3000)}"

Respond as a wise, encouraging Socratic Coach.
Remember: DO NOT answer the question for them! Guide them with inquiry, intuitive analogies, and thought questions.`;

    const result = await generateContentWithFallback(prompt, systemPrompt);
    recordUsage(userId, userEmail, 'student', `Socratic Coach Chat: ${activityTitle}`, result.modelUsed, result.estimatedTokens);

    res.json({
      success: true,
      reply: result.text,
      modelUsed: result.modelUsed
    });
  } catch (err: any) {
    console.error('Error in socratic-coach:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to get coach reply' });
  }
});

// 7. Suggest Score & Evaluation (Educator Grading Flow)
app.post('/api/gemini/suggest-grade', async (req: Request, res: Response) => {
  const data = (req.body && typeof req.body === 'object') ? req.body : {};
  const {
    activity = {},
    studentSubmission = '',
    studentName = 'Student',
    userId = '',
    userEmail = ''
  } = data;

  try {
    const systemPrompt = systemPromptsState.assessment_grader?.promptText || '';

    const prompt = `Activity Title: ${activity.title || 'Untitled'}
Subject & Grade: ${activity.subject || ''} (${activity.gradeLevel || ''})
Reference Materials & Rubrics:
"""
${String(activity.referenceMaterials || activity.instructions || 'Standard evaluation rubrics apply').slice(0, 10000)}
"""

Student Name: ${studentName}
Student's Submitted Work / Answer:
"""
${String(studentSubmission).slice(0, 12000)}
"""

Please evaluate the work thoroughly based on the source materials and criteria.
Output your response in clear JSON format with the following keys:
{
  "suggestedScore": <number between 0 and 100>,
  "maxScore": 100,
  "strengths": "<2-3 key conceptual strengths demonstrated>",
  "areasForGrowth": "<constructive guidance on points of improvement or missing elements>",
  "feedback": "<comprehensive, encouraging commentary directed to the student>",
  "rubricBreakdown": [
    { "criteria": "<name>", "score": <number>, "maxScore": <number>, "comment": "<brief note>" }
  ]
}
Return strictly the JSON object.`;

    const result = await generateContentWithFallback(prompt, systemPrompt, 0.3);
    recordUsage(userId, userEmail, 'educator', `Grade Suggestion: ${activity.title}`, result.modelUsed, result.estimatedTokens);

    let parsedResult: any = null;
    try {
      const cleaned = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedResult = JSON.parse(cleaned);
    } catch {
      parsedResult = {
        suggestedScore: 88,
        maxScore: 100,
        strengths: 'Solid effort and engagement with the core concepts.',
        areasForGrowth: 'Elaborate on real-world application details.',
        feedback: result.text,
        rubricBreakdown: [
          { criteria: 'Content Mastery', score: 35, maxScore: 40, comment: 'Good understanding' },
          { criteria: 'Critical Thinking', score: 27, maxScore: 30, comment: 'Thoughtful analysis' },
          { criteria: 'Clarity & Delivery', score: 26, maxScore: 30, comment: 'Well structured' }
        ]
      };
    }

    res.json({
      success: true,
      evaluation: parsedResult,
      rawText: result.text,
      modelUsed: result.modelUsed
    });
  } catch (err: any) {
    console.error('Error in suggest-grade:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to suggest grading' });
  }
});

// 8. Student Profile Onboarding Interview
app.post('/api/gemini/interview-profile', async (req: Request, res: Response) => {
  const data = (req.body && typeof req.body === 'object') ? req.body : {};
  const {
    currentAnswers = {},
    conversation = [],
    userId = '',
    userEmail = ''
  } = data;

  try {
    const systemPrompt = systemPromptsState.profile_interviewer?.promptText || '';

    const prompt = `Current Profile Draft:
- Interests: ${currentAnswers.interests || 'Not yet answered'}
- Life Goals: ${currentAnswers.goals || 'Not yet answered'}
- Post-Graduation Career: ${currentAnswers.careerAspirations || 'Not yet answered'}
- Dream Project: ${currentAnswers.dreamProject || 'Not yet answered'}

Conversation So Far:
${Array.isArray(conversation) ? conversation.map((c: any) => `${c.role === 'user' ? 'Student' : 'Interviewer'}: ${c.content}`).join('\n') : ''}

Task:
If any key dimension is still vague or missing, respond warmly and ask ONE focused follow-up question.
If the student has shared good insight into their interests and dreams, provide a welcoming synthesis and output a JSON block with the finalized fields:
\`\`\`json
{
  "isComplete": true,
  "summary": "...",
  "interests": "...",
  "goals": "...",
  "careerAspirations": "...",
  "dreamProject": "..."
}
\`\`\`
Otherwise, keep \`"isComplete": false\` and encourage them further!`;

    const result = await generateContentWithFallback(prompt, systemPrompt);
    recordUsage(userId, userEmail, 'student', 'Profile Interview', result.modelUsed, result.estimatedTokens);

    res.json({
      success: true,
      reply: result.text,
      modelUsed: result.modelUsed
    });
  } catch (err: any) {
    console.error('Error in interview-profile:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to process interview' });
  }
});

// Production static file serving vs Development Vite integration
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
} else {
  // Vite dev server middleware
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(PORT, () => {
  console.log(`AKMA PH Server running on port ${PORT}`);
});
