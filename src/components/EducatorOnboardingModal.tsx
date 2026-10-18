import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  Users,
  Award,
  Printer,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  Compass,
  Lightbulb,
  ShieldAlert,
  Layers,
  HelpCircle
} from 'lucide-react';

interface EducatorOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartCreating: () => void;
}

export const EducatorOnboardingModal: React.FC<EducatorOnboardingModalProps> = ({
  isOpen,
  onClose,
  onStartCreating
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [selectedDemoProfile, setSelectedDemoProfile] = useState<number>(0);

  if (!isOpen) return null;

  const demoProfiles = [
    {
      name: 'Juan Santos (Isabela)',
      dream: 'Aspiring Drone & Hardware Engineer',
      background: 'Passionate about autonomous flight and river telemetry in Northern Luzon.',
      adaptedPrompt: '🎯 Challenge: Calculate the head and discharge of a mountain stream in the Cordillera to power an autonomous drone charging hub for typhoon relief.',
      antiCheatReason: 'Generic AI prompts or copying from a classmate will fail because this problem requires calculations contextualized specifically to Juan\'s drone battery specs.'
    },
    {
      name: 'Maria Reyes (Bukidnon)',
      dream: 'Sustainable Agriculture Entrepreneur',
      background: 'Focuses on hillside coffee farming, irrigation systems, and solar microgrids.',
      adaptedPrompt: '🎯 Challenge: Design a solar-powered irrigation pumping network for high-elevation coffee cooperatives, balancing solar irradiance curves with crop water demand.',
      antiCheatReason: 'Maria receives distinct crop yield figures and solar irradiation metrics that do not match Juan\'s formulas or numbers.'
    },
    {
      name: 'Carlo Mendoza (Palawan)',
      dream: 'Marine Biologist & Environmental Advocate',
      background: 'Works on coral reef restoration, coastal erosion, and tidal energy monitoring.',
      adaptedPrompt: '🎯 Challenge: Evaluate tidal stream energy generation to power acoustic marine monitoring sensors in the Puerto Princesa Subterranean River vicinity.',
      antiCheatReason: 'Carlo\'s deliverable evaluates fluid velocity in marine estuaries, requiring authentic independent reasoning.'
    }
  ];

  const steps = [
    {
      title: 'Welcome to AKMA PH',
      badge: 'Core Philosophy',
      icon: Sparkles,
      color: 'from-blue-600 to-indigo-600',
      description: 'Solving Real Classroom Struggles with Student-Centric Lessons',
      content: (
        <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
          <p className="leading-relaxed text-sm font-medium text-slate-800 dark:text-slate-200">
            Technology integration works best when it solves real classroom struggles. Right now, educators fight a losing battle against AI cheating and copied homework.
          </p>
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-blue-900 dark:text-blue-200 space-y-2">
            <span className="font-bold text-xs uppercase tracking-wider block">How AKMA PH Changes the Game:</span>
            <p className="leading-relaxed">
              You craft <strong>one master lesson</strong> with your standard curriculum objectives. AKMA PH then automatically adapts the assessment for each student based on their unique background and aspirations.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="font-bold text-rose-600 dark:text-rose-400 block mb-1">Old Way (Classroom Struggles)</span>
              <p className="text-[11px] text-slate-500">Every student gets the identical prompt. Answers are easily shared in group chats or copied from a generic chatbot.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="font-bold text-emerald-600 dark:text-emerald-400 block mb-1">AKMA PH Way (Authentic Learning)</span>
              <p className="text-[11px] text-slate-500">Everyone receives a personalized challenge. Students cannot copy answers, and generic AI tools cannot solve it without personalized reasoning.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Step 1: Input Your Master Lesson',
      badge: 'Curriculum Authoring',
      icon: BookOpen,
      color: 'from-indigo-600 to-purple-600',
      description: 'Define Learning Competencies & Reference Materials',
      content: (
        <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
          <p className="leading-relaxed">
            In the <strong>"Create & Refine"</strong> studio, you set the foundation for your lesson or assessment:
          </p>
          <ul className="space-y-2 list-disc list-inside bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <li><strong>Activity vs. Graded Assessment:</strong> Choose whether the task is a guided learning activity with AI Coaching or a formal graded assessment.</li>
            <li><strong>Subject & Grade Level:</strong> Aligned with DepEd or CHED higher education standards.</li>
            <li><strong>Reference Materials & Syllabi:</strong> Paste textbook formulas, local case studies, lecture excerpts, or rubric criteria.</li>
          </ul>
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800/60 text-[11px]">
            💡 <em>Pro-Tip:</em> The more specific reference criteria and formulas you paste, the more precise Gemini will be when evaluating submissions and suggesting scores.
          </div>
        </div>
      )
    },
    {
      title: 'Step 2: Refine with Gemini Pedagogical AI',
      badge: 'Pedagogical Brainstorming',
      icon: Sparkles,
      color: 'from-purple-600 to-pink-600',
      description: 'Align with Bloom’s Taxonomy and Philippine Frameworks',
      content: (
        <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
          <p className="leading-relaxed">
            On the right panel of the creator studio, you can engage in multi-turn brainstorms with Gemini 3.6 Flash:
          </p>
          <div className="space-y-2">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-start gap-2.5">
              <span className="font-bold text-blue-600">You:</span>
              <span className="italic">"Suggest 3 authentic assessment scenarios in the Philippines with clear rubric scoring dimensions."</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-start gap-2.5">
              <span className="font-bold text-indigo-600">Gemini:</span>
              <span>Formulates step-by-step student instructions, scoring rubrics (e.g. Content Mastery 40%, Critical Analysis 30%, Delivery 30%), and pedagogical alignment notes.</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 pt-1">
            All brainstorming exchanges are saved isolated strictly to your account in Cloud Firestore.
          </p>
        </div>
      )
    },
    {
      title: 'Step 3: Anti-Copying Personalization in Action',
      badge: 'Interactive Simulation',
      icon: Users,
      color: 'from-emerald-600 to-teal-600',
      description: 'See How One Lesson Becomes 3 Distinct Challenges',
      content: (
        <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
          <p className="leading-relaxed">
            Here is a live simulation. Below is a single lesson on <em>"Renewable Energy Fluid Mechanics"</em>. Select a student to see how AKMA PH customizes the task:
          </p>
          
          {/* Profile Selector */}
          <div className="flex gap-2 pb-1 overflow-x-auto">
            {demoProfiles.map((p, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedDemoProfile(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  selectedDemoProfile === idx
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>

          {/* Adapted Preview Box */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-900 dark:text-white">{demoProfiles[selectedDemoProfile].dream}</span>
              <span className="text-emerald-600 font-semibold text-[10px]">Student-Centric Adaptation</span>
            </div>
            <p className="text-slate-500 text-[11px]">{demoProfiles[selectedDemoProfile].background}</p>
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-sans text-xs font-medium border border-emerald-200 dark:border-emerald-800/60">
              {demoProfiles[selectedDemoProfile].adaptedPrompt}
            </div>
            <div className="text-[11px] text-slate-500 flex items-start gap-1.5 pt-1">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
              <span><strong>Why Cheating Fails:</strong> {demoProfiles[selectedDemoProfile].antiCheatReason}</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Step 4: AI Coaching & Automated Rubric Grading',
      badge: 'Evaluation & Feedback',
      icon: Award,
      color: 'from-amber-600 to-orange-600',
      description: 'Support Learning & Streamline Assessment Workloads',
      content: (
        <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="font-bold text-teal-600 dark:text-teal-400 block text-xs">Student AI Coaching</span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                While working on non-assessment activities, students have access to the Gemini AI Coach. It guides their intuition with questions and analogies, and strictly refuses to provide direct answers.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="font-bold text-blue-600 dark:text-blue-400 block text-xs">AI-Suggested Grading</span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                When students submit their work, click <strong>"Suggest Score with Gemini"</strong>. Gemini analyzes their answer against your rubrics, providing a suggested score out of 100, strengths, growth areas, and rubric criteria breakdowns.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-bold text-slate-900 dark:text-white text-xs block">Export Official PDF Performance Reports</span>
              <p className="text-[11px] text-slate-500">Generate clean, printable CHED/DepEd compliance reports with class mastery statistics.</p>
            </div>
            <Printer className="w-5 h-5 text-slate-400 flex-shrink-0" />
          </div>
        </div>
      )
    }
  ];

  const current = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Bar */}
        <div className={`p-6 bg-gradient-to-r ${current.color} text-white flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <current.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-black/20 text-white">
                  {current.badge} &bull; Step {currentStep + 1} of {steps.length}
                </span>
              </div>
              <h2 className="text-lg font-bold mt-1">{current.title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {current.description}
          </div>
          {current.content}
        </div>

        {/* Progress & Footer Actions */}
        <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
          
          {/* Step Dots */}
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                aria-label={`Jump to step ${i + 1}`}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  currentStep === i
                    ? 'w-6 bg-blue-600'
                    : 'bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
            )}

            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => {
                  onClose();
                  onStartCreating();
                }}
                className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-md transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Start Creating Lessons</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
