# ⚔️ Minecraft Chess (Xadrez Minecraft)

Um jogo de xadrez completo ambientado no universo de Minecraft, desenvolvido em **HTML5**, **CSS3** e **JavaScript modular**.

As peças foram recortadas diretamente da imagem de sprites (`minechess.jpeg`), processadas com remoção de fundo (transparência alfa) e estilizadas com perspectiva isométrica voxel sobre um tabuleiro temático de blocos de madeira Birch e Dark Oak.

---

## 🎮 Como Jogar

Você pode abrir o jogo de duas formas simples:

1. **Direto no Navegador**:
   - Dê um duplo-clique no arquivo `index.html` para abrir diretamente no seu navegador preferido (Google Chrome, Edge, Firefox, Brave, etc.).

2. **Servidor Local (Opcional)**:
   ```bash
   # Com Python:
   python -m http.server 8000
   
   # Ou com Node.js:
   npx serve .
   ```
   Depois acesse `http://localhost:8000`.

---

## 👑 Peças do Jogo (Lore Minecraft)

### Time das Brancas (Humanos & Aldeões)
- **Peão**: Steve
- **Torre**: Torre de Diorito
- **Cavalo**: Steve com Armadura em Cavalo Branco
- **Bispo**: Clérigo Aldeão com Cajado Sagrado
- **Dama (Rainha)**: Rainha Alex
- **Rei**: Rei Steve com Manto Real e Coroa de Ouro

### Time das Negras (Monstros & Submundo)
- **Peão**: Zumbi Aldeão
- **Torre**: Citadela de Obsidiana e Rocha-Negra
- **Cavalo**: Esqueleto em Cavalo Negro
- **Bispo**: Evocador Illager com Cajado
- **Dama (Rainha)**: Rainha Ender com Asas de Dragão
- **Rei**: Rei Herobrine com Olhos Brilhantes e Manto das Sombras

---

## 🧩 Recursos & Regras Implementadas

- **Regras Oficiais de Xadrez**:
  - Movimentos completos de todas as 6 peças.
  - **Roque** (Pequeno e Grande) com verificação de peças que se moveram e casas sob ataque.
  - **En Passant** (Captura na passagem do peão).
  - **Promoção de Peão**: Modal temático para escolher Dama, Torre, Bispo ou Cavalo.
  - **Detecção de Xeque e Xeque-Mate**.
  - **Empates**: Afogamento (Stalemate), Material Insuficiente e Regra dos 50 movimentos.
- **Modos de Jogo**:
  - **Jogador vs Bot Minecraft**: Inteligência Artificial com algoritmo Minimax, poda Alpha-Beta e tabelas de valor posicional. Três níveis:
    - *Zumbi (Fácil)*: Movimentos casuais com foco em capturas.
    - *Esqueleto (Médio)*: Minimax com avaliação de posição.
    - *Herobrine (Difícil)*: Minimax profundo com poda Alpha-Beta e ordenação MVV-LVA.
  - **Dois Jogadores (Local)**: Passe e jogue no mesmo dispositivo.
- **Interatividade & Controles**:
  - Clique na peça para ver casas válidas (esferas verdes) e capturas (anéis vermelhos).
  - Suporte total a **Arrastar e Soltar (Drag & Drop)** e **Clique-para-Mover**.
  - Flash de dano vermelho animado no Rei quando em Xeque.
  - Realce dourado do último movimento efetuado.
  - Histórico de lances em notação SAN (e4, Nf3, O-O, etc.) com rolagem automática.
  - Bandeja de peças capturadas com contagem de vantagem material (+1, +3, etc.).
  - Botão de **Desfazer (Undo)** para reverter jogadas.
  - Botão de **Girar Tabuleiro** para inverter a perspectiva.
- **Efeitos Sonoros Procedurais (Web Audio API)**:
  - Som de bloco de madeira ao mover peças.
  - Som de golpe de espada e impacto crítico ao capturar.
  - Som de sino/bigorna de alerta em Xeque.
  - Som de pistão mecânico ao realizar Roque.
  - Fanfarra triunfante de subida de nível do Minecraft na vitória.
  - Botão para Ativar/Desativar áudio com salvamento de preferência.

---

## 📁 Estrutura Modular dos Arquivos

```
mine-chess/
├── index.html            # Estrutura visual e interface da aplicação
├── css/
│   └── style.css         # Estilização completa estilo Minecraft e peças isométricas
├── js/
│   ├── constants.js      # Constantes, tipos de peças, valores e estado inicial
│   ├── board.js          # Manipulação e coordenadas do tabuleiro (8x8)
│   ├── rules.js          # Validação de regras, xeque, roque, en passant e mate
│   ├── audio.js          # Síntese procedural de áudio estilo Minecraft
│   ├── ai.js             # Engine de IA (Minimax + Alpha-Beta + Tabelas Posicionais)
│   ├── ui.js             # Renderização visual, animações e eventos de interação
│   └── main.js           # Orquestração do ciclo de vida do jogo e eventos
├── assets/
│   └── pieces/           # 12 sprites transparentes de alta qualidade
│       ├── w_pawn.png, w_rook.png, w_knight.png, w_bishop.png, w_queen.png, w_king.png
│       └── b_pawn.png, b_rook.png, b_knight.png, b_bishop.png, b_queen.png, b_king.png
├── extract_pieces.py     # Script Python para recorte e processamento de transparência
└── minechess.jpeg        # Imagem original com os personagens
```
