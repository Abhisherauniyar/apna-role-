import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '2mb' }));

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health & configuration status endpoint
app.get('/api/health', (_req, res) => {
  const aiConfigured = Boolean(
    process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'
  );
  res.json({ ok: true, aiConfigured, timestamp: new Date().toISOString() });
});

// SEO: robots.txt
app.get('/robots.txt', (req, res) => {
  const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  res.type('text/plain').send(
    `User-agent: *\nAllow: /\nDisallow: /dashboard\nDisallow: /employer\nDisallow: /admin\nSitemap: ${baseUrl}/sitemap.xml\n`
  );
});

// SEO: sitemap.xml
app.get('/sitemap.xml', (req, res) => {
  const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  const routes = [
    '/',
    '/jobs',
    '/companies',
    '/internships',
    '/resume-builder',
    '/career-guidance',
    '/interview-prep',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
  ];
  const urls = routes
    .map(
      (route) =>
        `  <url>\n    <loc>${baseUrl}${route}</loc>\n    <changefreq>daily</changefreq>\n    <priority>${route === '/' ? '1.0' : '0.8'}</priority>\n  </url>`
    )
    .join('\n');

  res.type('application/xml').send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`
  );
});

// AI Resume Builder endpoint
app.post('/api/ai/resume', async (req, res) => {
  try {
    const ai = getAiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini AI is not configured. Please add GEMINI_API_KEY in Settings > Secrets.',
        code: 'MISSING_API_KEY',
      });
    }

    const { action, resumeData, targetJobDescription } = req.body as {
      action: 'summary' | 'improve' | 'skills' | 'grammar' | 'keywords' | 'ats';
      resumeData: Record<string, unknown>;
      targetJobDescription?: string;
    };

    if (!action || !resumeData) {
      return res.status(400).json({ error: 'Missing action or resumeData.' });
    }

    const serializedResume = JSON.stringify(resumeData).slice(0, 8000);
    const serializedJD = (targetJobDescription || '').slice(0, 4000);

    if (action === 'summary') {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Write a crisp, high-impact 3-4 sentence professional resume summary tailored for the Indian job market based on this candidate profile:\n${serializedResume}\nTarget role/JD (if provided): ${serializedJD}`,
        config: {
          systemInstruction:
            'You are an executive career coach and ATS resume specialist for Indian professionals. Output only the polished summary paragraph without markdown fences or preamble.',
        },
      });
      return res.json({ summary: (response.text || '').trim() });
    }

    if (action === 'skills') {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Suggest 10 relevant, high-demand technical and domain skills to strengthen this resume:\n${serializedResume}\nTarget JD: ${serializedJD}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              skills: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
          },
        },
      });
      const parsed = JSON.parse(response.text || '{"skills":[]}');
      return res.json({ skills: parsed.skills || [] });
    }

    if (action === 'keywords') {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Extract the top 12 ATS keywords and action verbs from this job description and compare against the candidate resume.\nJob Description:\n${serializedJD || 'General Indian IT & corporate role'}\nCandidate Resume:\n${serializedResume}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
              matchedKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
              tip: { type: Type.STRING },
            },
          },
        },
      });
      return res.json(JSON.parse(response.text || '{}'));
    }

    if (action === 'grammar' || action === 'improve' || action === 'ats') {
      const prompts: Record<string, string> = {
        grammar: `Review this resume data for grammar, tense consistency, clarity, and Indian/global corporate phrasing:\n${serializedResume}`,
        improve: `Improve the bullet points, impact phrasing, and quantifiable achievements for this resume:\n${serializedResume}\nTarget JD: ${serializedJD}`,
        ats: `Audit this resume for ATS compatibility (section headers, measurable metrics, keyword density, formatting) and return concrete actionable recommendations:\n${serializedResume}\nTarget JD: ${serializedJD}`,
      };
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompts[action],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overallFeedback: { type: Type.STRING },
              improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
              rewrittenSummary: { type: Type.STRING },
            },
          },
        },
      });
      return res.json(JSON.parse(response.text || '{}'));
    }

    return res.status(400).json({ error: 'Unsupported AI resume action.' });
  } catch (err) {
    console.error('AI Resume Error:', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to process AI resume request.',
    });
  }
});

