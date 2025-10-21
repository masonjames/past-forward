const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
const GENERATE_ENDPOINT = `${API_BASE_URL}/api/generate` || "/api/generate";

interface GenerateImagePayload {
  imageDataUrl: string;
  prompt: string;
}

interface GenerateImageResponse {
  imageDataUrl?: string;
  error?: string;
}

export async function generateDecadeImage(
  imageDataUrl: string,
  prompt: string
): Promise<string> {
  const payload: GenerateImagePayload = { imageDataUrl, prompt };

  let response: Response;
  try {
    response = await fetch(GENERATE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    const networkMessage =
      error instanceof Error ? error.message : "Network request failed";
    throw new Error(`Failed to connect to the Past Forward API: ${networkMessage}`);
  }

  let data: GenerateImageResponse | null = null;
  try {
    data = (await response.json()) as GenerateImageResponse;
  } catch (error) {
    console.error("Failed to parse API response as JSON", error);
  }

  if (!response.ok) {
    const message = data?.error ?? `Image generation failed with status ${response.status}`;
    throw new Error(message);
  }

  if (!data?.imageDataUrl) {
    throw new Error("The API did not return an imageDataUrl.");
  }

  return data.imageDataUrl;
}
