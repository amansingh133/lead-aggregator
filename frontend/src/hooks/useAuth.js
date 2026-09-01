import { useAppSelector } from '../app/hooks';
import { ROLE, PRIVILEGED_ROLES } from '../constants/roles';

export function useAuth() {
  const { token, user, status } = useAppSelector((state) => state.auth);
  const role = user?.role;
  return {
    token,
    user,
    isAuthenticated: Boolean(token && user),
    // "Privileged" = org-wide access. Kept named `isAdmin` so the ~10
    // existing call sites that gate admin-level UI also cover Super Admins.
    isAdmin: PRIVILEGED_ROLES.includes(role),
    isSuperAdmin: role === ROLE.SUPER_ADMIN,
    isPrimarySuperAdmin: role === ROLE.SUPER_ADMIN && Boolean(user?.isPrimary),
    status,
  };
}
