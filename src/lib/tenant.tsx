import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from './db';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from './auth';

export interface TenantDetails {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  updatedAt?: string;
}

interface TenantContextType {
  tenant: TenantDetails | null;
  loading: boolean;
}

const TenantContext = createContext<TenantContextType>({ tenant: null, loading: false });

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const [tenant, setTenant] = useState<TenantDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!profile?.tenantId) {
      setTenant(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = onSnapshot(doc(db, 'tenants', profile.tenantId), (docSnap) => {
      if (docSnap.exists()) {
        setTenant({ id: docSnap.id, ...docSnap.data() } as TenantDetails);
      } else {
        setTenant(null);
      }
      setLoading(false);
    }, (err) => {
      console.error("Failed to fetch tenant:", err);
      setLoading(false);
    });

    return () => unsub();
  }, [profile?.tenantId]);

  return (
    <TenantContext.Provider value={{ tenant, loading }}>
      {children}
    </TenantContext.Provider>
  );
}

export const useTenant = () => useContext(TenantContext);
