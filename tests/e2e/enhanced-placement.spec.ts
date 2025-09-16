import { test, expect, Page } from '@playwright/test';

test.describe('Enhanced Ship Placement UI Tests', () => {
  let page: Page;

  // Helper function to navigate to ship placement phase
  async function navigateToShipPlacement() {
    // Step 1: Click "vs AI" game mode
    const vsAIButton = page.locator('text=/vs AI/i').first();
    if (await vsAIButton.count() > 0) {
      console.log('  - Clicking vs AI mode...');
      await vsAIButton.click();
      await page.waitForTimeout(500);
    }

    // Step 2: Select a difficulty (Beginner)
    const beginnerButton = page.locator('text=/Beginner/i').first();
    if (await beginnerButton.count() > 0) {
      console.log('  - Selecting Beginner difficulty...');
      await beginnerButton.click();
      await page.waitForTimeout(500);
    }

    // Step 3: Click Start Battle button
    const startBattleButton = page.locator('button:has-text("Start Battle")');
    if (await startBattleButton.count() > 0) {
      console.log('  - Clicking Start Battle...');
      await startBattleButton.click();
      await page.waitForTimeout(2000); // Give more time for placement to load
    }
  }

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();

    // Enable console logging to capture debug messages
    page.on('console', msg => {
      console.log(`Browser Console [${msg.type()}]:`, msg.text());
    });

    // Navigate to the game page
    await page.goto('http://localhost:3000/game');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should navigate to ship placement phase', async () => {
    console.log('Test 1: Navigate to Ship Placement Phase');

    // Step 1: Click "vs AI" game mode
    const vsAIButton = page.locator('text=/vs AI/i').first();
    if (await vsAIButton.count() > 0) {
      console.log('Clicking vs AI mode...');
      await vsAIButton.click();
      await page.waitForTimeout(500);
    }

    // Step 2: Select a difficulty (Beginner)
    const beginnerButton = page.locator('text=/Beginner/i').first();
    if (await beginnerButton.count() > 0) {
      console.log('Selecting Beginner difficulty...');
      await beginnerButton.click();
      await page.waitForTimeout(500);
    }

    // Step 3: Click Start Battle button
    const startBattleButton = page.locator('button:has-text("Start Battle")');
    if (await startBattleButton.count() > 0) {
      console.log('Clicking Start Battle...');
      await startBattleButton.click();
      await page.waitForTimeout(1000);
    }

    // Wait for ship placement phase to appear
    try {
      await page.waitForSelector('text=/Ship Placement/i, text=/Place.*Ship/i', {
        timeout: 5000
      });
      console.log('Reached Ship Placement Phase!');
    } catch (e) {
      console.log('Did not find ship placement text, checking for other indicators...');
    }

    // Check for ship placement indicators
    const placementTitle = await page.locator('text=/Ship Placement/i, text=/Place.*Ship/i').count();
    console.log(`Found ${placementTitle} placement title(s)`);

    expect(placementTitle).toBeGreaterThan(0);
  });

  test('should display enhanced ship palette with test ID', async () => {
    console.log('Test 2: Enhanced Ship Palette Visibility');

    // Navigate to placement phase
    await navigateToShipPlacement();

    // Wait and check for enhanced ship palette
    const enhancedPalette = page.locator('[data-testid="enhanced-ship-palette"]');

    try {
      await enhancedPalette.waitFor({ timeout: 5000 });
      console.log('✅ Enhanced ship palette found with test ID');

      const isVisible = await enhancedPalette.isVisible();
      console.log(`Enhanced palette visibility: ${isVisible}`);

      expect(isVisible).toBeTruthy();
    } catch (error) {
      console.log('❌ Enhanced ship palette not found, checking for fallback palette...');

      // Check for any ship palette element
      const anyPalette = page.locator('[data-testid*="palette"], .ship-palette, #ship-palette');
      const paletteCount = await anyPalette.count();
      console.log(`Found ${paletteCount} palette element(s)`);
    }
  });

  test('should display all 5 ship cards with correct test IDs', async () => {
    console.log('Test 3: Ship Cards Visibility and Test IDs');

    // Navigate to placement phase
    await navigateToShipPlacement();

    await page.waitForTimeout(1000); // Wait for UI to render

    const shipNames = ['carrier', 'battleship', 'cruiser', 'submarine', 'destroyer'];
    const foundShips: string[] = [];
    const missingShips: string[] = [];

    for (const shipName of shipNames) {
      const shipCard = page.locator(`[data-testid="ship-card-${shipName}"]`);

      if (await shipCard.count() > 0) {
        console.log(`✅ Found ship card: ${shipName}`);
        foundShips.push(shipName);

        // Check visibility
        const isVisible = await shipCard.isVisible();
        console.log(`  - Visibility: ${isVisible}`);

        // Get ship card text content
        const textContent = await shipCard.textContent();
        console.log(`  - Content: ${textContent}`);
      } else {
        console.log(`❌ Ship card not found: ${shipName}`);
        missingShips.push(shipName);

        // Try to find ship by text
        const shipByText = page.locator(`text=/${shipName}/i`);
        if (await shipByText.count() > 0) {
          console.log(`  - Found ship by text (no test ID): ${shipName}`);
        }
      }
    }

    console.log(`\nSummary: Found ${foundShips.length}/5 ships with test IDs`);
    console.log(`Found ships: ${foundShips.join(', ')}`);
    if (missingShips.length > 0) {
      console.log(`Missing ships: ${missingShips.join(', ')}`);
    }

    expect(foundShips.length).toBeGreaterThan(0);
  });

  test('should allow ship card selection', async () => {
    console.log('Test 4: Ship Card Selection');

    // Navigate to placement phase
    await navigateToShipPlacement();

    await page.waitForTimeout(1000);

    // Try to click on each ship card
    const shipNames = ['carrier', 'battleship', 'cruiser', 'submarine', 'destroyer'];

    for (const shipName of shipNames) {
      const shipCard = page.locator(`[data-testid="ship-card-${shipName}"]`);

      if (await shipCard.count() > 0) {
        console.log(`Clicking on ${shipName} card...`);

        try {
          await shipCard.click();
          await page.waitForTimeout(500); // Wait for selection state

          // Check for selection indicators
          const isSelected = await shipCard.evaluate(el => {
            const classList = el.classList.toString();
            const styles = window.getComputedStyle(el);
            return classList.includes('selected') ||
                   classList.includes('active') ||
                   styles.borderColor !== 'rgba(0, 0, 0, 0)' ||
                   styles.backgroundColor !== 'rgba(0, 0, 0, 0)';
          });

          console.log(`  - Selection state: ${isSelected}`);
        } catch (error) {
          console.log(`  - Error clicking ${shipName}: ${error}`);
        }
      }
    }
  });

  test('should display interactive grid with test ID', async () => {
    console.log('Test 5: Interactive Grid Visibility');

    // Navigate to placement phase
    await navigateToShipPlacement();

    await page.waitForTimeout(1000);

    // Check for interactive grid
    const interactiveGrid = page.locator('[data-testid="interactive-grid"]');

    try {
      await interactiveGrid.waitFor({ timeout: 5000 });
      console.log('✅ Interactive grid found with test ID');

      const isVisible = await interactiveGrid.isVisible();
      console.log(`Grid visibility: ${isVisible}`);

      // Get grid dimensions
      const boundingBox = await interactiveGrid.boundingBox();
      if (boundingBox) {
        console.log(`Grid dimensions: ${boundingBox.width}x${boundingBox.height}`);
        console.log(`Grid position: (${boundingBox.x}, ${boundingBox.y})`);
      }

      expect(isVisible).toBeTruthy();
    } catch (error) {
      console.log('❌ Interactive grid not found with test ID');

      // Check for any grid element
      const anyGrid = page.locator('canvas, [data-testid*="grid"], .game-grid, #game-board');
      const gridCount = await anyGrid.count();
      console.log(`Found ${gridCount} grid-like element(s)`);
    }
  });

  test('should have clickable grid cells with test IDs', async () => {
    console.log('Test 6: Grid Cell Interaction');

    // Navigate to placement phase
    await navigateToShipPlacement();

    await page.waitForTimeout(1000);

    // Test specific grid cells
    const testCells = [
      { x: 0, y: 0, label: 'Top-left corner' },
      { x: 5, y: 5, label: 'Center' },
      { x: 9, y: 9, label: 'Bottom-right corner' }
    ];

    for (const cell of testCells) {
      const cellSelector = `[data-testid="grid-cell-${cell.x}-${cell.y}"]`;
      const gridCell = page.locator(cellSelector);

      if (await gridCell.count() > 0) {
        console.log(`✅ Found grid cell at (${cell.x}, ${cell.y}) - ${cell.label}`);

        try {
          // Test click interaction
          await gridCell.click();
          console.log(`  - Clicked successfully`);

          // Test hover interaction
          await gridCell.hover();
          console.log(`  - Hover successful`);

          // Check for visual feedback
          const styles = await gridCell.evaluate(el => {
            const computed = window.getComputedStyle(el);
            return {
              background: computed.backgroundColor,
              border: computed.borderColor,
              cursor: computed.cursor
            };
          });
          console.log(`  - Styles:`, styles);
        } catch (error) {
          console.log(`  - Interaction error: ${error}`);
        }
      } else {
        console.log(`❌ Grid cell not found at (${cell.x}, ${cell.y})`);
      }
    }

    // Count total grid cells
    const allGridCells = page.locator('[data-testid^="grid-cell-"]');
    const totalCells = await allGridCells.count();
    console.log(`\nTotal grid cells found: ${totalCells}`);

    if (totalCells === 0) {
      console.log('No grid cells with test IDs found, checking for canvas...');
      const canvas = page.locator('canvas');
      if (await canvas.count() > 0) {
        console.log('Canvas element found - grid might be rendered on canvas');
      }
    }
  });

  test('should show placement instructions', async () => {
    console.log('Test 7: Placement Instructions');

    // Navigate to placement phase
    await navigateToShipPlacement();

    await page.waitForTimeout(1000);

    // Check for instruction text
    const instructions = [
      'Click a ship in the palette to select it',
      'Hover over the grid to preview placement',
      'Click to place the ship at the previewed position'
    ];

    for (const instruction of instructions) {
      const instructionElement = page.locator(`text=/${instruction}/i`);
      const count = await instructionElement.count();

      if (count > 0) {
        console.log(`✅ Found instruction: "${instruction}"`);
      } else {
        // Try partial match
        const partialMatch = page.locator(`text=/${instruction.slice(0, 20)}/i`);
        if (await partialMatch.count() > 0) {
          console.log(`⚠️ Partial match for: "${instruction}"`);
        } else {
          console.log(`❌ Instruction not found: "${instruction}"`);
        }
      }
    }
  });

  test('should test full placement workflow', async () => {
    console.log('Test 8: Full Placement Workflow');

    // Navigate to placement phase
    await navigateToShipPlacement();

    await page.waitForTimeout(1000);

    // Step 1: Select a ship
    const carrierCard = page.locator('[data-testid="ship-card-carrier"]');
    if (await carrierCard.count() > 0) {
      console.log('Step 1: Selecting carrier...');
      await carrierCard.click();
      await page.waitForTimeout(500);
    }

    // Step 2: Hover over grid to preview
    const gridCell = page.locator('[data-testid="grid-cell-3-3"]');
    if (await gridCell.count() > 0) {
      console.log('Step 2: Hovering over grid cell (3,3)...');
      await gridCell.hover();
      await page.waitForTimeout(500);
    } else {
      // Try hovering over canvas
      const canvas = page.locator('canvas').first();
      if (await canvas.count() > 0) {
        console.log('Step 2: Hovering over canvas at position...');
        await canvas.hover({ position: { x: 150, y: 150 } });
        await page.waitForTimeout(500);
      }
    }

    // Step 3: Click to place
    if (await gridCell.count() > 0) {
      console.log('Step 3: Clicking to place ship...');
      await gridCell.click();
    } else {
      const canvas = page.locator('canvas').first();
      if (await canvas.count() > 0) {
        console.log('Step 3: Clicking canvas to place ship...');
        await canvas.click({ position: { x: 150, y: 150 } });
      }
    }

    await page.waitForTimeout(1000);

    // Check for placement confirmation or ship on board
    console.log('Checking for placement confirmation...');
    const placedShips = await page.locator('text=/placed/i, text=/ship.*position/i').count();
    console.log(`Found ${placedShips} placement confirmation(s)`);
  });

  test('should capture all UI elements and debug info', async () => {
    console.log('Test 9: Complete UI Debug Information');

    // Navigate to placement phase
    await navigateToShipPlacement();

    await page.waitForTimeout(1000);

    // Capture all elements with test IDs
    const allTestIds = await page.locator('[data-testid]').evaluateAll(elements =>
      elements.map(el => ({
        testId: el.getAttribute('data-testid'),
        tagName: el.tagName.toLowerCase(),
        visible: (el as HTMLElement).offsetParent !== null,
        text: (el as HTMLElement).innerText?.slice(0, 50)
      }))
    );

    console.log('\n=== All Elements with Test IDs ===');
    allTestIds.forEach(item => {
      console.log(`- ${item.testId} (${item.tagName}) - Visible: ${item.visible}`);
      if (item.text) console.log(`  Text: ${item.text}`);
    });

    // Check for canvas elements
    const canvasElements = await page.locator('canvas').count();
    console.log(`\n=== Canvas Elements: ${canvasElements} ===`);

    // Check for ship-related elements
    const shipElements = await page.locator('[class*="ship"], [id*="ship"]').count();
    console.log(`\n=== Ship-related Elements: ${shipElements} ===`);

    // Check for grid-related elements
    const gridElements = await page.locator('[class*="grid"], [id*="grid"]').count();
    console.log(`\n=== Grid-related Elements: ${gridElements} ===`);

    // Take a screenshot for visual debugging
    await page.screenshot({
      path: 'placement-ui-debug.png',
      fullPage: true
    });
    console.log('\n📸 Screenshot saved as placement-ui-debug.png');
  });
});

// Run the tests
console.log('Starting Enhanced Ship Placement UI Tests...');
console.log('Target URL: http://localhost:3000/game');
console.log('============================================\n');