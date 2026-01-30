import { createContext, useContext, useState, ReactNode, useCallback } from "react";

interface AdminSearchContextType {
  globalSearch: string;
  setGlobalSearch: (search: string) => void;
  clearSearch: () => void;
}

const AdminSearchContext = createContext<AdminSearchContextType | null>(null);

export function AdminSearchProvider({ children }: { children: ReactNode }) {
  const [globalSearch, setGlobalSearch] = useState("");

  const clearSearch = useCallback(() => {
    setGlobalSearch("");
  }, []);

  return (
    <AdminSearchContext.Provider
      value={{
        globalSearch,
        setGlobalSearch,
        clearSearch,
      }}
    >
      {children}
    </AdminSearchContext.Provider>
  );
}

export function useAdminSearch() {
  const context = useContext(AdminSearchContext);
  if (!context) {
    throw new Error("useAdminSearch must be used within an AdminSearchProvider");
  }
  return context;
}
