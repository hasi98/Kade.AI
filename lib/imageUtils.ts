const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export type PreparedImage = {
  base64: string;
  mimeType: string;
  url: string;
};

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const lowerName = file.name.toLowerCase();
  const extensionOk = /\.(jpe?g|png|webp|heic|heif)$/.test(lowerName);
  if (file.size > MAX_IMAGE_SIZE) {
    return { valid: false, error: "Aiyo, that image is too big ne - try a smaller one!" };
  }
  if (!ACCEPTED_TYPES.has(file.type) && !extensionOk) {
    return { valid: false, error: "Aiyo, I can only read JPG, PNG, WEBP, or HEIC images right now." };
  }
  return { valid: true };
}

export function createPreviewUrl(file: File) {
  return URL.createObjectURL(file);
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(reader.error ?? new Error("Image read failed"));
    reader.readAsDataURL(file);
  });
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image decode failed"));
    image.src = url;
  });
}

export async function resizeImage(file: File, maxDimension = 1024): Promise<PreparedImage> {
  const validation = validateImageFile(file);
  if (!validation.valid) throw new Error(validation.error);

  const previewUrl = createPreviewUrl(file);

  try {
    const source = await loadImage(previewUrl);
    const scale = Math.min(1, maxDimension / Math.max(source.width, source.height));
    const width = Math.max(1, Math.round(source.width * scale));
    const height = Math.max(1, Math.round(source.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas unavailable");
    context.drawImage(source, 0, 0, width, height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    return {
      base64: dataUrl.split(",")[1] ?? "",
      mimeType: "image/jpeg",
      url: previewUrl,
    };
  } catch {
    const base64 = await fileToBase64(file);
    return {
      base64,
      mimeType: file.type || "image/jpeg",
      url: previewUrl,
    };
  }
}
