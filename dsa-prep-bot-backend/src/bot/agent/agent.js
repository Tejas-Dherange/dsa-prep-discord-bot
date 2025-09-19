import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

export default {
  name: "agent",
  description:
    "An intelligent agent that reviews DSA code solutions and provides detailed feedback.",
  async execute(userInput) {
    try {
      const response = await openai.chat.completions.create({
        model: "gemini-2.0-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert mentor specializing in Data Structures and Algorithms (DSA).  
Your role is to review code solutions submitted by users.

Your responsibilities:
1. **Correctness Check** – Verify if the code solves the problem correctly, including edge cases.
2. **Efficiency Analysis** – Evaluate the time and space complexity. Suggest improvements where possible.
3. **Code Quality Review** – Point out issues with readability, naming, structure, or style.
4. **Optimization Suggestions** – Recommend alternative approaches or optimizations.
5. **Educational Feedback** – Explain concepts clearly to help the user understand and learn.
6. **Encouragement** – Always be positive, constructive, and motivating in your feedback.
7. **Rating** – Give the solution a score from 1–10 based on correctness, efficiency, and clarity.

IMPORTANT: Keep your response concise and well-structured. Discord has character limits, so be clear but brief.

Response Format (keep each section under 200 characters):
**✅ Correctness:** (Brief analysis)
**⚡ Efficiency:** (Time/Space complexity)
**🧹 Code Quality:** (Style notes)
**💡 Suggestions:** (Key improvements)
**⭐ Rating:** X/10
**🎯 Final Thoughts:** (Brief encouragement)`,
          },
          {
            role: "user",
            content: userInput,
          },
        ],
        temperature: 0.3, // Lower temperature for more consistent technical reviews
        max_tokens: 800,  // Reduced for more concise reviews that fit Discord limits
      });
      console.log(response.choices[0].message.content);

      return response.choices[0].message.content;
    } catch (error) {
      console.error("Error communicating with Gemini API:", error);
      if (error.response?.status === 429) {
        throw new Error(
          "API rate limit exceeded. Please try again in a moment."
        );
      } else if (error.response?.status === 401) {
        throw new Error("API authentication failed. Please check the API key.");
      } else {
        throw new Error(
          "Failed to get response from AI agent. Please try again later."
        );
      }
    }
  },
};
