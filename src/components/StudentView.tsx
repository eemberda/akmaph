import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  StudentProfileData,
  ActivityData,
  StudentSubmissionData,
  CoachChatMessage
} from '../types';
import {
  getStudentProfileDetails,
  saveStudentProfileDetails,
  getActivityByJoinCode,
  saveStudentSubmission,
  getStudentSubmission,
  getCoachChats,
  saveCoachChat,
  getActivityById
} from '../lib/firebase';
import {
  UserCheck,
  Sparkles,
  Compass,
  BookOpen,
  MessageSquare,
  Send,
  CheckCircle2,
  Lock,
  Lightbulb,
  Award,
  RefreshCw,
  Clock,
  ArrowRight,
  HelpCircle,
  Hash
} from 'lucide-react';

export const StudentView: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const studentId = currentUser?.uid || userProfile?.uid || 'demo-student-123';
  const studentEmail = currentUser?.email || userProfile?.email || 'student.santos@ust.edu.ph';
  const studentName = currentUser?.displayName || userProfile?.displayName || 'Juan Santos';

  // Navigation state within student view
  const [activeTab, setActiveTab] = useState<'activities' | 'profile' | 'workspace' | 'history'>('activities');

  // Student Profile state
  const [profile, setProfile] = useState<StudentProfileData>({
    studentId,
    name: studentName,
    interests: 'Robotics, IoT Sensors, Renewable Microgrids, Drone Flight Systems',
    goals: 'Develop autonomous disaster response technologies for rural Philippine communities',
    careerAspirations: 'Hardware Engineer / Tech Entrepreneur in Southeast Asia',
    dreamProject: 'Solar-powered river sensor network to prevent flash floods in Marikina and Cagayan',
    completed: true
  });
  const [profileLoading, setProfileLoading] = useState<boolean>(true);
  const [savingProfile, setSavingProfile] = useState<boolean>(false);

  // Gemini Onboarding Interview Chat
  const [interviewMode, setInterviewMode] = useState<boolean>(false);
  const [interviewChat, setInterviewChat] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    {
      role: 'assistant',
      content: `Mabuhay, ${studentName}! Welcome to AKMA PH (Adaptive Knowledge and Mastery Assessment Philippines).

Technology integration works best when it solves real classroom struggles. Right now, teachers fight a losing battle against AI cheating and copied homework. But AKMA PH changes the game: your teachers can build truly student-centric lessons, and the platform adapts each assessment to your unique background. Everyone gets a different version of the task, so you cannot just copy answers or ask a generic AI tool to do the work for you.

To build your personalized learning profile, tell me: Where in the Philippines are you based, and what passions, technologies, or hobbies genuinely excite you?`
    }
  ]);
  const [interviewInput, setInterviewInput] = useState<string>('');
  const [interviewProcessing, setInterviewProcessing] = useState<boolean>(false);

  // Join activity state
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joining, setJoining] = useState<boolean>(false);

  // Activities student is working on
  const [enrolledActivities, setEnrolledActivities] = useState<ActivityData[]>([]);
  const [currentActivity, setCurrentActivity] = useState<ActivityData | null>(null);
  const [currentSubmission, setCurrentSubmission] = useState<StudentSubmissionData | null>(null);

  // Workspace & AI Coach state
  const [studentAnswerInput, setStudentAnswerInput] = useState<string>('');
  const [submittingWork, setSubmittingWork] = useState<boolean>(false);
  const [workSubmittedSuccess, setWorkSubmittedSuccess] = useState<boolean>(false);

  // Coach Chat messages
  const [coachChats, setCoachChats] = useState<CoachChatMessage[]>([]);
  const [coachInput, setCoachInput] = useState<string>('');
  const [coachLoading, setCoachLoading] = useState<boolean>(false);

  // Personalization loading state
  const [isPersonalizing, setIsPersonalizing] = useState<boolean>(false);

  // Load student profile & check URL join param on boot
  useEffect(() => {
    const loadProfileAndData = async () => {
      setProfileLoading(true);
      try {
        const p = await getStudentProfileDetails(studentId);
        if (p) {
          setProfile(p);
        }

        // Check if ?join=CODE in URL
        const urlParams = new URLSearchParams(window.location.search);
        const joinParam = urlParams.get('join');
        if (joinParam) {
          setJoinCodeInput(joinParam);
          await handleJoinWithCode(joinParam);
        } else {
          // Provide default enrolled activity
          const defaultAct: ActivityData = {
            id: 'act-sample-energy',
            educatorId: 'prof-delacruz',
            educatorEmail: 'prof.delacruz@up.edu.ph',
            educatorName: 'Prof. Maria Dela Cruz',
            title: 'Renewable Energy Systems in Rural Luzon',
            type: 'activity',
            subject: 'Physics / Environmental Engineering',
            gradeLevel: 'Tertiary / Undergraduate 2nd Year',
            instructions: 'Analyze the viability of micro-hydro or solar microgrids for off-grid barangays in the Cordillera region. Calculate energy output and formulate sustainable deployment plans.',
            referenceMaterials: 'NREP 2030 targets; Fluid mechanics equations: Power = rho * g * Q * H * eta.',
            pedagogicalBasis: "Bloom's Analysis; Problem-Based Learning.",
            joinCode: 'ENERGY-PH',
            invitedEmails: [studentEmail],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          setEnrolledActivities([defaultAct]);
          handleSelectActivity(defaultAct, p || profile);
        }
      } catch (err) {
        console.error('Failed to load student profile:', err);
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfileAndData();
  }, [studentId]);

  // Handle joining with code
  const handleJoinWithCode = async (codeToUse?: string) => {
    const code = (codeToUse || joinCodeInput).trim().toUpperCase();
    if (!code) return;
    setJoining(true);
    setJoinError(null);

    try {
      const act = await getActivityByJoinCode(code);
      if (act) {
        setEnrolledActivities(prev => {
          if (!prev.some(a => a.id === act.id)) {
            return [act, ...prev];
          }
          return prev;
        });
        handleSelectActivity(act, profile);
        setJoinCodeInput('');
      } else {
        setJoinError(`No activity found with join code "${code}". Please verify with your educator.`);
      }
    } catch (err: any) {
      setJoinError(`Could not join: ${err.message}`);
    } finally {
      setJoining(false);
    }
  };

  // Select activity and ensure personalized prompt exists
  const handleSelectActivity = async (act: ActivityData, currentProfile: StudentProfileData) => {
    setCurrentActivity(act);
    setActiveTab('workspace');
    setWorkSubmittedSuccess(false);

    try {
      // Check if student already has a submission record
      let sub = await getStudentSubmission(act.id, studentId);

      if (!sub || !sub.personalizedContent) {
        // Request Gemini to generate personalized challenge based on profile
        setIsPersonalizing(true);
        const res = await fetch('/api/gemini/personalize-activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            masterActivity: act,
            studentProfile: currentProfile,
            userId: studentId,
            userEmail: studentEmail
          })
        });

        const pData = await res.json();
        const personalizedText = pData.personalizedText || `Contextualized for ${currentProfile.careerAspirations}: ${act.instructions}`;

        sub = {
          id: studentId,
          activityId: act.id,
          educatorId: act.educatorId,
          studentId,
          studentEmail,
          studentName,
          personalizedContent: personalizedText,
          studentAnswer: sub?.studentAnswer || '',
          status: sub?.status || 'in_progress',
          updatedAt: new Date().toISOString()
        };

        await saveStudentSubmission(sub);
      }

      setCurrentSubmission(sub);
      setStudentAnswerInput(sub.studentAnswer || '');

      // Load existing coach chat history
      const chats = await getCoachChats(act.id, studentId);
      if (chats.length > 0) {
        setCoachChats(chats);
      } else {
        // Welcoming AI Coach greeting
        setCoachChats([
          {
            id: 'init-coach',
            role: 'assistant',
            content: `Hello ${studentName}! I am your AI Coach for "${act.title}". I will guide your critical thinking and help you build true mastery without giving away direct answers. What is your initial thought on this challenge?`,
            timestamp: new Date().toISOString()
          }
        ]);
      }
    } catch (err) {
      console.error('Error personalizing/loading activity:', err);
    } finally {
      setIsPersonalizing(false);
    }
  };

  // Student Gemini Profile Interview exchange
  const handleInterviewStep = async () => {
    if (!interviewInput.trim()) return;
    setInterviewProcessing(true);

    const userEntry = { role: 'user' as const, content: interviewInput.trim() };
    const updatedHistory = [...interviewChat, userEntry];
    setInterviewChat(updatedHistory);
    setInterviewInput('');

    try {
      const res = await fetch('/api/gemini/interview-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentAnswers: profile,
          conversation: updatedHistory.slice(-6),
          userId: studentId,
          userEmail: studentEmail
        })
      });

      const data = await res.json();
      if (data.success && data.reply) {
        setInterviewChat(prev => [...prev, { role: 'assistant', content: data.reply }]);

        // Check if JSON block returned with completed profile
        try {
          const match = data.reply.match(/\{[\s\S]*"isComplete"[\s\S]*\}/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            if (parsed.isComplete) {
              const updatedProfile: StudentProfileData = {
                ...profile,
                interests: parsed.interests || profile.interests,
                goals: parsed.goals || profile.goals,
                careerAspirations: parsed.careerAspirations || profile.careerAspirations,
                dreamProject: parsed.dreamProject || profile.dreamProject,
                completed: true
              };
              setProfile(updatedProfile);
              await saveStudentProfileDetails(studentId, updatedProfile);
            }
          }
        } catch {
          // Normal conversational text
        }
      }
    } catch (err) {
      console.error('Interview processing error:', err);
    } finally {
      setInterviewProcessing(false);
    }
  };

  // AI Coach Chat Exchange
  const handleAskCoach = async () => {
    if (!coachInput.trim() || !currentActivity) return;
    setCoachLoading(true);

    const userMsg: CoachChatMessage = {
      id: `chat-${Date.now()}`,
      role: 'user',
      content: coachInput.trim(),
      timestamp: new Date().toISOString()
    };

    const newHistory = [...coachChats, userMsg];
    setCoachChats(newHistory);
    setCoachInput('');

    try {
      const res = await fetch('/api/gemini/ai-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityTitle: currentActivity.title,
          activityInstructions: currentSubmission?.personalizedContent || currentActivity.instructions,
          studentQuery: userMsg.content,
          conversationHistory: newHistory.slice(-4),
          userId: studentId,
          userEmail: studentEmail
        })
      });

      const data = await res.json();
      if (data.success && data.reply) {
        const coachMsg: CoachChatMessage = {
          id: `chat-${Date.now() + 1}`,
          role: 'assistant',
          content: data.reply,
          timestamp: new Date().toISOString()
        };
        setCoachChats(prev => [...prev, coachMsg]);

        // Save isolated coach chat to Firestore
        await saveCoachChat(currentActivity.id, studentId, userMsg);
        await saveCoachChat(currentActivity.id, studentId, coachMsg);
      }
    } catch (err) {
      console.error('Coach failed:', err);
    } finally {
      setCoachLoading(false);
    }
  };

  // Submit Answer to Educator & Firestore
  const handleSubmitWork = async () => {
    if (!currentActivity || !currentSubmission) return;
    setSubmittingWork(true);
    setWorkSubmittedSuccess(false);

    try {
      const updated: StudentSubmissionData = {
        ...currentSubmission,
        studentAnswer: studentAnswerInput,
        status: 'submitted',
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await saveStudentSubmission(updated);
      setCurrentSubmission(updated);
      setWorkSubmittedSuccess(true);
    } catch (err) {
      console.error('Submission failed:', err);
    } finally {
      setSubmittingWork(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Student Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-2xl p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center flex-shrink-0 text-white">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold">
                  Philippine Student Learning Portal
                </h1>
                <span className="bg-emerald-400/30 text-white text-xs px-2.5 py-0.5 rounded-full border border-white/20">
                  {studentEmail}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-100 mt-1">
                Every activity is uniquely adapted to your personal background and career goals with interactive Gemini AI coaching.
              </p>
            </div>
          </div>

          {/* Join with Code input */}
          <div className="flex items-center gap-2 bg-black/15 p-2 rounded-xl border border-white/20">
            <div className="flex items-center gap-1.5 px-2">
              <Hash className="w-4 h-4 text-emerald-300" />
              <input
                type="text"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleJoinWithCode()}
                placeholder="ENTER JOIN CODE"
                className="w-32 bg-transparent text-xs font-mono font-bold text-white placeholder-emerald-200/60 focus:outline-none"
              />
            </div>
            <button
              onClick={() => handleJoinWithCode()}
              disabled={joining || !joinCodeInput.trim()}
              className="px-3 py-1.5 bg-white text-emerald-900 rounded-lg text-xs font-bold hover:bg-emerald-50 transition disabled:opacity-50"
            >
              {joining ? 'Joining...' : 'Join'}
            </button>
          </div>
        </div>

        {joinError && (
          <div className="mt-3 p-2.5 bg-rose-500/30 border border-rose-300 rounded-xl text-xs text-white">
            {joinError}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/15 overflow-x-auto">
          <button
            onClick={() => setActiveTab('activities')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
              activeTab === 'activities' ? 'bg-white text-emerald-950 shadow-sm' : 'text-white/80 hover:bg-white/10'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>My Activities & Tasks ({enrolledActivities.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('workspace')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
              activeTab === 'workspace' ? 'bg-white text-emerald-950 shadow-sm' : 'text-white/80 hover:bg-white/10'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Personalized Workspace & AI Coach</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
              activeTab === 'profile' ? 'bg-white text-emerald-950 shadow-sm' : 'text-white/80 hover:bg-white/10'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>My Adaptive Profile (AI Interviewer)</span>
          </button>
        </div>
      </div>

      {/* TAB 1: ACTIVITIES LIST */}
      {activeTab === 'activities' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              <span>Assigned Curriculum & Assessments</span>
            </h2>
            <span className="text-xs text-slate-500">
              Each activity will be contextualized around: <span className="font-semibold text-slate-700 dark:text-slate-300">{profile.careerAspirations}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrolledActivities.map((act) => (
              <div
                key={act.id}
                className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm hover:border-emerald-500 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-semibold text-slate-500">{act.subject}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      act.type === 'assessment' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}>
                      {act.type}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {act.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Educator: {act.educatorName} ({act.educatorEmail})
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 line-clamp-3">
                    {act.instructions}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                    Code: {act.joinCode}
                  </span>
                  <button
                    onClick={() => handleSelectActivity(act, profile)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                  >
                    <span>Open Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: PERSONALIZED WORKSPACE & AI COACH */}
      {activeTab === 'workspace' && currentActivity && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Personalized Challenge & Student Submission */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Personalized Challenge Card */}
            <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-700">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {currentActivity.type === 'assessment' ? 'Graded Assessment' : 'Learning Activity'}
                    </span>
                    <span className="text-xs text-slate-400">&bull;</span>
                    <span className="text-xs text-slate-500">{currentActivity.subject}</span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                    {currentActivity.title}
                  </h2>
                </div>

                {isPersonalizing && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-medium animate-pulse">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Gemini is customizing for you...</span>
                  </div>
                )}
              </div>

              {/* Personalized Context Badge */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-50/80 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800/60 text-xs">
                <div className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Uniquely Customized for Your Journey</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300">
                  Adapted for your interest in <span className="font-semibold text-emerald-800 dark:text-emerald-300">{profile.interests}</span> and goal to <span className="font-semibold text-emerald-800 dark:text-emerald-300">{profile.goals}</span>.
                </p>
              </div>

              {/* Personalized Instructions */}
              <div className="prose dark:prose-invert max-w-none text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700">
                {currentSubmission?.personalizedContent || currentActivity.instructions}
              </div>
            </div>

            {/* Answer Input & Submission Form */}
            <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>Your Submission & Solution</span>
                </h3>
                {currentSubmission?.status === 'graded' ? (
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    Graded: {currentSubmission.suggestedScore} / {currentSubmission.maxScore || 100}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">
                    Status: {currentSubmission?.status || 'In Progress'}
                  </span>
                )}
              </div>

              <textarea
                value={studentAnswerInput}
                onChange={(e) => setStudentAnswerInput(e.target.value)}
                disabled={currentSubmission?.status === 'graded'}
                rows={6}
                className="w-full p-4 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-75 resize-y"
                placeholder="Formulate your detailed answers, calculations, design diagrams, or explanations..."
              />

              {workSubmittedSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>Your work has been submitted to {currentActivity.educatorName}! It is saved safely in Firestore.</span>
                </div>
              )}

              {/* Feedback if already graded */}
              {currentSubmission?.status === 'graded' && currentSubmission.feedback && (
                <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2 text-xs">
                  <div className="font-bold text-emerald-900 dark:text-emerald-300">
                    Educator & AI Evaluation Feedback:
                  </div>
                  <p className="text-slate-700 dark:text-slate-300">{currentSubmission.feedback}</p>
                  {currentSubmission.rubricAnalysis && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                      {currentSubmission.rubricAnalysis}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-400">
                  Isolate to: {studentEmail} &bull; {currentActivity.educatorEmail}
                </span>
                <button
                  onClick={handleSubmitWork}
                  disabled={submittingWork || !studentAnswerInput.trim() || currentSubmission?.status === 'graded'}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingWork ? 'Submitting...' : 'Submit Work to Educator'}</span>
                </button>
              </div>
            </div>

          </div>

          {/* Right Column: AI Coach */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm flex flex-col h-[700px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    Gemini AI Coach
                  </h3>
                  <p className="text-[10px] text-slate-500">Guides your critical thinking (Never reveals direct answers)</p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-semibold">
                AI Coaching Active
              </span>
            </div>

            {/* Coach Chat Exchange */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
              {coachChats.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className="text-[10px] text-slate-400 mb-1 px-1">
                    {msg.role === 'user' ? studentName : 'Gemini AI Coach'}
                  </div>
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-emerald-600 text-white rounded-tr-none'
                        : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-none shadow-xs'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {coachLoading && (
                <div className="flex items-center gap-2 p-3 bg-teal-50 dark:bg-teal-950/30 rounded-xl text-xs text-teal-700 dark:text-teal-300 animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Coach is considering your thought...</span>
                </div>
              )}
            </div>

            {/* Coach Chat Input */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={coachInput}
                  onChange={(e) => setCoachInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !coachLoading && handleAskCoach()}
                  placeholder="Ask a guiding question or share your idea..."
                  className="flex-1 px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  type="button"
                  onClick={handleAskCoach}
                  disabled={coachLoading || !coachInput.trim()}
                  className="p-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: STUDENT PROFILE & GEMINI ONBOARDING INTERVIEW */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          
          {/* Mission & Purpose Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-slate-900 border border-emerald-200/80 dark:border-emerald-800 text-xs space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-bold text-[10px] uppercase tracking-wider">
                AKMA PH Core Purpose
              </span>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Why Your Background Makes Cheating Impossible & Learning Meaningful
              </h3>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs">
              Technology integration works best when it solves real classroom struggles. Right now, educators fight a losing battle against AI cheating and copied homework. <strong className="text-slate-900 dark:text-white font-semibold">AKMA PH changes the game</strong>: it takes a single teacher-crafted lesson and adapts the assessment for each student based on their unique background. Everyone gets a different version of the task—meaning you cannot just share answers or ask a basic AI tool to do the work for you.
            </p>
            <div className="pt-1 flex flex-wrap items-center gap-4 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
              <span className="flex items-center gap-1">&bull; Truly student-centric lessons</span>
              <span className="flex items-center gap-1">&bull; Zero copied homework</span>
              <span className="flex items-center gap-1">&bull; Guided by interactive AI coaching</span>
              <span className="flex items-center gap-1">&bull; Builds institutional trust in modern educational tech</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Profile Form Fields */}
            <div className="lg:col-span-6 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>Personal Learning & Background Profile</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Your answers directly customize your coursework so no two students have the same assessment.
                  </p>
                </div>
              </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Core Interests & Technical/Creative Hobbies
              </label>
              <textarea
                value={profile.interests}
                onChange={(e) => setProfile({ ...profile, interests: e.target.value })}
                rows={2}
                className="w-full p-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g., Robotics, IoT, Marine biology, Mobile app development, Philippine agriculture..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Life Goals & Societal Impact
              </label>
              <textarea
                value={profile.goals}
                onChange={(e) => setProfile({ ...profile, goals: e.target.value })}
                rows={2}
                className="w-full p-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g., Build tech that reduces typhoon flooding damages in Marikina..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Post-Graduation Career Aspirations
              </label>
              <input
                type="text"
                value={profile.careerAspirations}
                onChange={(e) => setProfile({ ...profile, careerAspirations: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g., Hardware Engineer / Sustainability Consultant"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Dream Capstone or Real-World Project
              </label>
              <textarea
                value={profile.dreamProject}
                onChange={(e) => setProfile({ ...profile, dreamProject: e.target.value })}
                rows={2}
                className="w-full p-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g., Solar-powered telemetry buoy deployed in Laguna de Bay..."
              />
            </div>

            <button
              onClick={async () => {
                setSavingProfile(true);
                await saveStudentProfileDetails(studentId, profile);
                setSavingProfile(false);
              }}
              disabled={savingProfile}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{savingProfile ? 'Saving Profile...' : 'Save Profile Details'}</span>
            </button>
          </div>

          {/* Right: Interactive Gemini Onboarding Interviewer */}
          <div className="lg:col-span-6 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 shadow-sm flex flex-col h-[560px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Gemini Profile Interview Mentor
                  </h3>
                  <p className="text-[11px] text-slate-500">Chat with Gemini to articulate your life dreams & interests</p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                Interactive Onboarding
              </span>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
              {interviewChat.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className="text-[10px] text-slate-400 mb-1 px-1">
                    {msg.role === 'user' ? studentName : 'Gemini Mentor'}
                  </div>
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-emerald-600 text-white rounded-tr-none'
                        : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-none shadow-xs'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {interviewProcessing && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Gemini is listening and formulating thoughts...</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={interviewInput}
                  onChange={(e) => setInterviewInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !interviewProcessing && handleInterviewStep()}
                  placeholder="Share a project you love, a hobby, or your dream job..."
                  className="flex-1 px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleInterviewStep}
                  disabled={interviewProcessing || !interviewInput.trim()}
                  className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    )}

    </div>
  );
};
