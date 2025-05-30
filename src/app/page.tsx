'use client';

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from 'next/navigation'; // For redirection after login
import { useState, type FormEvent } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Placeholder login handler
  const handleLogin = (event: FormEvent) => {
    event.preventDefault();
    // In a real app, you'd validate credentials here
    // For now, simulate successful login and redirect to a generic dashboard or role-based one
    // For example, redirect to admin dashboard
    console.log("Login attempt with:", { email, password });
    // router.push('/admin'); 
    // For now, we'll just log it, actual routing will be part of role-based access feature
    alert("Login functionality to be implemented. Redirecting to placeholder admin page for now.");
    router.push('/admin'); // TEMPORARY: Redirect to admin page
  };

  return (
    <div className="layout-content-container flex flex-col w-full max-w-[512px] py-5">
      <h2 className="text-foreground tracking-light text-[28px] font-bold leading-tight px-4 text-center pb-3 pt-5 font-headline">
        Welcome back
      </h2>
      <form onSubmit={handleLogin} className="w-full">
        <div className="flex flex-col items-center gap-4 px-4 py-3 w-full max-w-[480px] mx-auto">
          <div className="w-full">
            <Input
              type="email"
              placeholder="Email"
              className="h-14 p-[15px] text-base rounded-xl border-input bg-card placeholder:text-muted-foreground"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="w-full">
            <Input
              type="password"
              placeholder="Password"
              className="h-14 p-[15px] text-base rounded-xl border-input bg-card placeholder:text-muted-foreground"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>
        <p className="text-muted-foreground text-sm font-normal leading-normal pb-3 pt-1 px-4 text-center">
          <Link href="#" className="underline hover:text-accent">
            Forgot password?
          </Link>
        </p>
        <div className="flex px-4 py-3 max-w-[480px] w-full mx-auto">
          <Button
            type="submit"
            className="flex-1 h-10 px-4 text-sm font-bold leading-normal tracking-[0.015em] rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Log in
          </Button>
        </div>
      </form>
    </div>
  );
}
