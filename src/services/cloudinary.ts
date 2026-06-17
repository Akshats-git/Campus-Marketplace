import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '../constants/config';

const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export async function uploadImage(
  uri: string,
  folder: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  const formData = new FormData();
  const filename = uri.split('/').pop() ?? `image_${Date.now()}.jpg`;

  formData.append('file', { uri, type: 'image/jpeg', name: filename } as any);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', folder);

  const response = await fetch(UPLOAD_URL, { method: 'POST', body: formData });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`);
  }

  const data = await response.json();
  onProgress?.(100);
  return data.secure_url as string;
}
