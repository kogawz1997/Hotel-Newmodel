export type PlatformSubRole =
  | 'platform_owner'
  | 'platform_support'
  | 'platform_finance'
  | 'platform_engineer';

export type PlatformContext = {
  web: 'platform';
  userId: string;
  email: string;
  isPlatformAdmin: true;
  platformRole: PlatformSubRole;
};
