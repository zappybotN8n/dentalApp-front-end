import { useState, useRef, useEffect } from 'react';
import { usePacientes } from '../../hooks/usePacientes';

export default function PacienteCombobox({ value, onChange, error }) {
  const [texto, setTexto] = useState('');
  const [abierto, setAbierto] = useState(false);
  const [seleccionado, setSeleccionado] = useState(null);
  const wrapperRef = useRef(null);

  const { data: resp, isFetching } = usePacientes(
    texto.length >= 2 ? { search: texto, limit: 10 } : { limit: 0 }
  );
  const pacientes = resp?.data ?? [];

  // Cerrar al hacer click afuera
  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setAbierto(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const seleccionar = (p) => {
    setSeleccionado(p);
    setTexto(`${p.apellido}, ${p.nombre}`);
    setAbierto(false);
    onChange(p._id);
  };

  const limpiar = () => {
    setSeleccionado(null);
    setTexto('');
    onChange('');
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            if (seleccionado) limpiar();
            setAbierto(true);
          }}
          onFocus={() => setAbierto(true)}
          placeholder="Buscar por nombre, apellido o DNI..."
          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 pr-8 ${
            error ? 'border-red-300' : 'border-gray-200'
          }`}
        />
        {seleccionado && (
          <button
            type="button"
            onClick={limpiar}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
          >×</button>
        )}
      </div>

      {abierto && texto.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {isFetching ? (
            <div className="px-3 py-2 text-xs text-gray-400">Buscando...</div>
          ) : pacientes.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-400">Sin resultados</div>
          ) : (
            pacientes.map(p => (
              <button
                key={p._id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => seleccionar(p)}
                className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors"
              >
                <p className="text-sm font-medium text-gray-800">{p.apellido}, {p.nombre}</p>
                <p className="text-xs text-gray-400">
                  {p.dni && `DNI: ${p.dni}`}
                  {p.dni && p.telefono && ' · '}
                  {p.telefono && `Tel: ${p.telefono}`}
                </p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
