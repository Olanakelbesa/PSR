"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function IRBClearanceRootRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/research/irb-clearance/my-submissions");
  }, [router]);
  return null;
}
