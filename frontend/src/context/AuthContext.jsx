import React, {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("load_shop_user");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (payload) => {
    localStorage.setItem("load_shop_token", payload.token);
    localStorage.setItem("load_shop_user", JSON.stringify(payload.user));

    setUser(payload.user);
  };

  const logout = () => {
    localStorage.removeItem("load_shop_token");
    localStorage.removeItem("load_shop_user");

    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}