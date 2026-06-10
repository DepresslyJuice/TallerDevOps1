# 🎬 Guía de Demostración - Taller DevOps, DevSecOps y SRE

> **Tiempo estimado total**: 20-25 minutos  
> **Prereq**: Tener Minikube corriendo (`minikube start`) y todas las terminales abiertas antes de comenzar.

---

## ⚙️ Preparación Previa (Hacer ANTES de la demo)

Abre **4 terminales** y déjalas listas:

| Terminal | Comando a ejecutar |
|---|---|
| **T1** - API | `kubectl port-forward svc/taller-devops-api 3000:80` |
| **T2** - Prometheus | `kubectl port-forward svc/prometheus-service 9090:9090` |
| **T3** - Grafana | `kubectl port-forward svc/grafana-service 3001:3000` |
| **T4** - Libre | *(para comandos en vivo)* |

Abre en el navegador (pestañas listas):
- 🔵 `http://localhost:3001` → Grafana (usuario: `admin`, contraseña: `admin`)
- 🟠 `http://localhost:9090` → Prometheus
- ⚪ GitHub Actions de tu repo → `https://github.com/DepresslyJuice/TallerDevOps1/actions`

---

## 📍 PARTE 1 — Infraestructura y API (3 min)

> **Objetivo**: Mostrar que el sistema está corriendo en Kubernetes local.

### 1.1 Mostrar los pods corriendo
En **T4**, ejecuta:
```bash
kubectl get pods
```
**Qué mostrar**: Todos los pods en estado `Running` (API x2, Prometheus, Grafana).

### 1.2 Mostrar el Autoescalado (HPA)
```bash
kubectl get hpa
```
**Qué decir**: _"El Horizontal Pod Autoscaler escala automáticamente entre 2 y 10 réplicas dependiendo del consumo de CPU y Memoria."_

### 1.3 Mostrar la API respondiendo
En el navegador, abre:
- `http://localhost:3000/health` → Muestra `status: UP`
- `http://localhost:3000/ready` → Muestra checks de base de datos
- `http://localhost:3000/metrics` → Muestra el endpoint de métricas de Prometheus

---

## 📍 PARTE 2 — Pipeline CI/CD con GitHub Actions (5 min)

> **Objetivo**: Mostrar el pipeline verde (commit limpio) y rojo (commit roto) en GitHub.

### 2.1 Mostrar el commit limpio ✅
En la pestaña de GitHub Actions, muestra el pipeline del commit:
```
feat: add version and environment info to root endpoint (v1.1.0)
```
**Qué decir**: _"Este commit pasó todas las validaciones: tests con Vitest, análisis de vulnerabilidades con Trivy y escaneo de secretos con Gitleaks. El pipeline se completó en verde."_

### 2.2 Mostrar el commit roto ❌
Muestra el pipeline fallido del commit:
```
feat: update health check response format [BREAKING]
```
**Qué decir**: _"Aquí introdujimos intencionalmente un bug: el endpoint /health comenzó a devolver 503 en lugar de 200. El test lo detectó inmediatamente y bloqueó el despliegue. El código nunca llegó a producción."_

Señala el error exacto en el log:
```
AssertionError: expected 503 to be 200
```

### 2.3 Mostrar el Rollback ✅
Muestra el pipeline del commit de revert:
```
revert: feat: update health check response format [BREAKING]
```
**Qué decir**: _"El equipo detectó el fallo, ejecutó git revert para crear un nuevo commit que deshace el cambio defectuoso sin alterar el historial, y el pipeline volvió a verde. Este es el flujo MTTR del Post-mortem."_

---

## 📍 PARTE 3 — Observabilidad con Prometheus y Grafana (7 min)

> **Objetivo**: Mostrar las métricas en tiempo real y disparar una alerta.

### 3.1 Mostrar Prometheus activo
Ve a `http://localhost:9090` → **Status → Targets**.

**Qué mostrar**: El target `taller-devops-api` con estado **UP** en verde.

**Qué decir**: _"Prometheus está recolectando métricas del servicio cada 5 segundos directamente desde el pod de Kubernetes."_

### 3.2 Mostrar las métricas del Dashboard en Grafana
Ve a `http://localhost:3001` y abre tu Dashboard.

Ejecuta en T4 para generar tráfico real mientras hablas:
```bash
for i in {1..50}; do curl -s http://localhost:3000/api/users > /dev/null; done
```

