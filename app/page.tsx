"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if the authentication token exists in the browser
    const token = localStorage.getItem("jbr_token");

    if (token) {
      // User is logged in, send them to the dashboard
      router.push("/dashboard");
    } else {
      // User is not logged in, send them to the auth page
      router.push("/auth");
    }
  }, [router]);

  // Return null or a blank screen while the redirect processes
  // You could also put a small loading spinner here if you prefer
  return null; 
}
