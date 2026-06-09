import type { UserType } from "@/features/auth/auth.schema";


const LANDING_BY_ROLE: Record<UserType, string> = {
    STUDENT: '/student',
    PROFESSOR: '/professor',
    ADMIN: '/admin'
};

export function landingPathFor(type: UserType): string {
    return LANDING_BY_ROLE[type];
}