import 'reflect-metadata';
import { container, injectable } from 'tsyringe';
import gameData from './config/game-data';
import { GEPService } from './services/gep-service';
import { GameDetectionService } from './services/game-detection-service';
import {
  GameClosedEvent,
  GameLaunchedEvent,
  PostGameEvent,
} from './interfaces/running-game';
import { GEPConsumer } from './services/gep-consumer';
import { AuthService } from './services/auth-service';
import { environment } from "./environment/environment";

// -----------------------------------------------------------------------------
@injectable()
export class Main {
  server: any;
  port = 61234;
  userData: any;

  public constructor(
      private readonly gepService: GEPService,
      private readonly gepConsumer: GEPConsumer,
      private readonly gameDetectionService: GameDetectionService,
      private readonly authService: AuthService,
  ) {
    this.createServer();
    this.checkTokenAndUser();
  }

  checkTokenAndUser(): void {
    const token = localStorage.getItem('token');
    if (token) {
      this.authService.getUser()
          .then((userData) => {
            this.userData = userData;
            this.displayUserInfo();
            this.init();
          })
          .catch((error) => {
            console.error('Error fetching user data:', error);
            this.displayAuthButtons();
          });
    } else {
      this.displayAuthButtons();  // No token, show login/register
    }
  }

  createServer(): void {
    overwolf.web.createServer(this.port, (serverInfo) => {
      if (serverInfo.error) {
        console.log('Failed to create local server');
      } else {
        this.server = serverInfo.server;

        if (!this.server) {
          return;
        }

        this.server.onRequest.removeListener(this.onRequest.bind(this));
        this.server.onRequest.addListener(this.onRequest.bind(this));

        this.server.listen(() => {
          console.log(`Local server listening on port ${this.port}`);
        });
      }
    });
  }

  onRequest(info: { url: string }) {
    const urlString = info.url;
    const url = new URL(urlString);
    const searchParams = url.searchParams;

    const token = searchParams.get('token');

    if (token) {
      localStorage.setItem('token', token);

      this.authService.getUser()
          .then((userData) => {
            this.userData = userData;
            this.displayUserInfo();
            this.init();
          })
          .catch((error) => {
            console.error('Error fetching user data:', error);
          });
    }
  }

  displayUserInfo(): void {
    const container = document.querySelector('.center-container');
    if (container) {
      container.innerHTML = `
        <div>
          Enjoy playing games!<br />
          User Data:
          <pre>${this.userData?.user?.discordData?.username}</pre>
        </div>
      `;
    }
  }

  displayAuthButtons(): void {
    const callbackUrl = `http://localhost:${this.port}`;
    const loginUrl = `${environment.url}/login/?callbackUrl=${encodeURIComponent(callbackUrl)}`;
    const registerUrl = `${environment.url}/register/?callbackUrl=${encodeURIComponent(callbackUrl)}`;

    const container = document.querySelector('.center-container');
    if (container) {
      container.innerHTML = `
        <button id="login-button" class="btn">Login</button>
        <button id="register-button" class="btn">Register</button>
      `;

      document.getElementById('login-button')?.addEventListener('click', () => {
        overwolf.utils.openUrlInDefaultBrowser(loginUrl);
      });

      document.getElementById('register-button')?.addEventListener('click', () => {
        overwolf.utils.openUrlInDefaultBrowser(registerUrl);
      });
    }
  }

  /**
   * Initializes this app
   */
  public init(): void {
    // Register for the `gameLaunched` event from the game detection service
    this.gameDetectionService.on(
      'gameLaunched',
      (gameLaunch: GameLaunchedEvent) => {
        console.log(`Game was launched: ${gameLaunch.name} ${gameLaunch.id}`);
        // Get the configured data for the launched game
        const gameConfig = gameData[gameLaunch.id];
        // If the detected game exists
        if (gameConfig) {
          this.gepService.gameLaunchId = gameLaunch.id;
          // Run the game launched logic of the gep service
          this.gepService.onGameLaunched(gameConfig.interestedInFeatures);
        }
      },
    );
    // Register for the `gameClosed` event from the gameDetectionService
    this.gameDetectionService.on(
      'gameClosed',
      (gameClosed: GameClosedEvent) => {
        console.log(`Game was closed: ${gameClosed.name}`);
        // Run game closed cleanup of the gep service
        this.gepService.onGameClosed();
      },
    );
    // Register for the `postGame` event from the gameDetectionService
    this.gameDetectionService.on('postGame', (postGame: PostGameEvent) => {
      console.log(`Running post-game logic for game: ${postGame.name}`);
    });

    // Register for the `gameEvent`, `infoUpdate`, and `error` gepService events
    this.gepService.on('gameEvent', this.gepConsumer.onNewGameEvent);
    this.gepService.on('infoUpdate', this.gepConsumer.onGameInfoUpdate);
    this.gepService.on('error', this.gepConsumer.onGEPError);

    // Handle Events to write data into database
    this.gepService.on('gameEvent', this.gepService.onNewGameEvent);
    this.gepService.on('infoUpdate', this.gepService.onGameInfoUpdate);

    // Initialize the game detection service
    this.gameDetectionService.init();
  }
}

container.resolve(Main);
