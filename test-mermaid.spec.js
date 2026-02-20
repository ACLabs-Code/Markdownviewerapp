import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testMermaidRendering() {
  console.log('Starting Playwright test...\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Navigate to the app
    console.log('Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Take screenshot of initial state
    console.log('Taking screenshot of initial state...');
    await page.screenshot({ path: 'test-screenshots/01-initial.png', fullPage: true });

    // Check for file input element
    console.log('\nLooking for file input...');
    const fileInput = page.locator('input[type="file"]');
    const fileInputCount = await fileInput.count();
    console.log(`Found ${fileInputCount} file input element(s)`);

    if (fileInputCount > 0) {
      // Load the test markdown file using file input
      console.log('\nLoading test-mermaid.md file...');
      const testFilePath = path.join(__dirname, 'test-mermaid.md');
      await fileInput.setInputFiles(testFilePath);

      // Wait for content to render
      console.log('Waiting for content to render...');
      await page.waitForTimeout(4000); // Wait 4 seconds for Mermaid diagrams
      await page.waitForLoadState('networkidle');

      // Take screenshot of rendered content
      console.log('Taking screenshot of rendered content...');
      await page.screenshot({ path: 'test-screenshots/02-rendered-full.png', fullPage: true });

      // Inspect Mermaid diagrams
      console.log('\nInspecting Mermaid diagrams...');
      const mermaidContainers = page.locator('.mermaid-container');
      const containerCount = await mermaidContainers.count();
      console.log(`Found ${containerCount} Mermaid diagram container(s)`);

      // Check SVG elements
      const svgs = page.locator('.mermaid-container svg');
      const svgCount = await svgs.count();
      console.log(`Found ${svgCount} SVG element(s)`);

      if (svgCount > 0) {
        // Analyze first diagram (flowchart)
        console.log('\n--- Analyzing Diagram 1: Flowchart ---');
        const firstSvg = svgs.nth(0);
        const bbox1 = await firstSvg.boundingBox();
        if (bbox1) {
          console.log(`SVG dimensions: ${Math.round(bbox1.width)}x${Math.round(bbox1.height)}`);
          await page.screenshot({
            path: 'test-screenshots/03-flowchart.png',
            clip: bbox1,
          });
        }

        // Check for text elements in first diagram
        const texts1 = page.locator('.mermaid-container').nth(0).locator('text');
        const textCount1 = await texts1.count();
        console.log(`Text elements: ${textCount1}`);

        // Sample text content
        for (let i = 0; i < Math.min(textCount1, 10); i++) {
          const text = await texts1.nth(i).textContent();
          if (text && text.trim()) {
            console.log(`  Text ${i}: "${text.trim()}"`);
          }
        }

        // Analyze second diagram (sequence diagram) if exists
        if (svgCount > 1) {
          console.log('\n--- Analyzing Diagram 2: Sequence Diagram ---');
          const secondSvg = svgs.nth(1);
          const bbox2 = await secondSvg.boundingBox();
          if (bbox2) {
            console.log(`SVG dimensions: ${Math.round(bbox2.width)}x${Math.round(bbox2.height)}`);
            await page.screenshot({
              path: 'test-screenshots/04-sequence.png',
              clip: bbox2,
            });
          }
        }

        // Analyze state diagram if exists
        if (svgCount > 3) {
          console.log('\n--- Analyzing Diagram 4: State Diagram ---');
          const fourthSvg = svgs.nth(3);
          const bbox4 = await fourthSvg.boundingBox();
          if (bbox4) {
            console.log(`SVG dimensions: ${Math.round(bbox4.width)}x${Math.round(bbox4.height)}`);
            await page.screenshot({
              path: 'test-screenshots/05-state.png',
              clip: bbox4,
            });
          }
        }

        // Analyze git graph if exists
        if (svgCount > 4) {
          console.log('\n--- Analyzing Diagram 5: Git Graph ---');
          const fifthSvg = svgs.nth(4);
          const bbox5 = await fifthSvg.boundingBox();
          if (bbox5) {
            console.log(`SVG dimensions: ${Math.round(bbox5.width)}x${Math.round(bbox5.height)}`);
            await page.screenshot({
              path: 'test-screenshots/06-gitgraph.png',
              clip: bbox5,
            });
          }
        }

        // Check for foreignObject elements (HTML labels)
        const foreignObjects = page.locator('.mermaid-container svg foreignObject');
        const foreignObjectCount = await foreignObjects.count();
        console.log(`\nForeignObject elements (HTML labels): ${foreignObjectCount}`);

        // Get the HTML of the first diagram to inspect structure
        console.log('\n--- First Diagram HTML Structure ---');
        const firstDiagramHTML = await mermaidContainers.nth(0).innerHTML();
        // Just show a snippet
        console.log(firstDiagramHTML.substring(0, 500) + '...');
      }

      console.log('\n✅ Test complete!');
      console.log('\nScreenshots saved to test-screenshots/:');
      console.log('  - 01-initial.png (app before loading file)');
      console.log('  - 02-rendered-full.png (full page with all diagrams)');
      console.log('  - 03-flowchart.png (first diagram closeup)');
      console.log('  - 04-sequence.png (second diagram closeup)');
      console.log('  - 05-state.png (state diagram closeup)');
      console.log('  - 06-gitgraph.png (git graph closeup)');
    } else {
      console.log('❌ No file input found - app may be in File System Access API only mode');
    }
  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testMermaidRendering();
