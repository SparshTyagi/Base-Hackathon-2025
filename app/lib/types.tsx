/** Member in a Piggybank */
export type Member = {
  id: string;
  name: string;
  address?: string; // future: Base address / Farcaster fid link
  avatarHue?: number; // for generated avatar
  breaks: number; // number of broken rules
};

/** Rule types */
export type RuleType = "WORD_BAN" | "POST_QUOTA" | "CUSTOM";

/** Rule */
export type Rule = {
  id: string;
  label: string; // human-readable title
  type: RuleType;
  config: {
    bannedWords?: string[];
    minPostsPerWeek?: number;
    description?: string; // for CUSTOM
  };
  penaltyEth: number; // how much to add to the pot when broken
};

/** Infraction */
export type Infraction = {
  id: string;
  memberId: string;
  ruleId: string;
  notes?: string;
  timestamp: number;
  penaltyEth: number;
};

/** Piggybank */
export type Piggybank = {
  id: string;
  name: string;
  theme?: string; // e.g., "No Cursing November"
  createdAt: number;
  periodEndsAt?: number; // future: settlement schedule
  potEth: number;
  entryStakeEth: number;
  rules: Rule[];
  members: Member[];
  infractions: Infraction[];
  image?: string; // optional cover image URL
};
