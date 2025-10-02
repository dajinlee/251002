import { GoogleGenAI, Modality } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

function dataUrlToInlineData(dataUrl: string): { mimeType: string; data: string } {
    const parts = dataUrl.split(';base64,');
    const mimeType = parts[0].split(':')[1];
    const data = parts[1];
    return { mimeType, data };
}

export const transformToUSAnimationStyle = async (faceDataUrl: string): Promise<string> => {
    try {
        const imagePart = {
            inlineData: dataUrlToInlineData(faceDataUrl)
        };

        const textPart = {
            text: "Transform this person's face into a US animation style. A bright and cute cartoon art style."
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
                parts: [imagePart, textPart],
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });
        
        const imagePartResponse = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);

        if (imagePartResponse?.inlineData) {
            const base64ImageBytes = imagePartResponse.inlineData.data;
            const mimeType = imagePartResponse.inlineData.mimeType;
            return `data:${mimeType};base64,${base64ImageBytes}`;
        }
        
        const textResponse = response.text;
        if (textResponse) {
            console.error("Gemini API returned a text response instead of an image:", textResponse);
            throw new Error(`AI generation failed: ${textResponse}`);
        } else {
            console.error("Gemini API response did not contain an image.", response);
            throw new Error("AI generation failed: The response did not contain a valid image.");
        }

    } catch (error) {
        console.error("Error transforming image with Gemini API:", error);
        if (error instanceof Error) {
          throw error;
        }
        throw new Error("An unknown error occurred while contacting the AI service.");
    }
};