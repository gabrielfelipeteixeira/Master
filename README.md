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

## Como usar

Abra o `index.html` no navegador. Pra instalar no celular e usar offline, sirva a pasta por HTTP, por exemplo:

```bash
python3 -m http.server 8000
```

ou publique no GitHub Pages.

Os dados ficam salvos no `localStorage` do navegador. Use o botão de backup pra não perder nada.
