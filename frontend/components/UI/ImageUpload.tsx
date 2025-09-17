import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import apiService from '../../services/api';
import { getImageUrl } from '../../utils/imageUtils';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  className?: string;
  disabled?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ 
  value, 
  onChange, 
  className = '', 
  disabled = false 
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);

  // Actualizar preview cuando cambie el valor
  React.useEffect(() => {
    setPreview(value ? getImageUrl(value) : null);
  }, [value]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido');
      return;
    }

    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo es demasiado grande. Máximo 5MB');
      return;
    }

    try {
      setIsUploading(true);
      
      // Crear preview local inmediatamente
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Subir archivo
      const response = await apiService.uploadImage(file);
      
      if (response.success) {
        // Usar la URL relativa para guardar en la base de datos
        const relativeUrl = response.data.url;
        
        // Actualizar el preview usando la función helper
        setPreview(getImageUrl(relativeUrl));
        
        // Notificar al componente padre con URL relativa (para guardar en BD)
        onChange(relativeUrl);
      } else {
        throw new Error(response.message || 'Error al subir la imagen');
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      alert(error.message || 'Error al subir la imagen');
      setPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreview(null);
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        Imagen del producto
      </label>
      
      <div className="relative">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || isUploading}
        />
        
        {preview ? (
          <div className="relative group">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg border border-gray-300"
            />
            {!disabled && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div
            onClick={handleClick}
            className={`
              w-full h-48 border-2 border-dashed border-gray-300 rounded-lg
              flex flex-col items-center justify-center cursor-pointer
              hover:border-primary-500 hover:bg-primary-50 transition-colors
              ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mb-2"></div>
                <p className="text-sm text-gray-600">Subiendo imagen...</p>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-1">
                  Haz clic para subir una imagen
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, JPEG hasta 5MB
                </p>
              </>
            )}
          </div>
        )}
      </div>
      
      {value && (
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <ImageIcon className="w-4 h-4" />
          <span>Imagen cargada: {value.split('/').pop()}</span>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
