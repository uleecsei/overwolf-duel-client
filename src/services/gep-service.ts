import { EventEmitter } from 'events';
import { injectable } from 'tsyringe';
import { GameFileName, GameKey } from '../config/game-data';
import { environment } from '../environment/environment';

@injectable()
export class GEPService extends EventEmitter {
  private events: any = [];
  private info: any = [];
  public gameLaunchId: null | number = null;

  getDataButton = document.getElementById('get-data-button');
  userData = document.getElementById('user-data');

  constructor() {
    super();
    this.onErrorListener = this.onErrorListener.bind(this);
    this.onInfoUpdateListener = this.onInfoUpdateListener.bind(this);
    this.onGameEventListener = this.onGameEventListener.bind(this);

    this.getDataButton?.addEventListener('click', () => {
      this.getFromDataBase();
    });
  }

  /**
   * Save data to db
   *
   */

  async saveToDataBase() {
    try {
      console.log('save to database');
      const sessionId = localStorage.getItem('sessionId');
      if (!sessionId) {
        return;
      }

      const fileName =
        GameFileName[this.gameLaunchId as keyof typeof GameFileName];
      const response = await fetch(`${environment.url}/game-data/write`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            events: this.events,
            info: this.info,
            fileName: fileName || null,
          },
          sessionId,
        }),
      });
      this.events = [];
      this.info = [];

      if (!response.ok) {
        console.error('Error saving to database:', response.statusText);
      } else {
        const result = await response.json();
        console.log('Data saved to database:', result);
      }
    } catch (error: any) {
      this.events = [];
      this.info = [];
      console.error('Error:', error.message);
    }
  }

  /**
   * Get data from db
   *
   */

  async getFromDataBase() {
    try {
      const sessionId = localStorage.getItem('sessionId');
      if (!sessionId) {
        return;
      }

      const response = await fetch(
        `${environment.url}?sessionId=${sessionId}`,
        {
          method: 'GET',
        },
      );

      response.json().then((data) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this.userData?.innerText = JSON.stringify(data, null, 2);
      });
    } catch (error: any) {
      console.error('Error:', error.message);
    }
  }

  /**
   * Consumes the game events fired by the Overwolf GEP
   *
   * @param {overwolf.games.events.NewGameEvents} event
   * - An array of fired Game Events
   */
  public onNewGameEvent(event: overwolf.games.events.NewGameEvents) {
    switch (this.gameLaunchId) {
      case GameKey.ApexLegends:
        this.handleApexLegendsEvents(event);
        break;
      case GameKey.RocketLeague:
        this.handleRocketLeagueEvents(event);
        break;
      case GameKey.Fortnite:
        this.handleFortniteEvents(event);
        break;
      case GameKey.Valorant:
        this.handleValorantEvents(event);
        break;
      case GameKey.LeagueOfLegends:
        this.handleLeagueOfLegendsEvents(event);
        break;
      case GameKey.PUBG:
        this.handlePUBGEvents(event);
        break;
      case GameKey.CS2:
        this.handleCS2Events(event);
        break;
    }
  }

  /**
   * Consumes game info updates fired by the Overwolf GEP
   *
   * @param {overwolf.games.events.InfoUpdates2Event<
   *  string,
   *  overwolf.games.events.InfoUpdate2
   * >} info - An array of fired info updates
   */
  public onGameInfoUpdate(
    info: overwolf.games.events.InfoUpdates2Event<
      string,
      overwolf.games.events.InfoUpdate2
    >,
  ) {
    if (!info.info) {
      return;
    }

    switch (this.gameLaunchId) {
      case GameKey.RocketLeague:
        this.handleRocketLeagueInfo(info);
        break;
      case GameKey.Fortnite:
        this.handleFortniteInfo(info);
        break;
      case GameKey.Valorant:
        this.handleValorantInfo(info);
        break;
      case GameKey.LeagueOfLegends:
        this.handleLeagueOfLegendsInfo(info);
        break;
      case GameKey.PUBG:
        this.handlePUBGInfo(info);
        break;
    }
  }

  /**
   * Handle Apex Legends events fired
   *
   * @param {overwolf.games.events.NewGameEvents} event
   * - An array of fired Game Events
   */
  private handleApexLegendsEvents(
    event: overwolf.games.events.NewGameEvents,
  ): void {
    // eslint-disable-next-line max-len
    const killFeedEvent = event.events.find(
      (item) => item.name === 'kill_feed',
    );
    if (killFeedEvent) {
      const killFeedEventDataParsed = JSON.parse(killFeedEvent.data);
      const resultData = {
        local_player_name: killFeedEventDataParsed.local_player_name,
        victimName: killFeedEventDataParsed.victimName,
        action: killFeedEventDataParsed.action,
      };
      this.events.push(resultData);
      return;
    }

    const matchEndEvent = event.events.find(
      (item) => item.name === 'match_end',
    );
    if (matchEndEvent && this.events.length) {
      this.events.push({
        name: matchEndEvent.name,
        data: { date: new Date() },
      });
      console.log('calling save function', matchEndEvent);
      this.saveToDataBase();
    }
  }

  /**
   * Handle Rocket League events fired
   *
   * @param {overwolf.games.events.NewGameEvents} event
   * - An array of fired Game Events
   */
  private handleRocketLeagueEvents(
    event: overwolf.games.events.NewGameEvents,
  ): void {
    const goalEvent = event.events.find((item) => item.name === 'goal');
    if (goalEvent) {
      this.events.push(goalEvent);
      return;
    }

    const scoreEvent = event.events.find((item) => item.name === 'score');
    if (scoreEvent) {
      this.events.push(scoreEvent);
      return;
    }

    const matchEndEvent = event.events.find((item) => item.name === 'matchEnd');
    if (matchEndEvent && (this.info.length || this.events.length)) {
      this.events.push({
        name: matchEndEvent.name,
        data: { date: new Date() },
      });
      this.saveToDataBase();
    }
  }

  /**
   * Handle Rocket League info updates
   *
   * @param {overwolf.games.events.InfoUpdates2Event<
   *  string,
   *  overwolf.games.events.InfoUpdate2
   * >} info - An array of fired info updates
   */
  private handleRocketLeagueInfo(info: any) {
    if (
      info.info.matchState &&
      (Object.prototype.hasOwnProperty.call(info.info.matchState, 'started') ||
        Object.prototype.hasOwnProperty.call(info.info.matchState, 'ended'))
    ) {
      this.info.push({
        matchState: info.info.matchState,
        data: { date: new Date() },
      });
    }

    if (info.info.playersInfo) {
      // eslint-disable-next-line array-callback-return
      Object.keys(info.info.playersInfo).map((item) => {
        if (item.match(/player([0-9]+)/gi)) {
          this.info.push(info.info);
        }
      });
    }
  }

  /**
   * Handle Fortnite events fired
   *
   * @param {overwolf.games.events.NewGameEvents} event
   * - An array of fired Game Events
   */
  private handleFortniteEvents(
    event: overwolf.games.events.NewGameEvents,
  ): void {
    const killedEvent = event.events.find((item) => item.name === 'killed');
    if (killedEvent) {
      this.events.push(killedEvent);
      return;
    }

    const deathEvent = event.events.find((item) => item.name === 'death');
    if (deathEvent) {
      this.events.push(deathEvent);
      return;
    }

    const matchStartEvent = event.events.find(
      (item) => item.name === 'matchStart',
    );
    if (matchStartEvent) {
      this.events.push({
        name: matchStartEvent.name,
        data: { date: new Date() },
      });
      return;
    }

    const matchEndEvent = event.events.find((item) => item.name === 'matchEnd');
    if (matchEndEvent && (this.info.length || this.events.length)) {
      this.events.push({
        name: matchEndEvent.name,
        data: { date: new Date() },
      });
      this.saveToDataBase();
    }
  }

  /**
   * Handle Fortnite info updates
   *
   * @param {overwolf.games.events.InfoUpdates2Event<
   *  string,
   *  overwolf.games.events.InfoUpdate2
   * >} info - An array of fired info updates
   */
  private handleFortniteInfo(info: any) {
    if (
      info.info.match_info &&
      Object.prototype.hasOwnProperty.call(info.info.match_info, 'rank')
    ) {
      this.info.push(info.info);
    }
  }

  /**
   * Handle Valorant events fired
   *
   * @param {overwolf.games.events.NewGameEvents} event
   * - An array of fired Game Events
   */
  private handleValorantEvents(
    event: overwolf.games.events.NewGameEvents,
  ): void {
    const matchStartEvent = event.events.find(
      (item) => item.name === 'match_start',
    );
    if (matchStartEvent) {
      this.events.push({
        name: matchStartEvent.name,
        data: { date: new Date() },
      });
      return;
    }

    const matchEndEvent = event.events.find(
      (item) => item.name === 'match_end',
    );
    if (matchEndEvent && (this.info.length || this.events.length)) {
      this.events.push({
        name: matchEndEvent.name,
        data: { date: new Date() },
      });
      this.saveToDataBase();
    }
  }

  /**
   * Handle Valorant info updates
   *
   * @param {overwolf.games.events.InfoUpdates2Event<
   *  string,
   *  overwolf.games.events.InfoUpdate2
   * >} info - An array of fired info updates
   */
  private handleValorantInfo(info: any) {
    if (
      info.info.match_info &&
      Object.prototype.hasOwnProperty.call(info.info.match_info, 'kill_feed')
    ) {
      this.info.push(info.info);
    }
  }

  /**
   * Handle League of Legends events fired
   *
   * @param {overwolf.games.events.NewGameEvents} event
   * - An array of fired Game Events
   */
  private handleLeagueOfLegendsEvents(
    event: overwolf.games.events.NewGameEvents,
  ): void {
    const killEvent = event.events.find((item) => item.name === 'kill');
    if (killEvent) {
      this.events.push(killEvent);
      return;
    }

    const deathEvent = event.events.find((item) => item.name === 'death');
    if (deathEvent) {
      this.events.push(deathEvent);
      return;
    }

    const matchEndEvent = event.events.find(
      (item) => item.name === 'announcer',
    );
    if (
      matchEndEvent &&
      (this.info.length || this.events.length) &&
      (matchEndEvent.data.includes('victory') ||
        matchEndEvent.data.includes('defeat'))
    ) {
      this.events.push(matchEndEvent);
      this.saveToDataBase();
    }
  }

  /**
   * Handle League of Legends info updates
   *
   * @param {overwolf.games.events.InfoUpdates2Event<
   *  string,
   *  overwolf.games.events.InfoUpdate2
   * >} info - An array of fired info updates
   */
  private handleLeagueOfLegendsInfo(info: any) {
    if (
      info.info.live_client_data &&
      // eslint-disable-next-line max-len
      Object.prototype.hasOwnProperty.call(
        info.info.live_client_data,
        'all_players',
      )
    ) {
      this.info.push(info.info);
    }
  }

  /**
   * Handle PUBG events fired
   *
   * @param {overwolf.games.events.NewGameEvents} event
   * - An array of fired Game Events
   */
  private handlePUBGEvents(event: overwolf.games.events.NewGameEvents): void {
    const killEvent = event.events.find((item) => item.name === 'kill');
    if (killEvent) {
      this.events.push(killEvent);
      return;
    }

    const killerEvent = event.events.find((item) => item.name === 'killer');
    if (killerEvent) {
      this.events.push(killerEvent);
      return;
    }

    const deathEvent = event.events.find((item) => item.name === 'death');
    if (deathEvent) {
      this.events.push(deathEvent);
      return;
    }

    const matchStartEvent = event.events.find(
      (item) => item.name === 'matchStart',
    );
    if (matchStartEvent) {
      this.events.push({
        name: matchStartEvent.name,
        data: { date: new Date() },
      });
      return;
    }

    const matchSummaryEvent = event.events.find(
      (item) => item.name === 'matchSummary',
    );
    if (matchSummaryEvent) {
      this.events.push(matchSummaryEvent);
      return;
    }

    const matchEndEvent = event.events.find((item) => item.name === 'matchEnd');
    if (matchEndEvent && (this.info.length || this.events.length)) {
      this.events.push({
        name: matchEndEvent.name,
        data: { date: new Date() },
      });
      this.saveToDataBase();
    }
  }

  /**
   * Handle PUBG info updates
   *
   * @param {overwolf.games.events.InfoUpdates2Event<
   *  string,
   *  overwolf.games.events.InfoUpdate2
   * >} info - An array of fired info updates
   */
  private handlePUBGInfo(info: any) {
    if (
      (info.info.match_info &&
        Object.prototype.hasOwnProperty.call(info.info.match_info, 'kills')) ||
      Object.prototype.hasOwnProperty.call(info.info.match_info, 'headshots')
    ) {
      this.info.push(info.info);
    }
  }

  /**
   * Handle CS2 events fired
   *
   * @param {overwolf.games.events.NewGameEvents} event
   * - An array of fired Game Events
   */
  private handleCS2Events(event: overwolf.games.events.NewGameEvents): void {
    const killEvent = event.events.find((item) => item.name === 'kill');
    if (killEvent) {
      this.events.push(killEvent);
      return;
    }

    const deathEvent = event.events.find((item) => item.name === 'death');
    if (deathEvent) {
      this.events.push(deathEvent);
      return;
    }

    const killFeedEvent = event.events.find(
      (item) => item.name === 'kill_feed',
    );
    if (killFeedEvent) {
      this.events.push(killFeedEvent);
      return;
    }

    const matchStartEvent = event.events.find(
      (item) => item.name === 'match_start',
    );
    if (matchStartEvent) {
      this.events.push({
        name: matchStartEvent.name,
        data: { date: new Date() },
      });
      return;
    }

    const matchEndEvent = event.events.find(
      (item) => item.name === 'match_end',
    );
    if (matchEndEvent && (this.info.length || this.events.length)) {
      this.events.push({
        name: matchEndEvent.name,
        data: { date: new Date() },
      });
      this.saveToDataBase();
    }
  }

  /**
   * Emit the fired Overwolf GEP Error
   *
   * @param {overwolf.games.events.ErrorEvent} error - The fired GEP error
   */
  private onErrorListener(error: overwolf.games.events.ErrorEvent) {
    this.emit('error', error);
  }

  /**
   * Emit the fired Overwolf Game Info Update
   *
   * @param {overwolf.games.events.InfoUpdates2Event<
   * string,
   * overwolf.games.events.InfoUpdate2
   * >} info - The fired info updated
   */
  private onInfoUpdateListener(
    info: overwolf.games.events.InfoUpdates2Event<
      string,
      overwolf.games.events.InfoUpdate2
    >,
  ) {
    this.tryEmit('infoUpdate', info);
  }

  /**
   * Emit the fired Overwolf Game Events as events
   *
   * @param {overwolf.games.events.NewGameEvents} events - The fired game events
   */
  private onGameEventListener(events: overwolf.games.events.NewGameEvents) {
    this.tryEmit('gameEvent', events);
  }

  /**
   * Attempt to emit an event.
   * If there are no listeners for this event, log it as a warning.*
   *
   * @param {string} event - The name of the event
   * @param {any} value - The value of the event
   */
  private tryEmit(event: string, value: any) {
    if (this.listenerCount(event)) {
      this.emit(event, value);
    } else {
      console.warn(`Unhandled ${event}, with value ${value}`);
    }
  }

  /**
   * Handles all GEP-related logic when a game is launched
   *
   * It is possible to register all listeners once when starting the app, and
   * then only de-register them when closing the app (if at all). We choose
   * to register/deregister them for every game, mostly just to show how.
   *
   * @param {string[] | undefined} requiredFeatures
   * - Optional list of required features. Ignored if this is a GEP SDK game
   * @returns {Promise<string[] | undefined>}
   * A promise resolving to the features that were successfully set,
   * or to nothing if this is a GEP SDK game
   * @throws Error if setting the required features failed too many times
   * (native GEP only)
   */
  public async onGameLaunched(
    requiredFeatures?: string[],
  ): Promise<string[] | undefined> {
    console.log('Registering GEP listeners');
    this.registerEvents();
    if (requiredFeatures) {
      console.log('Registering required features');
      return this.setRequiredFeatures(requiredFeatures, 10);
    }

    console.log('GEP SDK detected, no need to set required features');
  }

  /**
   * Run cleanup logic for when a game was closed
   */
  public onGameClosed() {
    console.log('Removing all GEP listeners');
    this.unregisterEvents();
  }

  /**
   * Set the required features for the current game
   *
   * @param {string[]} requiredFeatures
   * - An array containing the required features for this game
   * @param {number} maximumRetries
   * - The maximum amount of attempts before giving up on setting
   * the required features
   * @returns {Promise<string[]>}
   * A promise resolving to the features that were successfully set
   * @throws An error if setting the required features failed too many times
   */
  private async setRequiredFeatures(
    requiredFeatures: string[],
    maximumRetries: number,
  ): Promise<string[]> {
    for (let i = 0; i < maximumRetries; i++) {
      try {
        const success = await this.trySetRequiredFeatures(requiredFeatures);
        console.log(`Required features set: ${success}`);
        if (success.length < requiredFeatures.length)
          console.warn(
            `Could not set ${requiredFeatures.filter(
              (feature) => !success.includes(feature),
            )}`,
          );
        return success;
      } catch (e) {
        console.warn(`Could not set required features: ${JSON.stringify(e)}`);
        console.log('Retrying in 2 seconds');
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    throw new Error('Aborting required features!');
  }

  /**
   * Attempts to set the required features for this specific game
   *
   * @param {string[]} requiredFeatures
   * - An array containing the required features for this game
   * @returns {Promise<string[]>}
   * A promise resolving to the features that were successfully set
   * @throws {string} The error message given if the features failed to be set
   */
  private async trySetRequiredFeatures(
    requiredFeatures: string[],
  ): Promise<string[]> {
    let registered: (result: string[]) => void;
    let failed: (reason: string) => void;

    // Create a promise, and save its resolve/reject callbacks
    const promise: Promise<string[]> = new Promise(function (resolve, reject) {
      registered = resolve;
      failed = reject;
    });

    // Try to set the required features
    overwolf.games.events.setRequiredFeatures(requiredFeatures, (result) => {
      // If features failed to be set
      if (!result.success) {
        // Fail the current attempt with the error message
        return failed(result.error as string);
      }

      // Approve the current attempt, and return the list of set features
      registered(result.supportedFeatures as string[]);
    });

    // Return the dummy promise
    return promise;
  }

  /**
   * Register all GEP listeners
   */
  public registerEvents() {
    // Register errors listener
    overwolf.games.events.onError.addListener(this.onErrorListener);

    // Register Info Update listener
    overwolf.games.events.onInfoUpdates2.addListener(this.onInfoUpdateListener);

    // Register Game event listener
    overwolf.games.events.onNewEvents.addListener(this.onGameEventListener);
  }

  /**
   * De-register all GEP listeners
   */
  public unregisterEvents() {
    overwolf.games.events.onError.removeListener(this.onErrorListener);
    overwolf.games.events.onInfoUpdates2.removeListener(
      this.onInfoUpdateListener,
    );
    overwolf.games.events.onNewEvents.removeListener(this.onGameEventListener);
  }
}
