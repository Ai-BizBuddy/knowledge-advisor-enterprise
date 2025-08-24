"use client";

import { useLoading } from "@/contexts/LoadingContext";
import { useAuth } from "@/hooks";
import { Label, TextInput, Button, Checkbox } from "flowbite-react";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const { login, getSession, error } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const { setLoading } = useLoading();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await getSession();
        if (session) {
          window.location.href = "/dashboard";
        }
        setLoading(false);
      } catch (err) {
        console.error("Error checking session:", err);
      }
    };
    checkSession();
  }, [getSession, setLoading]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await login(form.email, form.password);
    } catch (err) {
      setLoading(false);
      console.error("Login failed:", err);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 dark:bg-gray-900">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800">
        {/* Logo or Title */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Knowledge Advisor
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Sign in to access your dashboard
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-100 px-3 py-2 text-center text-sm text-red-600 dark:bg-red-900 dark:text-red-300">
            {typeof error === "string"
              ? error
              : "Login failed. Please try again."}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="email">Email</Label>
            <TextInput
              id="email"
              type="email"
              placeholder="name@example.com"
              required
              name="email"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <TextInput
              id="password"
              type="password"
              placeholder="••••••••"
              required
              name="password"
              value={form.password}
              onChange={handleChange}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox id="remember" />
              <Label htmlFor="remember">Remember me</Label>
            </div>
            <a
              href="#"
              className="text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              Forgot password?
            </a>
          </div>

          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
