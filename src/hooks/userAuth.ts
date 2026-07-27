import { isLoggedIn, getToken } from '@/services/authServices';

const useAuth = () => ({
  isAuthenticated: isLoggedIn(),
  token: getToken(),
});

export default useAuth;
