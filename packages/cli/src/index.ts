#!/usr/bin/env bun
import { Command } from 'commander';
import { createCanvas } from '@napi-rs/canvas';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';

import {
  generateWallpaper,
  generateShapeConfigs,
  renderWallpaper,
  generateRandomPalette,
  getPaletteNames,
  getAllPalettes,
  RESOLUTION_PRESETS,
  type GeneratorOptions,
  type ResolutionPreset,
} from '@wallpaper-gen/core';

const program = new Command();

program
  .name('wallpaper')
  .description('Generate beautiful geometric wallpapers')
  .version('0.0.1');

program
  .command('generate')
  .description('Generate a wallpaper with specified options')
  .option('-p, --palette <name>', 'palette name', 'catppuccinMocha')
  .option('-s, --shapes <number>', 'number of shapes', '7')
  .option('-r, --resolution <preset>', 'resolution preset (hd, fhd, qhd, 4k, ultrawide, mobile)', 'fhd')
  .option('-w, --width <number>', 'custom width (overrides resolution)')
  .option('-h, --height <number>', 'custom height (overrides resolution)')
  .option('-o, --output <path>', 'output file path', './wallpaper.png')
  .option('--seed <number>', 'random seed for reproducibility')
  .action(async (options) => {
    const spinner = ora('Generating wallpaper...').start();

    try {
      let width: number;
      let height: number;

      if (options.width && options.height) {
        width = parseInt(options.width, 10);
        height = parseInt(options.height, 10);
      } else {
        const preset = RESOLUTION_PRESETS[options.resolution as ResolutionPreset];
        if (!preset) {
          spinner.fail(`Unknown resolution preset: ${options.resolution}`);
          console.log(chalk.yellow('Available presets:'), Object.keys(RESOLUTION_PRESETS).join(', '));
          process.exit(1);
        }
        width = preset.width;
        height = preset.height;
      }

      const generatorOptions: GeneratorOptions = {
        width,
        height,
        palette: options.palette,
        shapeCount: parseInt(options.shapes, 10),
        seed: options.seed ? parseInt(options.seed, 10) : undefined,
      };

      const canvas = createCanvas(width, height);
      const config = generateWallpaper(canvas as any, generatorOptions);

      const outputPath = path.resolve(options.output);
      const buffer = canvas.toBuffer('image/png');
      await fs.writeFile(outputPath, buffer);

      spinner.succeed(`Wallpaper saved to ${chalk.green(outputPath)}`);
      console.log(chalk.dim(`  Resolution: ${width}x${height}`));
      console.log(chalk.dim(`  Palette: ${options.palette}`));
      console.log(chalk.dim(`  Shapes: ${options.shapes}`));
      if (config.seed) {
        console.log(chalk.dim(`  Seed: ${config.seed}`));
      }
    } catch (error) {
      spinner.fail('Failed to generate wallpaper');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

program
  .command('random')
  .description('Generate a wallpaper with random colors')
  .option('-s, --shapes <number>', 'number of shapes', '7')
  .option('-r, --resolution <preset>', 'resolution preset', 'fhd')
  .option('-w, --width <number>', 'custom width')
  .option('-h, --height <number>', 'custom height')
  .option('-o, --output <path>', 'output file path', './wallpaper.png')
  .option('--seed <number>', 'random seed')
  .action(async (options) => {
    const spinner = ora('Generating random wallpaper...').start();

    try {
      let width: number;
      let height: number;

      if (options.width && options.height) {
        width = parseInt(options.width, 10);
        height = parseInt(options.height, 10);
      } else {
        const preset = RESOLUTION_PRESETS[options.resolution as ResolutionPreset];
        if (!preset) {
          spinner.fail(`Unknown resolution preset: ${options.resolution}`);
          process.exit(1);
        }
        width = preset.width;
        height = preset.height;
      }

      const seed = options.seed ? parseInt(options.seed, 10) : Date.now();
      const shapeCount = parseInt(options.shapes, 10);
      const randomColors = generateRandomPalette(shapeCount, seed);

      const generatorOptions: GeneratorOptions = {
        width,
        height,
        palette: randomColors,
        shapeCount,
        seed,
      };

      const canvas = createCanvas(width, height);
      generateWallpaper(canvas as any, generatorOptions);

      const outputPath = path.resolve(options.output);
      const buffer = canvas.toBuffer('image/png');
      await fs.writeFile(outputPath, buffer);

      spinner.succeed(`Random wallpaper saved to ${chalk.green(outputPath)}`);
      console.log(chalk.dim(`  Resolution: ${width}x${height}`));
      console.log(chalk.dim(`  Seed: ${seed} (use this to reproduce)`));
      console.log(chalk.dim(`  Colors:`));
      randomColors.forEach((c, i) => console.log(chalk.hex(c)(`    ${i + 1}. ${c}`)));
    } catch (error) {
      spinner.fail('Failed to generate wallpaper');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

program
  .command('palettes')
  .description('List available color palettes')
  .action(() => {
    console.log(chalk.bold('\nAvailable Palettes:\n'));
    
    const palettes = getAllPalettes();
    for (const palette of palettes) {
      console.log(chalk.hex(palette.colors[0])('●') + ' ' + chalk.bold(palette.displayName) + chalk.dim(` (${palette.name})`));
      
      const colorPreview = palette.colors
        .map(c => chalk.bgHex(c)('  '))
        .join('');
      console.log(`  ${colorPreview}`);
      console.log(chalk.dim(`  Background: ${palette.background}`));
      console.log();
    }
  });

program
  .command('resolutions')
  .description('List available resolution presets')
  .action(() => {
    console.log(chalk.bold('\nAvailable Resolutions:\n'));
    
    for (const [key, preset] of Object.entries(RESOLUTION_PRESETS)) {
      console.log(`  ${chalk.green(key.padEnd(12))} ${chalk.dim(preset.label)}`);
    }
    console.log();
  });

program.parse();
