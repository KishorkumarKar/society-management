export type UserRole = "admin" | "committee" | "resident" | "security";

export interface Society {
  id: string;
  name: string;
  slug: string;
  city: string;
  address: string;
  established: number;
  totalUnits: number;
  occupiedUnits: number;
  initial: string;
  registrationNo: string;
}

export interface SocietyUser {
  id: string;
  societyId: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  unit: string;
  initial: string;
}

export interface Notice {
  id: string;
  societyId: string;
  title: string;
  category: string;
  date: string;
  body: string;
}

export interface Plan {
  id: string;
  name: string;
  tagline: string;
  price: number | null;
  billing: string;
  unitCap: string;
  features: string[];
  highlighted: boolean;
}

export interface AuthenticatedUser extends SocietyUser {
  societyName: string;
}
