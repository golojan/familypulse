import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const coreBaseUrl =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_CORE_API_URL) ||
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api`
    : "/api");

const rawBaseQuery = fetchBaseQuery({
  baseUrl: coreBaseUrl,
  credentials: "include",
});

const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    console.warn("coreApi: 401 Unauthorized");
  }

  return result;
};

export const CORE_TAG_TYPES = [
  "User",
  "Group",
  "Event",
  "Message",
  "Volunteer",
  "Stat",
  "Activity",
  "Announcement",
] as const;

export const coreApi = createApi({
  reducerPath: "coreApi",
  baseQuery,
  tagTypes: CORE_TAG_TYPES,
  endpoints: (builder) => ({
    getServerHealth: builder.query<{ ok: boolean }, void>({
      query: () => "health",
    }),
  }),
});

export const { useGetServerHealthQuery } = coreApi;
