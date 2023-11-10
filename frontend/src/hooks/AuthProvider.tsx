import { createContext, useContext, useState, ReactNode } from 'react';
import storage from '../utils/storage';

// Создайте контекст для хранения состояния авторизации
interface AuthContextProps {
  isAuthorized: boolean;
  setIsAuthorized: React.Dispatch<React.SetStateAction<boolean>>;
}

const AuthContext = createContext<AuthContextProps | null>(null);

// Создайте провайдер контекста, который будет обертывать ваше приложение
export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState<boolean>(!!storage.getToken());
  const value = { isAuthorized, setIsAuthorized };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Создайте пользовательский хук для доступа к контексту авторизации
export function useAuth() {
  return useContext(AuthContext);
}