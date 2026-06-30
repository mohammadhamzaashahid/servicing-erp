"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Boxes, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { saveAuth } from "@/lib/auth";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
// admin@microerp.com
// Admin@12345
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const result = await api.post("/auth/login", form);

      saveAuth({
        token: result.token,
        user: result.user,
      });

      router.replace("/dashboard");
    } catch (err) {
      setError(err.message || "Unable to login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen bg-slate-50 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-950">
            <Boxes size={22} />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Saroya Chemicals</h1>
            <p className="text-sm text-slate-400">Business Operations Portal</p>
          </div>
        </div>

        <div className="max-w-xl">
          <p className="mb-5 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
            Inventory • Manufacturing • Sales • Ledger
          </p>

          <h2 className="text-4xl font-semibold tracking-tight">
            Your complete production and sales flow panel.
          </h2>

          {/* <p className="mt-5 text-base leading-7 text-slate-300">
            Register vendors, receive raw material, manufacture finished goods,
            sell products, print invoices, and track business balances.
          </p> */}
        </div>

        {/* <p className="text-xs text-slate-500">
          Built for small industrial and warehouse operations.
        </p> */}
      </section>

      <section className="flex items-center justify-center p-5">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-8 lg:hidden">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <Boxes size={22} />
            </div>
            <h1 className="text-xl font-semibold text-slate-950">
              Saroya Chemicals
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Business Operations Portal
            </p>
          </div>

          <div className="mb-7">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Login to continue managing your ERP operations.
            </p>
          </div>

          {error ? (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              placeholder="ex@for.com"
              required
            />

            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
              placeholder="••••••••"
              required
            />

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? <Loader2 size={17} className="animate-spin" /> : null}
              {loading ? "Signing in..." : "Login"}
            </Button>
          </form>

          
        </div>
      </section>
    </main>
  );
}