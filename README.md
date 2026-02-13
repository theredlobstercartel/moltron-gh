# 🐙 moltron-gh

> *GitHub CLI wrapper com SmythOS - Gerencie PRs, issues e workflows com inteligência*

Skill criado com [Moltron](https://github.com/theredlobstercartel) para o ecossistema OpenClaw. Interface inteligente para o GitHub CLI com tratamento de erros, validação de pré-requisitos e observabilidade completa.

## 🚀 Instalação

### Pré-requisitos

1. **GitHub CLI instalado**:
   ```bash
   # Se tiver o moltron-package-installer
   node ~/.openclaw/workspace/skills/moltron-package-installer/scripts/moltron-package-installer/dist/index.js install gh
   ```

2. **Autenticado com GitHub**:
   ```bash
   gh auth login
   ```

3. **Instalar o skill**:
   ```bash
   git clone https://github.com/theredlobstercartel/moltron-gh.git
   cd moltron-gh
   npm install
   npm run build
   ```

## 📖 Uso

### Verificar Status

```bash
node dist/index.js status
```

### Pull Requests

```bash
# Listar PRs (open/closed/merged/all)
node dist/index.js pr list
node dist/index.js pr list closed

# Criar PR
node dist/index.js pr create "Fix: resolve memory leak"

# Ver detalhes do PR
node dist/index.js pr view 42

# Fazer checkout do PR
node dist/index.js pr checkout 42
```

### Issues

```bash
# Listar issues
node dist/index.js issue list
node dist/index.js issue list closed

# Criar issue
node dist/index.js issue create "Bug: crash on startup"

# Ver issue
node dist/index.js issue view 123
```

### Workflows

```bash
# Listar runs recentes
node dist/index.js workflow list

# Ver logs de um run
node dist/index.js workflow view 123456789
```

## 🧠 Skills do Agente

O agente SmythOS expõe estas skills para uso programático:

| Skill | Descrição |
|-------|-----------|
| `check_prerequisites` | Verifica se gh está instalado e autenticado |
| `list_prs` | Lista PRs do repo atual |
| `create_pr` | Cria novo PR |
| `view_pr` | Visualiza detalhes de um PR |
| `checkout_pr` | Faz checkout local de um PR |
| `list_issues` | Lista issues do repo |
| `create_issue` | Cria nova issue |
| `view_issue` | Visualiza detalhes de uma issue |
| `list_workflows` | Lista execuções de workflows |
| `view_workflow` | Visualiza logs de um workflow |

## 🧪 Scoring

Avalie o skill após cada uso:

```bash
node score.js --insert <score>

# Ver histórico de scores
node score.js --list
```

**Critérios:**

| Score | Critério |
|-------|----------|
| 100 | Comando executou com sucesso, saída correta |
| 80 | Sucesso com pequenas ressalvas |
| 60 | Precisou de retry ou workaround |
| 40 | Erro, mas mensagem clara |
| 0 | Crash ou erro não tratado |

## 📡 Observabilidade

Traces OpenTelemetry enviados para Signoz:
- Endpoint: `http://localhost:4318`
- Service name: `moltron-gh`
- Métricas: duração de comandos, taxas de sucesso/erro

## 🏗️ Arquitetura

Diagramas em `mermaid/`:
- `architecture.mmd` - Visão geral
- `workflow.mmd` - Fluxo de execução
- `components.mmd` - Componentes

## 🛠️ Desenvolvimento

```bash
# Editar código
vim src/index.ts

# Recompilar
npm run build

# Testar
node dist/index.js status
```

## 📦 Stack

- [GitHub CLI](https://cli.github.com/) - Interface com GitHub
- [SmythOS SDK](https://smythos.github.io/sre/sdk/) - Framework de agentes
- [OpenTelemetry](https://opentelemetry.io/) - Observabilidade
- [Signoz](https://signoz.io/) - Coletor de traces
- [Moltron](https://github.com/theredlobstercartel) - Criador de skills

## 🦞 The Red Lobster Cartel

Parte da fábrica de software pessoal onde IA e humanos colaboram.

- **Org**: https://github.com/theredlobstercartel
- **Main repo**: https://github.com/theredlobstercartel/red-lobster-cartel

---

*Construído com 🦞 e código*
