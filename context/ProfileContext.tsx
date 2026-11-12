import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import { profiles, type Profile, type UpdateProfileRequest } from "../services/supabase_api";
import { unwrap, useUserScopedLoad, type LoadState, type Take } from "./contextUtils";

export type ProfileValue = LoadState & {
  profile: Profile | null;
  profilesById: Record<string, Profile>;
  getProfile: (id: string) => Promise<Profile | null>;
  updateProfile: (data: UpdateProfileRequest) => Promise<Profile>;
};

const ProfileContext = createContext<ProfileValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [profilesById, setProfilesById] = useState<Record<string, Profile>>({});
  const profileCache = useRef<Record<string, Profile>>({});
  const inflightProfiles = useRef(new Map<string, Promise<Profile | null>>());

  const fetchAll = useCallback(async () => {
    const p = await profiles.getCurrent();
    return (take: Take) => take(p, setProfile);
  }, []);

  const reset = useCallback(() => {
    profileCache.current = {};
    inflightProfiles.current.clear();
    setProfile(null);
    setProfilesById({});
  }, []);

  const { loading, error, refresh } = useUserScopedLoad(
    user?.id,
    fetchAll,
    reset,
    "Could not load your profile"
  );

  const getProfile = useCallback(async (id: string): Promise<Profile | null> => {
    const cached = profileCache.current[id];
    if (cached) return cached;
    const pending = inflightProfiles.current.get(id);
    if (pending) return pending;

    const request = Promise.resolve(profiles.getById(id)).then((res) => {
      inflightProfiles.current.delete(id);
      // A missing profile can come back as a row of nulls, so check the id too.
      if (res.error || !res.data?.id) return null;
      const found = res.data as Profile;
      profileCache.current[id] = found;
      setProfilesById((prev) => ({ ...prev, [id]: found }));
      return found;
    });
    inflightProfiles.current.set(id, request);
    return request;
  }, []);

  const updateProfile = useCallback(async (data: UpdateProfileRequest) => {
    const updated = unwrap(await profiles.update(data));
    setProfile(updated);
    return updated;
  }, []);

  const value: ProfileValue = {
    profile,
    profilesById,
    loading,
    error,
    refresh,
    getProfile,
    updateProfile,
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used inside <ProfileProvider>");
  return ctx;
}
