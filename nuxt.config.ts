// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/ui', 'nuxt-auth-utils', '@nuxthub/core', 'nuxt-nodemailer'],
  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    nodemailer: {
      host: '',
      port: 2525,
      auth: {
        user: '',
        pass: ''
      }
    },

    secretJwtKey: '',
    public: {
      baseApi: '',
      appUrl: process.env.APP_URL || 'http://localhost:3000'
    }
  },
  routeRules: {
    '/': { prerender: true }
  },

  compatibilityDate: '2026-05-21',

  hub: {
    db: {
      dialect: 'postgresql',
      connection: {
        url: process.env.POSTGRES_URL // Variable de entorno en Vercel
      },
      applyMigrationsDuringBuild: false // Crucial para evitar el error de build
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

})
