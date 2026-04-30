// src/hooks/useAuthExtended.ts
import { useAuth } from '#/context/AuthContext';

export const useAuthExtended = () => {
  const auth = useAuth();
  
  // Add any additional methods or override existing ones
  const loginWithGoogle = async (): Promise<boolean> => {
    // Implementation here
    return true;
  };

  const loginWithPhone = async (phoneNumber: string): Promise<boolean> => {
    // Implementation here
    return true;
  };

  return {
    ...auth,
    loginWithGoogle,
    loginWithPhone
  };
};