# NOC Board — Tríade Fibra

Sistema de gerenciamento de tarefas operacionais para o NOC.

## Files

- `tv.html` — display passivo 1920×1080 para TV. Grid com tarefas urgentes em destaque + cronômetros que mudam de cor.
- `admin.html` — painel do supervisor (lista + edição lateral estilo email).
- `data.js` — fonte compartilhada de tarefas + helpers (`urgencyLevel`, `formatCountdown`).
- `tv.css` / `admin.css` — estilos por tela. Tema escuro NOC.

## Lógica de urgência (compartilhada)

| Nível | Critério | Cor |
|---|---|---|
| `overdue`  | `dueAt < now` | vermelho · borda pulsante |
| `critical` | `<15 min` ou `priority=critical` | laranja-vermelho |
| `warning`  | `<60 min` ou `priority=high` | âmbar |
| `ok`       | qualquer outro caso | verde / neutro |

Cronômetros atualizam a cada 1s; ordenação re-renderiza a cada 30s.
