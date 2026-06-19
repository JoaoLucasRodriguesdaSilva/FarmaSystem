'use client';

import { FormEvent, useState } from 'react';
import type { Medicamento } from '@/types';
import { ProductCard } from './ProductCard';

interface ProductsSectionProps {
  medicamentos: Medicamento[];
  carregando?: boolean;
  onBuscar?: (termo: string) => void;
  onAddProduct?: (medicamento: Medicamento) => void;
}

export function ProductsSection({
  medicamentos,
  carregando,
  onBuscar,
  onAddProduct,
}: ProductsSectionProps) {
  const [termo, setTermo] = useState('');

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onBuscar?.(termo);
  }

  return (
    <section className="flex h-full flex-col gap-3">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder="Buscar medicamento por nome ou princípio ativo…"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <button
          type="submit"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Buscar
        </button>
      </form>

      <div className="flex-1 overflow-auto">
        {carregando ? (
          <p className="p-8 text-center text-sm text-gray-500">
            Carregando produtos…
          </p>
        ) : medicamentos.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-500">
            Nenhum medicamento encontrado.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {medicamentos.map((m) => (
              <ProductCard
                key={m.id}
                medicamento={m}
                onAddProduct={onAddProduct}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
