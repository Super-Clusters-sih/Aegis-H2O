"use client";

import { useEffect, useState } from "react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type DashboardData = {
  id: number;
  timestamp: string;
  sensor_data: {
    ph: number;
    tds_mgl: number;
    flow_lpm: number;
    turbidity_ntu: number;
    photodiode_mv: number;
  };
  prediction: {
    water_health: string;
    filter_status: string;
  };
};

type HistoryReading = {
  id: number;
  timestamp: string;
  ph: number;
  tds_mgl: number;
  flow_lpm: number;
  turbidity_ntu: number;
  photodiode_mv: number;
  water_health: string;
  filter_status: string;
};

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [history, setHistory] = useState<HistoryReading[]>([]);
  const [error, setError] = useState(false);
  const [mouse, setMouse] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const fetchLatest = async () => {
      try {
       const response = await fetch(
  "/api/latest",
  { cache: "no-store" }
);

        if (!response.ok) {
          throw new Error("API request failed");
        }

        const result = await response.json();

        setData(result);
        setError(false);
      } catch (err) {
        console.error(err);
        setError(true);
      }
    };

    const fetchHistory = async () => {
      try {
      const response = await fetch(
  "/api/history",
  { cache: "no-store" }
);

        if (!response.ok) {
          throw new Error("History API request failed");
        }

        const result = await response.json();

        setHistory(result);
      } catch (err) {
        console.error(err);
      }
    };

    fetchLatest();
    fetchHistory();

    const interval = setInterval(() => {
      fetchLatest();
      fetchHistory();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  /* ============================================================
     SCROLL REVEAL
  ============================================================ */

  useEffect(() => {
    const elements = document.querySelectorAll(".reveal");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
          }
        });
      },
      {
        threshold: 0.12,
      }
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  /* ============================================================
     MOUSE AMBIENT EFFECT
  ============================================================ */

  const handleMouseMove = (
    event: React.MouseEvent<HTMLElement>
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();

    const x =
      ((event.clientX - rect.left) / rect.width) * 100;

    const y =
      ((event.clientY - rect.top) / rect.height) * 100;

    setMouse({ x, y });
  };

  const sensor = data?.sensor_data;
  const prediction = data?.prediction;

  return (
    <>
      {/* ========================================================
          GLOBAL STYLES
      ======================================================== */}

      <style jsx global>{`

        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          background: #f8fafc;
        }

        /* -----------------------------
           SCROLLBAR
        ----------------------------- */

        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #f1f5f9;
        }

        ::-webkit-scrollbar-thumb {
          background: linear-gradient(
            180deg,
            #14b8a6,
            #8b5cf6
          );
          border-radius: 999px;
        }

        /* -----------------------------
           REVEAL
        ----------------------------- */

        .reveal {
          opacity: 0;
          transform: translateY(35px);
          transition:
            opacity 0.8s ease,
            transform 0.8s cubic-bezier(.22,1,.36,1);
        }

        .reveal.revealed {
          opacity: 1;
          transform: translateY(0);
        }

        /* -----------------------------
           FLOAT
        ----------------------------- */

        @keyframes floatOne {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }

          50% {
            transform: translate3d(18px, -24px, 0);
          }
        }

        @keyframes floatTwo {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }

          50% {
            transform: translate3d(-20px, 20px, 0);
          }
        }

        @keyframes floatThree {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }

          50% {
            transform: translate3d(12px, 25px, 0);
          }
        }

        .float-one {
          animation: floatOne 8s ease-in-out infinite;
        }

        .float-two {
          animation: floatTwo 10s ease-in-out infinite;
        }

        .float-three {
          animation: floatThree 7s ease-in-out infinite;
        }

        /* -----------------------------
           PULSE
        ----------------------------- */

        @keyframes livePulse {
          0% {
            box-shadow:
              0 0 0 0 rgba(16, 185, 129, 0.35);
          }

          70% {
            box-shadow:
              0 0 0 9px rgba(16, 185, 129, 0);
          }

          100% {
            box-shadow:
              0 0 0 0 rgba(16, 185, 129, 0);
          }
        }

        .live-pulse {
          animation: livePulse 2s infinite;
        }

        /* -----------------------------
           SHIMMER
        ----------------------------- */

        @keyframes shimmer {
          0% {
            transform: translateX(-130%);
          }

          100% {
            transform: translateX(130%);
          }
        }

        .shimmer {
          animation: shimmer 2.5s infinite;
        }

        /* -----------------------------
           WATER WAVE
        ----------------------------- */

        @keyframes wave {
          0% {
            transform: translateX(-4%);
          }

          50% {
            transform: translateX(4%);
          }

          100% {
            transform: translateX(-4%);
          }
        }

        .wave-animation {
          animation: wave 7s ease-in-out infinite;
        }

        /* -----------------------------
           CARD HOVER
        ----------------------------- */

        .premium-card {
          transition:
            transform 0.4s cubic-bezier(.22,1,.36,1),
            box-shadow 0.4s ease,
            border-color 0.4s ease;
        }

        .premium-card:hover {
          transform: translateY(-7px);
          box-shadow:
            0 24px 60px rgba(15, 23, 42, 0.10),
            0 8px 25px rgba(15, 23, 42, 0.05);
        }

        /* -----------------------------
           SENSOR HOVER
        ----------------------------- */

        .sensor-card {
          transition:
            transform 0.35s cubic-bezier(.22,1,.36,1),
            box-shadow 0.35s ease;
        }

        .sensor-card:hover {
          transform:
            translateY(-8px)
            scale(1.015);
          box-shadow:
            0 22px 45px rgba(15, 23, 42, 0.11);
        }

        /* -----------------------------
           GRADIENT BORDER
        ----------------------------- */

        .gradient-border {
          position: relative;
        }

        .gradient-border::before {
          content: "";
          position: absolute;
          inset: 0;
          padding: 1px;
          border-radius: inherit;
          background: linear-gradient(
            120deg,
            rgba(20,184,166,.25),
            rgba(59,130,246,.18),
            rgba(139,92,246,.25),
            rgba(244,63,94,.15)
          );

          -webkit-mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);

          -webkit-mask-composite: xor;
          mask-composite: exclude;

          pointer-events: none;
        }

        /* -----------------------------
           HERO GRID
        ----------------------------- */

        .hero-grid {
          background-image:
            linear-gradient(
              rgba(148,163,184,.08) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(148,163,184,.08) 1px,
              transparent 1px
            );

          background-size: 32px 32px;
        }

        /* -----------------------------
           TEXT GRADIENT
        ----------------------------- */

        .rainbow-text {
          background:
            linear-gradient(
              90deg,
              #0f766e,
              #0891b2,
              #2563eb,
              #7c3aed,
              #db2777
            );

          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        /* -----------------------------
           TABLE ROW
        ----------------------------- */

        .table-row {
          transition:
            background-color 0.25s ease,
            transform 0.25s ease;
        }

        .table-row:hover {
          background: #f8fafc;
        }

        /* -----------------------------
           BUTTON
        ----------------------------- */

        .shine-button {
          position: relative;
          overflow: hidden;
        }

        .shine-button::after {
          content: "";
          position: absolute;
          top: 0;
          left: -100%;
          width: 70%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255,255,255,.35),
            transparent
          );
          transform: skewX(-20deg);
          transition: left 0.6s ease;
        }

        .shine-button:hover::after {
          left: 140%;
        }

        /* -----------------------------
           MOBILE
        ----------------------------- */

        @media (max-width: 640px) {

          .hero-title {
            font-size: 2.2rem;
            line-height: 1.08;
          }

        }

      `}</style>


      {/* ========================================================
          MAIN
      ======================================================== */}

      <main
        onMouseMove={handleMouseMove}
        className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900"
      >


        {/* ======================================================
            AMBIENT BACKGROUND
        ====================================================== */}

        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">

          <div
            className="absolute h-[500px] w-[500px] rounded-full bg-teal-200/20 blur-[100px]"
            style={{
              left: `${mouse.x - 25}%`,
              top: `${mouse.y - 25}%`,
              transition:
                "left 1.2s ease, top 1.2s ease",
            }}
          />

          <div className="float-one absolute -left-32 top-32 h-72 w-72 rounded-full bg-cyan-200/30 blur-3xl" />

          <div className="float-two absolute right-[-100px] top-[30%] h-80 w-80 rounded-full bg-violet-200/25 blur-3xl" />

          <div className="float-three absolute bottom-[-150px] left-[40%] h-96 w-96 rounded-full bg-rose-200/20 blur-3xl" />

        </div>


        {/* ======================================================
            NAVBAR
        ====================================================== */}

        <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-2xl">

          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">

            {/* BRAND */}

            <div className="flex items-center gap-3">

              <div className="relative">

                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-teal-400 to-violet-500 opacity-30 blur-lg" />

                <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 via-cyan-500 to-violet-600 shadow-lg">

                  <svg
                    viewBox="0 0 24 24"
                    className="h-6 w-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path
                      d="M12 3C12 3 6 9.3 6 14a6 6 0 0 0 12 0c0-4.7-6-11-6-11Z"
                      fill="currentColor"
                      fillOpacity="0.2"
                    />

                    <path d="M12 3C12 3 6 9.3 6 14a6 6 0 0 0 12 0c0-4.7-6-11-6-11Z" />

                    <path d="m9.5 14.5 1.7 1.7 3.5-3.8" />
                  </svg>

                </div>

              </div>


              <div>

                <h1 className="text-xl font-black tracking-tight sm:text-2xl">

                  Aegis{" "}

                  <span className="rainbow-text">
                    H2O
                  </span>

                </h1>

                <p className="hidden text-[11px] font-medium text-slate-400 sm:block">
                  Intelligent Water Monitoring
                </p>

              </div>

            </div>


            {/* STATUS */}

            <div
              className={`flex items-center gap-2 rounded-full border px-3 py-2 shadow-sm ${
                error
                  ? "border-red-200 bg-red-50"
                  : "border-emerald-200 bg-emerald-50"
              }`}
            >

              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  error
                    ? "bg-red-500"
                    : "live-pulse bg-emerald-500"
                }`}
              />

              <span
                className={`text-xs font-bold sm:text-sm ${
                  error
                    ? "text-red-600"
                    : "text-emerald-600"
                }`}
              >
                {error
                  ? "API Offline"
                  : "System Online"}
              </span>

            </div>

          </div>

        </header>


        {/* ======================================================
            CONTENT
        ====================================================== */}

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">


          {/* ====================================================
              HERO
          ==================================================== */}

          <section className="reveal">

            <div className="hero-grid gradient-border relative overflow-hidden rounded-[2rem] bg-white p-6 shadow-sm sm:p-9 lg:p-12">

              {/* gradient glow */}

              <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-cyan-200/30 blur-3xl" />

              <div className="pointer-events-none absolute -bottom-32 right-1/4 h-72 w-72 rounded-full bg-violet-200/25 blur-3xl" />


              {/* animated water */}

              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-20 overflow-hidden opacity-40">

                <div className="wave-animation absolute -bottom-10 left-[-5%] h-24 w-[110%] rounded-[50%] bg-gradient-to-r from-cyan-100 via-teal-100 to-blue-100" />

              </div>


              <div className="relative max-w-3xl">

                {/* live pill */}

                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3.5 py-2">

                  <span className="live-pulse h-2 w-2 rounded-full bg-teal-500" />

                  <span className="text-[10px] font-black tracking-[0.18em] text-teal-700">
                    LIVE MONITORING
                  </span>

                </div>


                {/* heading */}

                <h2 className="hero-title text-4xl font-black leading-tight tracking-[-0.04em] text-slate-900 sm:text-5xl lg:text-6xl">

                  Water intelligence.

                  <br />

                  <span className="rainbow-text">
                    Every drop matters.
                  </span>

                </h2>


                <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">

                  Aegis H2O combines real-time sensor monitoring,
                  machine-learning predictions and persistent data
                  storage into one intelligent water monitoring system.

                </p>


                {/* quick stats */}

                <div className="mt-7 flex flex-wrap gap-3">

                  <MiniStat
                    icon="sensor"
                    value="05"
                    label="Sensors"
                    color="teal"
                  />

                  <MiniStat
                    icon="brain"
                    value="ML"
                    label="Prediction"
                    color="violet"
                  />

                  <MiniStat
                    icon="database"
                    value="24/7"
                    label="Monitoring"
                    color="rose"
                  />

                </div>

              </div>

            </div>

          </section>


          {/* ====================================================
              OVERVIEW
          ==================================================== */}

          <section
            className="reveal mt-12"
          >

            <SectionHeading
              eyebrow="INTELLIGENCE"
              title="System Overview"
              description="Live predictions generated from the current sensor stream."
              color="violet"
            />


            <div className="grid gap-5 md:grid-cols-2">


              {/* WATER HEALTH */}

              <PredictionCard
                title="Water Health"
                value={
                  prediction?.water_health ??
                  "Loading..."
                }
                description="ML prediction based on live sensor readings"
                icon="water"
                type="health"
              />


              {/* FILTER */}

              <PredictionCard
                title="Filter Status"
                value={
                  prediction?.filter_status ??
                  "Loading..."
                }
                description="Current estimated filter condition"
                icon="filter"
                type="filter"
              />

            </div>

          </section>


          {/* ====================================================
              SENSOR NETWORK
          ==================================================== */}

          <section
            className="reveal mt-12"
          >

            <SectionHeading
              eyebrow="SENSOR NETWORK"
              title="Live Sensors"
              description="Real-time measurements received from the monitoring system."
              color="teal"
            />


            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

              <SensorCard
                name="pH"
                value={
                  sensor?.ph?.toFixed(2) ??
                  "--"
                }
                unit=""
                color="cyan"
                icon="ph"
              />

              <SensorCard
                name="TDS"
                value={
                  sensor?.tds_mgl?.toFixed(2) ??
                  "--"
                }
                unit="mg/L"
                color="violet"
                icon="tds"
              />

              <SensorCard
                name="Flow"
                value={
                  sensor?.flow_lpm?.toFixed(2) ??
                  "--"
                }
                unit="L/min"
                color="blue"
                icon="flow"
              />

              <SensorCard
                name="Turbidity"
                value={
                  sensor?.turbidity_ntu?.toFixed(2) ??
                  "--"
                }
                unit="NTU"
                color="orange"
                icon="turbidity"
              />

              <SensorCard
                name="Photodiode"
                value={
                  sensor?.photodiode_mv?.toFixed(2) ??
                  "--"
                }
                unit="mV"
                color="rose"
                icon="photo"
              />

            </div>

          </section>


          {/* ====================================================
              ANALYTICS
          ==================================================== */}

          <section
            className="reveal mt-12"
          >

            <div className="grid gap-5 lg:grid-cols-3">


              {/* CHART */}

              <div className="premium-card gradient-border overflow-hidden rounded-3xl bg-white p-5 shadow-sm sm:p-6 lg:col-span-2">

                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

                  <div>

                    <div className="flex items-center gap-2">

                      <span className="h-2.5 w-2.5 rounded-full bg-cyan-500 shadow-lg shadow-cyan-300" />

                      <h2 className="text-lg font-black text-slate-900">
                        Water Quality Trend
                      </h2>

                    </div>

                    <p className="mt-1 text-xs text-slate-400">
                      Live pH history from PostgreSQL
                    </p>

                  </div>


                  <div className="shine-button inline-flex w-fit items-center gap-2 rounded-xl border border-cyan-100 bg-cyan-50 px-3 py-2">

                    <span className="text-xs font-black text-cyan-700">
                      pH
                    </span>

                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />

                    <span className="text-[9px] font-bold tracking-wider text-cyan-600">
                      LIVE
                    </span>

                  </div>

                </div>


                {/* chart */}

                <div className="relative mt-6 h-72 overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 via-white to-cyan-50/30 p-2">

                  <div className="pointer-events-none absolute left-10 top-8 h-32 w-32 rounded-full bg-cyan-100/40 blur-3xl" />

                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >

                    <LineChart
                      data={history}
                      margin={{
                        top: 12,
                        right: 12,
                        left: -15,
                        bottom: 0,
                      }}
                    >

                      <CartesianGrid
                        strokeDasharray="4 5"
                        stroke="#e2e8f0"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="timestamp"
                        tickFormatter={(value) =>
                          new Date(
                            String(value)
                          ).toLocaleTimeString()
                        }
                        stroke="#94a3b8"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                      />

                      <YAxis
                        stroke="#94a3b8"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        domain={[
                          "auto",
                          "auto",
                        ]}
                      />

                      <Tooltip
                        labelFormatter={(value) =>
                          new Date(
                            String(value)
                          ).toLocaleTimeString()
                        }
                        contentStyle={{
                          backgroundColor:
                            "#ffffff",
                          border:
                            "1px solid #e2e8f0",
                          borderRadius:
                            "14px",
                          boxShadow:
                            "0 20px 45px rgba(15,23,42,.12)",
                          color: "#0f172a",
                          fontSize: "12px",
                        }}
                      />

                      <Line
                        type="monotone"
                        dataKey="ph"
                        name="pH"
                        stroke="#06b6d4"
                        strokeWidth={3}
                        dot={false}
                        activeDot={{
                          r: 6,
                          strokeWidth: 3,
                          stroke: "#ffffff",
                          fill: "#06b6d4",
                        }}
                        isAnimationActive={true}
                        animationDuration={800}
                      />

                    </LineChart>

                  </ResponsiveContainer>

                </div>


                {/* chart footer */}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">

                  <div className="flex items-center gap-2">

                    <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />

                    <span className="text-xs font-semibold text-slate-500">
                      pH history
                    </span>

                  </div>


                  <span className="rounded-lg bg-slate-50 px-3 py-1.5 text-[10px] font-bold text-slate-400">

                    {history.length} readings

                  </span>

                </div>

              </div>


              {/* SYSTEM STATUS */}

              <div className="premium-card rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="flex items-start justify-between">

                  <div>

                    <p className="text-[10px] font-black tracking-[0.18em] text-violet-600">
                      INFRASTRUCTURE
                    </p>

                    <h2 className="mt-1 text-xl font-black text-slate-900">
                      System Status
                    </h2>

                  </div>


                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">

                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="3"
                      />

                      <path d="M12 2v3" />
                      <path d="M12 19v3" />
                      <path d="m4.93 4.93 2.12 2.12" />
                      <path d="m16.95 16.95 2.12 2.12" />
                      <path d="M2 12h3" />
                      <path d="M19 12h3" />
                      <path d="m4.93 19.07 2.12-2.12" />
                      <path d="m16.95 7.05 2.12-2.12" />
                    </svg>

                  </div>

                </div>


                <div className="mt-7 space-y-3">

                  <StatusRow
                    name="FastAPI"
                    description="Backend API"
                    status={
                      error
                        ? "Disconnected"
                        : "Connected"
                    }
                  />

                  <StatusRow
                    name="ML Engine"
                    description="Prediction service"
                    status="Ready"
                  />

                  <StatusRow
                    name="PostgreSQL"
                    description="Data storage"
                    status="Connected"
                  />

                  <StatusRow
                    name="Sensors"
                    description="Current data source"
                    status="Simulated"
                  />

                </div>


                {/* refresh card */}

                <div className="mt-5 overflow-hidden rounded-2xl bg-gradient-to-br from-violet-50 via-blue-50 to-cyan-50 p-4">

                  <div className="flex items-center justify-between">

                    <div>

                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Data refresh
                      </p>

                      <p className="mt-1 text-sm font-black text-slate-800">
                        Every 2 seconds
                      </p>

                    </div>


                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 shadow-sm">

                      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-violet-500" />

                    </div>

                  </div>

                  <div className="mt-3 h-1 overflow-hidden rounded-full bg-white">

                    <div className="shimmer h-full w-1/2 rounded-full bg-gradient-to-r from-violet-400 to-cyan-400" />

                  </div>

                </div>

              </div>

            </div>

          </section>


          {/* ====================================================
              LATEST READING
          ==================================================== */}

          <section
            className="reveal mt-12"
          >

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

              {/* heading */}

              <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">

                <div>

                  <p className="text-[10px] font-black tracking-[0.18em] text-rose-500">
                    LIVE DATA
                  </p>

                  <h2 className="mt-1 text-xl font-black text-slate-900">
                    Latest Reading
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">
                    Most recent measurement received by Aegis H2O
                  </p>

                </div>


                <div className="flex w-fit items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">

                  <span className="live-pulse h-2 w-2 rounded-full bg-emerald-500" />

                  <span className="text-[10px] font-black text-emerald-700">
                    AUTO UPDATING
                  </span>

                </div>

              </div>


              {/* table */}

              <div className="overflow-x-auto">

                <table className="w-full min-w-[760px] text-left">

                  <thead className="bg-slate-50">

                    <tr className="text-[10px] font-black uppercase tracking-wider text-slate-400">

                      <th className="px-5 py-4">
                        Time
                      </th>

                      <th className="px-5 py-4">
                        pH
                      </th>

                      <th className="px-5 py-4">
                        TDS
                      </th>

                      <th className="px-5 py-4">
                        Flow
                      </th>

                      <th className="px-5 py-4">
                        Turbidity
                      </th>

                      <th className="px-5 py-4">
                        Health
                      </th>

                      <th className="px-5 py-4">
                        Filter
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    <tr className="table-row border-t border-slate-100">

                      <td className="px-5 py-5 text-xs font-semibold text-slate-500">

                        {data
                          ? new Date(
                              data.timestamp
                            ).toLocaleTimeString()
                          : "--"}

                      </td>


                      <td className="px-5 py-5">

                        <ValueBadge
                          value={
                            sensor?.ph?.toFixed(2) ??
                            "--"
                          }
                          color="cyan"
                        />

                      </td>


                      <td className="px-5 py-5 text-sm font-bold text-violet-600">

                        {sensor?.tds_mgl?.toFixed(2) ??
                          "--"}

                      </td>


                      <td className="px-5 py-5 text-sm font-bold text-blue-600">

                        {sensor?.flow_lpm?.toFixed(2) ??
                          "--"}

                      </td>


                      <td className="px-5 py-5 text-sm font-bold text-orange-600">

                        {sensor?.turbidity_ntu?.toFixed(2) ??
                          "--"}

                      </td>


                      <td className="px-5 py-5">

                        <StatusBadge
                          value={
                            prediction?.water_health ??
                            "--"
                          }
                          type="health"
                        />

                      </td>


                      <td className="px-5 py-5">

                        <StatusBadge
                          value={
                            prediction?.filter_status ??
                            "--"
                          }
                          type="filter"
                        />

                      </td>

                    </tr>

                  </tbody>

                </table>

              </div>

            </div>

          </section>


          {/* ====================================================
              FOOTER
          ==================================================== */}

          <footer className="reveal mt-12 pb-5">

            <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-6 text-xs text-slate-400 sm:flex-row">

              <div className="flex items-center gap-2">

                <span className="font-bold text-slate-600">
                  Aegis H2O
                </span>

                <span className="h-1 w-1 rounded-full bg-slate-300" />

                <span>
                  Intelligent Water Monitoring
                </span>

              </div>


              <div className="flex items-center gap-2">

                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                <span>
                  Monitoring active
                </span>

              </div>

            </div>

          </footer>

        </div>

      </main>
    </>
  );
}


/* ================================================================
   SECTION HEADING
================================================================ */

function SectionHeading({
  eyebrow,
  title,
  description,
  color,
}: {
  eyebrow: string;
  title: string;
  description: string;
  color: "teal" | "violet";
}) {

  const eyebrowColor =
    color === "teal"
      ? "text-teal-600"
      : "text-violet-600";

  return (

    <div className="mb-6">

      <p
        className={`text-[10px] font-black tracking-[0.2em] ${eyebrowColor}`}
      >
        {eyebrow}
      </p>

      <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
        {title}
      </h2>

      <p className="mt-1 text-sm text-slate-400">
        {description}
      </p>

    </div>

  );
}


/* ================================================================
   MINI STAT
================================================================ */

function MiniStat({
  icon,
  value,
  label,
  color,
}: {
  icon: string;
  value: string;
  label: string;
  color: "teal" | "violet" | "rose";
}) {

  const styles = {
    teal: "bg-teal-50 text-teal-700 border-teal-100",
    violet:
      "bg-violet-50 text-violet-700 border-violet-100",
    rose:
      "bg-rose-50 text-rose-700 border-rose-100",
  };

  return (

    <div
      className={`flex items-center gap-3 rounded-2xl border px-4 py-2.5 ${styles[color]}`}
    >

      <div className="text-xs font-black">
        {value}
      </div>

      <div className="h-5 w-px bg-current opacity-10" />

      <div className="text-[10px] font-bold">
        {label}
      </div>

    </div>

  );
}


/* ================================================================
   PREDICTION CARD
================================================================ */

function PredictionCard({
  title,
  value,
  description,
  icon,
  type,
}: {
  title: string;
  value: string;
  description: string;
  icon: "water" | "filter";
  type: "health" | "filter";
}) {

  const isHealth = type === "health";

  const accent = isHealth
    ? {
        border: "border-emerald-100",
        glow: "bg-emerald-100",
        icon: "bg-emerald-50 text-emerald-600",
        text: "text-emerald-600",
        gradient:
          "from-emerald-400 via-teal-400 to-cyan-500",
      }
    : {
        border: "border-violet-100",
        glow: "bg-violet-100",
        icon: "bg-violet-50 text-violet-600",
        text: "text-violet-600",
        gradient:
          "from-violet-400 via-purple-500 to-fuchsia-500",
      };

  return (

    <div
      className={`premium-card group relative overflow-hidden rounded-3xl border bg-white p-6 shadow-sm ${accent.border}`}
    >

      {/* glow */}

      <div
        className={`absolute -right-12 -top-12 h-44 w-44 rounded-full opacity-50 blur-3xl transition-all duration-700 group-hover:scale-150 ${accent.glow}`}
      />


      <div className="relative">

        <div className="flex items-start justify-between">

          <div>

            <p className="text-sm font-bold text-slate-500">
              {title}
            </p>

            <h3
              className={`mt-2 text-3xl font-black ${accent.text}`}
            >
              {value}
            </h3>

          </div>


          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl ${accent.icon}`}
          >

            {icon === "water" ? (

              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >

                <path d="M12 3C12 3 6 9.3 6 14a6 6 0 0 0 12 0c0-4.7-6-11-6-11Z" />

                <path d="m9.5 14.5 1.7 1.7 3.5-3.8" />

              </svg>

            ) : (

              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >

                <path d="M4 5h16" />

                <path d="M7 5v7l5 5v2" />

                <path d="M17 5v7l-5 5" />

                <path d="M8 21h8" />

              </svg>

            )}

          </div>

        </div>


        {/* progress */}

        <div className="mt-7 h-2 overflow-hidden rounded-full bg-slate-100">

          <div
            className={`relative h-full w-[82%] overflow-hidden rounded-full bg-gradient-to-r ${accent.gradient}`}
          >

            <div className="shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent" />

          </div>

        </div>


        <div className="mt-3 flex items-center justify-between">

          <p className="text-xs text-slate-400">
            {description}
          </p>

          <span className={`text-[10px] font-black ${accent.text}`}>
            LIVE
          </span>

        </div>

      </div>

    </div>

  );
}


