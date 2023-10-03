export function isMobileDevice() {
  const userAgent = navigator.userAgent;
  const mobileKeywords = /Mobile|Android|iPhone|iPad|iPod|Windows Phone/i;
  return mobileKeywords.test(userAgent);
}
