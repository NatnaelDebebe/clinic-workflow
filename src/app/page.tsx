
'use client';

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useState, type FormEvent, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { initialUsers, type User } from '@/lib/data/users';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in (basic check)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loggedInUser = localStorage.getItem('loggedInUser');
      if (loggedInUser) {
        router.push('/admin');
      }
    }
  }, [router]);


  const handleLogin = (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    const user = initialUsers.find(u => u.username === email && u.status === 'Active');

    if (user && user.password === password) { // Insecure: direct password comparison
      if (typeof window !== 'undefined') {
        localStorage.setItem('loggedInUser', JSON.stringify({
          fullName: user.fullName,
          username: user.username,
          role: user.role,
        }));
      }
      toast({
        title: "Login Successful",
        description: `Welcome back, ${user.fullName}!`,
      });
      router.push('/admin');
    } else {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Invalid email or password, or user is inactive.",
      });
      setIsLoading(false);
    }
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
              disabled={isLoading}
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
              disabled={isLoading}
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
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Log in'}
          </Button>
        </div>
      </form>
    </div>
  );
}
