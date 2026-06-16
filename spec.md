# Spec — Controle de Ponto Pessoal

## Visão Geral

App web para controle de ponto pessoal. O usuário registra seus 4 horários diários (entrada, ida intervalo, volta intervalo, saída) e o app calcula automaticamente banco de horas, previsão de saída e diferença em relação à carga horária contratada.

**Público-alvo:** Trabalhadores que precisam controlar seu ponto de forma simples, sem dependência de sistemas empresariais.

**Status:** MVP funcional, pronto para deploy.

---

## Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Estrutura | HTML5 | - |
| Estilo | CSS3 (variáveis CSS) | - |
| Lógica | JavaScript ES6+ (vanilla) | - |
| Armazenamento | localStorage | - |
| Hospedagem | Cloudflare Pages | - |
| PWA | Service Worker + Manifest | - |

**Linguagem do app:** Português Brasileiro (pt-BR).

---

## Estrutura do Projeto

```
controle-ponto/
├── index.html              # Tela de login/cadastro
├── app.html                # Tela principal do app (shell)
├── manifest.json           # Configuração PWA
├── sw.js                   # Service Worker (cache offline)
├── test-data.js            # Script para gerar dados de teste no console
├── css/
│   └── style.css           # Estilos globais (tema dark midnight orange)
├── js/
│   ├── utils.js            # Funções utilitárias puras (sem DOM/localStorage)
│   ├── data.js             # Camada de acesso ao localStorage
│   ├── nav.js              # Navegação entre abas + gerenciamento do modal
│   ├── auth.js             # Lógica de login/cadastro
│   ├── ponto.js            # Aba "Ponto" — bater ponto, CRUD, previsão de saída
│   ├── banco.js            # Aba "Banco" — saldo de horas, detalhes do dia
│   └── perfil.js           # Aba "Perfil" — editar nome/PIN, carga horária
└── icons/
    ├── icon-192.png        # Ícone PWA 192x192
    └── icon-512.png        # Ícone PWA 512x512
```

---

## Paleta de Cores (Midnight Orange)

| Variável CSS | Cor | Uso |
|-------------|-----|-----|
| `--bg-primary` | `#1a1a2e` | Fundo principal (dark navy) |
| `--bg-secondary` | `#16213e` | Cards, header, nav |
| `--accent` | `#e94560` | Botões primários, erros, negativo |
| `--highlight` | `#f39c12` | Títulos, valores, destaques (laranja) |
| `--text-primary` | `#ffffff` | Texto principal |
| `--text-secondary` | `#a0a0a0` | Texto secundário, labels |

---

## Telas e Funcionalidades

### 1. Tela de Login (`index.html` + `auth.js`)

**Rota:** `/index.html`

| Elemento | Funcionalidade |
|----------|---------------|
| Campo "Nome" | Input de texto, obrigatório |
| Campo "PIN" | Input password, 4 dígitos, obrigatório |
| Botão "Entrar" | Valida credenciais, salva no localStorage, redireciona para `app.html` |
| Botão "Login rápido" | Entra com nome "Usuário" e PIN "0000" sem validação |

**Regras:**
- Se já existe usuário no localStorage, redireciona automaticamente para `app.html`
- PIN deve ter exatamente 4 dígitos numéricos
- Nome é trimado (espaços removidos)

---

### 2. Tela Principal (`app.html` + `ponto.js`)

**Rota:** `/app.html`

**Layout:**
- Header: nome do usuário + botão "Sair"
- Main: conteúdo dinâmico (renderizado por JS conforme aba ativa)
- Bottom Nav: 3 abas — Banco, Ponto, Perfil

#### Aba "Ponto" (padrão ao abrir)

| Elemento | Funcionalidade |
|----------|---------------|
| Botão circular "Bater ponto" | Registra o próximo horário vazio automaticamente |
| Card "Entrada" | Exibe horário registrado + botões editar/excluir |
| Card "Ida Intervalo" | Exibe horário registrado + botões editar/excluir |
| Card "Volta Intervalo" | Exibe horário registrado + botões editar/excluir |
| Card "Saída" | Exibe horário registrado + botões editar/excluir |
| Card "Previsão de Saída" | Calculada automaticamente ao bater entrada |

