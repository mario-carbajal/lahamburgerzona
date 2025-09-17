/**
 * Convierte una URL relativa de imagen a una URL que funcione en el frontend
 */
export function getImageUrl(imagePath: string | null | undefined): string {
  // Si no hay imagen, usar placeholder
  if (!imagePath) {
    return '/images/placeholder-burger.jpg';
  }

  // Si ya es una URL completa, devolverla tal como está
  if (imagePath.startsWith('http')) {
    return imagePath;
  }

  // Para todas las rutas relativas, devolver tal como están
  // Next.js se encargará de redirigir /uploads/ al backend
  return imagePath;
}

/**
 * Verifica si una imagen es una imagen subida por el usuario (desde /uploads/)
 */
export function isUploadedImage(imagePath: string | null | undefined): boolean {
  return imagePath?.startsWith('/uploads/') || false;
}
