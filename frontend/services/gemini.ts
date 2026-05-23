import { GoogleGenAI, Type } from '@google/genai';
import { JobMatch } from '../types.ts';

// Safely get API key depending on the environment to prevent ReferenceErrors
let apiKey = '';
try {
  // @ts-ignore
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    // @ts-ignore
    apiKey = process.env.API_KEY;
  } else if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_API_KEY) {
    apiKey = (import.meta as any).env.VITE_API_KEY;
  }
} catch (e) {
  console.warn('Could not read API key from environment');
}

// Initialize the SDK.
const ai = new GoogleGenAI({ apiKey, vertexai: true });

/**
 * Step 1: Use Google Search tool to fetch information about a specific job URL.
 * We use this as a pseudo-scraper to get the job description.
 */
export async function fetchJobDetails(url: string): Promise<string> {
  const prompt = `
    Task: Extract job posting details from the following URL.
    URL: ${url}
    
    Instructions:
    1. Use the Google Search tool to find the content of this job posting.
    2. Return ONLY the Company Name, Job Title, and the Job Description.
    3. Be concise. If you cannot find the exact page immediately, infer the company and title from the URL and provide a brief summary. Do not perform multiple exhaustive searches.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    return response.text || '';
  } catch (error) {
    console.error(`Error fetching job details for ${url}:`, error);
    throw error;
  }
}

/**
 * Step 2: Evaluate the fetched job details against the user's resume and criteria.
 */
export async function evaluateJob(
  url: string,
  jobDetailsText: string,
  resume: string,
  criteria: string
): Promise<JobMatch | null> {
  const prompt = `
    You are an expert technical recruiter and career advisor.
    
    I have a job opportunity and I need you to evaluate if the candidate should apply.
    
    Job URL: ${url}
    Job Details (scraped/searched):
    ---
    ${jobDetailsText}
    ---
    
    Candidate's Resume:
    ---
    ${resume}
    ---
    
    Candidate's Criteria/Preferences:
    ---
    ${criteria}
    ---
    
    Evaluate the candidate's fit for this role. Consider their skills, experience, and how well the job aligns with their criteria.
    Provide a structured evaluation.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            company: { type: Type.STRING, description: "The company offering the job. Infer from details if not explicitly stated." },
            title: { type: Type.STRING, description: "The job title. Infer from details if not explicitly stated." },
            snippet: { type: Type.STRING, description: "A 1-2 sentence summary of the role." },
            matchScore: { type: Type.NUMBER, description: "A score from 0 to 100 indicating how well the resume and criteria match the role." },
            recommendation: { type: Type.STRING, description: "Must be exactly one of: 'Strong Yes', 'Yes', 'Maybe', 'No'" },
            reasoning: { type: Type.STRING, description: "A brief explanation of why this score and recommendation were given, highlighting matching skills, gaps, and criteria alignment." }
          },
          required: ["company", "title", "snippet", "matchScore", "recommendation", "reasoning"],
        },
      },
    });

    const jsonStr = response.text.trim();
    if (!jsonStr) return null;
    
    const parsedJob = JSON.parse(jsonStr);
    
    return {
      ...parsedJob,
      id: Math.random().toString(36).substring(2, 9),
      url: url,
    };

  } catch (error) {
    console.error(`Error evaluating job ${url}:`, error);
    return null;
  }
}

/**
 * Step 3: Draft answers to application questions based on resume and job details.
 * Optionally takes a user's draft to refine.
 */
export async function draftApplicationAnswer(
  job: JobMatch,
  resume: string,
  question: string,
  userDraft?: string
): Promise<string> {
  let prompt = `
    You are an expert career coach helping a candidate apply for a job.
    
    Job Details:
    Company: ${job.company}
    Title: ${job.title}
    Description: ${job.snippet}
    
    Candidate Resume:
    ---
    ${resume}
    ---
    
    The application asks the following question:
    "${question}"
  `;

  if (userDraft && userDraft.trim() !== '') {
    prompt += `
    The candidate has provided an initial draft answer:
    ---
    ${userDraft}
    ---
    
    Please refine and improve this draft answer. Make it professional, compelling, and concise.
    Ensure it highlights relevant skills and achievements from the resume that align with the job details.
    Do not include placeholders like [Your Name], just write the final answer text directly.
    `;
  } else {
    prompt += `
    Draft a professional, compelling, and concise answer to this question using the candidate's experience from their resume. 
    Highlight relevant skills and achievements that align with the job details.
    Do not include placeholders like [Your Name], just write the answer text directly.
    `;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Could not generate an answer.";
  } catch (error) {
    console.error("Error drafting answer:", error);
    throw error;
  }
}