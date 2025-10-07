"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function VerifyPromptInner() {
  const search = useSearchParams();
  const email = search.get("email");
  const router = useRouter();

  const resend = async () => {
    const API = process.env.NEXT_PUBLIC_API_URL ?? "";
    const url = API ? `${API}/resend-verification` : "/resend-verification";
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: email }),
    });
    router.replace("/signin");
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="p-8 bg-white dark:bg-gray-800 rounded shadow text-center max-w-md">
        <h2 className="text-lg font-semibold">Verify your email</h2>
        <p className="mt-4 text-sm text-gray-600">
          A verification link was sent to <strong>{email}</strong>. Please check
          your inbox and click the link to verify your account.
        </p>
        <button
          onClick={resend}
          className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded"
        >
          Resend verification
        </button>
      </div>
    </div>
  );
}

// ✅ Wrap the page in Suspense
export default function VerifyPrompt() {
  return (
    <Suspense fallback={<div className="text-white text-center mt-20">Loading...</div>}>
      <VerifyPromptInner />
    </Suspense>
  );
}
