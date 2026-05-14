/**
 * Absolute URL for QTI zip (Express serves `/uploads` at API origin).
 */
export function quizDownloadUrl(quiz: {
  qtiFileUrl?: string | null;
  qtiFilePath?: string | null;
}): string {
  const base = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
  const path = quiz.qtiFilePath?.replace(/^\//, '');
  if (path) {
    return `${base}/${path}`;
  }
  if (quiz.qtiFileUrl) {
    return quiz.qtiFileUrl;
  }
  return '';
}
