"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Video,
  Sparkles,
  Award,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Loader2,
  RotateCcw,
  Zap,
  Clock,
  Briefcase,
  Layers,
  BarChart3,
  Check,
  TrendingUp,
  MessageSquare,
} from "lucide-react";
import type { InterviewType, InterviewDifficulty } from "@/lib/interview/generator";

export interface QuestionEvaluation {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export interface CurrentQuestionData {
  id: number;
  question: string;
  category: string;
}

export interface MockInterviewRecord {
  id: string;
  user_id: string;
  interview_type: string;
  target_role: string | null;
  difficulty: string | null;
  status: string;
  questions: any;
  current_question_index: number;
  score: number | null;
  feedback: string | null;
  created_at: string;
  updated_at: string;
}

interface MockInterviewClientProps {
  userId: string;
  initialRole: string;
  initialInterviews: MockInterviewRecord[];
}

export default function MockInterviewClient({
  userId,
  initialRole,
  initialInterviews,
}: MockInterviewClientProps) {
  // Navigation / View state
  const [viewState, setViewState] = useState<"setup" | "in_session" | "evaluated_step" | "completed">("setup");
  const [interviews, setInterviews] = useState<MockInterviewRecord[]>(initialInterviews);

  // Setup form states
  const [targetRole, setTargetRole] = useState(initialRole || "Software Developer");
  const [interviewType, setInterviewType] = useState<InterviewType>("Mixed");
  const [difficulty, setDifficulty] = useState<InterviewDifficulty>("Medium");
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  // Active session states
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [currentQuestion, setCurrentQuestion] = useState<CurrentQuestionData | null>(null);
  const [studentAnswer, setStudentAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answerError, setAnswerError] = useState<string | null>(null);

  // Evaluated step states (intermediate question evaluation)
  const [lastEvaluation, setLastEvaluation] = useState<QuestionEvaluation | null>(null);
  const [stashedNextQuestion, setStashedNextQuestion] = useState<CurrentQuestionData | null>(null);

  // Completed interview summary states
  const [overallScore, setOverallScore] = useState<number | null>(null);
  const [overallFeedback, setOverallFeedback] = useState<string | null>(null);
  const [allQuestionsReview, setAllQuestionsReview] = useState<any[]>([]);

  // 1. Handle Start Interview
  const handleStartInterview = async () => {
    setIsStarting(true);
    setStartError(null);

    try {
      const response = await fetch("/api/interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole: targetRole.trim(),
          interviewType,
          difficulty,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to start interview session.");
      }

      setInterviewId(data.interviewId);
      setCurrentQuestionIndex(data.currentQuestionIndex || 0);
      setTotalQuestions(data.totalQuestions || 5);
      setCurrentQuestion(data.currentQuestion);
      setStudentAnswer("");
      setLastEvaluation(null);
      setStashedNextQuestion(null);
      setViewState("in_session");
    } catch (err: unknown) {
      setStartError(err instanceof Error ? err.message : "Failed to initialize interview.");
    } finally {
      setIsStarting(false);
    }
  };

  // 2. Handle Submit Answer
  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interviewId || !studentAnswer.trim() || studentAnswer.trim().length < 2) {
      setAnswerError("Please enter an answer with at least 2 characters.");
      return;
    }

    setIsSubmitting(true);
    setAnswerError(null);

