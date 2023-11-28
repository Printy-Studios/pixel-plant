import Game from './Game';

declare global {
    interface Window { game: Game; }
}

const game = new Game();

game.init().then(() => {
    game.start();
})

window.game = game;
