# Meu Bolso

App simples de controle financeiro pessoal. Roda no navegador, sem servidor e sem cadastro.

## O que faz

- Lança entradas e saídas com descrição, valor, data e categoria
- Resumo do mês (entradas, saídas, saldo) e saldo total
- Navegação mês a mês
- Gráfico de gastos por categoria
- Orçamento mensal por categoria, com alerta quando passa de 80% e de 100%
- Busca e filtro na lista de transações
- Categorias personalizáveis
- Exporta CSV (abre no Excel) e faz backup/restauração em JSON
- Funciona offline e pode ser instalado no celular (PWA)

## Instalar no iPhone

1. Publique no GitHub Pages: no repositório, **Settings → Pages → Build and deployment**, em *Source* escolha **Deploy from a branch**, selecione o branch `claude/financial-control-app-t6p7ml` e a pasta `/ (root)`, e salve. Em 1 ou 2 minutos o link aparece ali (algo como `https://gabrielfelipeteixeira.github.io/Master/`).
2. No iPhone, abra esse link no **Safari**.
3. Toque em **Compartilhar** (quadrado com a seta) → **Adicionar à Tela de Início** → **Adicionar**.

Pronto: o ícone fica na tela de início, abre em tela cheia e funciona sem internet.

> Os dados ficam no próprio iPhone. Se o app ficar semanas sem ser aberto, o iOS pode limpar o armazenamento, então use o **Backup (JSON)** de vez em quando.

## Como usar no computador

Abra o `index.html` no navegador. Pra instalar no celular e usar offline, sirva a pasta por HTTP, por exemplo:

```bash
python3 -m http.server 8000
```

ou publique no GitHub Pages.

Os dados ficam salvos no `localStorage` do navegador. Use o botão de backup pra não perder nada.
