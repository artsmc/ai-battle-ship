/**
 * Ability System Integration Tests
 * Tests the complete ability framework and implementations
 */

import { AbilityEngine } from '../../AbilityEngine'
import { AbilityFactory } from '../AbilityFactory'
import { AllBigGunsAbility } from '../implementations/AllBigGuns'
import { SilentRunningAbility } from '../implementations/SilentRunning'
import { AirScoutAbility } from '../implementations/AirScout'
import { GameShip, GamePlayer, BoardState } from '../../../game/types'
import { ShipClass, ShipEra } from '../../../database/types/enums'

describe('Ability System Integration', () => {
  let abilityEngine: AbilityEngine
  let testShip: GameShip
  let testPlayer: GamePlayer
  let boardState: BoardState

  beforeEach(() => {
    // Initialize ability engine
    abilityEngine = new AbilityEngine({
      enableAbilities: true,
      maxAbilitiesPerShip: 2
    })

    // Create test board state
    boardState = {
      cells: Array(10).fill(null).map((_, y) =>
        Array(10).fill(null).map((_, x) => ({
          coordinate: { x, y },
          hasShip: false,
          isHit: false,
          isRevealed: false
        }))
      ),
      size: 10,
      placedShips: []
    }

    // Create test ship
    testShip = {
      id: 'ship_1',
      typeId: 'battleship_1',
      name: 'HMS Dreadnought',
      class: ShipClass.BATTLESHIP,
      size: 5,
      damage: {
        hitPositions: [],
        totalHits: 0,
        isSunk: false
      },
      hitPoints: 5,
      maxHitPoints: 5,
      abilities: [],
      playerId: 'player_1',
      position: {
        shipId: 'ship_1',
        coordinates: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 0 },
          { x: 3, y: 0 },
          { x: 4, y: 0 }
        ],
        orientation: 'horizontal',
        startPosition: { x: 0, y: 0 }
      }
    }

    // Create test player
    testPlayer = {
      id: 'player_1',
      name: 'Test Player',
      board: boardState,
      fleet: [testShip],
      score: 0,
      powerups: [],
      shotsHistory: [],
      stats: {
        shotsTotal: 0,
        shotsHit: 0,
        shotsMiss: 0,
        shipsDestroyed: 0,
        accuracy: 0
      }
    }
  })

  describe('AbilityFactory', () => {
    it('should create abilities for ships based on class and era', () => {
      const abilities = AbilityFactory.createAbilitiesForShip(
        testShip,
        ShipEra.DREADNOUGHT
      )

      expect(abilities.length).toBeGreaterThan(0)
      expect(abilities[0]).toBeDefined()
      expect(abilities[0].name).toBe('All Big Guns')
    })

    it('should get all abilities for a ship class', () => {
      const abilities = AbilityFactory.getAbilitiesForClass(ShipClass.BATTLESHIP)

      expect(abilities.length).toBeGreaterThan(0)
      const abilityIds = abilities.map(a => a.id)
      expect(abilityIds).toContain('all_big_guns')
      expect(abilityIds).toContain('armor_piercing')
    })

    it('should get abilities for an era', () => {
      const abilities = AbilityFactory.getAbilitiesForEra(ShipEra.MODERN)

      expect(abilities.length).toBeGreaterThan(0)
      const abilityIds = abilities.map(a => a.id)
      expect(abilityIds).toContain('air_scout')
      expect(abilityIds).toContain('sonar_ping')
    })
  })

  describe('AbilityEngine', () => {
    it('should initialize ship abilities', () => {
      abilityEngine.initializeShipAbilities(testShip, ShipEra.DREADNOUGHT)

      expect(testShip.abilities.length).toBeGreaterThan(0)
      expect(testShip.abilities[0].id).toBe('all_big_guns')
    })

    it('should activate an ability', async () => {
      abilityEngine.initializeShipAbilities(testShip, ShipEra.DREADNOUGHT)

      const result = await abilityEngine.activateAbility(
        testShip.id,
        'all_big_guns',
        {
          ship: testShip,
          player: testPlayer,
          boardState,
          currentTurn: 1
        }
      )

      expect(result.success).toBe(true)
      expect(result.messages).toContain('HMS Dreadnought prepares All Big Guns!')
    })

    it('should apply attack modifiers', () => {
      abilityEngine.initializeShipAbilities(testShip, ShipEra.DREADNOUGHT)

      // Activate All Big Guns
      abilityEngine.activateAbility(
        testShip.id,
        'all_big_guns',
        {
          ship: testShip,
          player: testPlayer,
          boardState,
          currentTurn: 1
        }
      )

      const modifiedDamage = abilityEngine.applyAttackModifiers(testShip, 10)
      expect(modifiedDamage).toBe(15) // 50% boost
    })

    it('should handle stealth abilities', () => {
      const submarine: GameShip = {
        ...testShip,
        id: 'sub_1',
        class: ShipClass.SUBMARINE,
        name: 'U-47'
      }

      abilityEngine.initializeShipAbilities(submarine, ShipEra.MODERN)

      const isHidden = abilityEngine.isShipHidden(submarine)
      expect(isHidden).toBe(false) // Needs to be activated first
    })

    it('should manage ability cooldowns', async () => {
      abilityEngine.initializeShipAbilities(testShip, ShipEra.DREADNOUGHT)

      // Activate ability
      await abilityEngine.activateAbility(
        testShip.id,
        'all_big_guns',
        {
          ship: testShip,
          player: testPlayer,
          boardState,
          currentTurn: 1
        }
      )

      // Try to activate again immediately
      const result = await abilityEngine.activateAbility(
        testShip.id,
        'all_big_guns',
        {
          ship: testShip,
          player: testPlayer,
          boardState,
          currentTurn: 1
        }
      )

      expect(result.success).toBe(false)
      expect(result.errors).toContain('Ability is on cooldown')
    })
  })

  describe('Specific Ability Implementations', () => {
    describe('All Big Guns', () => {
      it('should boost damage for next attack', () => {
        const ability = new AllBigGunsAbility(
          AllBigGunsAbility.DEFINITION,
          {
            definitionId: 'all_big_guns',
            shipId: testShip.id,
            playerId: testPlayer.id,
            isActive: true,
            currentCooldown: 0,
            remainingUses: 2,
            activeEffects: [],
            timesUsed: 0
          }
        )

        const result = ability.activate({
          ability: ability.getInstance(),
          ship: testShip,
          player: testPlayer,
          boardState,
          currentTurn: 1
        })

        expect(result.success).toBe(true)
        expect(ability.isDamageBoostActive()).toBe(true)
        expect(ability.getDamageMultiplier()).toBe(1.5)
      })
    })

    describe('Silent Running', () => {
      it('should make submarine stealthy', () => {
        const submarine: GameShip = {
          ...testShip,
          id: 'sub_1',
          class: ShipClass.SUBMARINE
        }

        const ability = new SilentRunningAbility(
          SilentRunningAbility.DEFINITION,
          {
            definitionId: 'silent_running',
            shipId: submarine.id,
            playerId: testPlayer.id,
            isActive: true,
            currentCooldown: 0,
            activeEffects: [],
            timesUsed: 0
          }
        )

        const result = ability.activate({
          ability: ability.getInstance(),
          ship: submarine,
          player: testPlayer,
          boardState,
          currentTurn: 1
        })

        expect(result.success).toBe(true)
        expect(ability.isStealthActive()).toBe(true)
        expect(ability.getDetectionResistance()).toBe(100)
      })

      it('should break stealth on attack', () => {
        const submarine: GameShip = {
          ...testShip,
          id: 'sub_1',
          class: ShipClass.SUBMARINE
        }

        const ability = new SilentRunningAbility(
          SilentRunningAbility.DEFINITION,
          {
            definitionId: 'silent_running',
            shipId: submarine.id,
            playerId: testPlayer.id,
            isActive: true,
            currentCooldown: 0,
            activeEffects: [],
            timesUsed: 0
          }
        )

        // Activate stealth
        ability.activate({
          ability: ability.getInstance(),
          ship: submarine,
          player: testPlayer,
          boardState,
          currentTurn: 1
        })

        expect(ability.isStealthActive()).toBe(true)

        // Simulate attack
        ability.onAttack({
          ability: ability.getInstance(),
          ship: submarine,
          player: testPlayer,
          boardState,
          currentTurn: 2
        })

        expect(ability.isStealthActive()).toBe(false)
      })
    })

    describe('Air Scout', () => {
      it('should reveal area on board', () => {
        const carrier: GameShip = {
          ...testShip,
          id: 'carrier_1',
          class: ShipClass.CARRIER
        }

        const ability = new AirScoutAbility(
          AirScoutAbility.DEFINITION,
          {
            definitionId: 'air_scout',
            shipId: carrier.id,
            playerId: testPlayer.id,
            isActive: true,
            currentCooldown: 0,
            remainingUses: 3,
            activeEffects: [],
            timesUsed: 0
          }
        )

        const result = ability.activate({
          ability: ability.getInstance(),
          ship: carrier,
          player: testPlayer,
          opponent: testPlayer, // Using same player for test
          boardState,
          currentTurn: 1,
          targetData: {
            coordinates: [{ x: 5, y: 5 }]
          }
        })

        expect(result.success).toBe(true)
        expect(result.coordinatesRevealed).toBeDefined()
        expect(result.coordinatesRevealed!.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Multiplayer Synchronization', () => {
    it('should provide sync data', () => {
      abilityEngine.initializeShipAbilities(testShip, ShipEra.DREADNOUGHT)

      const syncData = abilityEngine.getSyncData()

      expect(syncData.abilityStates).toBeDefined()
      expect(syncData.activeEffects).toBeDefined()
      expect(syncData.pendingActivations).toBeDefined()
    })

    it('should apply sync data', () => {
      abilityEngine.initializeShipAbilities(testShip, ShipEra.DREADNOUGHT)

      const syncData = abilityEngine.getSyncData()

      // Create new engine and apply sync
      const newEngine = new AbilityEngine({
        enableAbilities: true
      })

      newEngine.applySyncData(syncData)

      // Verify sync was applied
      const newSyncData = newEngine.getSyncData()
      expect(newSyncData.abilityStates.size).toBe(syncData.abilityStates.size)
    })
  })
})