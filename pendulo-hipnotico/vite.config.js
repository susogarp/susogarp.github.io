var _a, _b, _c;
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
// GitHub Actions expone GITHUB_REPOSITORY como "usuario/nombre-del-repo" durante el build.
// Lo usamos para fijar automáticamente la ruta base de GitHub Pages (/nombre-del-repo/)
// sin tener que escribir el nombre del repo a mano en ningún sitio. En local (`npm run dev`
// o un build fuera de Actions) esa variable no existe y la base cae de vuelta a '/'.
// Excepción: un repo llamado literalmente "usuario.github.io" es una página de
// usuario/organización y GitHub la sirve en la raíz del dominio, no en un subdirectorio.
// GitHub Actions expone GITHUB_REPOSITORY como "usuario/nombre-del-repo" durante el build,
// y si lo usas, la ruta base se calcula sola. Si compilas en tu máquina y subes /dist a mano
// (sin Actions), esa variable no existe: reemplaza el texto de abajo por el nombre real de tu
// repositorio para que las rutas de los archivos generados apunten al lugar correcto.
var FALLBACK_REPO_NAME = "github.com/susogarp/susogarp.github.io/pendulo"; // <- pon aquí el nombre exacto de tu repo en GitHub
var repoName = (_b = (_a = process.env.GITHUB_REPOSITORY) === null || _a === void 0 ? void 0 : _a.split("/")[1]) !== null && _b !== void 0 ? _b : FALLBACK_REPO_NAME;
var isUserOrgPage = (_c = repoName === null || repoName === void 0 ? void 0 : repoName.endsWith(".github.io")) !== null && _c !== void 0 ? _c : false;
var base = repoName && !isUserOrgPage ? "/".concat(repoName, "/") : "/";
// https://vite.dev/config/
export default defineConfig({
    base: base,
    plugins: [
        react(),
        VitePWA({
            registerType: "autoUpdate",
            includeAssets: ["favicon.svg", "icons/apple-touch-icon.png"],
            manifest: {
                name: "Péndulo Hipnótico",
                short_name: "Péndulo",
                description: "Simulación física de un péndulo de hipnosis con movimiento realista, instalable como app.",
                theme_color: "#0a0a0f",
                background_color: "#0a0a0f",
                display: "standalone",
                orientation: "any",
                start_url: base,
                scope: base,
                lang: "es",
                icons: [
                    {
                        src: "icons/icon-192.png",
                        sizes: "192x192",
                        type: "image/png",
                    },
                    {
                        src: "icons/icon-512.png",
                        sizes: "512x512",
                        type: "image/png",
                    },
                    {
                        src: "icons/icon-maskable-512.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "maskable",
                    },
                ],
            },
            workbox: {
                globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
                cleanupOutdatedCaches: true,
                clientsClaim: true,
            },
            devOptions: {
                // Permite probar la PWA (service worker) también en `npm run dev`
                enabled: true,
            },
        }),
    ],
    server: {
        host: true,
    },
});
