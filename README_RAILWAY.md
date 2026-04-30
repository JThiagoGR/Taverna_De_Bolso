# Taverna De Bolso — pronto para Railway

## Como subir no Railway

1. Envie estes arquivos para um repositório no GitHub.
2. No Railway: New Project > Deploy from GitHub repo.
3. Selecione o repositório.
4. Não precisa configurar porta manualmente: o servidor usa `process.env.PORT`.
5. Depois do deploy, abra a URL gerada pelo Railway.

## Verificação

- Rota de saúde: `/health` retorna `ok`.
- Comando de start: `npm start`.
- Arquivos públicos ficam em `/public`.

## Aviso importante

O estado da mesa fica em memória. Se o Railway reiniciar, a sala/mapa/tokens podem sumir. Use o botão Salvar/Importar do Mestre para backup das cenas.
