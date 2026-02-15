"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Wind } from "lucide-react";

interface WeatherData {
  temp: number;
  description: string;
  icon: string;
  high: number;
  low: number;
  location: string;
}

const weatherIcons: Record<string, React.ElementType> = {
  Clear: Sun,
  Clouds: Cloud,
  Rain: CloudRain,
  Drizzle: CloudRain,
  Snow: CloudSnow,
  Thunderstorm: CloudLightning,
};

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/weather")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setWeather(data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Weather
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-16 animate-pulse rounded bg-secondary" />
        </CardContent>
      </Card>
    );
  }

  if (!weather) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Weather
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Set your location in settings to see weather
          </p>
        </CardContent>
      </Card>
    );
  }

  const IconComponent = weatherIcons[weather.icon] || Wind;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Weather — {weather.location}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <IconComponent className="h-10 w-10 text-primary" />
          <div>
            <p className="text-2xl font-bold">{Math.round(weather.temp)}&deg;F</p>
            <p className="text-sm text-muted-foreground capitalize">
              {weather.description}
            </p>
          </div>
          <div className="ml-auto text-right text-sm">
            <p>H: {Math.round(weather.high)}&deg;</p>
            <p>L: {Math.round(weather.low)}&deg;</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
