"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface Member {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  color: string;
  role: string;
}

interface HouseholdContextValue {
  memberId: string;
  householdId: string;
  role: string;
  members: Member[] | null;
}

const HouseholdContext = createContext<HouseholdContextValue | null>(null);

export function HouseholdProvider({
  memberId,
  householdId,
  role,
  children,
}: {
  memberId: string;
  householdId: string;
  role: string;
  children: React.ReactNode;
}) {
  const [members, setMembers] = useState<Member[] | null>(null);

  useEffect(() => {
    fetch("/api/household")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.members) {
          setMembers(data.members);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <HouseholdContext.Provider
      value={{ memberId, householdId, role, members }}
    >
      {children}
    </HouseholdContext.Provider>
  );
}

export function useHouseholdContext() {
  const ctx = useContext(HouseholdContext);
  if (!ctx) {
    throw new Error(
      "useHouseholdContext must be used within a HouseholdProvider"
    );
  }
  return ctx;
}
