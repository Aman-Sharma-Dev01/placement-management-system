const getFileNameFromUrl = (url: string): string => {
  try {
    const parsedUrl = new URL(url);
    const fileName = parsedUrl.pathname.split('/').pop();
    return fileName || 'document';
  } catch {
    const fallback = url.split('/').pop();
    return fallback || 'document';
  }
};

export const openRemoteFile = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Unable to open file');
  }

  const blob = await response.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const newWindow = window.open(objectUrl, '_blank', 'noopener,noreferrer');

  window.setTimeout(() => {
    window.URL.revokeObjectURL(objectUrl);
  }, 60_000);

  if (!newWindow) {
    const fallbackLink = document.createElement('a');
    fallbackLink.href = objectUrl;
    fallbackLink.target = '_blank';
    fallbackLink.rel = 'noreferrer';
    fallbackLink.click();
  }
};

export const downloadRemoteFile = async (url: string, fileName?: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Unable to download file');
  }

  const blob = await response.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName || getFileNameFromUrl(url);
  link.click();

  window.setTimeout(() => {
    window.URL.revokeObjectURL(objectUrl);
  }, 60_000);
};