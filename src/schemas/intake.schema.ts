import { z } from 'zod';

export const CivicIntakeSchema = z.object({
  applicantId: z.string().uuid({ message: "Invalid applicant UUID format" }),
  programCode: z.enum(["PROGRAM_300", "FSSA_PATHWAY", "EMERGENCY_AID"]),
  residencyState: z.string().length(2, "Must be a valid 2-letter state code (e.g. IN)"),
  householdIncome: z.number().nonnegative("Income cannot be negative"),
  supportingDocsUri: z.string().url("Must be a valid Cloud Storage URI"),
  timestamp: z.string().datetime(),
  metadata: z.record(z.any()).optional(),
});

export type CivicIntakePayload = z.infer<typeof CivicIntakeSchema>;
