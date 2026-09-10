export type FeatureFlags = {
  googleCalendarSync: boolean;
};

export function getFeatureFlags(source: NodeJS.ProcessEnv = process.env): FeatureFlags {
  return {
    googleCalendarSync: source.FEATURE_GOOGLE_CALENDAR_SYNC === 'true',
  };
}