/* ================================================================
   SENSOR CARD
================================================================ */

function SensorCard({
  name,
  value,
  unit,
  color,
  icon,
}: {
  name: string;
  value: string;
  unit: string;
  color:
    | "cyan"
    | "violet"
    | "blue"
    | "orange"
    | "rose";
  icon: string;
}) {

  const styles = {

    cyan: {
      icon: "from-cyan-400 to-teal-500",
      soft: "bg-cyan-50",
      text: "text-cyan-700",
      dot: "bg-cyan-500",
    },

    violet: {
      icon: "from-violet-500 to-purple-600",
      soft: "bg-violet-50",
      text: "text-violet-700",
      dot: "bg-violet-500",
    },

    blue: {
      icon: "from-blue-500 to-indigo-600",
      soft: "bg-blue-50",
      text: "text-blue-700",
      dot: "bg-blue-500",
    },

    orange: {
      icon: "from-orange-400 to-amber-500",
      soft: "bg-orange-50",
      text: "text-orange-700",
      dot: "bg-orange-500",
    },

    rose: {
      icon: "from-rose-500 to-pink-600",
      soft: "bg-rose-50",
      text: "text-rose-700",
      dot: "bg-rose-500",
    },

  };

  const current = styles[color];

  return (

    <div className="sensor-card group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">

      {/* hover glow */}

      <div
        className={`absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-0 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-70 ${current.soft}`}
      />


      <div className="relative">

        <div className="flex items-center justify-between">

          <div className="flex items-center gap-3">

            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${current.icon} text-white shadow-md`}
            >

              <SensorIcon type={icon} />

            </div>


            <div>

              <p className="text-sm font-black text-slate-700">
                {name}
              </p>

              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Sensor
              </p>

            </div>

          </div>


          <span
            className={`h-2 w-2 animate-pulse rounded-full ${current.dot}`}
          />

        </div>


        <div className="mt-6 flex items-baseline gap-1">

          <span className="text-2xl font-black tracking-tight text-slate-900">
            {value}
          </span>

          <span className="text-[10px] font-bold text-slate-400">
            {unit}
          </span>

        </div>


        <div className="mt-4 flex items-center gap-2">

          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">

            <div
              className={`h-full w-[65%] rounded-full bg-gradient-to-r ${current.icon} transition-all duration-700 group-hover:w-[88%]`}
            />

          </div>

          <span className={`text-[9px] font-black ${current.text}`}>
            LIVE
          </span>

        </div>

      </div>

    </div>

  );
}


/* ================================================================
   SENSOR ICON
================================================================ */

function SensorIcon({
  type,
}: {
  type: string;
}) {

  if (type === "ph") {

    return (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >

        <path d="M12 3C12 3 6 9.3 6 14a6 6 0 0 0 12 0c0-4.7-6-11-6-11Z" />

        <path d="M9 14h6" />

      </svg>
    );

  }


  if (type === "tds") {

    return (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >

        <circle cx="12" cy="12" r="8" />

        <circle cx="9" cy="10" r="1" />

        <circle cx="15" cy="14" r="1" />

        <path d="m8 16 8-8" />

      </svg>
    );

  }


  if (type === "flow") {

    return (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >

        <path d="M3 12h18" />

        <path d="m14 7 5 5-5 5" />

        <path d="M3 7h5" />

        <path d="M3 17h5" />

      </svg>
    );

  }


  if (type === "turbidity") {

    return (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >

        <path d="M12 3C12 3 6 9.5 6 14a6 6 0 0 0 12 0c0-4.5-6-11-6-11Z" />

        <circle
          cx="9"
          cy="14"
          r="0.8"
          fill="currentColor"
        />

        <circle
          cx="13"
          cy="16"
          r="0.8"
          fill="currentColor"
        />

        <circle
          cx="15"
          cy="12"
          r="0.8"
          fill="currentColor"
        />

      </svg>
    );

  }


  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >

      <circle cx="12" cy="12" r="7" />

      <path d="M12 5v14" />

      <path d="M5 12h14" />

      <path d="M8 8l8 8" />

      <path d="M16 8l-8 8" />

    </svg>
  );
}


/* ================================================================
   STATUS ROW
================================================================ */

function StatusRow({
  name,
  description,
  status,
}: {
  name: string;
  description: string;
  status: string;
}) {

  const connected =
    status === "Connected" ||
    status === "Ready" ||
    status === "Simulated";

  return (

    <div className="group flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 transition-all duration-300 hover:border-slate-200 hover:bg-white hover:shadow-md">

      <div className="flex items-center gap-3">

        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${
            connected
              ? "bg-emerald-50"
              : "bg-red-50"
          }`}
        >

          <span
            className={`h-2.5 w-2.5 rounded-full ${
              connected
                ? "live-pulse bg-emerald-500"
                : "bg-red-500"
            }`}
          />

        </div>


        <div>

          <p className="text-sm font-black text-slate-700">
            {name}
          </p>

          <p className="text-[10px] text-slate-400">
            {description}
          </p>

        </div>

      </div>


      <span
        className={`rounded-full px-2.5 py-1 text-[9px] font-black ${
          connected
            ? "bg-emerald-50 text-emerald-600"
            : "bg-red-50 text-red-600"
        }`}
      >
        {status}
      </span>

    </div>

  );
}


