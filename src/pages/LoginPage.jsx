// app/login/page.tsx or wherever your component lives

"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox"; // 👈 Add this at the top

export default function LoginPage() {
  return (
    <section>
      <div className="flex w-full max-w-5xl bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Left image */}
        <div className="hidden md:block w-1/2">
          <Image
            src="/login-img.png"
            alt="login image"
            width={600}
            height={600}
            className="h-full w-full object-cover"
          />
        </div>

        {/* Right form */}
        <div className="w-full md:w-1/2 p-10">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">leadG</h1>
          <h2 className="text-xl font-semibold mb-6">Welcome Back!</h2>

          <form className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                type="email"
                id="email"
                placeholder="linda@framcreative.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                type="password"
                id="password"
                placeholder="Your password"
              />
            </div>

            <Button type="submit" className="w-full">
              Login
            </Button>

            <div className="flex items-center justify-between text-sm">
              <label htmlFor="remember" className="text-sm leading-none">
                <Checkbox id="remember" />
                Remember me
              </label>
              <a
                href="#"
                className="text-blue-500 hover:underline transition-colors"
              >
                Forgot password?
              </a>
            </div>

            <p className="text-center text-sm">
              Don't have an account?{" "}
              <a href="#" className="text-blue-600 font-medium hover:underline">
                Sign up
              </a>
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
