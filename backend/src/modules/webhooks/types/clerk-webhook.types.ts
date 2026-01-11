export interface ClerkEmailAddress {
  id: string;
  email_address: string;
  verification?: {
    status: string;
    strategy?: string;
  };
}

export interface ClerkUserData {
  id: string;
  first_name?: string;
  last_name?: string;
  email_addresses?: ClerkEmailAddress[];
  image_url?: string;
  username?: string;
  created_at?: number;
  updated_at?: number;
}

export interface ClerkWebhookEvent {
  type: string;
  data: ClerkUserData;
  object: string;
}