/* ================================================================
   STATUS BADGE
================================================================ */

function StatusBadge({
  value,
  type,
}: {
  value: string;
  type: "health" | "filter";
}) {

  const healthClass =
    value === "Safe"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : value === "Moderate"
        ? "bg-amber-50 text-amber-700 border-amber-100"
        : value === "Unsafe"
          ? "bg-red-50 text-red-700 border-red-100"
          : "bg-slate-50 text-slate-600 border-slate-100";

  const filterClass =
    value === "Good"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : value === "Normal"
        ? "bg-blue-50 text-blue-700 border-blue-100"
        : value === "Degraded"
          ? "bg-amber-50 text-amber-700 border-amber-100"
          : value === "Replace"
            ? "bg-red-50 text-red-700 border-red-100"
            : "bg-slate-50 text-slate-600 border-slate-100";

  return (

    <span
      className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-black ${
        type === "health"
          ? healthClass
          : filterClass
      }`}
    >
      {value}
    </span>

  );
}


/* ================================================================
   VALUE BADGE
================================================================ */

function ValueBadge({
  value,
  color,
}: {
  value: string;
  color: "cyan";
}) {

  return (

    <span
      className={
        color === "cyan"
          ? "inline-flex rounded-xl border border-cyan-100 bg-cyan-50 px-3 py-1.5 text-xs font-black text-cyan-700"
          : ""
      }
    >
      {value}
    </span>

  );
}