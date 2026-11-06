export interface UserProfile {
  id: number | string;
  name: string;
  profileImage: string | null;
}

export const DEFAULT_USER: UserProfile = {
  id: 1,
  name: 'Martín Varela',
  profileImage: null,
};
