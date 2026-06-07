## 🚀 Requisitos Técnicos e Implementación

### 1. Pipeline CI/CD Completo (GitHub Actions)
El ciclo de vida del software se automatiza mediante GitHub Actions, dividiéndose en dos fases principales en **al menos 2 entornos**:
* **Integración Continua (CI):**
    * **Build & Test:** Compilación del proyecto y ejecución de pruebas unitarias asegurando un **coverage $\ge$ 80%**.
    * **SAST & SCA:** Análisis estático de seguridad de código fuente y escaneo de dependencias.
    * **Dockerización:** Construcción y empaquetamiento de la aplicación en una imagen Docker optimizada.
* **Despliegue Continuo (CD):**
    * **Staging:** Despliegue automático ante cualquier cambio integrado en la rama principal o de staging.
    * **Production:** Despliegue controlado que requiere de una **aprobación manual** (environments con *required reviewers*).

### 2. Infraestructura como Código (IaC con Terraform)
Toda la infraestructura cloud necesaria para dar soporte a la aplicación se aprovisiona de forma declarativa.
* **Recursos Cloud Mínimos (3):** Configuración de un clúster de Kubernetes (**EKS**), base de datos relacional (**RDS**) y almacenamiento de objetos (**S3**) o sus equivalentes.
* **Backend Remoto Seguro:** El archivo de estado `terraform.tfstate` se almacena de manera centralizada en un bucket de **AWS S3**, empleando una tabla de **DynamoDB** para el bloqueo de estado (*state locking*), previniendo ejecuciones concurrentes conflictivas.
* **Buenas Prácticas:** Modularización completa, parametrización mediante variables (`variables.tf`) y exposición de resultados clave (`outputs.tf`) debidamente documentados.

### 3. Manifiestos de Kubernetes (K8s)
El orquestador gestiona el ciclo de vida de los contenedores asegurando alta disponibilidad y resiliencia:
* **Estrategia de Despliegue:** `Deployment` configurado con **Rolling Update** para garantizar cero tiempo de inactividad (*Zero-Downtime*) durante las actualizaciones.
* **Escalabilidad:** Implementación de **Horizontal Pod Autoscaler (HPA)** con un umbral mínimo de 2 réplicas y un máximo de 10 basándose en el consumo de CPU/Memoria.
* **Ciclo de Vida del Pod:** Configuración estricta de `livenessProbes` (salud del contenedor) y `readinessProbes` (listo para recibir tráfico), acompañados de `resources.limits` y `resources.requests` para mitigar problemas de "OOMKilled".
* **Configuración y Resiliencia:** Uso de `ConfigMap` para variables de entorno, `Secrets` para credenciales cifradas y un `PodDisruptionBudget` (PDB) para garantizar la disponibilidad mínima de Pods durante mantenimientos del clúster.

### 4. Observabilidad Completa
Estrategia orientada a la telemetría avanzada y cumplimiento de objetivos de negocio:
* **Métricas y Dashboards:** Stack de **Prometheus** para la recolección de métricas y **Grafana** para la visualización mediante un *SLO Dashboard*.
* **Alerting:** Configuración de al menos 1 alerta crítica (vía Slack/Email) basada en la degradación de los servicios.
* **Logs Estructurados:** Los logs de la aplicación se emiten en formato estructurado (JSON) e incluyen un identificador único de trazabilidad (`trace_id`) para el rastreo de peticiones distribuidas.
* **SLA / SLO / SLI:** Definición explícita de indicadores y objetivos de nivel de servicio (ej: **99.9% de disponibilidad** / *availability*).

### 5. DevSecOps Integrado
La seguridad se posiciona como un elemento transversal (*Shift Left Security*):
* **Filtro Local:** `gitleaks` configurado como un *pre-commit hook* para impedir la subida accidental de secretos (API keys, contraseñas) al repositorio.
* **Escaneo de Vulnerabilidades:** Integración de **Trivy** en el pipeline bloqueando el despliegue ante la presencia de CVEs críticos (**Zero critical CVEs**).
* **Gestión de Secretos:** Centralización y almacenamiento seguro utilizando **HashiCorp Vault** o inyecciones nativas protegidas de *K8s Secrets*.
* **Análisis Dinámico (DAST):** Escaneo básico automatizado con **OWASP ZAP** al entorno de Staging para detectar fallos en tiempo de ejecución. Entrega final de un **Reporte de Seguridad**.

### 6. Métricas DORA (DevOps Research and Assessment)
Medición y cuantificación del rendimiento del equipo durante todo el sprint de desarrollo:
1.  **Deployment Frequency (DF):** Frecuencia de despliegues exitosos a producción.
2.  **Lead Time for Changes (LTFC):** Tiempo transcurrido desde que el código se confirma hasta que llega a producción.
3.  **Mean Time to Restore (MTTR):** Tiempo promedio requerido para recuperarse de una falla en producción.
4.  **Change Failure Rate (CFR):** Porcentaje de despliegues en producción que resultan en fallas o requieren degradación.
* **Análisis:** Comparativa de los resultados obtenidos con los estándares de la industria del **DORA Report 2024** y propuesta formal de acciones de mejora continua.

### 7. Post-mortem de un Incidente
Simulación y documentación formal de un fallo en el entorno productivo siguiendo la cultura del **Google SRE (Site Reliability Engineering)**:
* **Enfoque Blameless:** Análisis objetivo centrado en fallas del sistema y de procesos, no en culpar a individuos.
* **Estructura del Documento:**
    * *Timeline:* Línea de tiempo detallada desde la introducción del fallo, detección, mitigación hasta la resolución.
    * *Root Cause Analysis (RCA):* Identificación de la causa raíz técnica.
    * *5 Whys:* Metodología de los 5 porqués para profundizar en las fallas organizacionales o procedimentales.
    * *Action Items:* Listado de tareas correctivas con responsables asignados para evitar la recurrencia del incidente.

---

## 📊 Rúbrica de Evaluación

| Porcentaje | Componente Evaluado | Enfoque de Revisión |
| :---: | :--- | :--- |
| **25%** | **CI/CD Pipeline** | Automatización completa, testing $\ge$ 80%, configuración multi-entorno y flujo de aprobaciones. |
| **20%** | **IaC (Terraform)** | Correcto aprovisionamiento cloud, backend en S3 con DynamoDB lock y modularidad. |
| **20%** | **K8s Manifests** | Resiliencia (HPA, PDB, Probes), estrategias de despliegue y gestión de recursos de cómputo. |
| **15%** | **Observabilidad** | Configuración de Prometheus/Grafana, diseño de dashboards SLO, alertas y logs con `trace_id`. |
| **10%** | **DevSecOps** | Ejecución de gitleaks, escaneo Trivy sin CVEs críticos, DAST con OWASP ZAP y reporte. |
| **5%** | **DORA Metrics** | Medición real de las 4 métricas, comparativa metodológica contra el benchmark 2024. |
| **5%** | **Post-mortem** | Simulación del incidente, calidad del análisis de causa raíz y adopción del formato Google SRE. |
| **100%** | **Nota Total** | **Cumplimiento estricto de todos los entregables (Código + PDF + Demo).** |

---
*Fábrica de Software · Unidad: DevOps · Ingeniería de Software · 8vo Nivel*
"""