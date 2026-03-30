{{/*
Expand the name of the chart.
*/}}
{{- define "standardization.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "standardization.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "standardization.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "standardization.labels" -}}
helm.sh/chart: {{ include "standardization.chart" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}
{{- define "standardization.labels.backend" -}}
{{ include "standardization.labels" . }}
{{ include "standardization.backend.selectorLabels" . }}
{{- end }}
{{- define "standardization.labels.frontend" -}}
{{ include "standardization.labels" . }}
{{ include "standardization.frontend.selectorLabels" . }}
{{- end }}
{{- define "standardization.labels.frontend.micro-frame" -}}
{{ include "standardization.labels" . }}
{{ include "standardization.frontend.micro-frame.selectorLabels" . }}
{{- end }}
{{- define "standardization.labels.frontend.micro-app" -}}
{{ include "standardization.labels" . }}
{{ include "standardization.frontend.micro-app.selectorLabels" . }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "standardization.backend.selectorLabels" -}}
app.kubernetes.io/name: {{ include "standardization.fullname" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
{{- define "standardization.frontend.selectorLabels" -}}
app.kubernetes.io/name: {{ include "standardization.fullname" . }}-frontend
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
{{- define "standardization.frontend.micro-frame.selectorLabels" -}}
app.kubernetes.io/name: {{ include "standardization.fullname" . }}-frontend-micro-frame
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
{{- define "standardization.frontend.micro-app.selectorLabels" -}}
app.kubernetes.io/name: {{ include "standardization.fullname" . }}-frontend-micro-app
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "standardization.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "standardization.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}
