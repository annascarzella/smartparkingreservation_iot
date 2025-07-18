import { useCookie } from "#app";

export const useApiFetch = (
  url: string,
  options: { headers?: Record<string, string> } = {},
) => {
  const config = useRuntimeConfig();
  const tokenCookie = useCookie("access_token");

  // Ensure headers object exists
  if (!options.headers) {
    options.headers = {};
  }

  // Only add Authorization header if token exists
  if (tokenCookie.value) {
    options.headers.Authorization = `Bearer ${tokenCookie.value}`;
  }

  console.log(config.public.BACKEND_URL);
  console.log(options.headers);

  return $fetch(url, {
    baseURL: config.public.BACKEND_URL,
    ...options,
    headers: options.headers,
  });
};
