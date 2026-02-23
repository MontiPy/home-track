interface WeatherData {
  temp: number;
  description: string;
  icon: string;
  high: number;
  low: number;
  location: string;
}

export async function getWeather(
  location: string
): Promise<WeatherData | null> {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;

  if (!apiKey) {
    console.error("OPENWEATHERMAP_API_KEY is not set");
    return null;
  }

  try {
    // Detect US ZIP codes (5 digits) and use the zip parameter
    const isZipCode = /^\d{5}$/.test(location.trim());
    const query = isZipCode
      ? `zip=${location.trim()},US`
      : `q=${encodeURIComponent(location)}`;
    const url = `https://api.openweathermap.org/data/2.5/weather?${query}&appid=${apiKey}&units=imperial`;

    const response = await fetch(url, { next: { revalidate: 600 } });

    if (!response.ok) {
      console.error(
        `Weather API error: ${response.status} ${response.statusText}`
      );
      return null;
    }

    const data = await response.json();

    return {
      temp: Math.round(data.main.temp),
      description: data.weather[0].description,
      icon: data.weather[0].main,
      high: Math.round(data.main.temp_max),
      low: Math.round(data.main.temp_min),
      location: data.name,
    };
  } catch (error) {
    console.error("Failed to fetch weather data:", error);
    return null;
  }
}
