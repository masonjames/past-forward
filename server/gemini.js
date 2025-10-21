import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY ?? process.env.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

function getFallbackPrompt(decade) {
  return `Create a photograph of the person in this image as if they were living in the ${decade}. The photograph should capture the distinct fashion, hairstyles, and overall atmosphere of that time period. Ensure the final image is a clear photograph that looks authentic to the era.`;
}

function extractDecade(prompt) {
  const match = prompt.match(/(\d{4}s)/);
  return match ? match[1] : null;
}

function processGeminiResponse(response) {
  const imagePartFromResponse = response.candidates?.[0]?.content?.parts?.find(
    (part) => part.inlineData
  );

  if (imagePartFromResponse?.inlineData) {
    const { mimeType, data } = imagePartFromResponse.inlineData;
    return `data:${mimeType};base64,${data}`;
  }

  const textResponse = response.text;
  console.error("API did not return an image. Response:", textResponse);
  throw new Error(
    `The AI model responded with text instead of an image: "${
      textResponse || "No text response received."
    }"`
  );
}

async function callGeminiWithRetry(imagePart, textPart) {
  const maxRetries = 3;
  const initialDelay = 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      return await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: { parts: [imagePart, textPart] },
      });
    } catch (error) {
      console.error(`Error calling Gemini API (Attempt ${attempt}/${maxRetries}):`, error);
      const errorMessage =
        error instanceof Error ? error.message : JSON.stringify(error);
      const isInternalError =
        errorMessage.includes('"code":500') || errorMessage.includes("INTERNAL");

      if (isInternalError && attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt - 1);
        console.log(`Internal error detected. Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }

  throw new Error("Gemini API call failed after all retries.");
}

export async function generateDecadeImage(imageDataUrl, prompt) {
  const match = imageDataUrl.match(/^data:(image\/\w+);base64,(.*)$/);
  if (!match) {
    throw new Error(
      "Invalid image data URL format. Expected 'data:image/...;base64,...'"
    );
  }

  const [, mimeType, base64Data] = match;

  const imagePart = {
    inlineData: { mimeType, data: base64Data },
  };

  try {
    console.log("Attempting generation with original prompt...");
    const textPart = { text: prompt };
    const response = await callGeminiWithRetry(imagePart, textPart);
    return processGeminiResponse(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isNoImageError = errorMessage.includes(
      "The AI model responded with text instead of an image"
    );

    if (!isNoImageError) {
      console.error("An unrecoverable error occurred during image generation.", error);
      throw new Error(`The AI model failed to generate an image. Details: ${errorMessage}`);
    }

    console.warn("Original prompt was likely blocked. Trying a fallback prompt.");
    const decade = extractDecade(prompt);
    if (!decade) {
      console.error("Could not extract decade from prompt, cannot use fallback.");
      throw error;
    }

    try {
      const fallbackPrompt = getFallbackPrompt(decade);
      console.log(`Attempting generation with fallback prompt for ${decade}...`);
      const fallbackTextPart = { text: fallbackPrompt };
      const fallbackResponse = await callGeminiWithRetry(
        imagePart,
        fallbackTextPart
      );
      return processGeminiResponse(fallbackResponse);
    } catch (fallbackError) {
      console.error("Fallback prompt also failed.", fallbackError);
      const finalErrorMessage =
        fallbackError instanceof Error
          ? fallbackError.message
          : String(fallbackError);
      throw new Error(
        `The AI model failed with both original and fallback prompts. Last error: ${finalErrorMessage}`
      );
    }
  }
}
