# 🛠️ GUÍA TÉCNICA DE GIT - LAIKA CLUB

Manual de referencia para la gestión de versiones y colaboración en el proyecto.

---

## 1. Conexión y Configuración Remota

Para vincular el repositorio local con el servidor:
```powershell
git remote add origin https://github.com/Usuario/Repositorio.git
git branch -M main
```

## 2. Flujo de Trabajo (Ciclo diario)

### Sincronización Inicial
`git pull origin main` (Descarga los últimos cambios del servidor).

### Registro de Cambios
1. **Estado actual:** `git status`
2. **Preparar archivos:** `git add .` (Añade todos los cambios) o `git add archivo.css` (Solo uno)
3. **Guardar cambios:** `git commit -m "Descripción técnica del cambio"`
4. **Enviar al servidor:** `git push origin main`

## 3. Auditoría y Trazabilidad (¿Quién hizo qué y cuándo?)

Para consultar el historial de modificaciones:

| Objetivo | Comando |
| :--- | :--- |
| **Historial con fechas:** | `git log --pretty=format:"%h - %an, %ar : %s"` |
| **Ver cambios de un archivo:** | `git log -p nombre_archivo.js` |
| **Saber quién editó una línea:** | `git blame nombre_archivo.js` |
| **Ver detalles de un commit:** | `git show <ID-DEL-COMMIT>` |

## 4. Gestión de Conflictos y Emergencias

Si dos personas editan la misma línea, Git marcará el archivo. 
1. Abre el archivo en VS Code.
2. Elige entre: *Accept Current Change*, *Accept Incoming Change* o *Accept Both*.
3. Guarda el archivo, haz `git add .` y `git commit`.

**Comando de recuperación:**
`git reset --hard HEAD` (Descarta todos los cambios locales no guardados y vuelve al último commit).

---

## 5. Estructura de Exclusiones (.gitignore)
El archivo `.gitignore` ya está configurado para omitir automáticamente:
- Dependencias (`node_modules/`, `.venv/`)
- Secretos (`.env`)
- Archivos temporales y de sistema (`.log`, `__pycache__/`)
- Backups locales (`*.sql`, `backups/`)
