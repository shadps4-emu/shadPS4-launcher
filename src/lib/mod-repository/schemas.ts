import { z } from "zod";

export const githubContentEntrySchema = z.object({
    name: z.string(),
    download_url: z.string(),
});

export const githubContentListSchema = z.array(githubContentEntrySchema);

export type GithubContentEntry = z.infer<typeof githubContentEntrySchema>;
