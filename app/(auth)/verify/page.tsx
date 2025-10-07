"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function VerifyPageInner() {
  const search = useSearchParams();
  const token = search.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No token provided");
      return;
    }

    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    fetch(`${API}/verify-email?token=${encodeURIComponent(token)}`)
      .then((r) => r.json().then((j) => ({ ok: r.ok, body: j })))
      .then(({ ok, body }) => {
        if (ok) {
          setStatus("success");
          setMessage("Email verified. You can now sign in.");
          setTimeout(() => router.replace("/signin"), 2500);
        } else {
          setStatus("error");
          setMessage(body.detail || body.message || "Verification failed");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Verification request failed");
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="p-8 bg-white dark:bg-gray-800 rounded shadow text-center max-w-md">
        {status === "loading" && <p>Verifying your email...</p>}
        {status === "success" && <p className="text-green-600">{message}</p>}
        {status === "error" && (
          <div>
            <p className="text-red-600">{message}</p>
            <p className="mt-4 text-sm text-gray-600">
              If your token expired, you can request a new verification email on the Sign In page.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="text-white text-center mt-20">Loading...</div>}>
      <VerifyPageInner />
    </Suspense>
  );
}
