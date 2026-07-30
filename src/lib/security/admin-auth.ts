import type { DecodedIdToken } from 'firebase-admin/auth';

const ADMIN_ROLE_VALUES = new Set(['admin', 'super_admin', 'owner']);

type DecodedAdminToken = Partial<DecodedIdToken> & {
  role?: string;
  roles?: string[];
};

export function hasAdminRole(decodedToken: DecodedAdminToken | null | undefined): boolean {
  if (!decodedToken || typeof decodedToken !== 'object') {
    return false;
  }

  if (decodedToken.isAdmin === true) {
    return true;
  }

  const declaredRoles = [
    typeof decodedToken.role === 'string' ? decodedToken.role : undefined,
    ...(Array.isArray(decodedToken.roles) ? decodedToken.roles : []),
  ].filter((role): role is string => typeof role === 'string' && role.trim().length > 0);

  return declaredRoles.some((role) => ADMIN_ROLE_VALUES.has(role.toLowerCase()));
}

export async function isAdminUser(decodedToken: DecodedAdminToken | null | undefined): Promise<boolean> {
  if (hasAdminRole(decodedToken)) {
    return true;
  }

  const uid = decodedToken?.uid;
  if (!uid) {
    return false;
  }

  try {
    const { db } = await import('../firebase-admin');
    const userDoc = await db.collection('users').doc(uid).get();
    const roles = userDoc.get('roles') ?? [];
    const normalizedRoles = (Array.isArray(roles) ? roles : [roles]).map((role) => String(role).toLowerCase());

    return normalizedRoles.some((role) => ADMIN_ROLE_VALUES.has(role));
  } catch (error) {
    console.error('Unable to resolve admin role from Firestore:', error);
    return false;
  }
}
