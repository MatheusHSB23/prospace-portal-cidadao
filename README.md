# ProSpace Health — Portal Web do Cidadão

Versão web independente do aplicativo do cidadão. O Portal de Gestão continua separado. Os dois projetos utilizam o mesmo Supabase e respeitam os perfis cadastrados em `public.profiles`.

## Recursos incluídos

- Cadastro de cidadão, login e sessão persistente pelo Supabase Auth.
- Confirmação e reenvio de e-mail.
- Recuperação e redefinição de senha.
- Bloqueio de contas `admin` e `health_worker` nesta área; esses perfis devem utilizar o Portal de Gestão.
- Início com resumo dos atendimentos, solicitações, campanhas e notificações.
- Catálogo de serviços e unidades de saúde.
- Consulta de horários disponíveis e agendamento via RPC `book_appointment`.
- Histórico de atendimentos, QR Code de protocolo e cancelamento via RPC `cancel_appointment`.
- Consulta de exames, vacinação e medicamentos.
- Cadastro e remoção de vínculos familiares.
- Abertura e acompanhamento de solicitações.
- Campanhas públicas e notificações com opção de marcar como lida.
- Edição dos dados pessoais do próprio perfil.
- Layout responsivo para computador, tablet e celular.

## Requisitos para executar no Windows

- Python 3 instalado e disponível no PATH.
- Conexão com a internet para carregar o Supabase JS e a biblioteca de QR Code do CDN, além de conectar ao Supabase.
- Não precisa de Flutter nem Android Studio.

## Como iniciar

1. Extraia o ZIP inteiro para uma pasta, por exemplo `C:\ProSpace_Health_Web_Cidadao`.
2. Confira `supabase-config.js`. A cópia entregue já está apontada para o Supabase configurado no projeto Flutter enviado.
3. Dê dois cliques em `INICIAR_PORTAL_CIDADAO.bat`.
4. O navegador abrirá em `http://localhost:7358`.
5. Mantenha a janela do CMD aberta enquanto estiver utilizando o portal. Para encerrar, pressione `Ctrl + C` na janela e confirme, se solicitado.

Alternativa pelo PowerShell, na pasta do projeto:

```powershell
py -3 -m http.server 7358 --bind 127.0.0.1
```

Depois abra `http://localhost:7358`.

**Não abra o `index.html` por duplo clique (`file://`).** O portal precisa ser servido por HTTP para que a autenticação e os recursos do navegador funcionem corretamente.

## Supabase: autenticação e redirecionamentos

Acesse o mesmo projeto Supabase usado pelo aplicativo e pelo Portal de Gestão.

1. Abra **Authentication → URL Configuration**.
2. Em **Redirect URLs**, adicione:

```text
http://localhost:7358/**
http://127.0.0.1:7358/**
```

3. Para hospedagem, adicione também o domínio final, por exemplo `https://app.seudominio.com/**`, e altere `emailRedirectTo` se o site estiver em um subdiretório.
4. O **Site URL** deve apontar para o domínio oficial publicado, não para uma chave ou endpoint REST.

O cadastro envia `full_name`, `cpf` e `phone` como metadados para o gatilho `handle_new_user()` criar `public.profiles`. A confirmação de e-mail segue a configuração de Authentication do seu projeto.

## Banco de dados

Este portal usa o mesmo esquema do aplicativo Flutter:

- `profiles`
- `health_units`
- `health_services`
- `appointment_slots`
- `appointments`
- `exam_records`
- `vaccinations`
- `medication_orders`
- `family_members`
- `service_requests`
- `campaigns`
- `notifications`

Também utiliza as RPCs `book_appointment` e `cancel_appointment` para manter a reserva e a liberação de vagas atômicas no banco.

Se o banco já está sendo usado pelo ProSpace Health, **não execute novamente o `database/schema.sql`**. Só execute o esquema em uma instalação nova depois de revisão. O portal web não exige uma migração nova.

## Configuração da conexão

`supabase-config.js` contém a **Project URL** e uma chave pública (`Publishable`/`anon`) para uso no navegador. Essa chave é visível por design em aplicações client-side e deve sempre estar protegida por políticas RLS corretas.

Nunca coloque no arquivo:
- `service_role`
- `sb_secret_...`
- senha do banco
- tokens privados

Para trocar de projeto, edite somente:

```js
window.PROSPACE_CONFIG = {
  supabaseUrl: 'https://SEU-PROJETO.supabase.co',
  supabaseAnonKey: 'SUA_CHAVE_PUBLICA'
};
```

## Perfis e acesso

- `citizen`: pode utilizar este Portal Web do Cidadão.
- `health_worker` e `admin`: devem utilizar o Portal de Gestão.

A alteração de perfil não é oferecida na interface do cidadão. A promoção de administradores deve ser feita por procedimento administrativo seguro no Supabase, não pelo navegador.

## Hospedagem

O projeto é estático. Pode ser publicado em um serviço de hospedagem estática que ofereça HTTPS. Faça upload de todos os arquivos e pastas preservando a estrutura (`assets/`, `styles.css`, `app.js`, `supabase-config.js`). Depois, cadastre o domínio final em **Authentication → URL Configuration → Redirect URLs**.

## Segurança e limitações

- O frontend não usa `service_role`; as operações são limitadas pelas políticas RLS do banco.
- O QR Code contém apenas o protocolo de atendimento, não dados clínicos.
- O portal mostra apenas os registros acessíveis à conta autenticada; não permite que cidadão consulte prontuários de terceiros.
- Não utilize informações de demonstração como registros reais.
- Antes de operar com pacientes reais, revise RLS, backups, MFA de equipe, auditoria, HTTPS, política de privacidade e requisitos da LGPD. Esta entrega não é uma certificação de segurança nem substitui prontuário clínico.

## Verificações realizadas

- Sintaxe JavaScript conferida com `node --check`.
- Estrutura dos arquivos, assets, manifesto e referências estáticas conferidos.
- Relação de tabelas, campos, RLS e RPCs conferida com o esquema do aplicativo Flutter enviado.
- A autenticação, a navegação com dados reais e as operações de escrita ainda precisam ser testadas no navegador do proprietário com o projeto Supabase ativo; não foram executadas contra o banco neste ambiente.
