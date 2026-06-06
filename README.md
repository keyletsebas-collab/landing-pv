# Verbo Eterno — Gestor de Usuarios

Esta es una aplicación React + Vite independiente y desacoplada del sitio web principal del grupo de poesía. Su propósito exclusivo es la administración segura de miembros, contraseñas (indicador visual), roles y estados de cuenta (habilitar/inhabilitar).

---

## Características Premium

- **Control de Acceso Seguro**: Solo los usuarios con rol de administrador (`'admin'`) en la base de datos de Supabase pueden ingresar al panel. Los usuarios estándar recibirán un mensaje de "Acceso Denegado".
- **Gestión de Roles**: Promueve o degrada usuarios de forma instantánea.
- **Inhabilitación Temporal**: Desactiva cuentas de usuario. Si una cuenta inhabilitada inicia sesión, es expulsada inmediatamente de cualquier sesión y se bloquea su reingreso.
- **Eliminación Permanente**: Elimina de manera segura a un usuario de la tabla del sistema `auth.users` utilizando una función RPC de Supabase con seguridad controlada.

---

## Configuración de Base de Datos (Supabase RPC)

Para que la eliminación permanente funcione correctamente, debes haber ejecutado la función RPC en el SQL Editor de Supabase:

```sql
CREATE OR REPLACE FUNCTION delete_user_by_admin(user_to_delete UUID)
RETURNS void AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    DELETE FROM auth.users WHERE id = user_to_delete;
  ELSE
    RAISE EXCEPTION 'Operación no permitida: Solo los administradores pueden eliminar usuarios.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Ejecución Local

1. Instala las dependencias:
   ```bash
   npm install
   ```

2. Crea tu archivo `.env` en la raíz de esta carpeta con las llaves de Supabase:
   ```env
   VITE_SUPABASE_URL=https://bienreziflsjpmskkkud.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_ffAfMU-oWC4MtTshDZqFFg_JJ6XRH-l
   ```

3. Inicia el servidor de desarrollo local en el puerto `3000`:
   ```bash
   npm run dev
   ```

---

## Despliegue en Vercel

1. Sube esta carpeta a tu repositorio en GitHub (ej. `landing-pv`).
2. Conecta el repositorio a Vercel.
3. Agrega las dos variables de entorno en la configuración del proyecto en Vercel (`Environment Variables`):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. ¡Despliega y listo!
