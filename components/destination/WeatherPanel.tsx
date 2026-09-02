"use client";

import { motion } from "motion/react";
import type { WeatherNow } from "@/lib/types";
import { weatherLabel, weekdayShort } from "@/lib/format";
import { WeatherIcon } from "@/components/destination/WeatherIcon";
import { fadeUp } from "@/lib/motion";

export function WeatherPanel({ weather }: { weather: WeatherNow }) {
  const now = Math.round(weather.temperature ?? 0);

  return (
    <motion.section
      variants={fadeUp}
      className="surface-card rounded-3xl p-6"
      aria-label="Local weather"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-ink-mute)]">
            On the ground now
          </p>
          <p className="mt-2 font-display text-5xl text-[var(--color-ink)]">
            {now}
            <span className="align-top text-2xl text-[var(--color-ink-mute)]">
              C
            </span>
          </p>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            {weatherLabel(weather.code)}
            {weather.apparentTemperature !== null &&
              `, feels ${Math.round(weather.apparentTemperature)}`}
          </p>
        </div>
        <WeatherIcon code={weather.code} size={64} isDay={weather.isDay} />
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-xl border border-[var(--color-hairline)] px-3 py-2">
          <dt className="text-[var(--color-ink-mute)]">Humidity</dt>
          <dd className="mt-0.5 text-sm text-[var(--color-ink)]">
            {weather.humidity !== null ? `${Math.round(weather.humidity)}%` : "n/a"}
          </dd>
        </div>
        <div className="rounded-xl border border-[var(--color-hairline)] px-3 py-2">
          <dt className="text-[var(--color-ink-mute)]">Wind</dt>
          <dd className="mt-0.5 text-sm text-[var(--color-ink)]">
            {weather.windSpeed !== null
              ? `${Math.round(weather.windSpeed)} km/h`
              : "n/a"}
          </dd>
        </div>
      </dl>

      {weather.daily.length > 0 && (
        <div className="mt-5 flex justify-between gap-1">
          {weather.daily.slice(0, 7).map((day, index) => (
            <motion.div
              key={day.date}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
              className="flex flex-1 flex-col items-center gap-1.5"
            >
              <span className="text-[10px] uppercase tracking-wide text-[var(--color-ink-mute)]">
                {index === 0 ? "Today" : weekdayShort(day.date)}
              </span>
              <WeatherIcon code={day.code} size={26} />
              <span className="text-[11px] text-[var(--color-ink)]">
                {day.tempMax !== null ? Math.round(day.tempMax) : "-"}
              </span>
              <span className="text-[10px] text-[var(--color-ink-mute)]">
                {day.tempMin !== null ? Math.round(day.tempMin) : "-"}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </motion.section>
  );
}
