# Taverna De Bolso - Railway com layout antigo

Esta versão mantém o visual/layout anterior:
- toolbar superior
- painel Mestre lateral
- seletor de imagem de token
- ficha de token antiga
- painel de dados antigo

Mantém compatibilidade Railway:
- `npm start`
- `process.env.PORT`
- `const socket=io()`
- pasta `public`

Corrigido:
- eventos de mapa `mapSet/mapUpdated`
- imagem de token persistida
- zoom só Mestre
- régua sincronizada
- paredes controladas pelo Mestre
