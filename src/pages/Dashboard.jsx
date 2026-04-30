import { useState, useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { turnosAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useCambiarEstado } from "../hooks/useTurnos";
import { usePacientesStats, useCumpleanos } from "../hooks/usePacientes";
import { ESTADOS_TURNO } from "../utils/fechas";
import { toast } from "sonner";

dayjs.locale("es");

const getLunes = (date) => {
  const d = dayjs(date);
  const day = d.day();
  const diff = day === 0 ? -6 : 1 - day;
  return d.add(diff, "day").startOf("day");
};

const Badge = ({ estado }) => {
  const { label, color } = ESTADOS_TURNO[estado] || {};
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>
      {label}
    </span>
  );
};

const ACCIONES = {
  pendiente: [
    {
      label: "Confirmar",
      next: "confirmado",
      cls: "text-blue-600 hover:text-blue-700",
    },
  ],
  confirmado: [
    {
      label: "Completar",
      next: "completado",
      cls: "text-green-600 hover:text-green-700",
    },
  ],
};

const ACCIONES_FULL = {
  pendiente: [
    {
      label: "Confirmar",
      next: "confirmado",
      cls: "bg-blue-50 text-blue-700 hover:bg-blue-100",
    },
    {
      label: "Ausente",
      next: "ausente",
      cls: "bg-gray-50 text-gray-600 hover:bg-gray-100",
    },
    {
      label: "Cancelar",
      next: "cancelado",
      cls: "bg-red-50 text-red-600 hover:bg-red-100",
    },
  ],
  confirmado: [
    {
      label: "Completar",
      next: "completado",
      cls: "bg-green-50 text-green-700 hover:bg-green-100",
    },
    {
      label: "Ausente",
      next: "ausente",
      cls: "bg-gray-50 text-gray-600 hover:bg-gray-100",
    },
    {
      label: "Cancelar",
      next: "cancelado",
      cls: "bg-red-50 text-red-600 hover:bg-red-100",
    },
  ],
};

