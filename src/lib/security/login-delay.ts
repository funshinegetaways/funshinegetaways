
const delays = [0, 2000, 5000]; // Delays in milliseconds

export const getLoginDelay = (failedAttempts: number): number => {
  if (failedAttempts < 0) {
    return 0;
  }
  return delays[failedAttempts] || 0;
};

export const applyLoginDelay = async (failedAttempts: number) => {
  const delay = getLoginDelay(failedAttempts);
  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
};
