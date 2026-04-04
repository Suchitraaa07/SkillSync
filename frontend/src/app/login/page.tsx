"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { authStore } from "@/lib/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const { data } = await api.post("/api/auth/login", { email, password });
      authStore.setSession(data.token, data.user);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-slate-100 p-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold text-slate-900">Login</h1>
        <p className="mt-1 text-sm text-slate-500">Continue your readiness journey</p>

        <input className="mt-5 w-full rounded-lg border p-3" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="mt-3 w-full rounded-lg border p-3" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

        <button className="mt-5 w-full rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white">Login</button>
        <p className="mt-3 text-sm text-slate-600">No account? <Link className="font-semibold" href="/signup">Sign up</Link></p>
      </form>
    </div>
  );
}
