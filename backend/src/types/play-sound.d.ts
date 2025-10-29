declare module "play-sound" {
    interface PlayerOptions {
        players?: string[];
    }

    interface AudioPlayer {
        play: (
            file: string,
            options?: Record<string, any>,
            callback?: (err: Error | null) => void
        ) => void;
    }

    function player(options?: PlayerOptions): AudioPlayer;

    export = player;
}