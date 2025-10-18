# Pizza Delivery Empire

An incremental game where you build a pizza delivery business. Accept delivery jobs, unlock new pizza types, hire drivers, and work your way to becoming a millionaire.

Built with the [Profectus](https://github.com/profectus-engine/Profectus) incremental game engine.

## Quick Start

### Prerequisites
- Node.js 16+
- npm

### Installation

```bash
git clone https://github.com/sfgeekgit/pizza-delivery-game.git
cd pizza-delivery-game
npm install
npm run dev
```

The game will open at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

## How to Play

You start with a small amount of money and one driver. New delivery jobs appear in a queue automatically. Each job requires a specific pizza type and an available driver.

Click Accept to start a delivery or Decline to remove it from the queue. Completed deliveries earn you money. Use your earnings to unlock new pizza types and hire additional drivers.

The goal is to reach one million dollars.

## Development

See [DEVELOPER_NOTES.md](DEVELOPER_NOTES.md) for technical documentation.

### Project Structure
```
pizza-delivery-game/
├── src/
│   ├── data/
│   │   ├── layers/
│   │   │   └── main.tsx       # Main game logic
│   │   └── projEntry.tsx      # Entry point
│   └── components/
└── package.json
```

## License

MIT License. See [Profectus repository](https://github.com/profectus-engine/Profectus) for framework license details.

## Credits

- Game: [@sfgeekgit](https://github.com/sfgeekgit)
- Framework: [Profectus](https://github.com/profectus-engine/Profectus)
