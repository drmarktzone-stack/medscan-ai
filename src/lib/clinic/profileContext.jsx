import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { loadClinicProfile, saveClinicProfile } from "./profile.js";
import { loadAccount, saveAccount } from "./account.js";

const ClinicProfileContext = createContext(null);

export function ClinicProfileProvider({ children }) {
  const [account, setAccount] = useState(() => loadAccount());
  const [profile, setProfile] = useState(() => loadClinicProfile());

  const update = useCallback((patch) => {
    const next = saveClinicProfile({ ...loadClinicProfile(), ...patch });
    setProfile(next);
    setAccount(loadAccount());
    return next;
  }, []);

  const updateAccount = useCallback((patch) => {
    const next = saveAccount({ ...loadAccount(), ...patch });
    setAccount(next);
    setProfile(loadClinicProfile());
    return next;
  }, []);

  const value = useMemo(
    () => ({ profile, update, account, updateAccount }),
    [profile, update, account, updateAccount],
  );
  return <ClinicProfileContext.Provider value={value}>{children}</ClinicProfileContext.Provider>;
}

export function useClinicProfile() {
  return useContext(ClinicProfileContext) || {
    profile: { clinicName: "", physicianName: "" },
    update: () => {},
    account: { role: "" },
    updateAccount: () => {},
  };
}
