export type osuCredentialsGrantResponse = {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  token_type: 'Bearer';
};

export type discordUserResponse = {
  id: string;
  username: string;
  avatar: string;
  discriminator: string;
  email?: string;
  verified?: boolean;
  public_flags: number;
  flags: number;
  banner: string | null;
  banner_color: string | null;
  accent_color: string | null;
  locale: string;
  mfa_enabled: boolean;
};

export type osuAccountData = {
    access_token: string;
    refresh_token: string;
    token_type: 'Bearer';
  };