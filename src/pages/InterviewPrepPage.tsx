import { useState } from 'react';
import { Mic, BookCheck, ChevronDown, ChevronUp, Sparkles, AlertCircle } from 'lucide-react';
import { PageMeta } from '../components/PageMeta';
import { INTERVIEW_QUESTION_BANKS } from '../data/catalog';

export function InterviewPrepPage() {
  const [activeBankId, setActiveBankId] = useState(INTERVIEW_QUESTION_BANKS[0].id);
  const [openQuestionIdx, setOpenQuestionIdx] = useState<number | null>(0);

  // AI Mock Interview State
  const [mockRole, setMockRole] = useState('Java / Backend Engineer');
  const [mockLevel, setMockLevel] = useState('Fresher');
  const [mockQuestion, setMockQuestion] = useState<string | null>(null);
  const [mockFocus, setMockFocus] = useState<string[]>([]);
  const [userAnswer, setUserAnswer] = useState('');
  const [evaluation, setEvaluation] = useState<{
    strengths?: string[];
    improvements?: string[];
    suggestedAnswer?: string;
    communicationTip?: string;
  } | null>(null);
  const [mockLoading, setMockLoading] = useState(false);
  const [mockError, setMockError] = useState<string | null>(null);

  const activeBank =
    INTERVIEW_QUESTION_BANKS.find((b) => b.id === activeBankId) ||
    INTERVIEW_QUESTION_BANKS[0];

  const generateMockQuestion = async () => {
    setMockLoading(true);
    setMockError(null);
    setEvaluation(null);
    setUserAnswer('');
    try {
      const res = await fetch('/api/ai/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_question',
          role: mockRole,
          experienceLevel: mockLevel,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMockError(data.error || 'Could not generate mock interview question.');
      } else {
        setMockQuestion(data.question);
        setMockFocus(data.focusAreas || []);
      }
    } catch {
      setMockError('Network error reaching AI Interview coach.');
    } finally {
      setMockLoading(false);
    }
  };

  const evaluateMockAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mockQuestion || !userAnswer.trim()) return;
    setMockLoading(true);
    setMockError(null);
    try {
      const res = await fetch('/api/ai/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'evaluate_answer',
          role: mockRole,
          experienceLevel: mockLevel,
          question: mockQuestion,
          userAnswer: userAnswer.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMockError(data.error || 'Failed to evaluate answer.');
      } else {
        setEvaluation(data);
      }
    } catch {
      setMockError('Network error evaluating answer.');
    } finally {
      setMockLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      <PageMeta
        title="Interview Preparation & AI Mock Practice – Apna Role"
        description="Practice HR, Fresher, Java, Python, JavaScript, SQL, and Data Science interview questions with suggested answers and live AI mock coaching."
      />

      <div>
        <h1 className="font-display text-3xl font-bold text-[#0B1B3B]">
          Interview Preparation Hub
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Curated technical &amp; HR question banks, communication guidance, and live AI mock interview evaluations.
        </p>
      </div>

      {/* AI Mock Interview Section */}
      <section className="bg-[#0B1B3B] text-white rounded-2xl p-6 sm:p-8 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <Mic className="w-5 h-5 text-cyan-400" />
              AI Mock Interview Simulator
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Select your target role, receive a realistic interview prompt, and get structured feedback on your answer.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            value={mockRole}
            onChange={(e) => setMockRole(e.target.value)}
            placeholder="Target Role"
            className="bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
          />
          <select
            value={mockLevel}
            onChange={(e) => setMockLevel(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
          >
            <option value="Fresher">Fresher / Campus</option>
            <option value="1-3 Years">1–3 Years Experience</option>
            <option value="3-5 Years">3–5 Years Experience</option>
          </select>
          <button
            type="button"
            disabled={mockLoading}
            onClick={generateMockQuestion}
            className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-[#0B1B3B] text-sm font-bold rounded-xl cursor-pointer disabled:opacity-50"
          >
            {mockLoading && !mockQuestion ? 'Generating...' : 'Generate Mock Question'}
          </button>
        </div>

        {mockError && (
          <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-xs text-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {mockError}
          </div>
        )}

        {mockQuestion && (
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 space-y-4">
            <div>
              <p className="text-xs font-semibold text-cyan-300">Interviewer Question</p>
              <p className="text-base font-semibold text-white mt-1">{mockQuestion}</p>
              {mockFocus.length > 0 && (
                <p className="text-xs text-slate-400 mt-1.5">
                  Focus areas: {mockFocus.join(' · ')}
                </p>
              )}
            </div>

            <form onSubmit={evaluateMockAnswer} className="space-y-3">
              <textarea
                rows={4}
                required
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Type your spoken response here..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white"
              />
              <button
                type="submit"
                disabled={mockLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {mockLoading ? 'Evaluating...' : 'Evaluate My Answer'}
              </button>
            </form>

            {evaluation && (
              <div className="pt-4 border-t border-slate-800 space-y-3 text-sm">
                {evaluation.strengths && evaluation.strengths.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-emerald-400">Strengths</p>
                    <ul className="list-disc pl-5 text-xs text-slate-200 mt-1 space-y-1">
                      {evaluation.strengths.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
                {evaluation.improvements && evaluation.improvements.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-amber-300">Areas to Improve</p>
                    <ul className="list-disc pl-5 text-xs text-slate-200 mt-1 space-y-1">
                      {evaluation.improvements.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
                {evaluation.suggestedAnswer && (
                  <div>
                    <p className="text-xs font-bold text-cyan-300">Suggested Model Answer</p>
                    <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                      {evaluation.suggestedAnswer}
                    </p>
                  </div>
                )}
                {evaluation.communicationTip && (
                  <p className="text-xs text-slate-300">
                    <strong>Delivery Tip:</strong> {evaluation.communicationTip}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Topic Question Banks */}
      <section className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {INTERVIEW_QUESTION_BANKS.map((bank) => (
            <button
              key={bank.id}
              type="button"
              onClick={() => {
                setActiveBankId(bank.id);
                setOpenQuestionIdx(0);
              }}
              className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg border cursor-pointer transition-colors ${
                activeBankId === bank.id
                  ? 'bg-blue-700 text-white border-blue-700 font-semibold'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {bank.label}
            </button>
          ))}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="pb-4 border-b border-slate-100">
            <h2 className="font-display text-xl font-bold text-[#0B1B3B] flex items-center gap-2">
              <BookCheck className="w-5 h-5 text-blue-700" />
              {activeBank.label} Questions
            </h2>
            <p className="text-sm text-slate-600 mt-1">{activeBank.description}</p>
          </div>

          <div className="divide-y divide-slate-100">
            {activeBank.questions.map((item, idx) => {
              const isOpen = openQuestionIdx === idx;
              return (
                <div key={idx} className="py-4">
                  <button
                    type="button"
                    onClick={() => setOpenQuestionIdx(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between gap-4 text-left cursor-pointer"
                  >
                    <span className="font-display text-sm sm:text-base font-semibold text-[#0B1B3B]">
                      {idx + 1}. {item.q}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="mt-3 space-y-2 text-sm text-slate-700 bg-slate-50 rounded-xl p-4">
                      <p>
                        <strong className="text-[#0B1B3B]">Suggested Answer:</strong> {item.a}
                      </p>
                      <p className="text-xs text-blue-800 font-medium">
                        Interview Tip: {item.tip}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Communication Skills Guidance */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-display text-base font-bold text-[#0B1B3B]">
            01. STAR Storytelling Structure
          </h3>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Frame behavioral answers with Situation (15%), Task (15%), Action (50%), and Result (20%). Quantify outcomes whenever possible.
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-display text-base font-bold text-[#0B1B3B]">
            02. Think Out Loud Clearly
          </h3>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            In technical rounds, clarify constraints before coding, state trade-offs calmly, and walk through edge cases step by step.
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-display text-base font-bold text-[#0B1B3B]">
            03. Smart Closing Questions
          </h3>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Always ask 2 thoughtful questions at the end, such as team onboarding expectations in the first 90 days or engineering roadmap priorities.
          </p>
        </div>
      </section>
    </div>
  );
}
