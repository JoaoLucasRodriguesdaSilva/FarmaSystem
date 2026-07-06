'use client';

import { useEffect, useRef, useState } from 'react';
import { medicamentosService } from '@/services/medicamentos.service';
import type { Medicamento } from '@/types';

interface MedicamentoAutocompleteProps {
  /** Callback com o medicamento escolhido (ou null enquanto o campo é editado). */
  onSelect: (medicamento: Medicamento | null) => void;
  className?: string;
  placeholder?: string;
}

const MIN_CARACTERES = 2;

/**
 * Busca de medicamento por nome com dropdown de no máximo 5 sugestões. A
 * consulta é feita com debounce (300ms) contra `GET /medicamentos?busca=&limit=5`.
 * Enquanto o texto é editado, a seleção anterior é descartada (onSelect(null)).
 */
export function MedicamentoAutocomplete({
  onSelect,
  className,
  placeholder = 'Medicamento (nome) *',
}: MedicamentoAutocompleteProps) {
  const [termo, setTermo] = useState('');
  const [opcoes, setOpcoes] = useState<Medicamento[]>([]);
  const [aberto, setAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Busca com debounce; só dispara a partir de 2 caracteres.
  useEffect(() => {
    const busca = termo.trim();
    if (busca.length < MIN_CARACTERES) {
      setOpcoes([]);
      setCarregando(false);
      return;
    }
    setCarregando(true);
    const t = setTimeout(() => {
      medicamentosService
        .listar({ busca, limit: 5 })
        .then((r) => setOpcoes(r.dados))
        .catch(() => setOpcoes([]))
        .finally(() => setCarregando(false));
    }, 300);
    return () => clearTimeout(t);
  }, [termo]);

  // Fecha o dropdown ao clicar fora do componente.
  useEffect(() => {
    function aoClicarFora(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setAberto(false);
      }
    }
    document.addEventListener('mousedown', aoClicarFora);
    return () => document.removeEventListener('mousedown', aoClicarFora);
  }, []);

  function aoDigitar(valor: string) {
    setTermo(valor);
    setAberto(true);
    onSelect(null);
  }

  function selecionar(medicamento: Medicamento) {
    onSelect(medicamento);
    setTermo(medicamento.nome);
    setAberto(false);
  }

  const mostrarDropdown = aberto && termo.trim().length >= MIN_CARACTERES;

  return (
    <div ref={boxRef} className="relative">
      <input
        className={className}
        placeholder={placeholder}
        value={termo}
        autoComplete="off"
        onChange={(e) => aoDigitar(e.target.value)}
        onFocus={() => {
          if (termo.trim().length >= MIN_CARACTERES) setAberto(true);
        }}
      />

      {mostrarDropdown && (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {carregando ? (
            <li className="px-3 py-2 text-sm text-gray-500">Buscando…</li>
          ) : opcoes.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-500">
              Nenhum medicamento encontrado.
            </li>
          ) : (
            opcoes.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => selecionar(m)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-emerald-50"
                >
                  <span className="font-medium text-gray-800">{m.nome}</span>
                  <span className="shrink-0 text-xs text-gray-500">
                    #{m.id} · {m.principioAtivo}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
