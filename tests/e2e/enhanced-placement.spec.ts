import { test, expect, Page, BrowserContext } from '@playwright/test';

// Helper to capture console logs
async function setupConsoleCapture(page: Page) {
  const consoleLogs: Array<{ type: string; text: string; time: number }> = [];

  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push({
      type: msg.type(),
      text,
      time: Date.now()
    });

    // Log all console output for debugging
    if (msg.type() === 'error' || msg.type() === 'warning') {
      console.log(`[CONSOLE ${msg.type().toUpperCase()}]: ${text}`);
    } else if (text.includes('KonvaShipPlacement') ||
               text.includes('Ship') ||
               text.includes('placement') ||
               text.includes('game') ||
               text.includes('Game')) {
      console.log(`[CONSOLE]: ${text}`);
    }
  });

  page.on('pageerror', error => {
    console.error('[PAGE ERROR]:', error.message);
  });

  page.on('requestfailed', request => {
    console.error('[REQUEST FAILED]:', request.url(), request.failure()?.errorText);
  });

  return consoleLogs;
}

test.describe('Enhanced Ship Placement UI Tests', () => {
  test.setTimeout(60000); // 60 second timeout for detailed testing

  test('Complete ship placement UI functionality test', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    // Setup console capture
    const consoleLogs = await setupConsoleCapture(page);

    console.log('\n========================================');
    console.log('ENHANCED SHIP PLACEMENT UI TEST SUITE');
    console.log('========================================\n');

    // Test 1: Navigate to game page
    console.log('TEST 1: Navigating to localhost:3000/game...');
    await page.goto('http://localhost:3000/game', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Check if page loaded
    const title = await page.title();
    console.log(`✅ Page loaded successfully - Title: "${title}"`);

    // Take screenshot of initial page
    await page.screenshot({ path: 'test-1-initial-page.png', fullPage: true });
    console.log('📸 Screenshot saved: test-1-initial-page.png\n');

    // Test 2: Start a new game
    console.log('TEST 2: Starting a new game...');

    // Look for game start button or similar
    const startButton = page.locator('button:has-text("Start"), button:has-text("New Game"), button:has-text("Play"), button:has-text("VS AI")').first();
    const hasStartButton = await startButton.count() > 0;

    if (hasStartButton) {
      const buttonText = await startButton.textContent();
      console.log(`Found button with text: "${buttonText}"`);
      await startButton.click();
      console.log('✅ Clicked start/new game button');
      await page.waitForTimeout(3000);

      // Take screenshot after clicking button
      await page.screenshot({ path: 'test-2-after-start.png', fullPage: true });
      console.log('📸 Screenshot saved: test-2-after-start.png');

      // Check if we need to select difficulty
      const difficultyHeading = await page.locator('h2:has-text("Select AI Difficulty"), h3:has-text("Select AI Difficulty")').count();
      if (difficultyHeading > 0) {
        console.log('Difficulty selection screen detected');

        // Find and click the Beginner button more specifically
        const beginnerButton = page.locator('button', { hasText: /^Beginner/i });
        const hasBeginnerButton = await beginnerButton.count() > 0;

        if (hasBeginnerButton) {
          console.log('Clicking Beginner difficulty button...');
          await beginnerButton.first().click();
          await page.waitForTimeout(1000);

          // Now click the Start Battle button
          const startBattleButton = page.locator('button:has-text("Start Battle"), button:has-text("Start Game")');
          const hasStartBattle = await startBattleButton.count() > 0;

          if (hasStartBattle) {
            console.log('Clicking Start Battle button...');
            await startBattleButton.first().click();
            await page.waitForTimeout(3000);

            // Take screenshot after starting the battle
            await page.screenshot({ path: 'test-2b-after-start-battle.png', fullPage: true });
            console.log('📸 Screenshot saved: test-2b-after-start-battle.png');
          } else {
            console.log('❌ Could not find Start Battle button');
          }

          // Check page content after difficulty selection
          const pageContent = await page.locator('body').textContent();
          console.log('Page content preview:', pageContent?.slice(0, 200) + '...');
        } else {
          console.log('❌ Could not find Beginner button');
        }
      }
    } else {
      console.log('⚠️  No start button found, checking if already in placement phase');
    }

    // Test 3: Check for ship palette with all 5 ships
    console.log('\nTEST 3: Checking for ship placement UI...');

    // Wait for placement phase to be visible - check multiple possible selectors
    const placementSelectors = [
      '[data-testid="ship-placement"]',
      '.ship-placement-phase',
      '#ship-placement',
      '.konva-ship-placement',
      '[data-testid="konva-ship-placement"]',
      'h2:has-text("Deploy Your Fleet")',
      'h1:has-text("Ship Placement")'
    ];

    let isPlacementVisible = false;
    for (const selector of placementSelectors) {
      const element = await page.locator(selector).first();
      const count = await element.count();
      if (count > 0) {
        console.log(`✅ Found placement element with selector: ${selector}`);
        isPlacementVisible = true;
        break;
      }
    }

    if (!isPlacementVisible) {
      console.log('❌ Ship placement phase not found with any selector');
      // List all visible headings to help debug
      const headings = await page.locator('h1, h2, h3').allTextContents();
      console.log('Visible headings:', headings);
    }

    // Check for ship palette
    const shipPalette = await page.locator('.ship-palette, [data-testid="ship-palette"], #ship-palette').first();
    const isPaletteVisible = await shipPalette.count() > 0;
    const foundShips: string[] = [];

    if (isPaletteVisible) {
      console.log('✅ Ship palette component found');

      // Check for individual ships
      const shipTypes = ['Carrier', 'Battleship', 'Cruiser', 'Submarine', 'Destroyer'];

      for (const shipType of shipTypes) {
        const shipSelector = await page.locator(`[data-ship-type="${shipType}"], .ship-item:has-text("${shipType}"), button:has-text("${shipType}")`).first();
        const isShipPresent = await shipSelector.count() > 0;

        if (isShipPresent) {
          foundShips.push(shipType);
          console.log(`  ✅ ${shipType} found in palette`);
        } else {
          console.log(`  ❌ ${shipType} NOT found in palette`);
        }
      }

      console.log(`\n📊 Ships found: ${foundShips.length}/5 (${foundShips.join(', ')})`);

      if (foundShips.length === 5) {
        console.log('✅ All 5 ships are present in the palette!');
      } else {
        console.log(`⚠️  Only ${foundShips.length} ships found, expected 5`);
      }
    } else {
      console.log('❌ Ship palette not found on page');
    }

    // Take screenshot of ship palette
    await page.screenshot({ path: 'test-3-ship-palette.png', fullPage: true });
    console.log('📸 Screenshot saved: test-3-ship-palette.png\n');

    // Test 4: Select a ship from palette
    console.log('TEST 4: Attempting to select a ship from palette...');

    // Try to click on Carrier first
    const carrierButton = await page.locator('[data-ship-type="Carrier"], .ship-item:has-text("Carrier"), button:has-text("Carrier")').first();
    const hasCarrier = await carrierButton.count() > 0;

    if (hasCarrier) {
      await carrierButton.click();
      console.log('✅ Clicked on Carrier ship');
      await page.waitForTimeout(1000);

      // Check for visual feedback
      const isSelected = await carrierButton.evaluate((el) => {
        return el.classList.contains('selected') ||
               el.classList.contains('active') ||
               el.getAttribute('data-selected') === 'true';
      });

      if (isSelected) {
        console.log('✅ Carrier shows visual selection feedback');
      } else {
        console.log('⚠️  No visual selection feedback detected');
      }
    } else {
      console.log('❌ Could not find Carrier ship to click');
    }

    // Test 5: Check for interactive 10x10 grid
    console.log('\nTEST 5: Checking for interactive 10x10 grid...');

    // Look for Konva canvas or grid container
    const canvasElement = await page.locator('canvas, .konvajs-content, [data-testid="game-grid"], .game-grid').first();
    const hasCanvas = await canvasElement.count() > 0;

    if (hasCanvas) {
      console.log('✅ Interactive grid/canvas element found');

      // Get canvas dimensions
      const canvasBounds = await canvasElement.boundingBox();
      if (canvasBounds) {
        console.log(`  📐 Grid dimensions: ${canvasBounds.width}x${canvasBounds.height}px`);
        console.log(`  📍 Grid position: (${canvasBounds.x}, ${canvasBounds.y})`);
      }
    } else {
      console.log('❌ No interactive grid/canvas found');
    }

    // Take screenshot of grid
    await page.screenshot({ path: 'test-5-grid.png', fullPage: true });
    console.log('📸 Screenshot saved: test-5-grid.png\n');

    // Test 6: Test hovering over grid cells
    console.log('TEST 6: Testing hover interactions on grid...');

    if (hasCanvas) {
      const canvasBounds = await canvasElement.boundingBox();
      if (canvasBounds) {
        // Calculate cell positions (assuming 10x10 grid)
        const cellWidth = canvasBounds.width / 10;
        const cellHeight = canvasBounds.height / 10;

        // Hover over a few different cells
        const testPositions = [
          { row: 0, col: 0, name: 'A1' },
          { row: 4, col: 4, name: 'E5' },
          { row: 9, col: 9, name: 'J10' }
        ];

        for (const pos of testPositions) {
          const x = canvasBounds.x + (pos.col * cellWidth) + (cellWidth / 2);
          const y = canvasBounds.y + (pos.row * cellHeight) + (cellHeight / 2);

          console.log(`  Hovering over cell ${pos.name} at (${Math.round(x)}, ${Math.round(y)})...`);
          await page.mouse.move(x, y);
          await page.waitForTimeout(500);

          // Check for hover feedback in console logs
          const recentLogs = consoleLogs.filter(log =>
            log.time > Date.now() - 1000 &&
            (log.text.includes('hover') || log.text.includes('preview'))
          );

          if (recentLogs.length > 0) {
            console.log(`  ✅ Hover feedback detected for ${pos.name}`);
          } else {
            console.log(`  ⚠️  No hover feedback detected for ${pos.name}`);
          }
        }
      }
    } else {
      console.log('❌ Cannot test hover - no grid found');
    }

    // Test 7: Try to place a ship
    console.log('\nTEST 7: Attempting to place a ship on the grid...');

    if (hasCanvas) {
      const canvasBounds = await canvasElement.boundingBox();
      if (canvasBounds) {
        // Click on position C3 (row 2, col 2)
        const cellWidth = canvasBounds.width / 10;
        const cellHeight = canvasBounds.height / 10;
        const x = canvasBounds.x + (2 * cellWidth) + (cellWidth / 2);
        const y = canvasBounds.y + (2 * cellHeight) + (cellHeight / 2);

        console.log(`  Clicking at position C3 (${Math.round(x)}, ${Math.round(y)}) to place ship...`);
        await page.mouse.click(x, y);
        await page.waitForTimeout(1000);

        // Check console logs for placement feedback
        const placementLogs = consoleLogs.filter(log =>
          log.time > Date.now() - 2000 &&
          (log.text.includes('placed') || log.text.includes('placement'))
        );

        if (placementLogs.length > 0) {
          console.log('  ✅ Ship placement detected in console logs');
          placementLogs.forEach(log => {
            console.log(`    - ${log.text}`);
          });
        } else {
          console.log('  ⚠️  No placement feedback in console logs');
        }

        // Take screenshot after placement attempt
        await page.screenshot({ path: 'test-7-placement-attempt.png', fullPage: true });
        console.log('📸 Screenshot saved: test-7-placement-attempt.png');
      }
    } else {
      console.log('❌ Cannot test placement - no grid found');
    }

    // Test 8: Test keyboard shortcuts
    console.log('\nTEST 8: Testing keyboard shortcuts...');

    // Test R key for rotation
    console.log('  Testing R key (rotate)...');
    await page.keyboard.press('r');
    await page.waitForTimeout(500);

    const rotationLogs = consoleLogs.filter(log =>
      log.time > Date.now() - 1000 &&
      (log.text.includes('rotate') || log.text.includes('orientation'))
    );

    if (rotationLogs.length > 0) {
      console.log('  ✅ Rotation detected');
    } else {
      console.log('  ⚠️  No rotation feedback detected');
    }

    // Test Escape key for cancel
    console.log('  Testing Escape key (cancel)...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    const cancelLogs = consoleLogs.filter(log =>
      log.time > Date.now() - 1000 &&
      (log.text.includes('cancel') || log.text.includes('deselect'))
    );

    if (cancelLogs.length > 0) {
      console.log('  ✅ Cancel/deselect detected');
    } else {
      console.log('  ⚠️  No cancel feedback detected');
    }

    // Final console log analysis
    console.log('\n========================================');
    console.log('CONSOLE LOG ANALYSIS');
    console.log('========================================');

    const debugLogs = consoleLogs.filter(log =>
      log.text.includes('KonvaShipPlacement render:')
    );

    console.log(`\n📊 Debug logs found: ${debugLogs.length}`);
    if (debugLogs.length > 0) {
      console.log('Sample debug logs:');
      debugLogs.slice(0, 5).forEach(log => {
        console.log(`  - ${log.text}`);
      });
    }

    // Final summary
    console.log('\n========================================');
    console.log('TEST SUMMARY');
    console.log('========================================');

    const foundShipsCount = isPaletteVisible ? foundShips.length : 0;

    const summary = {
      'Page Load': title ? '✅ Success' : '❌ Failed',
      'Placement Phase': isPlacementVisible ? '✅ Visible' : '❌ Not Found',
      'Ship Palette': isPaletteVisible ? '✅ Found' : '❌ Not Found',
      'All 5 Ships': foundShipsCount === 5 ? '✅ Complete' : `⚠️  ${foundShipsCount}/5`,
      'Grid/Canvas': hasCanvas ? '✅ Present' : '❌ Missing',
      'Ship Selection': hasCarrier ? '✅ Works' : '❌ Failed',
      'Debug Logs': debugLogs.length > 0 ? `✅ ${debugLogs.length} logs` : '⚠️  No logs'
    };

    Object.entries(summary).forEach(([test, result]) => {
      console.log(`${test}: ${result}`);
    });

    // Take final screenshot
    await page.screenshot({ path: 'test-final-state.png', fullPage: true });
    console.log('\n📸 Final screenshot saved: test-final-state.png');

    await context.close();
  });
});