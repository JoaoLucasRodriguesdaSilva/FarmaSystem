'use client';

import { useState } from 'react';

interface ImageGalleryProps {
  imagens: string[];
}

/** Galeria com miniatura selecionável e imagem principal. */
export function ImageGallery({ imagens }: ImageGalleryProps) {
  const [ativa, setAtiva] = useState(0);

  if (imagens.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-gray-300 text-sm text-gray-400">
        Sem imagens
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imagens[ativa]}
        alt="Imagem do medicamento"
        className="h-64 w-full rounded-xl border border-gray-200 object-contain bg-white"
      />
      {imagens.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {imagens.map((url, index) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url}
              alt={`Miniatura ${index + 1}`}
              onClick={() => setAtiva(index)}
              className={`h-16 w-16 cursor-pointer rounded-lg border-2 object-cover ${
                index === ativa ? 'border-emerald-500' : 'border-transparent'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
