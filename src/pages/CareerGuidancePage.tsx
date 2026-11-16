import { useState } from 'react';
import { Send, Compass, TrendingUp, BookOpen, AlertCircle } from 'lucide-react';
import { PageMeta } from '../components/PageMeta';
import { useAuth } from '../context/AuthContext';
import { SALARY_BENCHMARKS, SKILL_ROADMAPS } from '../data/catalog';

interface ChatMsg {
  role: 'user' | 'model';
  text: string;
}

const MODES = [
  'Career Guidance',
  'Job Recommendation Based on Skills',
  'Skill Gap Analysis',
  'Career Path Suggestions',
  'Interview Preparation',
  'Resume Improvement',
  'Job Description Explanation',
  'Learning Roadmap',
];

export function CareerGuidancePage() {
  const { userProfile } = useAuth();
  const [mode, setMode] = useState(MODES[0]);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: 'model',
      text: 'Namaste! I am your Apna Role AI Career Assistant. Ask me about Indian salary ranges, skill gap analysis, career transitions, or paste a job description to decode what recruiters want.',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Salary Insights Interactive Estimator
  const [roleQuery, setRoleQuery] = useState('Software Engineer');
  const [cityQuery, setCityQuery] = useState('Bengaluru');
  const [expQuery, setExpQuery] = useState('1-3 Years');
  const [insightResult, setInsightResult] = useState<{
    minLpa?: number;
    medianLpa?: number;
    maxLpa?: number;
    marketDemand?: string;
    topSkills?: string[];
    learningResources?: string[];
  } | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);

  const sendMessage = async (textOverride?: string) => {
    const prompt = (textOverride ?? input).trim();
    if (!prompt || loading) return;

    const nextMessages: ChatMsg[] = [...messages, { role: 'user', text: prompt }];
    setMessages(nextMessages);
    if (!textOverride) setInput('');
    setLoading(true);
    setChatError(null);

    try {
      const res = await fetch('/api/ai/career-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          mode,
          history: nextMessages,
          userProfile: userProfile
            ? {
                displayName: userProfile.displayName,
                headline: userProfile.headline,
                skills: userProfile.skills,
                location: userProfile.location,
              }
            : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setChatError(data.error || 'AI service unavailable.');
      } else {
        setMessages([...nextMessages, { role: 'model', text: data.reply }]);
      }
    } catch {
      setChatError('Network error reaching AI Career Assistant.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSalaryInsights = async (e: React.FormEvent) => {
    e.preventDefault();
    setInsightLoading(true);
    setInsightError(null);
    try {
      const res = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: roleQuery, city: cityQuery, experience: expQuery }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInsightError(data.error || 'Could not retrieve AI salary insights.');
      } else {
        setInsightResult(data);
      }
    } catch {
      setInsightError('Network error fetching salary insights.');
    } finally {
      setInsightLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      <PageMeta
        title="AI Career Guidance, Salary Insights & Skill Development – Apna Role"
        description="Get personalized Indian career guidance, skill gap analysis, salary benchmarks in INR LPA, and learning roadmaps powered by AI."
      />

      <div>
        <h1 className="font-display text-3xl font-bold text-[#0B1B3B]">
          AI Career Assistant &amp; Skill Intelligence
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Interactive career coaching, Indian salary benchmarks, and curated skill development tracks.
        </p>
      </div>

      {/* Chatbot Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 h-fit">
          <h2 className="font-display text-base font-bold text-[#0B1B3B] flex items-center gap-2">
            <Compass className="w-4 h-4 text-blue-700" /> Guidance Mode
          </h2>
          <div className="space-y-1.5">
            {MODES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  mode === m
                    ? 'bg-blue-700 text-white font-semibold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <p className="text-xs font-semibold text-slate-500">Quick Prompts</p>
            <button
              type="button"
              onClick={() =>
                sendMessage('Analyze skill gaps for a fresher aiming for a React & Node.js role in Bengaluru.')
              }
              className="w-full text-left text-xs text-blue-700 hover:underline cursor-pointer"
            >
              Skill gap for React + Node.js fresher in Bengaluru
            </button>
            <button
              type="button"
              onClick={() =>
                sendMessage('Suggest a 6-week roadmap to transition from customer support to business analyst.')
              }
              className="w-full text-left text-xs text-blue-700 hover:underline cursor-pointer"
            >
              6-week transition roadmap to Business Analyst
            </button>
          </div>
        </div>

        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl flex flex-col h-[540px]">
          <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
            <span className="font-display text-sm font-bold text-[#0B1B3B]">
              Mode: {mode}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm whitespace-pre-line leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-700 text-white'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="text-xs text-slate-500">Analyzing your career question...</div>
            )}
            {chatError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{chatError}</span>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="p-4 border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask about ${mode.toLowerCase()}...`}
              className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-600"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" /> Ask
            </button>
          </form>
        </div>
      </section>

      {/* Salary Insights */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#0B1B3B] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-700" />
              Indian Salary Insights (INR LPA)
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Query live AI salary estimates for your target city &amp; experience, or compare market benchmarks below.
            </p>
          </div>
        </div>

        <form onSubmit={fetchSalaryInsights} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input
            type="text"
            required
            value={roleQuery}
            onChange={(e) => setRoleQuery(e.target.value)}
            placeholder="Role (e.g. Data Analyst)"
            className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
          />
          <input
            type="text"
            value={cityQuery}
            onChange={(e) => setCityQuery(e.target.value)}
            placeholder="City (e.g. Pune)"
            className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
          />
          <select
            value={expQuery}
            onChange={(e) => setExpQuery(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white"
          >
            <option value="Fresher">Fresher (0–1 yr)</option>
            <option value="1-3 Years">1–3 Years</option>
            <option value="3-5 Years">3–5 Years</option>
            <option value="5+ Years">5+ Years</option>
          </select>
          <button
            type="submit"
            disabled={insightLoading}
            className="px-4 py-2.5 bg-[#0B1B3B] hover:bg-slate-800 text-white text-sm font-semibold rounded-lg cursor-pointer disabled:opacity-50"
          >
            {insightLoading ? 'Estimating...' : 'Estimate Salary'}
          </button>
        </form>

        {insightError && (
          <p className="text-xs text-red-600">{insightError}</p>
        )}

        {insightResult && (
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-5">
            <div>
              <p className="text-xs text-slate-500">Range (LPA)</p>
              <p className="font-mono text-xl font-bold text-[#0B1B3B] tabular-nums mt-1">
                ₹{insightResult.minLpa} – ₹{insightResult.maxLpa} LPA
              </p>
              <p className="text-xs text-blue-700 font-semibold mt-0.5 tabular-nums">
                Median: ₹{insightResult.medianLpa} LPA
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Market Demand</p>
              <p className="text-sm font-semibold text-slate-900 mt-1">
                {insightResult.marketDemand}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Top Paying Skills</p>
              <p className="text-xs text-slate-800 mt-1">
                {(insightResult.topSkills || []).join(' · ')}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Recommended Learning</p>
              <p className="text-xs text-slate-800 mt-1">
                {(insightResult.learningResources || []).join(' · ')}
              </p>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="py-3 pr-4 font-semibold">Role</th>
                <th className="py-3 px-4 font-semibold">Major Hubs</th>
                <th className="py-3 px-4 font-semibold">Fresher</th>
                <th className="py-3 px-4 font-semibold">1–4 Years</th>
                <th className="py-3 pl-4 font-semibold">5+ Years</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 tabular-nums">
              {SALARY_BENCHMARKS.map((row) => (
                <tr key={row.role}>
                  <td className="py-3 pr-4 font-semibold text-[#0B1B3B]">{row.role}</td>
                  <td className="py-3 px-4 text-slate-600">{row.city}</td>
                  <td className="py-3 px-4 text-slate-800">{row.fresher}</td>
                  <td className="py-3 px-4 text-blue-700 font-medium">{row.mid}</td>
                  <td className="py-3 pl-4 text-slate-900 font-semibold">{row.senior}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Skill Development Roadmaps */}
      <section className="space-y-5">
        <h2 className="font-display text-2xl font-bold text-[#0B1B3B] flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-cyan-700" />
          Skill Development Tracks
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {SKILL_ROADMAPS.map((track) => (
            <div key={track.track} className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
              <h3 className="font-display text-lg font-bold text-[#0B1B3B]">{track.track}</h3>
              <p className="text-xs font-medium text-blue-700">{track.demand}</p>
              <p className="text-xs text-slate-600">Core Stack: {track.skills.join(' · ')}</p>
              <p className="text-sm text-slate-700 pt-2 border-t border-slate-100">
                <strong className="text-[#0B1B3B]">Portfolio Milestone:</strong> {track.milestone}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
