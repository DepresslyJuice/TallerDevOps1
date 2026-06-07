# 🚀 Taller DevOps - API de Pruebas

Esta es una API REST premium desarrollada en **Node.js** con **TypeScript** y **Express** utilizando **pnpm** para la gestión de dependencias. Está especialmente diseñada para cumplir con todos los requerimientos técnicos y de observabilidad exigidos en el taller de DevOps.

## ✨ Características Clave

1. **Observabilidad Integrada:**
   * **Prometheus Metrics (`/metrics`):** Métricas nativas de la aplicación (uso de CPU, memoria, bucle de eventos) y métricas personalizadas (`http_requests_total`, `http_request_duration_seconds`) para facilitar la creación de dashboards de SLO en Grafana.
   * **Health Check (`/health`):** Endpoint de Liveness Probe que retorna el estado del servicio y su uptime.
   * **Readiness Check (`/ready`):** Endpoint de Readiness Probe para asegurar que el contenedor está listo para recibir tráfico, simulando validación de base de datos.

2. **Logs Estructurados con Trazabilidad:**
   * Emisión de logs en formato JSON nativo (ideal para recolectores de logs como Promtail, Fluentd o Logstash).
   * Middleware de trazabilidad que genera o propaga un `trace_id` (extraído de los headers `x-trace-id` o `x-correlation-id`).
   * Implementación de **`AsyncLocalStorage`** de Node.js, lo que garantiza que cualquier log emitido durante el ciclo de vida de una petición asíncrona automáticamente incluya el `trace_id` correspondiente sin necesidad de propagarlo manualmente por los parámetros de las funciones.

3. **Pruebas de Latencia y SLOs:**
   * El endpoint `GET /api/users` acepta el parámetro de consulta `?latency=X` (en milisegundos). Esto permite simular lentitud bajo demanda en la API para forzar alertas de SLO de latencia en Grafana o disparar un HPA (Autoscaling) por acumulación de peticiones concurrentes.
   * El endpoint `GET /api/error` provoca de manera intencional un error 500 para evaluar la captura de errores en alertas (por ejemplo, alertas de tasa de error > 1%).

4. **Calidad de Código y Pruebas Unitarias:**
   * Suite de pruebas unitarias robusta usando **Vitest** y **Supertest**, logrando una cobertura de código del **97.4%** (superando el requisito mínimo del 80%).

5. **Dockerización Optimizada:**
   * `Dockerfile` multi-stage que utiliza compilación en caché de capas de `pnpm` para velocidad.
   * Imagen final extremadamente reducida y basada en `node:22-alpine` para mitigar CVEs críticos.
   * Ejecución bajo el usuario de seguridad no privilegiado (`node`).

---

## 🛠️ Estructura del Proyecto

```text
├── src/
│   ├── app.ts          # Configuración de Express, middlewares y rutas de API/Métricas
│   ├── logger.ts       # Configuración de Winston logs e inyección de trace_id vía AsyncLocalStorage
│   ├── metrics.ts      # Registro y definición de métricas para prom-client
│   ├── server.ts       # Arranque del servidor y cierre controlado (Graceful Shutdown)
│   └── app.test.ts     # Conjunto completo de pruebas unitarias
├── tsconfig.json       # Configuración del compilador TypeScript
├── package.json        # Dependencias y scripts de ejecución
├── Dockerfile          # Construcción multi-stage optimizada
└── .dockerignore       # Exclusión de archivos pesados en el contexto Docker
```

---

## 🚀 Guía de Inicio Rápido

### Requisitos Previos

* Node.js v22+
* pnpm v11+

### Instalar Dependencias

```bash
pnpm install
```

### Ejecución en Desarrollo

Para iniciar el servidor con recarga en caliente (*hot reload*):

```bash
pnpm dev
```

El servidor estará escuchando en `http://localhost:3000`.

### Ejecutar Pruebas y Cobertura

Para correr las pruebas unitarias:

```bash
pnpm test
```

Para generar el reporte de cobertura de código (debe ser $\ge 80\%$):

```bash
pnpm test:coverage
```

### Construcción y Ejecución en Producción

Para compilar TypeScript a JavaScript:

```bash
pnpm build
```

Para ejecutar el código compilado:

```bash
pnpm start
```

---

## 🐳 Docker

Para compilar y empaquetar la aplicación localmente:

```bash
docker build -t taller-devops-api:latest .
```

Para correr el contenedor:

```bash
docker run -p 3000:3000 --name devops-api taller-devops-api:latest
```

---

## 📈 Endpoints Principales

| Ruta | Método | Descripción | Parámetros |
| :--- | :---: | :--- | :--- |
| `/` | `GET` | Mensaje de bienvenida con listado de endpoints. | Ninguno |
| `/health` | `GET` | Liveness Probe. Retorna `200 OK` con el estado y uptime de la API. | Ninguno |
| `/ready` | `GET` | Readiness Probe. Simula validaciones de salud de integraciones (BD, Cache). | Ninguno |
| `/metrics` | `GET` | Exposición de métricas en formato Prometheus OpenMetrics. | Ninguno |
| `/api/users` | `GET` | Lista de usuarios del taller. Admite simulación de latencia. | `?latency=ms` (opcional) |
| `/api/users/:id` | `GET` | Obtiene un usuario por su ID único. | ID de usuario en la ruta |
| `/api/users` | `POST` | Registra un nuevo usuario. | Body JSON: `{ "name": "...", "email": "..." }` |
| `/api/error` | `GET` | Fuerza un error interno `500` con trazabilidad completa. | Ninguno |

### Ejemplo de Log JSON Emitido (Consola)

```json
{"duration_ms":1.12,"ip":"::1","level":"info","message":"Request completed: GET /api/users -> 200 (1.12ms)","method":"GET","service":"taller-devops-api","statusCode":200,"timestamp":"2026-06-07T19:43:08.664Z","trace_id":"518865f6-657a-4913-b3b8-3c5d4c99528d","url":"/api/users"}
```
