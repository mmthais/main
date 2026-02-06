# Meu Site no GitHub Pages 🌐

Site pessoal com múltiplas páginas hospedado gratuitamente no GitHub Pages.

## 📁 Estrutura do Projeto

```
seu-repositorio/
│
├── index.html              # Página principal (hub/menu)
├── portfolio.html          # Portfólio profissional
├── checklist.html          # Checklist de disciplinas
├── experimentos.html       # Experimentos de código
│
├── css/
│   ├── main.css           # Estilos da página principal
│   ├── styles.css         # Estilos do portfólio
│   ├── checklist.css      # Estilos do checklist
│   └── experimentos.css   # Estilos dos experimentos
│
└── js/
    ├── script.js          # JavaScript do portfólio
    ├── checklist.js       # JavaScript do checklist
    └── experimentos.js    # JavaScript dos experimentos
```

## 🚀 Como Configurar no GitHub Pages

### 1. Criar o Repositório

1. Acesse [github.com](https://github.com) e faça login
2. Clique no botão **"New"** (repositório novo)
3. Dê um nome ao repositório (ex: `meu-site`)
4. Deixe como **Public**
5. Clique em **"Create repository"**

### 2. Fazer Upload dos Arquivos

**Opção A - Via Interface Web:**
1. No repositório criado, clique em **"Add file"** → **"Upload files"**
2. Arraste todos os arquivos e pastas
3. Clique em **"Commit changes"**

**Opção B - Via Git (linha de comando):**
```bash
git init
git add .
git commit -m "Primeira versão do site"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
git push -u origin main
```

### 3. Ativar o GitHub Pages

1. No repositório, vá em **Settings** (Configurações)
2. No menu lateral, clique em **Pages**
3. Em **Source**, selecione **"Deploy from a branch"**
4. Escolha a branch **main** e a pasta **/ (root)**
5. Clique em **Save**
6. Aguarde 1-2 minutos

### 4. Acessar seu Site

Seu site estará disponível em:
```
https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/
```

## ✏️ Personalização

### Página Principal (index.html)

Edite as informações no arquivo `index.html`:

```html
<!-- Título e subtítulo -->
<h1>Seu Nome Aqui</h1>
<p class="subtitle">Sua descrição</p>

<!-- Links sociais -->
<a href="mailto:seu@email.com">...</a>
<a href="https://linkedin.com/in/seu-perfil">...</a>
```

### Portfólio (portfolio.html)

1. Substitua "Seu Nome" pelo seu nome
2. Edite a seção "Sobre Mim"
3. Adicione/remova cards de experiência
4. Atualize suas habilidades
5. Inclua seus contatos reais

### Checklist (checklist.html)

O checklist já está funcional! Basta usar. As disciplinas são salvas automaticamente no navegador.

### Experimentos (experimentos.html)

Para adicionar novos experimentos:

1. Copie um bloco de `<div class="experiment-card">`
2. Modifique o título, descrição e tag
3. Adicione seu código HTML no `<div class="experiment-demo">`
4. Se precisar de JavaScript, adicione em `js/experimentos.js`

## 🎨 Personalizar Cores

Em cada arquivo CSS, edite as variáveis no início:

```css
:root {
    --primary: #SUA-COR-AQUI;
    --secondary: #SUA-COR-AQUI;
    /* ... */
}
```

## 📱 Funcionalidades

### Página Principal
- ✅ Design moderno e responsivo
- ✅ Cards clicáveis para navegação
- ✅ Links para redes sociais
- ✅ Animações suaves

### Portfólio
- ✅ Seção de experiências profissionais
- ✅ Destaques e conquistas
- ✅ Habilidades categorizadas
- ✅ Menu de navegação
- ✅ 100% responsivo

### Checklist de Disciplinas
- ✅ Adicionar/remover disciplinas
- ✅ Marcar como concluída
- ✅ Filtros (todas/em andamento/concluídas)
- ✅ Salva automaticamente no navegador
- ✅ Contadores dinâmicos

### Experimentos
- ✅ Calculadora funcional
- ✅ Contador interativo
- ✅ Espaço para novos testes
- ✅ Instruções de uso

## 🔧 Adicionar Novas Páginas

1. Crie um novo arquivo HTML (ex: `nova-pagina.html`)
2. Copie a estrutura básica de uma página existente
3. Crie um arquivo CSS em `css/` (ex: `nova-pagina.css`)
4. Adicione um card na página principal:

```html
<div class="project-card">
    <div class="card-icon">
        <i class="fas fa-star"></i>
    </div>
    <h2>Nova Página</h2>
    <p>Descrição da nova página</p>
    <a href="nova-pagina.html" class="card-link">
        Acessar <i class="fas fa-arrow-right"></i>
    </a>
</div>
```

## 📝 Dicas

1. **Teste localmente**: Abra os arquivos no navegador antes de fazer upload
2. **Commits frequentes**: Faça alterações pequenas e commit com frequência
3. **Backup**: Sempre mantenha uma cópia dos arquivos no seu computador
4. **Imagens**: Se adicionar imagens, crie uma pasta `images/` ou `img/`
5. **Responsividade**: Sempre teste em diferentes tamanhos de tela

## 🆘 Solução de Problemas

**Site não aparece após ativar GitHub Pages?**
- Aguarde 2-5 minutos
- Verifique se está na branch correta (main)
- Limpe o cache do navegador

**Página aparece mas sem CSS?**
- Verifique os caminhos dos arquivos CSS
- Certifique-se que a estrutura de pastas está correta

**JavaScript não funciona?**
- Abra o Console do navegador (F12) para ver erros
- Verifique se os caminhos dos arquivos JS estão corretos

## 📚 Recursos Úteis

- [Documentação GitHub Pages](https://docs.github.com/pt/pages)
- [Font Awesome (ícones)](https://fontawesome.com/icons)
- [Google Fonts](https://fonts.google.com/)
- [Can I Use (compatibilidade CSS)](https://caniuse.com/)

## 📄 Licença

Você é livre para usar, modificar e distribuir este código.

---

**Desenvolvido com ❤️ para facilitar sua presença online!**