**Qué mostrar en el dashboard**:
- **Peticiones por segundo**: Sube cuando corres el loop de curl.
- **Latencia promedio**: Se mantiene baja en condiciones normales.
- **Tasa de errores**: 0% (el servicio está sano).

### 3.3 Simular carga alta (HPA Scaling)
En T4, ejecuta en segundo plano:
```bash
while true; do curl -s "http://localhost:3000/api/users?latency=200" > /dev/null; sleep 0.05; done
```
En otra terminal, observa:
```bash
kubectl get hpa -w
```
**Qué mostrar**: El porcentaje de CPU subiendo y la columna `REPLICAS` escalando de 2 hacia más réplicas automáticamente.

Presiona `Ctrl+C` para detener la carga cuando termines de mostrar.

### 3.4 Disparar la Alerta de "Servicio Caído" 🚨
> Esta es la parte más impactante de la demo.

**Paso 1**: En Grafana, muestra la regla de alerta en **Alerting → Alert rules** con estado **Normal**.

**Paso 2**: En T4, apaga el servicio:
```bash
kubectl scale deployment taller-devops-api --replicas=0
```

**Paso 3**: Espera 15-30 segundos y muestra:
- En **Grafana → Alerting**: El estado cambia de `Normal` → `Pending` → **`Firing`** (rojo).
- En **Telegram**: Llega la notificación automática del bot.

**Qué decir**: _"El sistema detectó la caída de forma autónoma sin intervención humana y notificó al equipo de guardia en menos de 30 segundos. Esto reduce el MTTR."_

**Paso 4**: Restaura el servicio:
```bash
kubectl scale deployment taller-devops-api --replicas=2
```

---

## 📍 PARTE 4 — Seguridad DevSecOps (3 min)

> **Objetivo**: Mostrar el reporte de seguridad generado por las herramientas del pipeline.

### 4.1 Herramientas de seguridad en el pipeline
Muestra en GitHub Actions el job **"Build & Test"** y explica:
- **Trivy**: Escanea dependencias y la imagen Docker en busca de CVEs conocidos.
- **Gitleaks**: Revisa cada commit en busca de credenciales, tokens o contraseñas expuestas.

### 4.2 Reporte DAST de OWASP ZAP
Abre el archivo `zap_report.html` en el navegador:
```bash
firefox zap_report.html
# o
xdg-open zap_report.html
```
**Qué decir**: _"OWASP ZAP realizó un escaneo dinámico de la API en ejecución. Las alertas encontradas son de nivel informativo o bajo, lo que indica que la superficie de ataque de la API es mínima."_

---

## 📍 PARTE 5 — Métricas DORA y Cierre (3 min)

> **Objetivo**: Presentar los resultados cuantificados del taller.

### 5.1 Presenta la tabla DORA
Abre `REPORTE_FINAL.md` y muestra la tabla:

| Métrica | Valor | Clasificación |
|---|---|---|
| Deployment Frequency | ~3/semana | **Alto** |
| Lead Time for Changes | ~4 horas | **Elite** |
| Change Failure Rate | 0% | **Elite** |
| Mean Time to Restore | ~18 minutos | **Elite** |

**Qué decir**: _"3 de las 4 métricas DORA están en nivel Elite según el reporte oficial de Google DORA 2024, lo que demuestra que las prácticas DevOps implementadas tienen un impacto medible en la velocidad y estabilidad del equipo."_

### 5.2 Post-mortem
Menciona el documento `REPORTE_FINAL.md` → Sección 3 (Post-mortem Blameless).

**Qué decir**: _"El incidente del endpoint /health está documentado con cronología, causa raíz y acciones correctivas siguiendo el estándar de Google SRE. La retrospectiva es sin culpables (blameless), enfocada en mejorar el sistema."_

---

## ✅ Checklist Final Antes de la Demo

- [ ] `minikube start` ejecutado
- [ ] `kubectl get pods` → todos en `Running`
- [ ] Las 3 terminales de port-forward activas
- [ ] Grafana abierto en `http://localhost:3001`
- [ ] Prometheus abierto en `http://localhost:9090`
- [ ] GitHub Actions abierto en el navegador
- [ ] `zap_report.html` listo para abrir
- [ ] Telegram configurado y alerta de Grafana activa