**Fluxo do botão "Bater ponto":**
1. Busca o próximo campo vazio na ordem: Entrada → Ida Intervalo → Volta Intervalo → Saída
2. Preenche com a hora atual do sistema
3. Salva no localStorage
4. Atualiza UI e previsão de saída

**CRUD nos registros:**
- **Editar (✏️):** Abre modal com input `type="time"` para ajustar manualmente
- **Excluir (🗑️):** Remove o horário imediatamente (zera para null)

**Previsão de saída:**
```
Previsão = Saída Contratada + (Entrada Real - Entrada Contratada)
```
Exemplo: Saída contratada 17:00, entrada real 08:10 → previsão 17:10

---

### 3. Aba "Banco" (`banco.js`)

**Acessível pela bottom nav.**

| Elemento | Funcionalidade |
|----------|---------------|
| Card "Banco de Horas Total" | Soma das diferenças (extras - faltantes) de todos os dias |
| Lista de dias | Cada card mostra data + diferença em relação à carga horária |
| Popup ao clicar no dia | Modal com os 4 horários detalhados |

**Cálculo por dia:**
```
Diferença = (Saída - Entrada - Intervalo) - Carga Horária Contratada
```

**Exibição:**
- `+00:30` (verde) → trabalhou 30 min a mais que a carga
- `-00:15` (vermelho) → trabalhou 15 min a menos que a carga
- `--:--` → ainda não bateu saída naquele dia

**Banco de Horas Total:** Soma de todas as diferenças dos dias.

---

### 4. Aba "Perfil" (`perfil.js`)

**Acessível pela bottom nav.**

#### Card "Editar Perfil"

| Campo | Funcionalidade |
|-------|---------------|
| Nome | Input de texto com nome atual |
| PIN Atual | Input password, validado antes de alterar |
| Novo PIN | Input password, 4 dígitos |
| Confirmar | Input password, deve bater com novo PIN |
| Botão "Salvar" | Valida e salva alterações |

#### Card "Carga Horária"

| Campo | Funcionalidade |
|-------|---------------|
| Entrada | Input time (horário contratado de entrada) |
| Ida | Input time (ida para intervalo) |
| Volta | Input time (volta do intervalo) |
| Saída | Input time (horário contratado de saída) |
| Total | Exibe carga horária diária calculada |
| Botão "Salvar" | Salva carga horária no localStorage |

**Cálculo automático da saída:**
Ao alterar entrada, ida ou volta, a saída é recalculada:
```
Saída = Entrada + 480 min (8h) + (Volta - Ida)
```

---

## Modelo de Dados (localStorage)

### Chave: `usuario`
```json
{
    "nome": "string",
    "pin": "string (4 dígitos)"
}
```

### Chave: `registros`
```json
[
    {
        "data": "YYYY-MM-DD",
        "entrada": "HH:MM | null",
        "idaIntervalo": "HH:MM | null",
        "voltaIntervalo": "HH:MM | null",
        "saida": "HH:MM | null"
    }
]
```

### Chave: `cargaHoraria`
```json
{
    "entrada": "HH:MM",
    "idaIntervalo": "HH:MM",
    "voltaIntervalo": "HH:MM",
    "saida": "HH:MM"
}
```

**Default:** `{ entrada: '08:00', idaIntervalo: '12:00', voltaIntervalo: '13:00', saida: '17:00' }`

---

## Arquitetura dos Módulos JS

### Dependências entre módulos

```
ponto.js (entry point)
├── nav.js
│   ├── banco.js
│   ├── perfil.js
│   └── ponto.js
├── data.js
└── utils.js

auth.js (entry point - index.html)
├── data.js
└── utils.js
```

### Módulos

