# FinanceAI - Intelligent Financial Analysis System

## Overview

FinanceAI is a comprehensive financial analysis system that combines artificial intelligence with document processing to provide intelligent credit scoring, risk assessment, and financial consultancy services. The application processes bank statements, invoices, and other financial documents to detect patterns, assess creditworthiness, and identify potential risks including gambling activities.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: Radix UI components with shadcn/ui styling
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query for server state and React hooks for local state
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST API
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (@neondatabase/serverless)
- **Authentication**: Express sessions with bcrypt password hashing
- **File Processing**: Multer for file uploads with Python integration for document analysis

### AI/ML Integration
- **LLM Providers**: Multi-provider support including:
  - OpenAI (GPT-4o)
  - Anthropic Claude (claude-sonnet-4-20250514)
  - Google Gemini (gemini-2.5-flash)
- **Document Processing**: Python-based modules for extracting data from PDFs, spreadsheets, and images
- **Financial Analysis**: Custom algorithms for credit scoring and risk assessment

## Key Components

### Data Flow
1. **Document Upload**: Users upload financial documents through the web interface
2. **File Processing**: Python modules extract structured data from documents
3. **AI Analysis**: LLM providers analyze extracted data for patterns and insights
4. **Risk Assessment**: Custom algorithms calculate credit scores and detect suspicious activities
5. **Report Generation**: AI generates comprehensive financial reports and recommendations

### Database Schema
- **Users**: User accounts with authentication and role management
- **Conversations**: Chat-like interface for user interactions
- **Messages**: Individual messages in conversations with AI responses
- **File Uploads**: Metadata and processing status for uploaded documents
- **Financial Analyses**: Structured analysis results with scoring and risk indicators

### Authentication & Authorization
- Session-based authentication using Express sessions
- Password hashing with bcrypt
- Role-based access control (user/admin roles)
- Protected API routes requiring authentication

## External Dependencies

### Core Dependencies
- **Database**: PostgreSQL via Neon Database
- **File Storage**: Local file system with configurable upload limits
- **AI Services**: API keys required for OpenAI, Anthropic, and Google AI
- **Document Processing**: Python runtime with specialized libraries

### Android APK Build System
- Complete Android Studio project structure with Gradle build configuration
- Native WebView wrapper providing seamless mobile experience
- File upload integration with Android's native file picker system
- Splash screen with branded loading experience
- Proper mobile app lifecycle management and background handling
- Optimized APK generation with debug and release build variants
- Deep linking support for PDF and Excel file associations
- Material Design theming consistent with web application branding
- Pull-to-refresh functionality and native back button navigation
- Complete documentation in ANDROID_APK_BUILD.md for deployment

### File Processing Support
- PDF documents
- Excel/CSV spreadsheets  
- Images (JPEG, PNG)
- Word documents
- File size limit: 10MB per upload

### Security Features
- Input validation and sanitization
- File type restrictions
- SQL injection protection via parameterized queries
- Session security with configurable secrets

## Deployment Strategy

### Development Environment
- Replit-optimized configuration with hot reloading
- Vite development server with HMR
- Automatic database migrations
- Environment variable management

### Production Build Process
1. Frontend build: `vite build` compiles React app to static assets
2. Backend build: `esbuild` bundles Node.js server with external packages
3. Database setup: Drizzle migrations ensure schema consistency
4. Asset optimization: Static files served efficiently

### Environment Requirements
- Node.js 20+ runtime
- PostgreSQL 16+ database
- Python runtime for document processing
- Required environment variables:
  - `DATABASE_URL`: PostgreSQL connection string
  - `SESSION_SECRET`: Session encryption key
  - AI provider API keys (optional but recommended)

### Scalability Considerations
- Database connection pooling for high concurrency
- Stateless session management for horizontal scaling
- Modular AI provider system for load distribution
- Efficient file processing with async operations

