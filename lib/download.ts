export function dataUrlToBlob(dataUrl: string): Blob {
  const match = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
  if (!match) {
    throw new Error("Invalid data URL format. Expected 'data:<mime>;base64,<data>'");
  }
  const [, mimeType, base64Data] = match;
  const binary = atob(base64Data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

function isIosSafari(userAgent: string): boolean {
  const isAppleDevice = /iPad|iPhone|iPod/.test(userAgent);
  const isSafari = /Safari/.test(userAgent) && !/CriOS|FxiOS|EdgiOS/.test(userAgent);
  return isAppleDevice && isSafari;
}

export async function triggerDownloadFromDataUrl(
  dataUrl: string,
  filename: string,
): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("triggerDownloadFromDataUrl must be called in a browser environment");
  }

  const blob = dataUrlToBlob(dataUrl);
  const file = new File([blob], filename, { type: blob.type });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename });
      return;
    } catch (shareError) {
      console.warn("navigator.share failed, falling back to anchor download.", shareError);
    }
  }

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;

  if (!("download" in HTMLAnchorElement.prototype) || isIosSafari(window.navigator.userAgent)) {
    anchor.target = "_blank";
    anchor.rel = "noopener";
  }

  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  // Delay revocation slightly to support Safari opening the object URL.
  setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
}
