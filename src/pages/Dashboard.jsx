import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { turnosAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useCambiarEstado } from "../hooks/useTurnos";
import { usePacientesStats, useCumpleanos, usePendientesCobro } from "../hooks/usePacientes";
import { ESTADOS_TURNO, ESTADO_BORDER_CLS } from "../utils/fechas";
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
  return <span className={`badge badge-status ${color}`}>{label}</span>;
};

const ACCIONES = {
  pendiente: [{ label: "Confirmar", next: "confirmado", cls: "text-blue-600 hover:text-blue-700 font-semibold" }],
  confirmado: [{ label: "Completar", next: "completado", cls: "text-green-600 hover:text-green-700 font-semibold" }],
};

const ACCIONES_FULL = {
  pendiente: [
    { label: "Confirmar",  next: "confirmado", cls: "btn btn-sm btn-ghost-blue" },
    { label: "Ausente",    next: "ausente",    cls: "btn btn-sm btn-ghost-gray" },
    { label: "Cancelar",   next: "cancelado",  cls: "btn btn-sm btn-ghost-red" },
  ],
  confirmado: [
    { label: "Completar",  next: "completado", cls: "btn btn-sm btn-ghost-green" },
    { label: "Ausente",    next: "ausente",    cls: "btn btn-sm btn-ghost-gray" },
    { label: "Cancelar",   next: "cancelado",  cls: "btn btn-sm btn-ghost-red" },
  ],
};

const ICON = {
  calendar: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  clock:    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>,
  check:    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/></svg>,
  badge:    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622C17.176 19.29 21 14.59 21 9a12.02 12.02 0 00-.382-3.016z"/></svg>,
  userx:    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M16 11c1.657 0 3-1.343 3-3s-1.343-3-3-3M3 20c0-2.761 2.686-5 6-5s6 2.239 6 5"/><circle cx="9" cy="7" r="4"/><path d="M17 17l4 4m0-4l-4 4"/></svg>,
};

const STATS_CONFIG = [
  { key: "total",      label: "Total",       colorVal: "text-blue-600",   statCls: "stat-blue",   icon: ICON.calendar },
  { key: "pendiente",  label: "Pendientes",  colorVal: "text-orange-500", statCls: "stat-orange", icon: ICON.clock    },
  { key: "confirmado", label: "Confirmados", colorVal: "text-cyan-600",   statCls: "stat-cyan",   icon: ICON.check    },
  { key: "completado", label: "Completados", colorVal: "text-green-600",  statCls: "stat-green",  icon: ICON.badge    },
  { key: "ausente",    label: "Ausentes",    colorVal: "text-red-500",    statCls: "stat-red",    icon: ICON.userx    },
];

