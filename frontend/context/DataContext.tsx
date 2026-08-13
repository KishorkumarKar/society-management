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
  guards as initialGuards,
  shifts as initialShifts,
  visitors as initialVisitors,
  generateId,
  todayISODate,
  nowHHMM,
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
  SecurityGuard,
  SecurityShift,
  Visitor,
} from "@/lib/types";

interface DataContextValue {
  societies: Society[];
  users: SocietyUser[];
  notices: Notice[];
  events: SocietyEvent[];
  collections: EventCollection[];
  expenses: EventExpense[];
  guards: SecurityGuard[];
  shifts: SecurityShift[];
  visitors: Visitor[];

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

  addGuard: (input: Omit<SecurityGuard, "id">) => SecurityGuard;
  updateGuard: (id: string, input: Omit<SecurityGuard, "id">) => void;
  deleteGuard: (id: string) => void;

  addShift: (input: Omit<SecurityShift, "id">) => SecurityShift;
  updateShift: (id: string, input: Omit<SecurityShift, "id">) => void;
  deleteShift: (id: string) => void;

  addVisitor: (input: Omit<Visitor, "id">) => Visitor;
  updateVisitor: (id: string, input: Omit<Visitor, "id">) => void;
  deleteVisitor: (id: string) => void;
  markVisitorOut: (id: string) => void;

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
  const [guards, setGuards] = useState<SecurityGuard[]>(initialGuards);
  const [shifts, setShifts] = useState<SecurityShift[]>(initialShifts);
  const [visitors, setVisitors] = useState<Visitor[]>(initialVisitors);
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
    setGuards((prev) => prev.filter((g) => g.societyId !== id));
    setShifts((prev) => prev.filter((s) => s.societyId !== id));
    setVisitors((prev) => prev.filter((v) => v.societyId !== id));
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

  const addGuard = useCallback((input: Omit<SecurityGuard, "id">) => {
    const created: SecurityGuard = { ...input, id: generateId("grd") };
    setGuards((prev) => [...prev, created]);
    return created;
  }, []);

  const updateGuard = useCallback((id: string, input: Omit<SecurityGuard, "id">) => {
    setGuards((prev) => prev.map((g) => (g.id === id ? { ...input, id } : g)));
  }, []);

  const deleteGuard = useCallback((id: string) => {
    setGuards((prev) => prev.filter((g) => g.id !== id));
    // A guard with no roster entry can't be scheduled, so their shifts go too.
    setShifts((prev) => prev.filter((s) => s.guardId !== id));
  }, []);

  const addShift = useCallback((input: Omit<SecurityShift, "id">) => {
    const created: SecurityShift = { ...input, id: generateId("sft") };
    setShifts((prev) => [...prev, created]);
    return created;
  }, []);

  const updateShift = useCallback((id: string, input: Omit<SecurityShift, "id">) => {
    setShifts((prev) => prev.map((s) => (s.id === id ? { ...input, id } : s)));
  }, []);

  const deleteShift = useCallback((id: string) => {
    setShifts((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const addVisitor = useCallback((input: Omit<Visitor, "id">) => {
    const created: Visitor = { ...input, id: generateId("vis") };
    setVisitors((prev) => [...prev, created]);
    return created;
  }, []);

  const updateVisitor = useCallback((id: string, input: Omit<Visitor, "id">) => {
    setVisitors((prev) => prev.map((v) => (v.id === id ? { ...input, id } : v)));
  }, []);

  const deleteVisitor = useCallback((id: string) => {
    setVisitors((prev) => prev.filter((v) => v.id !== id));
  }, []);

  const markVisitorOut = useCallback((id: string) => {
    setVisitors((prev) =>
      prev.map((v) => {
        // Already OUT — leave untouched rather than overwrite the recorded
        // out time (also guards against a stale double-click).
        if (v.id !== id || v.status === "out") return v;
        return { ...v, status: "out", outDate: todayISODate(), outTime: nowHHMM() };
      })
    );
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
      guards,
      shifts,
      visitors,
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
      addGuard,
      updateGuard,
      deleteGuard,
      addShift,
      updateShift,
      deleteShift,
      addVisitor,
      updateVisitor,
      deleteVisitor,
      markVisitorOut,
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
      guards,
      shifts,
      visitors,
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
      addGuard,
      updateGuard,
      deleteGuard,
      addShift,
      updateShift,
      deleteShift,
      addVisitor,
      updateVisitor,
      deleteVisitor,
      markVisitorOut,
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