// AI Career Assistant endpoint
app.post('/api/ai/career-chat', async (req, res) => {
  try {
    const ai = getAiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini AI is not configured. Please add GEMINI_API_KEY in Settings > Secrets.',
        code: 'MISSING_API_KEY',
      });
    }

    const { message, mode, userProfile, history } = req.body as {
      message: string;
      mode?: string;
      userProfile?: Record<string, unknown>;
      history?: Array<{ role: 'user' | 'model'; text: string }>;
    };

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const profileContext = userProfile
      ? `\nCandidate Context: ${JSON.stringify(userProfile).slice(0, 2500)}`
      : '';

    const conversationHistory = (history || [])
      .slice(-8)
      .map((m) => `${m.role === 'user' ? 'Candidate' : 'Career Mentor'}: ${m.text}`)
      .join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `${conversationHistory ? `Previous Conversation:\n${conversationHistory}\n\n` : ''}Mode: ${mode || 'Career Guidance'}\nCandidate Question: ${message}`,
      config: {
        systemInstruction: `You are Apna Role Career Mentor, an expert Indian career counselor, hiring manager, and skill strategist. Give practical, specific advice tailored to the Indian job market (INR CTC/LPA norms, Bengaluru/Hyderabad/Pune/NCR/Remote hubs, fresher placements, upskilling roadmaps, and ATS resume tactics). Use clean plain formatting with concise bullet points.${profileContext}`,
      },
    });

    return res.json({ reply: (response.text || '').trim() });
  } catch (err) {
    console.error('AI Career Chat Error:', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to generate career guidance.',
    });
  }
});

// AI Mock Interview endpoint
app.post('/api/ai/interview', async (req, res) => {
  try {
    const ai = getAiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini AI is not configured. Please add GEMINI_API_KEY in Settings > Secrets.',
        code: 'MISSING_API_KEY',
      });
    }

    const { action, role, experienceLevel, question, userAnswer } = req.body as {
      action: 'generate_question' | 'evaluate_answer';
      role: string;
      experienceLevel?: string;
      question?: string;
      userAnswer?: string;
    };

    if (action === 'generate_question') {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Generate 1 realistic interview question for a "${role || 'Software Engineer'}" candidate at "${experienceLevel || 'Fresher'}" level in India, along with key points an interviewer looks for.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              category: { type: Type.STRING },
              focusAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
          },
        },
      });
      return res.json(JSON.parse(response.text || '{}'));
    }

    if (action === 'evaluate_answer') {
      if (!question || !userAnswer) {
        return res.status(400).json({ error: 'Question and answer are required.' });
      }
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Role: ${role}\nExperience: ${experienceLevel || 'Fresher'}\nInterview Question: ${question}\nCandidate Answer: ${userAnswer}\nEvaluate the answer constructively and provide a model high-scoring answer.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
              suggestedAnswer: { type: Type.STRING },
              communicationTip: { type: Type.STRING },
            },
          },
        },
      });
      return res.json(JSON.parse(response.text || '{}'));
    }

    return res.status(400).json({ error: 'Invalid interview action.' });
  } catch (err) {
    console.error('AI Interview Error:', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to run AI mock interview.',
    });
  }
});

// AI Salary Insights & Role Skill Roadmap
app.post('/api/ai/insights', async (req, res) => {
  try {
    const ai = getAiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini AI is not configured. Please add GEMINI_API_KEY in Settings > Secrets.',
        code: 'MISSING_API_KEY',
      });
    }

    const { role, city, experience } = req.body as {
      role: string;
      city?: string;
      experience?: string;
    };

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Provide Indian salary range insights (in INR LPA) and top skills to learn for role "${role}" in "${city || 'Bengaluru'}" with experience "${experience || '1-3 Years'}".`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            minLpa: { type: Type.NUMBER },
            medianLpa: { type: Type.NUMBER },
            maxLpa: { type: Type.NUMBER },
            marketDemand: { type: Type.STRING },
            topSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            learningResources: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
        },
      },
    });
    return res.json(JSON.parse(response.text || '{}'));
  } catch (err) {
    console.error('AI Insights Error:', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to fetch salary insights.',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Apna Role server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