    try {
      const response = await fetch("/api/interview/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewId,
          answer: studentAnswer.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to submit answer.");
      }

      setLastEvaluation(data.evaluation);

      if (data.completed) {
        // Interview complete
        setOverallScore(data.overallScore);
        setOverallFeedback(data.overallFeedback);
        setViewState("completed");

        // Refresh past interviews list locally
        setInterviews((prev) => [
          {
            id: interviewId,
            user_id: userId,
            interview_type: interviewType,
            target_role: targetRole,
            difficulty,
            status: "completed",
            questions: null,
            current_question_index: totalQuestions,
            score: data.overallScore,
            feedback: data.overallFeedback,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          ...prev,
        ]);
      } else {
        // Intermediate question: show evaluation and stash next question
        setStashedNextQuestion(data.nextQuestion);
        setCurrentQuestionIndex(data.currentQuestionIndex);
        setViewState("evaluated_step");
      }
    } catch (err: unknown) {
      setAnswerError(err instanceof Error ? err.message : "Error evaluating answer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Handle Proceed to Next Question
  const handleProceedToNextQuestion = () => {
    if (stashedNextQuestion) {
      setCurrentQuestion(stashedNextQuestion);
      setStashedNextQuestion(null);
      setStudentAnswer("");
      setLastEvaluation(null);
      setViewState("in_session");
    }
  };

  // 4. View an existing completed interview
  const handleViewPastInterview = (mock: MockInterviewRecord) => {
    setOverallScore(mock.score);
    setOverallFeedback(mock.feedback);
    setTargetRole(mock.target_role || "Software Developer");
    setInterviewType((mock.interview_type as InterviewType) || "Mixed");
    setDifficulty((mock.difficulty as InterviewDifficulty) || "Medium");

    const parsedQuestions = Array.isArray(mock.questions) ? mock.questions : [];
    setAllQuestionsReview(parsedQuestions);
    setViewState("completed");
  };

  return (
    <div className="space-y-8">
      {/* Top Breadcrumb & Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1.5">
            <Link
              href="/dashboard"
              className="hover:text-cyan-400 transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </Link>
            <span>/</span>
            <span className="text-cyan-400 font-medium">AI Mock Interview Drill</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>AI Mock Interview</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-semibold">
              Step 3 Live
            </span>
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Simulate realistic technical and HR recruitment rounds with instant AI evaluation, adaptive questioning, and comprehensive feedback.
          </p>
        </div>

        {viewState !== "setup" && (
          <button
            type="button"
            onClick={() => setViewState("setup")}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-xs text-slate-200 hover:text-white font-medium flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>New Interview Round</span>
          </button>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 1. SETUP VIEW: Configuration & Start Card                            */}
      {/* ==================================================================== */}
      {viewState === "setup" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Setup Card (2 Columns) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0c1222]/90 border border-white/10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white shadow-md shadow-indigo-500/20">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Configure Interview Drill</h2>
                    <p className="text-xs text-slate-400">
                      Tailor the role, interview focus, and difficulty level for your upcoming placement drive.
                    </p>
                  </div>
                </div>

                {startError && (
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{startError}</span>
                  </div>
                )}

                {/* Target Role Input */}
                <div className="space-y-2">
                  <label htmlFor="targetRole" className="block text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    Target Role
                  </label>
                  <div className="relative">
                    <input
                      id="targetRole"
                      type="text"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      placeholder="e.g. Software Development Engineer, Frontend Developer, Data Analyst"
                      className="w-full bg-[#080d1a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-colors"
                    />
                    <Briefcase className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5 pointer-events-none" />
                  </div>
                </div>

                {/* Interview Type Selection */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    Interview Type
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(["Technical", "HR / Behavioral", "Mixed"] as InterviewType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setInterviewType(type)}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                          interviewType === type
                            ? "bg-gradient-to-r from-indigo-900/40 to-cyan-900/30 border-cyan-500 text-white shadow-md shadow-cyan-500/10"
                            : "bg-white/[0.02] border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-white">{type}</span>
                          {interviewType === type && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          {type === "Technical"
                            ? "DSA, Core CS, System Design"
                            : type === "HR / Behavioral"
                            ? "STAR method, leadership, fit"
                            : "Full-spectrum campus mock"}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty Selection */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    Difficulty Level
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(["Easy", "Medium", "Hard"] as InterviewDifficulty[]).map((diff) => (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => setDifficulty(diff)}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          difficulty === diff
                            ? "bg-cyan-500/15 border-cyan-400 text-cyan-300 font-semibold"
                            : "bg-white/[0.02] border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20"
                        }`}
                      >
                        <span className="text-xs">{diff}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Launch Button */}
                <button
                  type="button"
                  disabled={isStarting}
                  onClick={handleStartInterview}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isStarting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Generating Tailored Questions via Groq...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-white" />
                      <span>Start Mock Interview Drill</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Past Mock Rounds History (1 Column) */}
          <div className="space-y-4">
            <div className="p-6 rounded-3xl bg-[#0c1222]/80 border border-white/10 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span>Past Mock Rounds</span>
                  </h3>
                  <span className="text-xs text-slate-400">
                    {interviews.length} Round(s)
                  </span>
                </div>

                {interviews.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 space-y-2">
                    <p>No mock interview rounds taken yet.</p>
                    <p className="text-[11px] text-slate-500">
                      Configure your target role on the left to start your first round.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                    {interviews.map((mock) => (
                      <div
                        key={mock.id}
                        className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/30 transition-all flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">
                            {mock.target_role || "Software Developer"}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            <span>{mock.interview_type}</span>
                            <span>•</span>
                            <span className="text-cyan-300">{mock.difficulty || "Medium"}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">
                            {new Date(mock.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>

                        <div className="shrink-0 text-right flex flex-col items-end gap-1.5">
                          {mock.score != null ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                              {Number(mock.score).toFixed(1)}/10
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-semibold">
                              In Progress
                            </span>
                          )}

                          {mock.status === "completed" && (
                            <button
                              type="button"
                              onClick={() => handleViewPastInterview(mock)}
                              className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium underline underline-offset-2 hover:no-underline cursor-pointer"
                            >
                              Review
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 text-[11px] text-slate-400">
                <span>💡 Mock interview scores directly improve your Placement Readiness Metric on the Dashboard.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. IN_SESSION VIEW: Question & Answer Workspace                      */}
      {/* ==================================================================== */}
      {viewState === "in_session" && currentQuestion && (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Progress Header */}
          <div className="p-4 rounded-2xl bg-[#0c1222]/90 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </span>
              <span className="text-xs text-slate-300 font-medium">
                {targetRole} • {difficulty}
              </span>
            </div>

            <div className="w-full sm:w-48 bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Question Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0c1222]/90 border border-white/10 shadow-2xl relative overflow-hidden space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-md">
                {currentQuestion.category}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-white leading-relaxed">
              {currentQuestion.question}
            </h2>

            <p className="text-xs text-slate-400">
              Take your time to structure your thoughts clearly. Explain the context, trade-offs, architecture, or algorithmic complexities where relevant.
            </p>
          </div>

          {/* Answer Form */}
          <form onSubmit={handleSubmitAnswer} className="space-y-4">
            <div className="p-6 rounded-3xl bg-[#0c1222]/80 border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <label htmlFor="studentAnswer" className="flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-cyan-400" />
                  <span>Your Response</span>
                </label>
                <span className="text-slate-500 font-normal">
                  {studentAnswer.length} characters
                </span>
              </div>

              <textarea
                id="studentAnswer"
                rows={7}
                value={studentAnswer}
                onChange={(e) => setStudentAnswer(e.target.value)}
                placeholder="Type your answer here in detail... (e.g. 'I would approach this problem by first considering...')"
                className="w-full bg-[#080d1a] border border-white/10 rounded-2xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 leading-relaxed transition-colors resize-y"
              />

              {answerError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{answerError}</span>
                </div>
              )}

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-[11px] text-slate-500">
                  Groq evaluates answers based on accuracy, structure, and depth.
                </p>

                <button
                  type="submit"
                  disabled={isSubmitting || studentAnswer.trim().length < 2}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Evaluating Answer with AI...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Answer</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 3. EVALUATED_STEP VIEW: Intermediate Question Feedback               */}
      {/* ==================================================================== */}
      {viewState === "evaluated_step" && lastEvaluation && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0c1222]/95 border border-white/10 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
              <div>
                <span className="text-xs uppercase tracking-wider text-cyan-300 font-semibold">
                  Question {currentQuestionIndex} Evaluation
                </span>
                <h2 className="text-xl font-bold text-white mt-1">Answer Assessment</h2>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[11px] text-slate-400 uppercase font-semibold">Score</p>
                  <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
                    {lastEvaluation.score.toFixed(1)} / 10
                  </p>
                </div>
                <div
                  className={`p-3 rounded-2xl border ${
                    lastEvaluation.score >= 8.0
                      ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                      : lastEvaluation.score >= 6.0
                      ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-400"
                      : "bg-amber-500/15 border-amber-500/30 text-amber-400"
                  }`}
                >
                  <Award className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Constructive Feedback */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Evaluator Feedback
              </span>
              <p className="text-sm text-slate-200 leading-relaxed">
                {lastEvaluation.feedback}
              </p>
            </div>

            {/* Strengths and Improvements Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Strengths */}
              <div className="p-5 rounded-2xl bg-emerald-500/[0.04] border border-emerald-500/20 space-y-2.5">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Key Strengths</span>
                </h4>
                {lastEvaluation.strengths.length === 0 ? (
                  <p className="text-xs text-slate-400">Good attempt; keep elaborating with concrete technical examples.</p>
                ) : (
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {lastEvaluation.strengths.map((str, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-400 mt-0.5">•</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Improvements */}
              <div className="p-5 rounded-2xl bg-amber-500/[0.04] border border-amber-500/20 space-y-2.5">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  <span>Areas to Refine</span>
                </h4>
                {lastEvaluation.improvements.length === 0 ? (
                  <p className="text-xs text-slate-400">Excellent response! No major gaps detected.</p>
                ) : (
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {lastEvaluation.improvements.map((imp, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-400 mt-0.5">•</span>
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Next Action */}
            <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between">
              <p className="text-xs text-slate-400">
                The next question has been adaptively calibrated to your performance.
              </p>

              <button
                type="button"
                onClick={handleProceedToNextQuestion}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.01] cursor-pointer"
              >
                <span>Proceed to Question {currentQuestionIndex + 1}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 4. COMPLETED VIEW: Comprehensive Final Interview Report             */}
      {/* ==================================================================== */}
      {viewState === "completed" && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0c1222]/95 border border-white/10 shadow-2xl space-y-8 relative overflow-hidden">
            {/* Header / Score Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-white/[0.08] pb-6">
              <div className="space-y-1.5">
                <span className="text-xs uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Round Completed
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Interview Performance Report
                </h2>
                <p className="text-xs text-slate-300">
                  {targetRole} • {interviewType} • {difficulty}
                </p>
              </div>

              <div className="flex items-center gap-4 bg-white/[0.03] border border-white/10 px-6 py-4 rounded-2xl">
                <div className="text-right">
                  <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                    Overall Score
                  </p>
                  <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400">
                    {overallScore != null ? Number(overallScore).toFixed(1) : "N/A"}{" "}
                    <span className="text-sm text-slate-400 font-normal">/ 10</span>
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white shadow-md shadow-indigo-500/25">
                  <Award className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Overall Feedback Summary */}
            {overallFeedback && (
              <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-[#0d152a] to-[#0a1120] border border-indigo-500/20 space-y-2">
                <h3 className="text-xs uppercase tracking-wider font-bold text-cyan-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Director's Placement Assessment</span>
                </h3>
                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                  {overallFeedback}
                </p>
              </div>
            )}

            {/* Question Breakdown (if reviewing past round) */}
            {allQuestionsReview.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  <span>Question-by-Question Breakdown</span>
                </h3>

                <div className="space-y-3">
                  {allQuestionsReview.map((q: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-cyan-300">
                          Q{idx + 1}: {q.category || "Technical"}
                        </span>
                        {q.score != null && (
                          <span className="text-xs font-bold text-emerald-400">
                            {Number(q.score).toFixed(1)}/10
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white font-medium">{q.question}</p>
                      {q.studentAnswer && (
                        <p className="text-xs text-slate-400 italic bg-black/20 p-2.5 rounded-lg">
                          "{q.studentAnswer}"
                        </p>
                      )}
                      {q.feedback && (
                        <p className="text-xs text-slate-300 border-l-2 border-cyan-500/50 pl-2 mt-1">
                          {q.feedback}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <Link
                href="/dashboard"
                className="px-5 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Dashboard</span>
              </Link>

              <button
                type="button"
                onClick={() => setViewState("setup")}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.01] cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Start Another Mock Round</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
