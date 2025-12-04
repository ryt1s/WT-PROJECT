import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    // Prevent redirect loop
    if (status === "loading" || redirecting) return;

    if (session) {
      setRedirecting(true);
      router.replace("/dashboard"); // Use replace instead of push
    } else if (status === "unauthenticated") {
      setRedirecting(true);
      router.replace("/login");
    }
  }, [session, status, router, redirecting]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}