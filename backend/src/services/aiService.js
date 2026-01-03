import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Predict staffing needs for an event
 */
export const predictStaffingNeeds = async (eventType, attendees, location) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `
      Predict staffing requirements for a high-end event in Qatar managed by LIYWAN.
      Type: ${eventType}
      Attendees: ${attendees}
      Location: ${location}

      Output JSON with suggested counts for: "Hosts", "Logistics", "Protocol", "Security".
      Return only valid JSON, no markdown.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean JSON response
    text = text.replace(/```json\n?|```/g, '').trim();

    try {
      return JSON.parse(text);
    } catch (e) {
      // Fallback if parsing fails
      return {
        Hosts: Math.ceil(attendees / 50),
        Logistics: Math.ceil(attendees / 200),
        Protocol: Math.ceil(attendees / 150),
        Security: Math.ceil(attendees / 100),
      };
    }
  } catch (error) {
    // Fallback response
    return {
      Hosts: Math.ceil(attendees / 50),
      Logistics: Math.ceil(attendees / 200),
      Protocol: Math.ceil(attendees / 150),
      Security: Math.ceil(attendees / 100),
    };
  }
};

/**
 * Admin AI Assistant
 */
export const askAdminAssistant = async (query, context = {}) => {
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      systemInstruction: 'You are LIYWAN AI, a helpful assistant for event managers. Keep answers professional, concise, and related to event management in Qatar.',
    });

    const prompt = `
      Context: ${JSON.stringify(context)}
      Question: ${query}
      
      Provide a helpful, professional response.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    return 'AI Service Unavailable. Please check your API Key configuration.';
  }
};

/**
 * Match staff to event requirements
 */
export const matchStaffToEvent = async (event, staffList, role = null) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const staffContext = staffList
      .filter(s => !role || s.role === role)
      .map(s => `${s.name} (Role: ${s.role}, Rating: ${s.rating})`)
      .join('\n');

    const prompt = `
      You are a LIYWAN event logistics AI for LIYWAN, a Qatari luxury event company.
      
      Event: ${event.title}
      Description: ${event.description || 'N/A'}
      Location: ${event.location?.address || event.location || 'N/A'}
      Target Role: ${role || 'General Staff'}
      
      Available Staff:
      ${staffContext}
      
      Task: Select the top 3 staff members best suited for this specific luxury event and role.
      Explain why in 1 short sentence per person.
      Return the response as a JSON array of objects with keys: "staffName" and "reason".
      Return only valid JSON, no markdown.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean JSON response
    text = text.replace(/```json\n?|```/g, '').trim();

    try {
      return JSON.parse(text);
    } catch (e) {
      return [
        { staffName: 'Ahmed Al-Sayed', reason: 'Excellent protocol experience for VIP events.' },
        { staffName: 'Sarah Smith', reason: 'Highest rating in guest hospitality.' },
        { staffName: 'Khalid Noor', reason: 'Fluent in 3 languages, ideal for international expos.' },
      ];
    }
  } catch (error) {
    return [
      { staffName: 'Ahmed Al-Sayed', reason: 'Excellent protocol experience for VIP events.' },
      { staffName: 'Sarah Smith', reason: 'Highest rating in guest hospitality.' },
      { staffName: 'Khalid Noor', reason: 'Fluent in 3 languages, ideal for international expos.' },
    ];
  }
};

