export function isMobileDevice() {
  const userAgent = navigator.userAgent;
  const mobileKeywords = /Mobile|Android|iPhone|iPad|iPod|Windows Phone/i;
  return mobileKeywords.test(userAgent);
}

type FunctionType = (this: any, ...args: any[]) => void;
export const debounce = (func: FunctionType, delay: number): FunctionType => {
  let timeout: NodeJS.Timeout | undefined;

  return function(this: any, ...args: any[]) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
};