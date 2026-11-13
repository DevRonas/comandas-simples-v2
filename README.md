# Comandas Simples — MVP

Primeira versão de um sistema web de comandas para balcão, com identificação por nome/número, cardápio, disponibilidade, pedidos em aberto e fechamento.

## Tecnologias
- HTML, CSS e JavaScript
- Supabase (Auth + PostgreSQL)
- Netlify (hospedagem estática)

## 1. Preparar o computador
1. Instale o Visual Studio Code: https://code.visualstudio.com/
2. Instale o Node.js LTS: https://nodejs.org/ (opcional para este MVP, útil para ferramentas futuras).
3. Extraia esta pasta e abra-a no VS Code.

## 2. Criar o banco no Supabase
1. Acesse https://supabase.com/ e crie um projeto.
2. Abra SQL Editor > New query.
3. Copie todo o conteúdo de `supabase.sql`, cole no editor e clique em Run.
4. Em Authentication > Users, crie o usuário do dono com e-mail e senha. Não habilite cadastro público.
5. Em Project Settings > API (ou Connect, conforme a interface), copie a Project URL e a chave pública `anon`/`publishable`. Nunca use `service_role` ou `secret` no navegador.

## 3. Ligar o site ao Supabase
1. Abra `app.js`.
2. Substitua `COLE_AQUI_A_URL_DO_PROJETO` pela Project URL.
3. Substitua `COLE_AQUI_A_CHAVE_PUBLICA` pela chave pública.
4. Salve o arquivo.

## 4. Testar localmente
A maneira mais simples é instalar a extensão **Live Server** no VS Code:
1. Abra Extensions (ícone de blocos à esquerda).
2. Pesquise `Live Server` e instale a extensão popular de Ritwick Dey.
3. Clique com o botão direito em `index.html` > Open with Live Server.
4. Entre com o usuário criado no Supabase.
5. Cadastre alguns produtos e crie um pedido de teste.

Não abra `index.html` diretamente com `file://`; use um servidor local.

## 5. Publicar no Netlify
1. Crie uma conta em https://www.netlify.com/
2. Faça upload/deploy da pasta do projeto pelo método de deploy manual disponível no painel, ou conecte um repositório Git.
3. Como o app é estático, não precisa de servidor Node em produção.
4. Configure Authentication > URL Configuration no Supabase para incluir o domínio publicado, se necessário.
5. Teste login, cadastro de produto, esgotamento, criação e fechamento de pedidos no endereço publicado.

## Observações importantes
- O site usa a chave pública do Supabase; a segurança depende das políticas RLS no banco.
- O SQL deste MVP permite que qualquer usuário autenticado no mesmo projeto opere os dados. Como o projeto é para um único dono, crie apenas a conta autorizada e desabilite signups públicos. Para uma versão com vários funcionários ou clientes, será necessário separar dados por estabelecimento e restringir políticas por usuário/tenant.
- Faça testes com pedidos fictícios antes de usar durante o atendimento real.
- A criação do pedido e a gravação dos itens são duas chamadas separadas nesta versão inicial. Antes de usar em produção, é recomendável migrar para uma função SQL transacional para impedir pedidos parcialmente gravados.
- A impressão térmica fica fora do escopo da primeira versão.


## Interação atualizada
- Seleção por toque de 12 mesas e opção balcão/retirada.
- Produtos adicionados tocando no cartão, com botões + e − para ajustar quantidades.
- Formulário de novo pedido pode ser recolhido/expandido.

## Minha primeira contribuição

Esta alteração foi realizada por RONALDELAS-DEVS
para praticar o processo de Pull Request no GitHub.