| Módulo | Responsabilidade | Depende de |
|--------|-----------------|------------|
| `Utils` | Funções puras: time conversion, formatação, escapeHtml, showMsg | Nada |
| `Data` | CRUD no localStorage: get/set usuario, registros, cargaHoraria | Nada |
| `Nav` | Navegação entre abas, modal compartilhado | Utils, Data, Banco, Ponto, Perfil |
| `Auth` | Login, cadastro, validação | Utils, Data |
| `Ponto` | Bater ponto, CRUD de registros, previsão de saída | Utils, Data, Nav |
| `Banco` | Exibir saldo de horas, detalhes do dia | Utils, Data, Nav |
| `Perfil` | Editar perfil, configurar carga horária | Utils, Data |

### Inicialização

- `app.html`: `Nav.init()` → `Ponto.init()` (após DOMContentLoaded)
- `index.html`: Lógica de auth (após DOMContentLoaded)

---

## PWA (Progressive Web App)

| Arquivo | Descrição |
|---------|-----------|
| `manifest.json` | Nome, cores, display standalone, ícones |
| `sw.js` | Cache de todos os arquivos para offline |
| `icons/` | Ícones 192x192 e 512x512 |

**Funcionalidades PWA:**
- Instalável no celular (Adicionar à tela inicial)
- Funciona offline (todos os arquivos em cache)
- Modo standalone (sem barra do navegador)
- Tema colorido na barra de status

**Cache:** `controle-ponto-v1` — todos os arquivos estáticos.

---

## Segurança

| Aspecto | Status | Observação |
|---------|--------|------------|
| PIN | ⚠️ Plaintext | Visível no DevTools, aceitável para uso pessoal |
| XSS | ✅ Protegido | `Utils.escapeHtml()` sanitiza nomes no HTML |
| Autenticação | ⚠️ Simulada | Sem backend, qualquer um com acesso ao dispositivo pode usar |
| HTTPS | ✅ Necessário | Cloudflare Pages fornece automaticamente |

---

## Como Rodar

### Local

1. Abrir `index.html` no navegador (ou usar Live Server no VS Code)
2. Login rápido ou cadastrar novo usuário
3. Para dados de teste: F12 → Console → colar conteúdo de `test-data.js` → Enter → recarregar

### Deploy (Cloudflare Pages)

1. Criar repositório no GitHub
2. Enviar código
3. Cloudflare Pages → Connect to Git → selecionar repositório
4. Build: (vazio)
5. Output directory: `/`

---

## Dados de Teste (`test-data.js`)

Gera 3 dias de registros no localStorage:

| Dia | Entrada | Saída | Carga | Diferença |
|-----|---------|-------|-------|-----------|
| 16/06/2026 | 08:00 | 17:30 | 08:00 | +00:30 |
| 17/06/2026 | 08:15 | 17:00 | 08:00 | -00:15 |
| 18/06/2026 | 07:50 | 16:40 | 08:00 | -00:10 |
| **Total** | | | | **+00:05** |

---

## Limitações Conhecidas

1. **Dados locais** — localStorage é por dispositivo/navegador, não sincroniza entre dispositivos
2. **Sem backend** — não há autenticação real, PIN é visível no DevTools
3. **iOS limitado** — Safari tem suporte parcial a PWA, instalação não é nativa
4. **Um usuário por dispositivo** — não há suporte a múltiplos usuários
5. **Sem exportação** — não há funcionalidade para baixar relatórios

---

## Possíveis Melhorias Futuras

| Melhoria | Prioridade | Descrição |
|----------|-----------|-----------|
| Migrar para Cloudflare D1 | Alta | Backend real com banco de dados SQL |
| Exportar dados | Média | Baixar relatório em CSV/PDF |
| Múltiplos usuários | Média | Login com backend, dados compartilhados |
| Notificações | Baixa | Lembrar de bater ponto |
| Gráficos | Baixa | Visualização semanal/mensal de horas |
| Modo offline completo | Baixa | Já funciona via PWA, mas sem sync |
