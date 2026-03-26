import axios from 'axios';
import FormData from 'form-data';
import type {
  CenteringResult,
  CornerResult,
  SurfaceResult,
  GradeResult,
} from '@/types';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

const mlClient = axios.create({
  baseURL: ML_SERVICE_URL,
  timeout: 60000,
});

async function sendImageToEndpoint<T>(endpoint: string, imageBuffer: Buffer): Promise<T> {
  const form = new FormData();
  form.append('file', imageBuffer, {
    filename: 'card.jpg',
    contentType: 'image/jpeg',
  });

  const response = await mlClient.post<T>(endpoint, form, {
    headers: form.getHeaders(),
  });

  return response.data;
}

export async function analyzeCentering(imageBuffer: Buffer): Promise<CenteringResult> {
  return sendImageToEndpoint<CenteringResult>('/analyze/centering', imageBuffer);
}

export async function analyzeCorners(imageBuffer: Buffer): Promise<CornerResult> {
  return sendImageToEndpoint<CornerResult>('/analyze/corners', imageBuffer);
}

export async function analyzeSurface(imageBuffer: Buffer): Promise<SurfaceResult> {
  return sendImageToEndpoint<SurfaceResult>('/analyze/surface', imageBuffer);
}

export async function predictGrade(imageBuffer: Buffer): Promise<GradeResult> {
  return sendImageToEndpoint<GradeResult>('/analyze/condition', imageBuffer);
}

export async function analyzeComplete(imageBuffer: Buffer): Promise<{
  centering: CenteringResult;
  corners: CornerResult;
  surface: SurfaceResult;
  grade: GradeResult;
}> {
  return sendImageToEndpoint('/analyze/complete', imageBuffer);
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await mlClient.get('/health', { timeout: 5000 });
    return response.data?.status === 'healthy';
  } catch {
    return false;
  }
}
