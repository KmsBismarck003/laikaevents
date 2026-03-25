# 🚀 GUÍA RÁPIDA DE GITHUB - LAIKA CLUB

Esta guía es para que **BranVnDev** y su compañero mantengan el proyecto sincronizado sin errores.

## 1. Conectar tu Repositorio (Ya vinculado)
Ya he vinculado este repositorio local con tu cuenta:
`https://github.com/BranVnDev/Laika_Club.git`

Si quieres cambiarlo en el futuro, el comando es:
```powershell
git remote set-url origin https://github.com/TU_NUEVO_REPO.git
```

## 2. Comandos Diarios para Cambios

Cada vez que hagas un cambio (como los de hoy), sigue este orden:

1.  **Ver qué cambió:** `git status`
2.  **Preparar archivos:** `git add .` (esto añade todo lo nuevo)
3.  **Guardar (Commit):** `git commit -m "Añadidos bordes redondeados y guía"`
4.  **Subir a GitHub:** `git push origin main`

## 3. ¿Cómo recibe los cambios tu compañero?

Tu compañero debe hacer lo siguiente:
1.  **Clonar (La primera vez):** `git clone https://github.com/BranVnDev/Laika_Club.git`
2.  **Bajar actualizaciones (Cada día):** `git pull origin main`

## 4. Archivos Prohibidos (Ya configurado en .gitignore)
Nunca subas estas carpetas, pesan mucho y rompen el proyecto de otros:
- `node_modules/`
- `.venv/`
- `.env` (donde están tus claves privadas)
- `backups/` e `laika_club_transfer.zip`

---
> [!IMPORTANT]
> Si GitHub te pide usuario/contraseña, recuerda que ahora usa **Tokens de Acceso Personal** o el **GitHub Desktop** para facilitar el login.
