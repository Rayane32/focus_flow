# FocusFlow ⏱️🚀

FocusFlow é um gerenciador de tempo e tarefas moderno, elegante e altamente funcional inspirado nos melhores produtos SaaS do mercado. O sistema combina o controle ágil de status de atividades cotidianas com um cronômetro Pomodoro interativo em tempo real para maximizar o rendimento pessoal e profissional de seus usuários.

---

## 🎨 Principais Funcionalidades

- **Autenticação Completa (Supabase Auth)**: Registro, login, logout e fluxo de redefinição de senhas.
- **Durable Cloud Database**: Integração sólida com o Banco de Dados PostgreSql do Supabase.
- **Políticas de RLS Confiáveis**: Row Level Security (Segurança a Nível de Linha) ativa, assegurando que cada usuário acesse exclusivamente seus dados.
- **Temporizador Pomodoro Integrado**: Associe o foco de 25 minutos com contadores visuais e alerta sonoro/visual para acompanhar seu tempo de produção atual.
- **Painel Estatístico (KPIs)**: Insights instantâneos sobre tarefas cadastradas, taxa de conclusão e total de horas estimadas restantes.
- **Filtros e Filtro Rápido por Categoria**: Busque no título ou nas anotações, e ordene instantaneamente por categoria, prioridade ou status.
- **Segurança Adaptativa (Fail-safe)**: Se as chaves do Supabase não forem devidamente configuradas temporariamente no `.env`, o FocusFlow ativa o **Modo Demonstrativo**, persistindo seus dados perfeitamente no `localStorage` local para testes sem interrupções!

---

## 🛠️ Stack Tecnológica

- **Frontend**: React 19 (Hooks Funcionais + Context API)
- **Compilador e Ferramenta de Build**: Vite
- **Tipagem**: TypeScript
- **Estilização**: Tailwind CSS v4 (SaaS Light & Dark Mode moderno)
- **Banco de Dados & Autenticação**: Supabase (`@supabase/supabase-js`)
- **Roteamento**: React Router v6 (`react-router-dom`)
- **Iconografia**: Lucide React
- **Animações**: Motion (`motion/react`)

---

## 🚀 Como Executar o Projeto

Siga os passos simplificados a seguir para rodar o FocusFlow localmente:

### 1. Clonar e Instalar Dependências

Certifique-se de possuir o Node.js instalado em sua máquina. execute:

```bash
# Baixe as dependências do projeto
npm install
```

### 2. Configurar o Banco do Supabase

Siga os passos no painel do Supabase para criar sua infraestrutura em nuvem:

1. Acesse o site do [Supabase](https://supabase.com) e crie uma conta (gratuita).
2. Clique no botão de criar um novo projeto (**New Project**) e guarde as credenciais de URL e chave anônima.
3. No menu à esquerda, navegue até a ferramenta **SQL Editor**.
4. Clique em **New query**, copie todo o conteúdo existente no arquivo `schema.sql` deste repositório, cole no editor de comandos e clique em **Run** (Executar).
5. Pronto! Todas as tabelas e políticas de RLS de segurança estarão criadas e ativas no seu banco.

### 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do diretório do projeto e atribua os valores de conexão obtidos (veja as referências em `.env.example`):

```env
VITE_SUPABASE_URL="https://seu-id-de-projeto.supabase.co"
VITE_SUPABASE_ANON_KEY="sua_chave_publica_anonima_aqui..."
```

*(Se você optar por não configurar as chaves agora, você pode rodar o projeto de toda forma e ele ligará no modo LocalStorage com uma conta simulada de demonstração automática).*

### 4. Iniciar o Servidor de Desenvolvimento

Inicie o servidor de testes local com:

```bash
npm run dev
```

Abra o endereço exibido no terminal (geralmente [http://localhost:3000](http://localhost:3000)) em seu navegador.

---

## 🪐 Execução do Schema de Segurança (schema.sql)

O arquivo `schema.sql` fornecido possui a estrutura da tabela `tasks` e as regras de segurança obrigatórias do projeto.
- Ele declara as chaves estrangeiras (`user_id` apontando para `auth.users(id) on delete cascade`) para que quando uma conta de usuário for excluída do Supabase Auth, suas tarefas acompanhem de forma limpa.
- O script ativa o **Row Level Security (RLS)** da tabela, garantindo que usuários mal-intencionados não acessem tarefas de terceiros através de queries de API, mantendo conformidade com as regras rígidas do SaaS.

---

## 🌍 Como realizar Deploy na Vercel

Deseja colocar seu FocusFlow em produção para uso diário? O projeto está pronto para a plataforma **Vercel**:

1. Garanta que o código do seu aplicativo esteja salvo e sincronizado em um repositório Git pessoal (no GitHub, GitLab, etc.).
2. Faça login no painel oficial da [Vercel](https://vercel.com).
3. Importe o repositório selecionando o botão **Add New... &rarr; Project**.
4. No menu de configuração do projeto, expanda a área **Environment Variables** (Variáveis de Ambiente).
5. Adicione as mesmas variáveis de produção configuradas localmente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Deixe o campo de comandos de build padrão e clique em **Deploy**.
7. Após poucos segundos, a Vercel fornecerá um link oficial seguro HTTPS (`.vercel.app`) para você acessar sua aplicação de qualquer dispositivo!
