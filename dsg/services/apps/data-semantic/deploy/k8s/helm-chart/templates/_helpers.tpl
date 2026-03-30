{{/*
Expand the name of the chart.
*/}}
{{- define "data-semantic.name" -}}
{{- default "data-semantic" .Values.nameOverride -}}
{{- end -}}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "data-semantic.fullname" -}}
{{- printf "%s-%s" (include "data-semantic.name" .) .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "data-semantic.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Common labels
*/}}
{{- define "data-semantic.labels" -}}
helm.sh/chart: {{ include "data-semantic.chart" . }}
{{ include "data-semantic.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
{{- end -}}

{{/*
Selector labels
*/}}
{{- define "data-semantic.selectorLabels" -}}
app.kubernetes.io/name: {{ include "data-semantic.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{/*
Create the name of the service account to use
*/}}
{{- define "data-semantic.serviceAccountName" -}}
{{- if .Values.serviceAccount.create -}}
{{- default (include "data-semantic.fullname" .) .Values.serviceAccount.name -}}
{{- else -}}
{{- default "default" .Values.serviceAccount.name -}}
{{- end -}}
{{- end -}}

{{/*
Allow the release namespace to be overridden for multi-namespace deployments in combined charts
*/}}
{{- define "data-semantic.namespace" -}}
{{- default .Release.Namespace .Values.namespaceOverride -}}
{{- end -}}
