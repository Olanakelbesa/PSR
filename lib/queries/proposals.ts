import { useEffect, useState } from "react";
import { proposalsApi } from "@/api/client";
import { mockProposals } from "@/lib/api/mock-data";
import type { ProposalDetail } from "@/types";

export function useCreateProposal() {
  const [isPending, setIsPending] = useState(false);
  return {
    isPending,
    mutateAsync: async (data: any) => {
      setIsPending(true);
      try {
        const res = await proposalsApi.createProposal(data);
        return res;
      } finally {
        setIsPending(false);
      }
    },
  };
}

export function useUpdateProposal() {
  const [isPending, setIsPending] = useState(false);
  return {
    isPending,
    mutateAsync: async ({ id, data }: { id: string; data: any }) => {
      setIsPending(true);
      try {
        const res = await proposalsApi.updateProposal(id, data);
        return res;
      } finally {
        setIsPending(false);
      }
    },
  };
}

export function useProposal(id: string): {
  data: ProposalDetail | undefined;
  isLoading: boolean;
  error: any;
} {
  const [data, setData] = useState<ProposalDetail | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!id) {
      setData(undefined);
      setIsLoading(false);
      return;
    }

    // Try mock first
    const mock = mockProposals.find((proposal) => proposal.id === id);
    if (mock) {
      setData(mock as unknown as ProposalDetail);
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);
    setError(null);

    proposalsApi
      .getProposal(id)
      .then((res) => {
        if (active) {
          setData(res);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err);
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [id]);

  return {
    data,
    isLoading,
    error,
  };
}

export function useProposalResponse(id: string) {
  return useProposal(id);
}
