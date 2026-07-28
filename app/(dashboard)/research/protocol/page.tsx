"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProtocolIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/research/protocol/my-submissions");
  }, [router]);

  return null;
}
