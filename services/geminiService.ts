import { GoogleGenAI, Modality } from "@google/genai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

console.log("Environment check:", {
  hasApiKey: !!API_KEY,
  apiKeyLength: API_KEY?.length || 0,
  envKeys: Object.keys(import.meta.env).filter(key => key.includes('GEMINI'))
});

if (!API_KEY) {
  console.error("❌ VITE_GEMINI_API_KEY environment variable is not set.");
  console.error("Please set up your API key in Vercel environment variables:");
  console.error("1. Go to your Vercel project dashboard");
  console.error("2. Settings → Environment Variables");
  console.error("3. Add: VITE_GEMINI_API_KEY = your_api_key");
  console.error("4. Redeploy the application");
}

let ai: GoogleGenAI | null = null;

try {
  if (API_KEY) {
    ai = new GoogleGenAI({ apiKey: API_KEY });
  }
} catch (error) {
  console.error("Failed to initialize GoogleGenAI:", error);
}

function dataUrlToInlineData(dataUrl: string): {
  mimeType: string;
  data: string;
} {
  const parts = dataUrl.split(";base64,");
  const mimeType = parts[0].split(":")[1];
  const data = parts[1];
  return { mimeType, data };
}

export const transformToUSAnimationStyle = async (
  faceDataUrl: string
): Promise<string> => {
  if (!ai) {
    throw new Error(
      "❌ AI service is not available. Please check that your VITE_GEMINI_API_KEY environment variable is properly set in Vercel."
    );
  }

  try {
    const imagePart = {
      inlineData: dataUrlToInlineData(faceDataUrl),
    };

    const textPart = {
      text: "Transform this person's face into a US animation style. A bright and cute cartoon art style.",
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image-preview",
      contents: {
        parts: [imagePart, textPart],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    const imagePartResponse = response.candidates?.[0]?.content?.parts.find(
      (part) => part.inlineData
    );

    if (imagePartResponse?.inlineData) {
      const base64ImageBytes = imagePartResponse.inlineData.data;
      const mimeType = imagePartResponse.inlineData.mimeType;
      return `data:${mimeType};base64,${base64ImageBytes}`;
    }

    const textResponse = response.text;
    if (textResponse) {
      console.error(
        "Gemini API returned a text response instead of an image:",
        textResponse
      );
      throw new Error(`AI generation failed: ${textResponse}`);
    } else {
      console.error("Gemini API response did not contain an image.", response);
      throw new Error(
        "AI generation failed: The response did not contain a valid image."
      );
    }
  } catch (error) {
    console.error("Error transforming image with Gemini API:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(
      "An unknown error occurred while contacting the AI service."
    );
  }
};