export default function Dashboard() {
  const { usuario } = useAuth();
  const [vista, setVista] = useState("semana");
  const [semanaBase, setSemanaBase] = useState(() => getLunes(dayjs()));
  const [diaSeleccionado, setDiaSeleccionado] = useState(() =>
    dayjs().startOf("day"),
  );
  const cambiarEstado = useCambiarEstado();
  const { data: stats } = usePacientesStats();
  const { data: cumpleanos = [] } = useCumpleanos("semana");

  const hoy = dayjs().startOf("day");

  const diasSemana = useMemo(
    () => Array.from({ length: 6 }, (_, i) => semanaBase.add(i, "day")),
    [semanaBase],
  );

  const queries = useQueries({
    queries: diasSemana.map((dia) => ({
      queryKey: ["turnos", usuario?._id, { fecha: dia.format("YYYY-MM-DD") }],
      queryFn: () =>
        turnosAPI
          .getAll({ fecha: dia.format("YYYY-MM-DD"), limit: 50 })
          .then((r) => r.data.data || []),
      enabled: !!usuario,
      staleTime: 1000 * 60 * 2,
    })),
  });

  const turnosPorDia = diasSemana.map((dia, i) => ({
    dia,
    turnos: (queries[i].data || []).sort((a, b) =>
      a.hora.localeCompare(b.hora),
    ),
    loading: queries[i].isLoading,
  }));

  const diaActualData = turnosPorDia.find((d) =>
    d.dia.isSame(diaSeleccionado, "day"),
  );
  const turnosDia = diaActualData?.turnos || [];

  // --- Lógica de contadores mejorada ---
  const totalSemana = turnosPorDia.reduce((acc, d) => acc + d.turnos.length, 0);
  const pendientesSem = turnosPorDia.reduce(
    (acc, d) => acc + d.turnos.filter((t) => t.estado === "pendiente").length,
    0,
  );
  const canceladosSem = turnosPorDia.reduce(
    (acc, d) => acc + d.turnos.filter((t) => t.estado === "cancelado").length,
    0,
  );
  const confirmadosSem = turnosPorDia.reduce(
    (acc, d) => acc + d.turnos.filter((t) => t.estado === "confirmado").length,
    0,
  );
  const completadosSem = turnosPorDia.reduce(
    (acc, d) => acc + d.turnos.filter((t) => t.estado === "completado").length,
    0,
  );
  const ausentesSem = turnosPorDia.reduce(
    (acc, d) => acc + d.turnos.filter((t) => t.estado === "ausente").length,
    0,
  );

  const pendientesDia = turnosDia.filter(
    (t) => t.estado === "pendiente",
  ).length;
  const confirmadosDia = turnosDia.filter(
    (t) => t.estado === "confirmado",
  ).length;
  const completadosDia = turnosDia.filter(
    (t) => t.estado === "completado",
  ).length;
  const ausentesDia = turnosDia.filter((t) => t.estado === "ausente").length;

  const handleEstado = (id, estado) => {
    cambiarEstado.mutate(
      { id, estado },
      {
        onSuccess: () => toast.success("Estado actualizado"),
        onError: () => toast.error("Error al actualizar"),
      },
    );
  };

  const navSemana = (dir) => setSemanaBase((s) => s.add(dir * 7, "day"));

  const navDia = (dir) => {
    const nuevo = diaSeleccionado.add(dir, "day");
    setDiaSeleccionado(nuevo);
    if (!diasSemana.some((d) => d.isSame(nuevo, "day"))) {
      setSemanaBase(getLunes(nuevo));
    }
  };

  const irHoy = () => {
    setSemanaBase(getLunes(hoy));
    setDiaSeleccionado(hoy);
  };

  const seleccionarDia = (dia) => {
    setDiaSeleccionado(dia);
    setVista("dia");
  };

  const esHoy = (dia) => dia.isSame(hoy, "day");
  const esDiaSeleccionado = (dia) => dia.isSame(diaSeleccionado, "day");

  const labelSemana = `${semanaBase.format("D MMM")} – ${semanaBase.add(5, "day").format("D MMM YYYY")}`;
  const labelDia = diaSeleccionado.format("dddd D [de] MMMM YYYY");

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 capitalize">
            {vista === "semana" ? labelSemana : labelDia}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {vista === "semana"
              ? `${totalSemana} turno${totalSemana !== 1 ? "s" : ""} esta semana`
              : `${turnosDia.length} turno${turnosDia.length !== 1 ? "s" : ""} este día`}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
            <button
              onClick={() => (vista === "semana" ? navSemana(-1) : navDia(-1))}
              className="px-2 py-1 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded text-sm transition-colors"
            >
              ←
            </button>
            <button
              onClick={irHoy}
              className="px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded transition-colors"
            >
              Hoy
            </button>
            <button
              onClick={() => (vista === "semana" ? navSemana(1) : navDia(1))}
              className="px-2 py-1 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded text-sm transition-colors"
            >
              →
            </button>
          </div>

          <div className="flex bg-white border border-gray-200 rounded-lg p-1">
            <button
              onClick={() => setVista("semana")}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${vista === "semana" ? "bg-blue-600 text-white" : "text-gray-500 hover:text-gray-700"}`}
            >
              Semana
            </button>
            <button
              onClick={() => setVista("dia")}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${vista === "dia" ? "bg-blue-600 text-white" : "text-gray-500 hover:text-gray-700"}`}
            >
              Día
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats de agenda (Grid 5 columnas) ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {(vista === "semana"
          ? [
              {
                label: "Total semana",
                value: totalSemana,
                color: "text-blue-600",
                bg: "bg-blue-50",
              },
              {
                label: "Pendientes",
                value: pendientesSem,
                color: "text-orange-500",
                bg: "bg-orange-50",
              },
              {
                label: "Confirmados",
                value: confirmadosSem,
                color: "text-cyan-600",
                bg: "bg-cyan-50",
              },
              {
                label: "Completados",
                value: completadosSem,
                color: "text-green-600",
                bg: "bg-green-50",
              },
              {
                label: "Ausentes",
                value: ausentesSem,
                color: "text-red-500",
                bg: "bg-red-50",
              },
            ]
          : [
              {
                label: "Total día",
                value: turnosDia.length,
                color: "text-blue-600",
                bg: "bg-blue-50",
              },
              {
                label: "Por confirmar",
                value: pendientesDia,
                color: "text-orange-500",
                bg: "bg-orange-50",
              },
              {
                label: "Confirmados",
                value: confirmadosDia,
                color: "text-cyan-600",
                bg: "bg-cyan-50",
              },
              {
                label: "Completados",
                value: completadosDia,
                color: "text-green-600",
                bg: "bg-green-50",
              },
              {
                label: "Ausentes",
                value: ausentesDia,
                color: "text-red-500",
                bg: "bg-red-50",
              },
            ]
        ).map(({ label, value, color, bg }) => (
          <div
            key={label}
            className={`bg-white rounded-xl border border-gray-200 p-4 ${bg}`}
          >
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Resumen del mes ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Resumen del mes
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Cobrado</p>
            <p className="text-xl font-bold text-emerald-600">
              ${(stats?.cobradoMes ?? 0).toLocaleString("es-AR")}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Pendiente de cobro</p>
            <p className="text-xl font-bold text-orange-500">
              ${(stats?.pendienteCobro ?? 0).toLocaleString("es-AR")}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">
              Cumpleaños esta semana
            </p>
            {cumpleanos.length === 0 ? (
              <p className="text-sm text-gray-300">Sin cumpleaños</p>
            ) : (
              <ul className="space-y-1 mt-0.5">
                {cumpleanos.slice(0, 3).map((p) => (
                  <li
                    key={p._id}
                    className="text-xs text-gray-700 flex items-center gap-1.5"
                  >
                    <span>🎂</span>
                    <span className="font-medium">
                      {p.apellido}, {p.nombre}
                    </span>
                    <span className="text-gray-400">
                      ({p.diaCumple}/{p.mesCumple})
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* ── Vista Semana (Cards Responsive) ── */}
      {vista === "semana" && (
        <div className="overflow-x-auto">
          <div className="grid grid-cols-6 gap-3 min-w-[900px] lg:min-w-0">
            {turnosPorDia.map(({ dia, turnos, loading }) => (
              <div
                key={dia.format("YYYY-MM-DD")}
                className={`rounded-xl border flex flex-col overflow-hidden transition-all ${esHoy(dia) ? "border-blue-300 bg-blue-50/40" : "border-gray-200 bg-white"}`}
              >
                <button
                  onClick={() => seleccionarDia(dia)}
                  className={`w-full px-3 py-2 text-left border-b transition-colors ${esHoy(dia) ? "border-blue-200 hover:bg-blue-100/50" : "border-gray-100 hover:bg-gray-50"}`}
                >
                  <p
                    className={`text-xs font-semibold uppercase tracking-wide ${esHoy(dia) ? "text-blue-600" : "text-gray-500"}`}
                  >
                    {dia.format("ddd")}
                  </p>
                  <p
                    className={`text-lg font-bold leading-tight ${esHoy(dia) ? "text-blue-700" : "text-gray-800"}`}
                  >
                    {dia.format("D")}
                  </p>
                </button>

                <div className="flex flex-col gap-2 p-2 flex-1">
                  {loading ? (
                    <div className="text-xs text-gray-400 text-center py-4">
                      ...
                    </div>
                  ) : turnos.length === 0 ? (
                    <div className="text-xs text-gray-300 text-center py-4">
                      Sin turnos
                    </div>
                  ) : (
                    turnos.map((turno) => (
                      <div
                        key={turno._id}
                        className={`rounded-lg p-2.5 border text-xs space-y-1.5 ${turno.estado === "cancelado" || turno.estado === "ausente" ? "bg-gray-50 border-gray-100 opacity-60" : turno.estado === "completado" ? "bg-green-50 border-green-100" : turno.estado === "confirmado" ? "bg-cyan-50 border-cyan-100" : "bg-white border-gray-200"}`}
                      >
                        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                          <span className="font-mono text-gray-600 font-medium">
                            {turno.hora}
                          </span>
                          <div className="flex md:justify-end">
                            <Badge estado={turno.estado} />
                          </div>
                        </div>
                        <p className="font-semibold text-gray-900 leading-tight break-words">
                          {turno.paciente?.apellido}, {turno.paciente?.nombre}
                        </p>
                        {ACCIONES[turno.estado] && (
                          <div className="pt-1 flex flex-wrap gap-1.5 border-t border-gray-100 md:border-none md:pt-0">
                            {ACCIONES[turno.estado].map(
                              ({ label, next, cls }) => (
                                <button
                                  key={next}
                                  onClick={() => handleEstado(turno._id, next)}
                                  className={`text-xs font-semibold ${cls} transition-colors py-1 md:py-0`}
                                >
                                  {label}
                                </button>
                              ),
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Vista Día (Responsive Layout) ── */}
      {vista === "dia" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex border-b border-gray-100 overflow-x-auto">
            {diasSemana.map((dia) => (
              <button
                key={dia.format("YYYY-MM-DD")}
                onClick={() => setDiaSeleccionado(dia)}
                className={`flex-1 min-w-[80px] px-3 py-3 text-center transition-colors ${esDiaSeleccionado(dia) ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}
              >
                <p className="text-xs font-semibold uppercase">
                  {dia.format("ddd")}
                </p>
                <p
                  className={`text-lg font-bold leading-tight ${esDiaSeleccionado(dia) ? "text-white" : ""}`}
                >
                  {dia.format("D")}
                </p>
              </button>
            ))}
          </div>
          {diaActualData?.loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              Cargando...
            </div>
          ) : turnosDia.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">
              No hay turnos para este día
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {turnosDia.map((turno) => (
                <li
                  key={turno._id}
                  className={`px-4 py-4 transition-colors ${turno.estado === "cancelado" || turno.estado === "ausente" ? "opacity-50" : "hover:bg-gray-50"}`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
                    <div className="flex items-center gap-2 sm:w-14 sm:flex-col sm:items-start">
                      <span className="text-sm font-mono font-semibold text-gray-700">
                        {turno.hora}
                      </span>
                      <p className="text-xs text-gray-400">{turno.duracion}m</p>
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-800">
                          {turno.paciente?.apellido}, {turno.paciente?.nombre}
                        </p>
                        <Badge estado={turno.estado} />
                      </div>
                      {turno.paciente?.telefono && (
                        <p className="text-xs text-gray-400">
                          📞 {turno.paciente.telefono}
                        </p>
                      )}
                    </div>
                    {ACCIONES_FULL[turno.estado] && (
                      <div className="flex flex-wrap gap-1.5 sm:justify-end">
                        {ACCIONES_FULL[turno.estado].map(
                          ({ label, next, cls }) => (
                            <button
                              key={next}
                              onClick={() => handleEstado(turno._id, next)}
                              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${cls}`}
                            >
                              {label}
                            </button>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
