export default function ModalConfirmacion({
  titulo,
  mensaje,
  labelConfirmar = 'Confirmar',
  onConfirmar,
  onCancelar,
  cargando = false,
}) {
  return (
    <div className="modal-overlay">
      <div className="modal-box max-w-sm">
        <div className="modal-header">
          <h3 className="modal-title">{titulo}</h3>
          <button onClick={onCancelar} disabled={cargando} className="modal-close">&times;</button>
        </div>
        {mensaje && (
          <div className="px-6 py-4">
            <p className="text-sm text-gray-500">{mensaje}</p>
          </div>
        )}
        <div className="modal-footer">
          <button
            type="button"
            onClick={onCancelar}
            disabled={cargando}
            className="btn btn-md btn-secondary flex-1"
          >
            No, volver
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={cargando}
            className="btn btn-md btn-danger flex-1"
          >
            {cargando ? 'Procesando...' : labelConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
