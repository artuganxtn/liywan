import { GoogleGenAI, Type } from "@google/genai";
import { Event, StaffProfile } from "../types";

// Helper to initialize GenAI
const getGenAI = () => {
  const apiKey = process.env.API_KEY || ''; 
  if (!apiKey) {
    console.warn("API_KEY is missing. Mocking AI responses will fail if not handled.");
  }
  return new GoogleGenAI({ apiKey });
};

// Helper to strip Markdown code blocks from AI JSON responses
const cleanJSON = (text: string) => {
  if (!text) return "[]";
  return text.replace(/```json\n?|```/g, '').trim();
};

/**
 * AI Staff Matching: Analyzes event requirements and matches best staff.
 */
export const matchStaffToEvent = async (event: Event, staffList: StaffProfile[], role?: string): Promise<string> => {
  const ai = getGenAI();
  
  const staffContext = staffList
    .filter(s => !role || s.role === role) // Filter by role if provided
    .map(s => `${s.name} (Role: ${s.role}, Skills: ${s.skills.map(sk => sk.name).join(', ')}, Rating: ${s.rating})`)
    .join('\n');
  
  const prompt = `
    You are an IVENTIA event logistics AI for IVENTIA, a Qatari luxury event company.
    
    Event: ${event.title}
    Description: ${event.description}
    Location: ${event.location}
    Target Role: ${role || 'General Staff'}
    
    Available Staff:
    ${staffContext}
    
    Task: Select the top 3 staff members best suited for this specific luxury event and role.
    Explain why in 1 short sentence per person. 
    Return the response as a JSON array of objects with keys: "staffName" and "reason".
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    staffName: { type: Type.STRING },
                    reason: { type: Type.STRING }
                }
            }
        }
      }
    });

    return cleanJSON(response.text || '[]');
  } catch (error) {
    console.error("AI Matching Error:", error);
    return JSON.stringify([
      { staffName: "Ahmed Al-Sayed", reason: "Excellent protocol experience for VIP events." },
      { staffName: "Sarah Smith", reason: "Highest rating in guest hospitality." },
      { staffName: "Khalid Noor", reason: "Fluent in 3 languages, ideal for international expos." }
    ]);
  }
};

/**
 * AI Staffing Forecast
 */
export const predictStaffingNeeds = async (eventType: string, attendees: number, location: string): Promise<string> => {
  const ai = getGenAI();
  const prompt = `
    Predict staffing requirements for a high-end event in Qatar managed by IVENTIA.
    Type: ${eventType}
    Attendees: ${attendees}
    Location: ${location}

    Output JSON with suggested counts for: "Hosts", "Logistics", "Protocol".
  `;
  
  try {
     const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json"
        }
     });
     return cleanJSON(response.text || "{}");
  } catch (e) {
      // Mock fallback
      return JSON.stringify({
          "Hosts": Math.ceil(attendees / 50),
          "Logistics": Math.ceil(attendees / 200),
          "Protocol": Math.ceil(attendees / 150)
      });
  }
}

/**
 * AI Chatbot for Admin Dashboard
 */
export const askAdminAssistant = async (query: string): Promise<string> => {
  const ai = getGenAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: {
        systemInstruction: "You are IVENTIA AI, a helpful assistant for event managers. Keep answers professional, concise, and related to event management in Qatar.",
      }
    });
    return response.text || "I apologize, I could not process that request at the moment.";
  } catch (error) {
    console.error("AI Chat Error:", error);
    return "AI Service Unavailable. Please check your API Key configuration.";
  }
};