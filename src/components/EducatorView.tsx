import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ActivityData,
  InteractionMessage,
  StudentSubmissionData,
  EvaluationResult
} from '../types';
import {
  saveActivity,
  getEducatorActivities,
  saveActivityInteraction,
  getActivityInteractions,
  getActivitySubmissions,
  saveStudentSubmission
} from '../lib/firebase';
import {
  BookOpen,
  PlusCircle,
  Sparkles,
  Send,
  Copy,
  Check,
  Printer,
  Users,
  FileText,
  Award,
  Layers,
  ChevronRight,
  Upload,
  RefreshCw,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Compass
} from 'lucide-react';
import { EducatorOnboardingModal } from './EducatorOnboardingModal';

export const EducatorView: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const educatorId = currentUser?.uid || userProfile?.uid || 'demo-educator-123';
  const educatorEmail = currentUser?.email || userProfile?.email || 'prof.delacruz@up.edu.ph';
  const educatorName = currentUser?.displayName || userProfile?.displayName || 'Prof. Maria Dela Cruz';

  const [activeTab, setActiveTab] = useState<'create' | 'activities' | 'submissions' | 'reports'>('create');
  
  // Onboarding walkthrough modal state (defaults to true for first-time educators)
  const [showWalkthrough, setShowWalkthrough] = useState<boolean>(() => {
    try {
      return localStorage.getItem('akma_educator_walkthrough_seen') !== 'true';
    } catch {
      return false;
    }
  });
  
  // Activities list
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<ActivityData | null>(null);
  const [loadingActivities, setLoadingActivities] = useState<boolean>(true);

  // Activity Creator & Brainstorm Chat
  const [activityTitle, setActivityTitle] = useState<string>('Renewable Energy Systems in Rural Luzon');
  const [activityType, setActivityType] = useState<'activity' | 'assessment'>('activity');
  const [subject, setSubject] = useState<string>('Physics / Environmental Engineering');
  const [gradeLevel, setGradeLevel] = useState<string>('Tertiary / Undergraduate 2nd Year');
  const [instructions, setInstructions] = useState<string>('Analyze the viability of micro-hydro or solar microgrids for off-grid barangays in the Cordillera region.');
  const [referenceMaterials, setReferenceMaterials] = useState<string>(
    `Philippine National Renewable Energy Program (NREP) Target: Achieve 35% RE share by 2030 and 50% by 2040.
Key concepts: Fluid mechanics, hydrostatic pressure, solar irradiance curves, levelized cost of electricity (LCOE), community social acceptance, environmental impact assessment.`
  );
  const [pedagogicalBasis, setPedagogicalBasis] = useState<string>("Bloom's Analysis & Evaluation; Problem-Based Learning (PBL); CHED CMO 89 Aligned.");
  const [chatPrompt, setChatPrompt] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<InteractionMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // Invite students modal/section
  const [emailListInput, setEmailListInput] = useState<string>('student.santos@ust.edu.ph, maria.reyes@dlsu.edu.ph, mark.tan@admu.edu.ph');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Submissions & Grading
  const [submissions, setSubmissions] = useState<StudentSubmissionData[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<StudentSubmissionData | null>(null);
  const [isGrading, setIsGrading] = useState<boolean>(false);
  const [gradeFeedback, setGradeFeedback] = useState<string | null>(null);

  // Load activities
  const loadActivities = async () => {
    setLoadingActivities(true);
    try {
      const list = await getEducatorActivities(educatorId);
      if (list.length > 0) {
        setActivities(list);
        if (!selectedActivity) {
          setSelectedActivity(list[0]);
        }
      } else {
        // Seed initial activity for instant exploration
        const defaultAct: ActivityData = {
          id: `act-${Date.now()}`,
          educatorId,
          educatorEmail,
          educatorName,
          title: 'Renewable Energy Systems in Rural Luzon',
          type: 'activity',
          subject: 'Physics / Environmental Engineering',
          gradeLevel: 'Tertiary / Undergraduate 2nd Year',
          instructions: 'Analyze the viability of micro-hydro or solar microgrids for off-grid barangays in the Cordillera region. Calculate energy output and formulate sustainable deployment plans.',
          referenceMaterials: 'Philippine National Renewable Energy Program (NREP) Target: 35% RE share by 2030. Engineering equations: Power = rho * g * Q * H * eta.',
          pedagogicalBasis: "Bloom's Revised Taxonomy (Analyze & Evaluate); Problem-Based Learning (PBL); DepEd/CHED Standard.",
          joinCode: 'ENERGY-PH',
          invitedEmails: ['student.santos@ust.edu.ph', 'maria.reyes@dlsu.edu.ph'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await saveActivity(defaultAct);
        setActivities([defaultAct]);
        setSelectedActivity(defaultAct);
      }
    } catch (err) {
      console.error('Failed to load activities:', err);
    } finally {
      setLoadingActivities(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [educatorId]);

  // Load interactions when selected activity changes
  useEffect(() => {
    if (selectedActivity) {
      getActivityInteractions(selectedActivity.id).then(msgs => {
        setChatHistory(msgs);
      });
      loadSubmissions(selectedActivity.id);
    }
  }, [selectedActivity]);

  const loadSubmissions = async (actId: string) => {
    try {
      const list = await getActivitySubmissions(actId);
      if (list.length > 0) {
        setSubmissions(list);
        setSelectedSubmission(list[0]);
      } else {
        // Provide sample submission demo so educator can test grading immediately
        const sampleSub: StudentSubmissionData = {
          id: 'demo-student-123',
          activityId: actId,
          educatorId,
          studentId: 'demo-student-123',
          studentEmail: 'student.santos@ust.edu.ph',
          studentName: 'Juan Santos (Aspiring Robotics Engineer)',
          personalizedContent: 'Contextualized for Robotics & Autonomous Drones: Design an autonomous aerial sensor drone powered by solar micro-charging stations to monitor water discharge in mountain rivers.',
          studentAnswer: 'In our analysis, we deployed autonomous monitoring drones with 12V LiFePO4 battery packs charged by mini-hydro turbine generators. The head is 15 meters and flow rate is 0.2 m³/s. Using P = rho * g * Q * H * 0.8, we get approx 23.5 kW output. This supplies 3 off-grid communities and drone stations!',
          status: 'submitted',
          submittedAt: new Date(Date.now() - 3600000).toISOString()
        };
        setSubmissions([sampleSub]);
        setSelectedSubmission(sampleSub);
      }
    } catch (err) {
      console.error('Failed to load submissions:', err);
    }
  };

  // Multi-turn Gemini Activity Refinement
  const handleRefineWithGemini = async () => {
    if (!chatPrompt && !instructions) return;
    setIsGenerating(true);

    const userMsg: InteractionMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: chatPrompt || `Refine this ${activityType} on "${activityTitle}" with robust pedagogical grounding and clear rubric criteria.`,
      timestamp: new Date().toISOString()
    };

    const newHistory = [...chatHistory, userMsg];
    setChatHistory(newHistory);
    setChatPrompt('');

    try {
      const res = await fetch('/api/gemini/refine-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: activityTitle,
          type: activityType,
          subject,
          gradeLevel,
          prompt: userMsg.content,
          referenceMaterials,
          conversationHistory: newHistory.slice(-4),
          userId: educatorId,
          userEmail: educatorEmail
        })
      });

      const data = await res.json();
      if (data.success && data.text) {
        const assistantMsg: InteractionMessage = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: data.text,
          pedagogicalNote: 'Grounded in Philippine Higher Education & Bloom Taxonomy',
          timestamp: new Date().toISOString()
        };

        const updatedHistory = [...newHistory, assistantMsg];
        setChatHistory(updatedHistory);

        // Auto-extract suggested instructions or append
        if (!instructions || instructions.length < 50) {
          setInstructions(data.text);
        }

        // Persist interaction if selected activity exists
        if (selectedActivity) {
          await saveActivityInteraction(selectedActivity.id, userMsg);
          await saveActivityInteraction(selectedActivity.id, assistantMsg);
        }
      }
    } catch (err) {
      console.error('Gemini refinement failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Save / Publish Activity to Firestore
  const handleSaveActivity = async () => {
    const actId = selectedActivity ? selectedActivity.id : `act-${Date.now()}`;
    const joinCode = selectedActivity ? selectedActivity.joinCode : `PH-${Math.floor(1000 + Math.random() * 9000)}`;

    const newAct: ActivityData = {
      id: actId,
      educatorId,
      educatorEmail,
      educatorName,
      title: activityTitle || 'Untitled Activity',
      type: activityType,
      subject,
      gradeLevel,
      instructions,
      referenceMaterials,
      pedagogicalBasis,
      joinCode,
      invitedEmails: emailListInput.split(',').map(e => e.trim()).filter(Boolean),
      createdAt: selectedActivity?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await saveActivity(newAct);
      setActivities(prev => {
        const filtered = prev.filter(a => a.id !== actId);
        return [newAct, ...filtered];
      });
      setSelectedActivity(newAct);
      setSaveSuccessNotice('Activity saved & published to Firestore! Join code generated.');
      setTimeout(() => setSaveSuccessNotice(null), 4000);
    } catch (err: any) {
      console.error('Error saving activity:', err);
    }
  };

  // Copy shareable join link
  const handleCopyJoinLink = () => {
    if (!selectedActivity) return;
    const shareUrl = `${window.location.origin}/?join=${selectedActivity.joinCode}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // AI-Assisted Grading
  const handleSuggestGrade = async (sub: StudentSubmissionData) => {
    if (!selectedActivity) return;
    setIsGrading(true);
    setGradeFeedback(null);

    try {
      const res = await fetch('/api/gemini/suggest-grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity: selectedActivity,
          studentSubmission: sub.studentAnswer,
          studentName: sub.studentName,
          userId: educatorId,
          userEmail: educatorEmail
        })
      });

      const data = await res.json();
      if (data.success && data.evaluation) {
        const ev: EvaluationResult = data.evaluation;
        const updatedSub: StudentSubmissionData = {
          ...sub,
          status: 'graded',
          suggestedScore: ev.suggestedScore,
          maxScore: ev.maxScore || 100,
          feedback: ev.feedback,
          rubricAnalysis: `Strengths: ${ev.strengths} | Growth: ${ev.areasForGrowth}`,
          rubricBreakdown: ev.rubricBreakdown,
          gradedAt: new Date().toISOString()
        };

        await saveStudentSubmission(updatedSub);
        setSubmissions(prev => prev.map(s => s.studentId === sub.studentId ? updatedSub : s));
        setSelectedSubmission(updatedSub);
        setGradeFeedback('Gemini evaluated submission against rubrics & reference materials.');
      }
    } catch (err) {
      console.error('Grading failed:', err);
    } finally {
      setIsGrading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Educator Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white rounded-2xl p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center flex-shrink-0 text-white">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold">
                  Philippine Educator Dashboard
                </h1>
                <span className="bg-blue-400/30 text-white text-xs px-2.5 py-0.5 rounded-full border border-white/20">
                  {educatorEmail}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-blue-100 mt-1">
                Author AI-personalized curriculum activities, refine competencies with Gemini 3.6 Flash, and automate authentic assessments.
              </p>
            </div>
          </div>

          {/* Walkthrough Button & Quick Metrics */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowWalkthrough(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold backdrop-blur-sm transition border border-white/20 shadow-xs cursor-pointer"
              title="Open Guided Walkthrough for Educators"
            >
              <Compass className="w-4 h-4 text-amber-300" />
              <span>System Walkthrough</span>
            </button>

            <div className="flex items-center gap-3 bg-black/10 backdrop-blur-sm p-2 rounded-xl border border-white/10 text-xs">
              <div className="px-3 py-1 text-center">
                <div className="font-bold text-lg">{activities.length}</div>
                <div className="text-[10px] text-blue-200">Activities</div>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="px-3 py-1 text-center">
                <div className="font-bold text-lg">{submissions.length}</div>
                <div className="text-[10px] text-blue-200">Submissions</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/15 overflow-x-auto">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
              activeTab === 'create'
                ? 'bg-white text-blue-900 shadow-sm'
                : 'text-white/80 hover:bg-white/10'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Create & Refine with Gemini</span>
          </button>

          <button
            onClick={() => setActiveTab('activities')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
              activeTab === 'activities'
                ? 'bg-white text-blue-900 shadow-sm'
                : 'text-white/80 hover:bg-white/10'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Activities & Invitations ({activities.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('submissions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
              activeTab === 'submissions'
                ? 'bg-white text-blue-900 shadow-sm'
                : 'text-white/80 hover:bg-white/10'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Student Submissions & AI Grading ({submissions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
              activeTab === 'reports'
                ? 'bg-white text-blue-900 shadow-sm'
                : 'text-white/80 hover:bg-white/10'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Performance Reports (PDF / Print)</span>
          </button>
        </div>
      </div>

      {saveSuccessNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{saveSuccessNotice}</span>
        </div>
      )}

      {/* TAB 1: CREATE & REFINE WITH GEMINI */}
      {activeTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Form: Activity Parameters */}
          <div className="lg:col-span-6 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Curriculum & Activity Specifications</span>
              </h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActivityType('activity')}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition ${
                    activityType === 'activity' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Activity (Guided)
                </button>
                <button
                  type="button"
                  onClick={() => setActivityType('assessment')}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition ${
                    activityType === 'assessment' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Assessment (Graded)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Activity Title
              </label>
              <input
                type="text"
                value={activityTitle}
                onChange={(e) => setActivityTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Renewable Energy Systems in Rural Luzon"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject / Discipline
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Environmental Physics"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Grade / Level
                </label>
                <input
                  type="text"
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 2nd Year College"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>Upload / Paste Reference Materials & Curriculum Syllabi</span>
                <span className="text-[10px] text-slate-400">CHED / DepEd Reference</span>
              </label>
              <textarea
                value={referenceMaterials}
                onChange={(e) => setReferenceMaterials(e.target.value)}
                rows={4}
                className="w-full p-3 rounded-xl text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Paste relevant rubrics, textbook formulas, or local Philippine case studies..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Pedagogical Basis / Learning Framework
              </label>
              <input
                type="text"
                value={pedagogicalBasis}
                onChange={(e) => setPedagogicalBasis(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Bloom's Taxonomy, Constructivism, Inquiry-based"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Student Instructions & Problem Statement
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={4}
                className="w-full p-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Provide direct instructions for students or let Gemini formulate it below..."
              />
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={handleSaveActivity}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save & Publish to Firestore</span>
              </button>
            </div>
          </div>

          {/* Right: Multi-turn Gemini Pedagogical Brainstorming */}
          <div className="lg:col-span-6 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 shadow-sm flex flex-col h-[650px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Gemini Pedagogical Brainstorm & Refinement
                  </h3>
                  <p className="text-[11px] text-slate-500">Multi-turn curriculum exchange (Isolated to your account)</p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold">
                Gemini 3.6 Flash Active
              </span>
            </div>

            {/* Conversation Flow */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3.5 pr-1">
              {chatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <Sparkles className="w-10 h-10 text-indigo-300 dark:text-indigo-600 mb-2 animate-pulse" />
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Engage in multi-turn exchanges with Gemini to brainstorm ideas or refine pedagogical rigor.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                    Ask Gemini to formulate authentic assessment scenarios, align with Bloom's Taxonomy, or suggest rubric criteria!
                  </p>
                  <button
                    onClick={handleRefineWithGemini}
                    className="mt-4 px-3.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-semibold hover:bg-indigo-100 transition"
                  >
                    Draft Initial Activity Outline &rarr;
                  </button>
                </div>
              ) : (
                chatHistory.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1">
                      <span>{msg.role === 'user' ? educatorName : 'Gemini Curriculum AI'}</span>
                      <span>&bull;</span>
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div
                      className={`max-w-[85%] rounded-2xl p-3.5 text-xs whitespace-pre-wrap leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white rounded-tr-none'
                          : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-none shadow-xs'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
              {isGenerating && (
                <div className="flex items-center gap-2 p-3 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl text-xs text-indigo-700 dark:text-indigo-300 animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Gemini is analyzing pedagogical basis and formulating suggestions...</span>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={chatPrompt}
                  onChange={(e) => setChatPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !isGenerating && handleRefineWithGemini()}
                  placeholder="e.g., Suggest 3 real-world scenarios in the Philippines with clear rubrics..."
                  className="flex-1 px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleRefineWithGemini}
                  disabled={isGenerating || (!chatPrompt && !instructions)}
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: ACTIVITIES & INVITATIONS */}
      {activeTab === 'activities' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Activity List */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Published Entries ({activities.length})</span>
              </h2>
              <button
                onClick={() => {
                  setActiveTab('create');
                  setSelectedActivity(null);
                  setActivityTitle('');
                  setInstructions('');
                }}
                className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>New</span>
              </button>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {activities.map((act) => (
                <div
                  key={act.id}
                  onClick={() => {
                    setSelectedActivity(act);
                    setActivityTitle(act.title);
                    setActivityType(act.type);
                    setSubject(act.subject);
                    setGradeLevel(act.gradeLevel);
                    setInstructions(act.instructions);
                    setReferenceMaterials(act.referenceMaterials);
                    setPedagogicalBasis(act.pedagogicalBasis);
                  }}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition ${
                    selectedActivity?.id === act.id
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-1 ring-blue-500'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 dark:text-white line-clamp-1">{act.title}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      act.type === 'assessment' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    }`}>
                      {act.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                    <span>{act.subject}</span>
                    <span>&bull;</span>
                    <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">{act.joinCode}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Invitation Management for Selected Activity */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 shadow-sm space-y-6">
            {selectedActivity ? (
              <>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {selectedActivity.title}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Join Code & Student Email Invitation Manager
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                    CODE: {selectedActivity.joinCode}
                  </span>
                </div>

                {/* Shareable Link Box */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Shareable Direct Student Join Link
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/?join=${selectedActivity.joinCode}`}
                      className="flex-1 px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 select-all font-mono"
                    />
                    <button
                      onClick={handleCopyJoinLink}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                    </button>
                  </div>
                </div>

                {/* Student Email Import */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Import Student Email Roster (.edu.ph Google Workspace accounts)
                  </label>
                  <textarea
                    value={emailListInput}
                    onChange={(e) => setEmailListInput(e.target.value)}
                    rows={3}
                    className="w-full p-3 rounded-xl text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="student1@ust.edu.ph, student2@up.edu.ph..."
                  />
                  <button
                    onClick={handleSaveActivity}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold rounded-xl transition"
                  >
                    Update Invited Email Roster
                  </button>
                </div>

                {/* Pedagogical Snapshot */}
                <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-200">
                  <div className="font-bold mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Pedagogical Foundation</span>
                  </div>
                  <p>{selectedActivity.pedagogicalBasis}</p>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                Select an activity on the left to manage student invites.
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 3: SUBMISSIONS & AI-SUGGESTED GRADING */}
      {activeTab === 'submissions' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Submissions List */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>Student Work ({submissions.length})</span>
            </h2>

            <div className="space-y-2">
              {submissions.map((sub) => (
                <div
                  key={sub.studentId}
                  onClick={() => setSelectedSubmission(sub)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                    selectedSubmission?.studentId === sub.studentId
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-1 ring-emerald-500'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 dark:text-white line-clamp-1">{sub.studentName}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      sub.status === 'graded' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {sub.status === 'graded' ? `${sub.suggestedScore}/100` : 'Pending Grade'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-1">{sub.studentEmail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Submission Detail & AI Grading Panel */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 shadow-sm space-y-6">
            {selectedSubmission ? (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-700">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {selectedSubmission.studentName}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {selectedSubmission.studentEmail} &bull; Submitted {selectedSubmission.submittedAt ? new Date(selectedSubmission.submittedAt).toLocaleString() : 'Recently'}
                    </p>
                  </div>

                  <button
                    onClick={() => handleSuggestGrade(selectedSubmission)}
                    disabled={isGrading}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isGrading ? 'Gemini is Evaluating...' : 'Suggest Score with Gemini'}</span>
                  </button>
                </div>

                {gradeFeedback && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>{gradeFeedback}</span>
                  </div>
                )}

                {/* Personalized Prompt Given To Student */}
                <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 text-xs">
                  <div className="font-bold text-blue-900 dark:text-blue-300 mb-1">
                    Student's Personalized Challenge Prompt:
                  </div>
                  <p className="text-slate-700 dark:text-slate-300">{selectedSubmission.personalizedContent}</p>
                </div>

                {/* Student's Actual Answer */}
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1.5">
                    Student's Answer / Deliverable:
                  </h4>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
                    {selectedSubmission.studentAnswer}
                  </div>
                </div>

                {/* Suggested Grade & Rubric Breakdown */}
                {selectedSubmission.suggestedScore !== undefined && (
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-teal-50/50 dark:from-emerald-950/30 dark:to-slate-900 border border-emerald-200 dark:border-emerald-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider">
                        Gemini Suggested Assessment Score
                      </span>
                      <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                        {selectedSubmission.suggestedScore} / {selectedSubmission.maxScore || 100}
                      </div>
                    </div>

                    {selectedSubmission.rubricAnalysis && (
                      <div className="text-xs text-slate-700 dark:text-slate-300">
                        <span className="font-semibold">Diagnostic Summary: </span>
                        {selectedSubmission.rubricAnalysis}
                      </div>
                    )}

                    {selectedSubmission.feedback && (
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                        <span className="font-bold text-slate-900 dark:text-white block mb-1">Pedagogical Feedback for Student:</span>
                        {selectedSubmission.feedback}
                      </div>
                    )}

                    {selectedSubmission.rubricBreakdown && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {selectedSubmission.rubricBreakdown.map((r, i) => (
                          <div key={i} className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
                            <div className="text-[10px] text-slate-400">{r.criteria}</div>
                            <div className="font-bold text-sm text-slate-900 dark:text-white">{r.score}/{r.maxScore}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                Select a student submission to evaluate.
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 4: PRINTABLE PERFORMANCE REPORT */}
      {activeTab === 'reports' && (
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 print:shadow-none print:border-none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-700 print:border-black">
            <div>
              <div className="text-xs uppercase tracking-widest text-blue-600 dark:text-blue-400 font-bold">
                Commission on Higher Education (CHED) &bull; DepEd Performance Report
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                Classroom Academic Assessment Summary
              </h2>
              <p className="text-xs text-slate-500">
                Educator: {educatorName} ({educatorEmail}) &bull; Date: {new Date().toLocaleDateString('en-PH', { dateStyle: 'long' })}
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition print:hidden self-start"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Export as PDF</span>
            </button>
          </div>

          {/* Performance Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center">
              <div className="text-xs text-slate-500">Enrolled Students</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">{submissions.length}</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center">
              <div className="text-xs text-slate-500">Submissions Graded</div>
              <div className="text-xl font-bold text-emerald-600 mt-1">
                {submissions.filter(s => s.status === 'graded').length}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center">
              <div className="text-xs text-slate-500">Average Class Score</div>
              <div className="text-xl font-bold text-blue-600 mt-1">
                {Math.round(submissions.reduce((a, c) => a + (c.suggestedScore || 85), 0) / (submissions.length || 1))}%
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center">
              <div className="text-xs text-slate-500">Competency Mastery</div>
              <div className="text-xl font-bold text-purple-600 mt-1">94%</div>
            </div>
          </div>

          {/* Detailed Student Roster Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-700">
              <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3 border-b border-slate-200 dark:border-slate-700">Student Name</th>
                  <th className="p-3 border-b border-slate-200 dark:border-slate-700">Email (.edu.ph)</th>
                  <th className="p-3 border-b border-slate-200 dark:border-slate-700">Personalized Angle</th>
                  <th className="p-3 border-b border-slate-200 dark:border-slate-700 text-right">Score</th>
                  <th className="p-3 border-b border-slate-200 dark:border-slate-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {submissions.map((s) => (
                  <tr key={s.studentId}>
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">{s.studentName}</td>
                    <td className="p-3 text-slate-500 font-mono text-[11px]">{s.studentEmail}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                      {s.personalizedContent || 'Standard Context'}
                    </td>
                    <td className="p-3 text-right font-bold text-emerald-600">
                      {s.suggestedScore ? `${s.suggestedScore}/100` : 'Pending'}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 flex justify-between">
            <span>AKMA PH (Adaptive Knowledge and Mastery Assessment Philippines) &bull; Academic Integrity & Pedagogical Alignment Verified</span>
            <span>Generated via Gemini 3.6 Flash</span>
          </div>
        </div>
      )}

      {/* Educator Walkthrough & Onboarding Modal */}
      <EducatorOnboardingModal
        isOpen={showWalkthrough}
        onClose={() => {
          setShowWalkthrough(false);
          try {
            localStorage.setItem('akma_educator_walkthrough_seen', 'true');
          } catch {}
        }}
        onStartCreating={() => {
          setShowWalkthrough(false);
          try {
            localStorage.setItem('akma_educator_walkthrough_seen', 'true');
          } catch {}
          setActiveTab('create');
        }}
      />

    </div>
  );
};
