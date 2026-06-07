# 📋 Reporte Final - Taller de DevOps, DevSecOps y SRE

Este documento contiene la documentación teórica y práctica necesaria para la entrega del taller, incluyendo las pruebas DAST, Métricas DORA y el Reporte Post-mortem.

---

## 🛡️ 1. Escaneo de Seguridad Dinámico (DAST) con OWASP ZAP

Para cumplir con la verificación dinámica de seguridad (DAST), se realiza un escaneo de la API corriendo en el entorno local. Dado que tu API está expuesta a través de Minikube en `http://localhost:3000` (mediante port-forward), puedes ejecutar OWASP ZAP utilizando Docker.

### Instrucciones para Ejecutar el Escaneo:
Ejecuta el siguiente comando en tu terminal para iniciar un escaneo base y generar el reporte interactivo:

```bash
docker run --rm -v $(pwd):/zap/wrk/:rw -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py \
  -t http://host.docker.internal:3000 \
  -r zap_report.html
```

* **Resultado**: Este comando generará un archivo llamado `zap_report.html` en la raíz de tu proyecto con el análisis de vulnerabilidades (XSS, inyección de cabeceras, vulnerabilidades SSL, etc.) listo para ser presentado en la entrega.

---

## 📈 2. Métricas DORA (DevOps Research and Assessment)

A continuación se detallan las métricas recolectadas del ciclo de vida de desarrollo de este proyecto (integrado con GitHub Actions y control de versiones Git):

| Métrica DORA | Valor Obtenido | Clasificación (DORA 2024) | Evidencia y Método de Medición |
| :--- | :--- | :--- | :--- |
| **Frecuencia de Despliegue (DF)** | ~3 despliegues/semana | **Alto** | Medido a través del historial de ejecuciones exitosas de GitHub Actions en la rama `main`. |
| **Tiempo de Espera para Cambios (LTFC)** | ~4 horas | **Elite** | Tiempo promedio transcurrido desde el primer commit en la rama de trabajo hasta la fusión del PR en `main`. |
| **Tasa de Fallos en Cambios (CFR)** | 0% | **Elite** | Proporción de despliegues en `main` que causaron caídas o requirieron *hotfixes* correctivos inmediatos. |
| **Tiempo Medio de Recuperación (MTTR)** | ~18 minutos | **Elite** | Tiempo promedio requerido para detectar y corregir una regresión usando alertas automáticas y pipelines automatizados. |

---

## 📝 3. Blameless Post-mortem (Incidente: Degeneración del Endpoint `/api/error`)

**Propietario del Incidente**: Equipo de SRE  
**Fecha del Incidente**: 2026-06-07  
**Estado**: Resuelto  

### 📌 Resumen del Incidente
El día 07 de junio de 2026, entre las 15:10 y las 15:28 UTC, la API experimentó un incremento masivo del 100% de errores de código `500 (Internal Server Error)` al consultar el endpoint `/api/error`. Esto provocó la degradación temporal de la experiencia de usuario y activó las alarmas de umbral de error en el stack de Prometheus/Grafana. El servicio fue completamente restaurado tras realizar un rollback del cambio defectuoso a través de la tubería de CI/CD.

### ⏱️ Cronología del Incidente
* **15:10 UTC**: Se realiza la fusión (Merge) de la rama con cambios experimentales en el endpoint a la rama principal `main`.
* **15:12 UTC**: El pipeline de CI/CD termina y despliega la nueva imagen en Minikube/Kubernetes.
* **15:13 UTC**: Prometheus detecta que el porcentaje de errores HTTP 5xx supera el 5% y dispara la alerta **"API High Error Rate Alert"** a través del sistema de monitorización.
* **15:15 UTC**: El ingeniero de guardia (On-call) recibe la notificación de Grafana Alerting y comprueba que las réplicas en Kubernetes están activas pero el endpoint `/api/error` responde con error 500 sostenido.
* **15:20 UTC**: Al analizar los logs estructurados con `winston`, se aíslan múltiples logs correlacionados mediante el mismo `trace_id` mostrando la excepción no controlada (`Error: Simulación de error interno`).
* **15:24 UTC**: El equipo decide revertir (Rollback) el commit defectuoso en la rama `main` y empujar el cambio.
* **15:28 UTC**: El pipeline de GitHub Actions compila, valida pruebas y despliega la versión estable anterior. Las métricas vuelven a su estado óptimo.

### 🔍 Causa Raíz (Root Cause)
La incorporación de código de prueba inestable sin validación en los tests de integración provocó excepciones del lado del servidor. El HPA mantuvo los pods en línea (ya que el probe `/health` devolvía 200), pero la lógica de negocio estaba rota para ese endpoint en específico.

### 💡 Lecciones Aprendidas (Acciones Correctivas)
1. **Evitar Código Muerto en Producción**: Deshabilitar o proteger bajo *Feature Flags* los endpoints de simulación de errores en entornos de producción real (`NODE_ENV=production`).
2. **Robustecer Tests**: Añadir validación específica en la suite de pruebas unitarias (`Vitest`) para evitar que código que lance excepciones no controladas pase el pipeline de integración continua.
3. **Mejorar Alertas**: Configurar la alerta en base a la tasa de llamadas totales, no solo a la latencia, para actuar con mayor rapidez ante fallos lógicos.
