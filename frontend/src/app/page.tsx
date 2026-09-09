"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Always route to login from the start so the user begins at the sign-in screen
    router.replace("/login");
  }, [router]);

  return null;
}
