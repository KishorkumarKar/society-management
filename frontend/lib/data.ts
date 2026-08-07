import societiesData from "@/data/societies.json";
import usersData from "@/data/users.json";
import plansData from "@/data/plans.json";
import noticesData from "@/data/notices.json";
import type { Society, SocietyUser, Plan, Notice, UserRole } from "@/lib/types";

export const societies = societiesData as Society[];
export const users = usersData as SocietyUser[];
export const plans = plansData as Plan[];
export const notices = noticesData as Notice[];

export function getSocietyBySlug(slug: string): Society | undefined {
  return societies.find((s) => s.slug === slug);
}

export function getSocietyById(id: string): Society | undefined {
  return societies.find((s) => s.id === id);
}

export function findUser(
  societyId: string,
  identifier: string,
  password: string
): SocietyUser | undefined {
  const normalized = identifier.trim().toLowerCase();
  return users.find(
    (u) =>
      u.societyId === societyId &&
      u.password === password &&
      (u.email.toLowerCase() === normalized || u.phone === identifier.trim())
  );
}

export function getUsersBySociety(societyId: string): SocietyUser[] {
  return users.filter((u) => u.societyId === societyId);
}

export function getNoticesBySociety(societyId: string): Notice[] {
  return notices
    .filter((n) => n.societyId === societyId)
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

export function roleLabel(role: UserRole): string {
  switch (role) {
    case "admin":
      return "Society Admin";
    case "committee":
      return "Committee Member";
    case "resident":
      return "Resident";
    case "security":
      return "Security Desk";
  }
}
