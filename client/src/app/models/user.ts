export type User = {
  email: string;
  roles: string[];
  token: string | null;
};

export type Address = {
  name: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
};
