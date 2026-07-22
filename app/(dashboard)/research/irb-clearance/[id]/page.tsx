"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function IRBClearanceDetailRedirect() {
  const router = useRouter();
  const params = useParams();
  useEffect(() => {
    router.replace(`/research/irb-clearance/my-submissions/${params.id}`);
  }, [router, params.id]);
  return null;
}
