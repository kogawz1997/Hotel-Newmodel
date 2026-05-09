export type RegionPlan = {
  primary: string;
  replicas: string[];
  failoverRpoMinutes: number;
  failoverRtoMinutes: number;
};

export const productionRegionPlan: RegionPlan = {
  primary: 'ap-southeast-1',
  replicas: ['ap-southeast-2'],
  failoverRpoMinutes: 15,
  failoverRtoMinutes: 60,
};

export function getScalingReadiness() {
  return {
    statelessApp: true,
    externalSessionStore: Boolean(process.env.UPSTASH_REDIS_REST_URL),
    databaseReadReplicas: 'configure_in_supabase_or_postgres_provider',
    objectStorageCdn: true,
    regionPlan: productionRegionPlan,
  };
}
