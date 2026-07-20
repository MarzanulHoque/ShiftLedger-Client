const ROLE_CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role';

export interface DecodedAccessToken {
  id: string;
  email: string;
  role: 'Admin' | 'Employee';
}

export function decodeAccessToken(token: string): DecodedAccessToken | null {
  try {
    const payload = token.split('.')[1];
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return {
      id: json.sub as string,
      email: json.email as string,
      role: json[ROLE_CLAIM] as 'Admin' | 'Employee',
    };
  } catch {
    return null;
  }
}