export default function Dashboard() {
  const { usuario } = useAuth();
  const [vista, setVista] = useState(() =>
    typeof window !== "undefined" && window.innerWidth < 640 ? "dia" : "semana"
  );
  const [semanaBase, setSemanaBase] = useState(() => getLunes(dayjs()));
  const [diaSeleccionado, setDiaSeleccionado] = useState(() => dayjs().startOf("day"));
  const [modalPendientes, setModalPendientes] = useState(false);
  const cambiarEstado = useCambiarEstado();
  const { data: stats } = usePacientesStats();
  const { data: cumpleanos = [] } = useCumpleanos("semana");
  const { data: pendientes = [], isLoading: cargandoPendientes } = usePendientesCobro(modalPendientes);

  const hoy = dayjs().startOf("day");

  const diasSemana = useMemo(
    () => Array.from({ length: 6 }, (_, i) => semanaBase.add(i, "day")),
    [semanaBase],
  );

  const queries = useQueries({
    queries: diasSemana.map((dia) => ({
      queryKey: ["turnos", usuario?._id, { fecha: dia.format("YYYY-MM-DD") }],
      queryFn: () =>
        turnosAPI.getAll({ fecha: dia.format("YYYY-MM-DD"), limit: 50 }).then((r) => r.data.data || []),
      enabled: !!usuario,
      staleTime: 1000 * 60 * 2,
    })),
  });

  const turnosPorDia = diasSemana.map((dia, i) => ({
    dia,
    turnos: (queries[i].data || []).sort((a, b) => a.hora.localeCompare(b.hora)),
    loading: queries[i].isLoading,
  }));

  const diaActualData = turnosPorDia.find((d) => d.dia.isSame(diaSeleccionado, "day"));
  const turnosDia = diaActualData?.turnos || [];

  const contarPorEstado = (lista, estado) => lista.filter((t) => t.estado === estado).length;

  const getStatsValues = (lista) => ({
    total:      lista.length,
    pendiente:  lista.filter(t => t.estado === "pendiente").length,
    confirmado: lista.filter(t => t.estado === "confirmado").length,
    completado: lista.filter(t => t.estado === "completado").length,
    ausente:    lista.filter(t => t.estado === "ausente").length,
  });

  const turnosSemanaFlat = turnosPorDia.flatMap((d) => d.turnos);
  const statsSemana = getStatsValues(turnosSemanaFlat);
  const statsDia    = getStatsValues(turnosDia);

  const currentStats = vista === "semana" ? statsSemana : statsDia;

  const statsLabels = {
    total:      vista === "semana" ? "Total semana" : "Total día",
    pendiente:  "Pendientes",
    confirmado: "Confirmados",
    completado: "Completados",
    ausente:    "Ausentes",
  };

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
    if (!diasSemana.some((d) => d.isSame(nuevo, "day"))) setSemanaBase(getLunes(nuevo));
  };
  const irHoy = () => { setSemanaBase(getLunes(hoy)); setDiaSeleccionado(hoy); };
  const seleccionarDia = (dia) => { setDiaSeleccionado(dia); setVista("dia"); };
  const esHoy = (dia) => dia.isSame(hoy, "day");
  const esDiaSeleccionado = (dia) => dia.isSame(diaSeleccionado, "day");

  const labelSemana = `${semanaBase.format("D MMM")} – ${semanaBase.add(5, "day").format("D MMM YYYY")}`;
  const labelDia = diaSeleccionado.format("dddd D [de] MMMM YYYY");

  return (
    <div className="p-4 lg:p-6 space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="page-title capitalize">
            {vista === "semana" ? labelSemana : labelDia}
          </h2>
          <p className="page-subtitle">
            {vista === "semana"
              ? `${statsSemana.total} turno${statsSemana.total !== 1 ? "s" : ""} esta semana`
              : `${turnosDia.length} turno${turnosDia.length !== 1 ? "s" : ""} este día`}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="day-nav">
            <button onClick={() => (vista === "semana" ? navSemana(-1) : navDia(-1))} className="day-nav-btn">←</button>
            <button onClick={irHoy} className="day-nav-today">Hoy</button>
            <button onClick={() => (vista === "semana" ? navSemana(1) : navDia(1))} className="day-nav-btn">→</button>
          </div>

          <div className="vista-toggle">
            <button onClick={() => setVista("semana")} className={`vista-toggle-btn ${vista === "semana" ? "vista-toggle-active" : "vista-toggle-idle"}`}>Semana</button>
            <button onClick={() => setVista("dia")}    className={`vista-toggle-btn ${vista === "dia"    ? "vista-toggle-active" : "vista-toggle-idle"}`}>Día</button>
          </div>
        </div>
      </div>

      {/* ── Stats de agenda ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {STATS_CONFIG.map(({ key, label, colorVal, statCls, icon }) => (
          <div key={key} className={`stat-card ${statCls}`}>
            <div className={`mb-2 ${colorVal} opacity-70`}>{icon}</div>
            <p className={`stat-value ${colorVal}`}>{currentStats[key]}</p>
            <p className="stat-label">{statsLabels[key]}</p>
          </div>
        ))}
      </div>

      {/* ── Resumen financiero — 3 mini-cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

        {/* Cobrado */}
        <div className="stat-card stat-emerald">
          <p className="section-title mb-2">Cobrado del mes</p>
          <p className="text-2xl font-bold text-emerald-600 leading-none">
            ${(stats?.cobradoMes ?? 0).toLocaleString("es-AR")}
          </p>
          <p className="text-xs text-gray-400 mt-1.5">Tratamientos pagados</p>
        </div>

        {/* Pendiente de cobro */}
        <div className="stat-card stat-orange">
          <p className="section-title mb-2">Pendiente de cobro</p>
          <button
            onClick={() => setModalPendientes(true)}
            className="text-2xl font-bold text-orange-500 hover:text-orange-600 transition-colors leading-none text-left"
          >
            ${(stats?.pendienteCobro ?? 0).toLocaleString("es-AR")}
          </button>
          <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
            Ver detalle
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M9 18l6-6-6-6" />
            </svg>
          </p>
        </div>

        {/* Cumpleaños */}
        <div className="stat-card stat-violet">
          <p className="section-title mb-2">Cumpleaños esta semana</p>
          {cumpleanos.length === 0 ? (
            <p className="text-sm text-gray-300 mt-1">Sin cumpleaños</p>
          ) : (
            <ul className="space-y-1.5 mt-1">
              {cumpleanos.slice(0, 3).map((p) => (
                <li key={p._id} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />
                  <span className="text-xs text-gray-700 font-medium truncate">
                    {p.apellido}, {p.nombre}
                  </span>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {p.diaCumple}/{p.mesCumple}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>

      {/* ── Vista Semana ── */}
      {vista === "semana" && (
        <div className="overflow-x-auto">
          <div className="grid grid-cols-6 gap-2.5 min-w-[860px] lg:min-w-0">
            {turnosPorDia.map(({ dia, turnos, loading }) => (
              <div
                key={dia.format("YYYY-MM-DD")}
                className={`rounded-xl border flex flex-col overflow-hidden transition-all ${
                  esHoy(dia)
                    ? "border-blue-200 bg-blue-50/30 shadow-sm shadow-blue-100"
                    : "border-gray-200 bg-white"
                }`}
              >
                {/* Cabecera del día */}
                <button
                  onClick={() => seleccionarDia(dia)}
                  className={`w-full px-3 py-2.5 text-left border-b transition-colors ${
                    esHoy(dia)
                      ? "border-blue-200 hover:bg-blue-100/40"
                      : "border-gray-100 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <p className={`text-xs font-semibold uppercase tracking-wide ${esHoy(dia) ? "text-blue-500" : "text-gray-400"}`}>
                      {dia.format("ddd")}
                    </p>
                    {esHoy(dia) && (
                      <span className="pill-today">HOY</span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <p className={`text-xl font-bold leading-tight ${esHoy(dia) ? "text-blue-700" : "text-gray-700"}`}>
                      {dia.format("D")}
                    </p>
                    {turnos.length > 0 && (
                      <span className={`text-xs font-medium ${esHoy(dia) ? "text-blue-400" : "text-gray-400"}`}>
                        {turnos.length}t
                      </span>
                    )}
                  </div>
                </button>

                {/* Turnos del día */}
                <div className="flex flex-col gap-1.5 p-1.5 flex-1">
                  {loading ? (
                    <div className="text-xs text-gray-300 text-center py-4">...</div>
                  ) : turnos.length === 0 ? (
                    <div className="text-xs text-gray-300 text-center py-5">—</div>
                  ) : (
                    turnos.map((turno) => {
                      const { label: estadoLabel, color: estadoColor } = ESTADOS_TURNO[turno.estado] || {};
                      return (
                        <div
                          key={turno._id}
                          title={`${turno.hora} · ${turno.paciente?.apellido}, ${turno.paciente?.nombre} · ${estadoLabel}`}
                          className={`bg-white rounded-lg border border-gray-100 border-l-[3px] p-2 text-xs space-y-1 transition-all overflow-hidden ${
                            ESTADO_BORDER_CLS[turno.estado] || 'border-l-gray-200'
                          } ${
                            turno.estado === "cancelado" || turno.estado === "ausente"
                              ? "opacity-40"
                              : ""
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-mono text-gray-600 font-semibold text-xs flex-shrink-0">
                              {turno.hora}
                            </span>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <span className={`badge badge-sm badge-status ${estadoColor} hidden sm:inline-flex`}>
                                {estadoLabel}
                              </span>
                              {(turno.recordatorioEnviado || turno.recordatorio2hEnviado) && (
                                <span
                                  title={[
                                    turno.recordatorioEnviado   ? "Recordatorio noche" : "",
                                    turno.recordatorio2hEnviado ? "Recordatorio 2hs"   : "",
                                  ].filter(Boolean).join(" · ")}
                                  className="text-green-500 leading-none flex-shrink-0"
                                >
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
                                </span>
                              )}
                            </div>
                          </div>
                          <Link
                            to={`/pacientes/${turno.paciente?._id}`}
                            className="font-semibold text-gray-800 leading-tight hover:text-blue-600 hover:underline transition-colors block text-sm truncate"
                          >
                            {turno.paciente?.apellido}, {turno.paciente?.nombre}
                          </Link>
                          {ACCIONES[turno.estado] && (
                            <div className="pt-1 flex flex-wrap gap-1 border-t border-gray-100">
                              {ACCIONES[turno.estado].map(({ label, next, cls }) => (
                                <button
                                  key={next}
                                  onClick={() => handleEstado(turno._id, next)}
                                  className={`text-xs transition-colors ${cls}`}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Vista Día ── */}
      {vista === "dia" && (
        <div className="card overflow-hidden">
          {/* Tabs días */}
          <div className="flex border-b border-gray-100 overflow-x-auto">
            {diasSemana.map((dia) => (
              <button
                key={dia.format("YYYY-MM-DD")}
                onClick={() => setDiaSeleccionado(dia)}
                className={`day-tab ${esDiaSeleccionado(dia) ? "day-tab-active" : "day-tab-idle"}`}
              >
                <p className="text-xs font-semibold uppercase tracking-wide">{dia.format("ddd")}</p>
                <p className={`text-lg font-bold leading-tight ${esDiaSeleccionado(dia) ? "text-blue-700" : ""}`}>
                  {dia.format("D")}
                </p>
                {esHoy(dia) && (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mt-0.5" />
                )}
              </button>
            ))}
          </div>

          {diaActualData?.loading ? (
            <div className="p-10 text-center text-gray-400 text-sm">Cargando...</div>
          ) : turnosDia.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-3xl mb-2">📅</p>
              <p className="text-gray-400 text-sm">No hay turnos para este día</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {turnosDia.map((turno) => {
                const muted = turno.estado === "cancelado" || turno.estado === "ausente";
                return (
                <li
                  key={turno._id}
                  className={`turno-item ${ESTADO_BORDER_CLS[turno.estado] || 'border-l-gray-200'} ${muted ? "turno-item-muted" : "turno-item-active"}`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
                    {/* Hora */}
                    <div className="flex items-center gap-2 sm:w-16 sm:flex-col sm:items-center">
                      <span className="text-sm font-mono font-bold text-gray-800">{turno.hora}</span>
                      <span className="text-xs text-gray-400">{turno.duracion}m</span>
                    </div>

                    <div className="w-px h-10 bg-gray-100 hidden sm:block flex-shrink-0" />

                    {/* Info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          to={`/pacientes/${turno.paciente?._id}`}
                          className="text-sm font-semibold text-gray-800 hover:text-blue-600 hover:underline transition-colors"
                        >
                          {turno.paciente?.apellido}, {turno.paciente?.nombre}
                        </Link>
                        <Badge estado={turno.estado} />
                        {(turno.recordatorioEnviado || turno.recordatorio2hEnviado) && (
                          <span
                            title={[
                              turno.recordatorioEnviado   ? "Recordatorio noche" : "",
                              turno.recordatorio2hEnviado ? "Recordatorio 2hs"   : "",
                            ].filter(Boolean).join(" · ")}
                            className="badge-reminder"
                          >
                            💬 {turno.recordatorioEnviado && turno.recordatorio2hEnviado ? "×2" : "×1"}
                          </span>
                        )}
                      </div>
                      {turno.paciente?.telefono && (
                        <p className="text-xs text-gray-400">📞 {turno.paciente.telefono}</p>
                      )}
                    </div>

                    {/* Acciones */}
                    {ACCIONES_FULL[turno.estado] && (
                      <div className="flex flex-wrap gap-1.5 sm:justify-end">
                        {ACCIONES_FULL[turno.estado].map(({ label, next, cls }) => (
                          <button key={next} onClick={() => handleEstado(turno._id, next)} className={cls}>
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* ── Modal pendientes de cobro ── */}
      {modalPendientes && (
        <div className="modal-overlay">
          <div className="modal-box max-w-lg">
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Pendientes de cobro</h3>
                <p className="modal-subtitle">
                  {pendientes.length} registro{pendientes.length !== 1 ? "s" : ""} sin cobrar
                </p>
              </div>
              <button onClick={() => setModalPendientes(false)} className="modal-close">&times;</button>
            </div>

            <div className="modal-body">
              {cargandoPendientes ? (
                <p className="text-sm text-gray-400 text-center py-6">Cargando...</p>
              ) : pendientes.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Sin pendientes de cobro</p>
              ) : (
                <div className="space-y-2">
                  {pendientes.map((p) => (
                    <div key={`${p.pacienteId}-${p.historialId}`} className="modal-list-row">
                      <div className="min-w-0">
                        <Link
                          to={`/pacientes/${p.pacienteId}`}
                          onClick={() => setModalPendientes(false)}
                          className="text-sm font-semibold text-gray-800 hover:text-blue-600 hover:underline"
                        >
                          {p.nombre}
                        </Link>
                        <p className="text-xs text-gray-400 mt-0.5">{p.tratamiento}</p>
                      </div>
                      <span className="text-sm font-bold text-orange-500 shrink-0">
                        ${p.costo.toLocaleString("es-AR")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer justify-between items-center">
              <div>
                <p className="text-xs text-gray-400">Total pendiente</p>
                <p className="text-lg font-bold text-orange-500">
                  ${pendientes.reduce((acc, p) => acc + p.costo, 0).toLocaleString("es-AR")}
                </p>
              </div>
              <button onClick={() => setModalPendientes(false)} className="btn btn-md btn-secondary">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
