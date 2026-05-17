import { useFormContext } from "react-hook-form";
import { useEffect } from "react";
import type { ProposalFormInput } from "@/lib/validators/proposal.schema";
import {
  MOCK_GRANT_CALLS,
  SUB_CALL_TYPES,
  THEMATIC_AREAS,
} from "./constants";

/**
 * Hook to handle grant call selection and auto-populate related fields
 */
// export function useGrantCallHandler() {
//   const form = useFormContext<ProposalFormInput>();
//   const grantCallId = form.watch("grantCallId");

//   const handleGrantCallChange = (value: string) => {
//     const selectedCall = MOCK_GRANT_CALLS.find((call) => call.id === value);
//     form.setValue("grantCallId", value);
//     if (selectedCall) {
//       form.setValue("callTypeId", String(selectedCall.callType.id));
//       if (selectedCall.subCallType) {
//         form.setValue("subCallTypeId", String(selectedCall.subCallType.id));
//       } else {
//         form.setValue("subCallTypeId", undefined);
//       }
//     }
//   };

//   // Initialize if grantCallId is already set
//   useEffect(() => {
//     if (grantCallId) {
//       const currentCallTypeId = form.getValues("callTypeId");
//       if (!currentCallTypeId) {
//         handleGrantCallChange(grantCallId);
//       }
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [grantCallId]);

//   return { handleGrantCallChange };
// }

/**
 * Hook to get filtered data based on form selections
 */
// export function useFilteredData() {
//   const form = useFormContext<ProposalFormInput>();
//   const callTypeId = form.watch("callTypeId");
//   const submissionLevel = form.watch("submissionLevel");

//   const availableSubCallTypes = callTypeId
//     ? MOCK_SUB_CALL_TYPES.filter((subType) => subType.callTypeId === callTypeId)
//     : [];

//   const availableOffices = submissionLevel
//     ? MOCK_OFFICES.filter(
//         (office) => office.submissionLevel === submissionLevel
//       )
//     : [];

//   return { availableSubCallTypes, availableOffices };
// }

/**
 * Hook to calculate date constraints
 */
export function useDateConstraints() {
  const form = useFormContext<ProposalFormInput>();
  const startDate = form.watch("startDate");

  const minEndDate = startDate
    ? new Date(startDate.getTime() + 24 * 60 * 60 * 1000)
    : undefined;

  return { minEndDate };
}
