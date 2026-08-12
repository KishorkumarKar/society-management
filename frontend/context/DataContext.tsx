"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  societies as initialSocieties,
  users as initialUsers,
  notices as initialNotices,
  events as initialEvents,
  collections as initialCollections,
  expenses as initialExpenses,
  aclMatrix as initialAclMatrix,
  generateId,
} from "@/lib/data";
import type {
  Society,
  SocietyUser,
  Notice,
  SocietyEvent,
  EventCollection,
  EventExpense,
  AclRoleEntry,
  AclModule,
  AclAction,
  UserRole,
} from "@/lib/types";

interface DataContextValue {
  societies: Society[];
  users: SocietyUser[];
  notices: Notice[];
  events: SocietyEvent[];
  collections: EventCollection[];
  expenses: EventExpense[];

  addSociety: (input: Omit<Society, "id">) => Society;
  updateSociety: (id: string, input: Omit<Society, "id">) => void;
  deleteSociety: (id: string) => void;

  addUser: (input: Omit<SocietyUser, "id">) => SocietyUser;
  updateUser: (id: string, input: Omit<SocietyUser, "id">) => void;
  deleteUser: (id: string) => void;

  addNotice: (input: Omit<Notice, "id">) => Notice;
  updateNotice: (id: string, input: Omit<Notice, "id">) => void;
  deleteNotice: (id: string) => void;

  addEvent: (input: Omit<SocietyEvent, "id">) => SocietyEvent;
  updateEvent: (id: string, input: Omit<SocietyEvent, "id">) => void;
  deleteEvent: (id: string) => void;

  addCollection: (input: Omit<EventCollection, "id">) => EventCollection;
  updateCollection: (id: string, input: Omit<EventCollection, "id">) => void;
  deleteCollection: (id: string) => void;

  addExpense: (input: Omit<EventExpense, "id">) => EventExpense;
  updateExpense: (id: string, input: Omit<EventExpense, "id">) => void;
  deleteExpense: (id: string) => void;

