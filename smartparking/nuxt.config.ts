import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      link: [
        {
          rel: "icon",
          type: "image/x-icon",
        },
      ],
    },
    baseURL: "",
  },
  ssr: true,
  nitro: {
    preset: "static", // output statico (Nuxt 3)
  },
  runtimeConfig: {
    public: {
      BACKEND_URL: process.env.BACKEND_URL,
    },
  },
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
})
