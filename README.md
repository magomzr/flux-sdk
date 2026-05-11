# @magomzr/flux-sdk

SDK para consumir feature flags desde un servidor Flux.

## Instalación

```sh
npm install @magomzr/flux-sdk
```

## Uso

```ts
import { FluxClient } from "@magomzr/flux-sdk";

const client = new FluxClient({
  apiKey: "tu-api-key",
  baseUrl: "https://tu-servidor-flux.com",
  pollInterval: 30_000, // opcional, default 30s
  defaults: {           // opcional, valores de fallback
    "mi-feature": false,
  },
});

await client.initialize();

// Verificar si un flag está activo
client.isEnabled("mi-feature"); // boolean

// Obtener el valor de un flag con variante
client.getVariant<string>("color-boton"); // string | null

// Obtener todos los flags
client.getAllFlags(); // FlagMap

// Detener el polling al cerrar la app
client.destroy();
```

## Cómo funciona

Al llamar `initialize()`, el cliente hace un fetch inicial de todos los flags y arranca un poller que los refresca en el intervalo configurado. Los flags se guardan en memoria. Si el servidor falla, se conservan los valores del cache anterior.

## Configuración

| Opción         | Tipo     | Requerido | Default  | Descripción                        |
|----------------|----------|-----------|----------|------------------------------------|
| `apiKey`       | `string` | ✓         | —        | Clave de autenticación             |
| `baseUrl`      | `string` | ✓         | —        | URL base del servidor Flux         |
| `pollInterval` | `number` | —         | `30000`  | Intervalo de refresco en ms        |
| `defaults`     | `object` | —         | `{}`     | Valores de fallback por flag key   |
