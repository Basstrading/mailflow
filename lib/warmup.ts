export interface WarmupConfigData {
  enabled: boolean;
  startDate: Date;
  dailyLimit: number;
  targetVolume: number;
  duplicationDays: number;
  maxWarmupDays: number;
  totalSent: number;
}

export function calculateCurrentDailyLimit(
  config: WarmupConfigData,
  currentDate: Date = new Date()
): number {
  if (!config.enabled) return config.targetVolume;

  const daysElapsed = Math.floor(
    (currentDate.getTime() - config.startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysElapsed >= config.maxWarmupDays) return config.targetVolume;

  const doubleCount = Math.floor(daysElapsed / config.duplicationDays);
  const calculatedLimit = config.dailyLimit * Math.pow(2, doubleCount);

  return Math.min(calculatedLimit, config.targetVolume);
}

export function getRemainingQuotaToday(
  config: WarmupConfigData,
  sentTodayCount: number,
  currentDate: Date = new Date()
): number {
  const dailyLimit = calculateCurrentDailyLimit(config, currentDate);
  return Math.max(0, dailyLimit - sentTodayCount);
}

export function getWarmupProgress(
  config: WarmupConfigData,
  sentTodayCount: number = 0,
  currentDate: Date = new Date()
) {
  const dailyLimit = calculateCurrentDailyLimit(config, currentDate);
  const daysElapsed = Math.floor(
    (currentDate.getTime() - config.startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const isComplete = dailyLimit >= config.targetVolume;
  const progressPercent = Math.min(100, (dailyLimit / config.targetVolume) * 100);

  return {
    dailyLimit,
    remainingToday: getRemainingQuotaToday(config, sentTodayCount, currentDate),
    daysElapsed,
    daysRemaining: Math.max(0, config.maxWarmupDays - daysElapsed),
    progressPercent,
    isComplete,
    totalSent: config.totalSent,
    targetVolume: config.targetVolume,
    sentToday: sentTodayCount,
  };
}
