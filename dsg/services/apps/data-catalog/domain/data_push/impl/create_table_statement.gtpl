CREATE TABLE IF NOT EXISTS {{ .DataSource.CatalogName }}."{{ .DataSource.Schema }}"."{{ .Table.Name }}" (
{{- $appendField := false -}}
{{- range .Table.Fields -}}
    {{/* Fields with the UnMapped attribute do not need to be generated */}}
    {{- if .UnMapped -}}
        {{- continue -}}
    {{- end -}}
    {{/* Except for the first line, add a comma before the newline character */}}
    {{- if $appendField -}},{{ else }}{{ $appendField = true }}{{ end }}
    {{ template "column" . }}
{{- end }}
)
{{/* Generate type of the column, such as int, decimal(5), decimal(5,2), */}}
{{- define "type" -}}
    {{- if .Length -}}
        {{- if .FieldPrecision -}}
            {{ .SearchType }}({{ .Length }},{{ .FieldPrecision }})
        {{- else -}}
            {{ .SearchType }}({{ .Length }})
        {{- end -}}
    {{- else -}}
            {{ .SearchType }}
    {{- end -}}
{{- end -}}

{{/* Generate column line in create table statement*/}}
{{- define "column" -}}
"{{ .Name }}" {{ template "type" . }} {{- with .Description }} COMMENT '{{ . }}'{{ end }}
{{- end -}}

{{/* Generate multi column lines in create table statement*/}}
{{- define "columns" -}}
    {{- $appendField := false -}}
    {{- range . }}
        {{- if .UnMapped -}}
            {{- continue -}}
        {{- end -}}
        {{- if $appendField -}},{{ else }}{{ $appendField = true }}{{ end }}
        {{ template "column" . }}
    {{- end }}
{{- end -}}