## Changelog
- June 26, 2025. Initial setup
- June 26, 2025. Frontend ChatGPT-style interface completed (95% fidelity)
- June 26, 2025. File upload system with progress tracking implemented
- June 26, 2025. Conversation management system with sidebar navigation
- June 26, 2025. Message layout with user/AI distinction and file attachments
- June 26, 2025. Interface ChatGPT 100% finalizada com todas as funcionalidades
- June 26, 2025. Sistema de notificações, validação de arquivos, e controles funcionais
- June 26, 2025. Sidebar comportamento corrigido, perfil reorganizado, funcionalidades ativas
- June 26, 2025. Backend completo implementado: banco de dados, IA real, autenticação
- June 26, 2025. Sistema de análise financeira com OpenAI integrado e funcionando
- June 26, 2025. API completa para conversas, mensagens, uploads e relatórios
- June 26, 2025. Sistema de autenticação completo implementado com login/registro
- June 26, 2025. Interface simplificada criada para resolver conflitos de compilação
- June 26, 2025. Componentes SimpleSidebar e SimpleChatArea funcionais
- June 26, 2025. Android APK project structure created with native WebView wrapper
- June 26, 2025. Complete Android build configuration with Gradle, Kotlin, and resources
- June 26, 2025. Native file upload support and deep linking for document handling
- June 26, 2025. Interface melhorada: botões de envio com fundo transparente
- June 26, 2025. Seletor de tema movido para barra superior dos chats
- June 26, 2025. Bordas melhoradas na caixa de digitação para melhor visibilidade
- June 26, 2025. Sistema de áudio completo: gravação, preview, transcrição automática
- June 26, 2025. Botão de gravação adicionado ao GeminiChatArea com interface roxa
- June 26, 2025. Linhas de cabeçalho removidas do ChatArea, botões flutuantes implementados
- June 26, 2025. Correções de rolagem móvel implementadas com CSS específico
- June 26, 2025. Modal de configurações reorganizado com seções expansíveis
- June 26, 2025. Campos para APIs OpenAI, Anthropic e Google adicionados
- June 26, 2025. Acesso administrativo implementado para funções sensíveis
- June 26, 2025. Sistema Multi-LLM completo implementado com orquestração inteligente
- June 26, 2025. Configurações de estratégias: Econômico, Balanceado e Premium
- June 26, 2025. Sistema de prompts com até 12 campos configuráveis em cadeia
- June 26, 2025. Roteamento inteligente por assunto, backup e validação cruzada
- June 26, 2025. Interface administrativa expandida para gerenciar LLMs e prompts
- June 26, 2025. Financial-analyzer integrado com orquestrador Multi-LLM
- June 27, 2025. AdminPanel implementado com estrutura completa e funcional
- June 27, 2025. Sistema de verificação de permissões de acesso administrativo
- June 27, 2025. Interface de abas para diferentes seções administrativas
- June 27, 2025. Browserslist atualizado para resolver warnings de compatibilidade
- June 27, 2025. Sistema de versionamento unificado implementado (v2.0.0)
- June 27, 2025. PWA completo com manifesto, service worker e funcionalidade offline
- June 27, 2025. Android APK atualizado para versão 2.0.0 (versionCode 2)
- June 27, 2025. Configuração centralizada de versões em version.json
- June 27, 2025. Sistema completo de correções implementado: duplicações removidas, autenticação unificada
- June 27, 2025. Context API implementado para gerenciamento centralizado de configurações
- June 27, 2025. Componentes duplicados removidos (SettingsModal antigo, componentes obsoletos)
- June 27, 2025. Sistema de usuários unificado - removidos hardcoded, usando apenas banco de dados
- June 27, 2025. Middleware de autenticação aprimorado com validação robusta
- June 27, 2025. UnifiedSettingsModal criado substituindo múltiplas implementações
- June 27, 2025. Layout mobile-first implementado: configurações em barra vertical única
- June 27, 2025. AdminPanel redesenhado para mobile com tabs horizontais responsivas
- June 27, 2025. Base de Conhecimento implementada com upload e gerenciamento de documentos
- June 27, 2025. Sistema de gerenciamento de usuários funcional no AdminPanel
- June 27, 2025. Interface otimizada para dispositivos móveis conforme solicitado
- June 27, 2025. Correções de extensões .jsx → .tsx para compatibilidade com servidor
- June 27, 2025. Sistema completo de upload no chat com drag & drop implementado
- June 27, 2025. Análise financeira integrada ao sistema de upload em tempo real
- June 27, 2025. Sistema de Prompts implementado: configuração de 12 campos de cadeia
- June 27, 2025. Estratégias Multi-LLM funcionais: Econômico, Balanceado e Premium
- June 27, 2025. Configurações do Sistema completas: upload, performance, segurança
- June 27, 2025. Interface de upload com preview, progress e validação de arquivos
- June 27, 2025. Orquestração inteligente por assunto com backup e validação cruzada
- June 27, 2025. Sistema de notificações visuais para processamento de arquivos
- June 28, 2025. Botão de tema implementado na página de login com localStorage
- June 28, 2025. Campos de entrada atualizados para bordas rounded-3xl seguindo padrão
- June 28, 2025. PWA manifest atualizado com suporte a tema escuro (theme_color_dark)
- June 28, 2025. Android APK: tema escuro completo implementado com values-night
- June 28, 2025. Sistema de cores unificado para todas as plataformas (Web, PWA, Android)
- June 28, 2025. Versão atualizada para 2.1.0 em todas as plataformas
- June 28, 2025. Sistema de login opcional implementado nas configurações do sistema
- June 28, 2025. Cantos arredondados (rounded-3xl) aplicados em todos os botões e campos de entrada
- June 28, 2025. Botões do modal de configurações reorganizados verticalmente com cores consistentes
- June 28, 2025. AdminPanel redesenhado: layout responsivo, cores dos temas e rolagem corrigida
- June 28, 2025. Todos os formulários e botões seguem agora o padrão de cores claro/escuro
- June 28, 2025. Rodapé da página de login removido (linha divisória e botão "Usar conta de teste")
- June 28, 2025. Nome do usuário agora aparece abaixo da saudação "Olá" na página do chat
- June 28, 2025. Sistema de limpeza automática de cache implementado ao finalizar aplicação
- June 28, 2025. Bordas laterais removidas da página inicial de login para visual mais limpo

## User Preferences

Preferred communication style: Simple, everyday language.

### Project Scope Restrictions
- No integration with Brazilian bank APIs
- No chat sharing functionality
- Focus on core financial analysis and consultation features

### User System
- **Standard User:** Admin / admin123 (default login, configurable via admin panel)
- **Administrator:** Leonardo / L30n4rd0@1004 (access to admin panel only)

### Admin Panel Features (Pending Implementation)
- Configuration management (API keys, prompts)
- User credential management
- Knowledge base management (upload/manage documents, books, articles)
- File upload access and management
- User activity monitoring
- System settings

### Knowledge Base System (Pending Implementation)
- Document upload and indexing (PDFs, books, articles)
- Semantic search with OpenAI embeddings
- Categorization and metadata management
- Integration with AI for contextual responses
- Admin interface for content management
- Vector database for efficient searching