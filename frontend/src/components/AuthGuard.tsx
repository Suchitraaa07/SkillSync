"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { authStore } from "@/lib/auth";

export function AuthGuard({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = authStore.getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) return <div className="p-8 text-slate-600">Loading...</div>;
  return <>{children}</>;
}
