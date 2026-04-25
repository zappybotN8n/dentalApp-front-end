export default function ModalConfirmacion({ titulo, mensaje, labelConfirmar = 'Confirmar', onConfirmar, onCancelar, cargando = false }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-2">{titulo}</h3>
        {mensaje && <p className="text-sm text-gray-500 mb-5">{mensaje}</p>}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancelar}
            disabled={cargando}
            className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            No, volver
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={cargando}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-medium py-2 rounded-lg transition-colors"
          >
            {cargando ? 'Procesando...' : labelConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
