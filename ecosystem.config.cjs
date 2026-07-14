/**
 * PM2 ecosystem — Senariy Analizer frontend
 *
 * Production'da nginx static serve qilish tavsiya etiladi (deploy/senariy-analizer.nginx).
 * Bu config — staging/preview yoki nginx ishlatilmaydigan muhitlar uchun.
 *
 * Ishga tushirish:
 *   cd frontend
 *   npm install
 *   npm run build
 *   pm2 start ecosystem.config.cjs
 *   pm2 save && pm2 startup
 */

const PORT = process.env.FRONTEND_PORT || "8013";
const NODE_ENV = process.env.NODE_ENV || "production";

const isDev = NODE_ENV !== "production";

module.exports = {
  apps: [
    {
      name: "senariy-frontend",
      cwd: __dirname,
      script: "npx",
      args: isDev
        ? `vite --host 0.0.0.0 --port ${PORT}`
        : `serve -s dist -l tcp://0.0.0.0:${PORT} --no-clipboard`,
      interpreter: "none",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 10,
      restart_delay: 2000,
      max_memory_restart: "400M",
      env: {
        NODE_ENV,
        // Production build static serve qilinishidan oldin yaratilgan bo'lishi kerak:
        //   npm run build
      },
      error_file: "./logs/frontend.error.log",
      out_file: "./logs/frontend.out.log",
      merge_logs: true,
      time: true,
    },
  ],
};