  aclMatrix: AclRoleEntry[];
  toggleAclPermission: (role: UserRole, module: AclModule, action: AclAction) => void;
  resetAcl: () => void;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

/**
 * Holds the "database" for the whole app in memory, seeded from the static
 * JSON files. There is no backend, so admin edits (add/edit/delete) live
 * only for the current browser session and reset on a full page reload.
 */
export function DataProvider({ children }: { children: ReactNode }) {
  const [societies, setSocieties] = useState<Society[]>(initialSocieties);
  const [users, setUsers] = useState<SocietyUser[]>(initialUsers);
  const [notices, setNotices] = useState<Notice[]>(initialNotices);
  const [events, setEvents] = useState<SocietyEvent[]>(initialEvents);
  const [collections, setCollections] = useState<EventCollection[]>(initialCollections);
  const [expenses, setExpenses] = useState<EventExpense[]>(initialExpenses);
  const [aclMatrix, setAclMatrix] = useState<AclRoleEntry[]>(initialAclMatrix);

  const addSociety = useCallback((input: Omit<Society, "id">) => {
    const created: Society = { ...input, id: generateId("soc") };
    setSocieties((prev) => [...prev, created]);
    return created;
  }, []);

  const updateSociety = useCallback((id: string, input: Omit<Society, "id">) => {
    setSocieties((prev) => prev.map((s) => (s.id === id ? { ...input, id } : s)));
  }, []);

  const deleteSociety = useCallback((id: string) => {
    setSocieties((prev) => prev.filter((s) => s.id !== id));
    setUsers((prev) => prev.filter((u) => u.societyId !== id));
    setNotices((prev) => prev.filter((n) => n.societyId !== id));
    setEvents((prev) => prev.filter((e) => e.societyId !== id));
    setCollections((prev) => prev.filter((c) => c.societyId !== id));
    setExpenses((prev) => prev.filter((e) => e.societyId !== id));
  }, []);

  const addUser = useCallback((input: Omit<SocietyUser, "id">) => {
    const created: SocietyUser = { ...input, id: generateId("usr") };
    setUsers((prev) => [...prev, created]);
    return created;
  }, []);

  const updateUser = useCallback((id: string, input: Omit<SocietyUser, "id">) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...input, id } : u)));
  }, []);

  const deleteUser = useCallback((id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }, []);

  const addNotice = useCallback((input: Omit<Notice, "id">) => {
    const created: Notice = { ...input, id: generateId("nb") };
    setNotices((prev) => [...prev, created]);
    return created;
  }, []);

  const updateNotice = useCallback((id: string, input: Omit<Notice, "id">) => {
    setNotices((prev) => prev.map((n) => (n.id === id ? { ...input, id } : n)));
  }, []);

  const deleteNotice = useCallback((id: string) => {
    setNotices((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addEvent = useCallback((input: Omit<SocietyEvent, "id">) => {
    const created: SocietyEvent = { ...input, id: generateId("evt") };
    setEvents((prev) => [...prev, created]);
    return created;
  }, []);

  const updateEvent = useCallback((id: string, input: Omit<SocietyEvent, "id">) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...input, id } : e)));
  }, []);

  const deleteEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setCollections((prev) => prev.filter((c) => c.eventId !== id));
    setExpenses((prev) => prev.filter((e) => e.eventId !== id));
  }, []);

  const addCollection = useCallback((input: Omit<EventCollection, "id">) => {
    const created: EventCollection = { ...input, id: generateId("col") };
    setCollections((prev) => [...prev, created]);
    return created;
  }, []);

  const updateCollection = useCallback((id: string, input: Omit<EventCollection, "id">) => {
    setCollections((prev) => prev.map((c) => (c.id === id ? { ...input, id } : c)));
  }, []);

  const deleteCollection = useCallback((id: string) => {
    setCollections((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const addExpense = useCallback((input: Omit<EventExpense, "id">) => {
    const created: EventExpense = { ...input, id: generateId("exp") };
    setExpenses((prev) => [...prev, created]);
    return created;
  }, []);

  const updateExpense = useCallback((id: string, input: Omit<EventExpense, "id">) => {
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...input, id } : e)));
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const toggleAclPermission = useCallback(
    (role: UserRole, moduleName: AclModule, action: AclAction) => {
      setAclMatrix((prev) =>
        prev.map((entry) => {
          if (entry.role !== role) return entry;
          const current = entry.permissions[moduleName] ?? [];
          const has = current.includes(action);
          const nextActions = has ? current.filter((a) => a !== action) : [...current, action];
          return {
            ...entry,
            permissions: { ...entry.permissions, [moduleName]: nextActions },
          };
        })
      );
    },
    []
  );

  const resetAcl = useCallback(() => {
    setAclMatrix(initialAclMatrix);
  }, []);

  const value = useMemo(
    () => ({
      societies,
      users,
      notices,
      events,
      collections,
      expenses,
      addSociety,
      updateSociety,
      deleteSociety,
      addUser,
      updateUser,
      deleteUser,
      addNotice,
      updateNotice,
      deleteNotice,
      addEvent,
      updateEvent,
      deleteEvent,
      addCollection,
      updateCollection,
      deleteCollection,
      addExpense,
      updateExpense,
      deleteExpense,
      aclMatrix,
      toggleAclPermission,
      resetAcl,
    }),
    [
      societies,
      users,
      notices,
      events,
      collections,
      expenses,
      addSociety,
      updateSociety,
      deleteSociety,
      addUser,
      updateUser,
      deleteUser,
      addNotice,
      updateNotice,
      deleteNotice,
      addEvent,
      updateEvent,
      deleteEvent,
      addCollection,
      updateCollection,
      deleteCollection,
      addExpense,
      updateExpense,
      deleteExpense,
      aclMatrix,
      toggleAclPermission,
      resetAcl,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error("useData must be used within a DataProvider");
  }
  return ctx;
}
