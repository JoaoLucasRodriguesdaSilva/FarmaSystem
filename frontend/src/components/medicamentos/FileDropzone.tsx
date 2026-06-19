'use client';

import { ChangeEvent, DragEvent, useRef, useState } from 'react';

interface FileDropzoneProps {
  label: string;
  accept: string;
  multiple?: boolean;
  files: File[];
  onChange: (files: File[]) => void;
}

/** Área de upload com suporte a clique e arrastar-e-soltar. */
export function FileDropzone({
  label,
  accept,
  multiple,
  files,
  onChange,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [arrastando, setArrastando] = useState(false);

  function adicionar(lista: FileList | null) {
    if (!lista) return;
    const novos = Array.from(lista);
    onChange(multiple ? [...files, ...novos] : novos.slice(0, 1));
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setArrastando(false);
    adicionar(e.dataTransfer.files);
  }

  function handleInput(e: ChangeEvent<HTMLInputElement>) {
    adicionar(e.target.files);
  }

  function remover(index: number) {
    onChange(files.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setArrastando(true);
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={handleDrop}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 text-center text-sm transition-colors ${
          arrastando
            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
            : 'border-gray-300 text-gray-500 hover:border-emerald-400'
        }`}
      >
        <span className="text-2xl">⬆️</span>
        <span>Arraste aqui ou clique para selecionar</span>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInput}
          className="hidden"
        />
      </div>

      {files.length > 0 && (
        <ul className="flex flex-col gap-1">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center justify-between rounded-lg bg-gray-100 px-3 py-1.5 text-xs text-gray-700"
            >
              <span className="truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => remover(index)}
                className="ml-2 text-red-600 hover:text-red-700"
              >
                remover
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
