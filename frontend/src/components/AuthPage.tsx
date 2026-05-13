import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useUserStore } from '../store/useUserStore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Loader2, Music } from 'lucide-react';
import { Label } from './ui/label';

async function authRequest(endpoint: 'login' | 'register', { username, password }) {
  const res = await fetch(`http://localhost:3000/users/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'An error occurred');
  }
  return res.json();
}

export function AuthPage() {
  const loginUser = useUserStore((state) => state.login);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: ({ endpoint, username, password }: any) => authRequest(endpoint, { username, password }),
    onSuccess: (user) => {
      loginUser(user);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleSubmit = () => {
    setError(null);
    if (!username || !password) {
      setError("Username and password are required.");
      return;
    }
    mutation.mutate({ endpoint: activeTab, username, password });
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-6">
      {/* Fixed width container to prevent any horizontal shifting */}
      <div className="w-[320px] flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <Music className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Antigravity Music</h1>
        </div>

        <Tabs 
          value={activeTab} 
          onValueChange={(val) => setActiveTab(val as 'login' | 'register')} 
          className="w-full"
        >
          {/* Grid ensure each tab is exactly 50% width regardless of label length */}
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <div className="flex flex-col space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Enter username"
                className="h-10 w-full"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="Enter password"
                className="h-10 w-full"
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>

            {/* Error Message - Reserved space to prevent vertical jumps */}
            <div className="h-5 flex items-center justify-center overflow-hidden">
              {error && (
                <p className="text-[11px] text-destructive text-center font-semibold leading-none">
                  {error}
                </p>
              )}
            </div>

            {/* Fixed height button to prevent vertical/horizontal shifting on text change */}
            <Button 
              disabled={mutation.isPending} 
              className="w-full h-11 flex-shrink-0 font-bold" 
              onClick={handleSubmit}
            >
              {mutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                activeTab === 'login' ? 'Sign In' : 'Create Account'
              )}
            </Button>
          </div>
        </Tabs>

        <p className="text-center text-[10px] text-muted-foreground uppercase tracking-widest opacity-50 pt-4">
          &copy; {new Date().getFullYear()} Antigravity Studio
        </p>
      </div>
    </div>
  );
}
