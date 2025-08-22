#!/usr/bin/env node

import { program } from 'commander';
import { initialize } from './initialize.js';
import { update } from './update.js';
import { createMayoristasCollection } from './create-mayoristas-collection.js';
import { testMayoristaSearch } from './test-mayorista-search.js';
import { testMayoristaAutocomplete } from './test-mayorista-autocomplete.js';
import { testProductMapping } from './test-product-mapping.js';
import { migrateMayoristaData } from './migrate-mayorista-data.js';
import { testItemConversion } from './test-item-conversion.js';
import { testSimpleConversion } from './test-simple-conversion.js';
import { testFinalConversion } from './test-final-conversion.js';

program
  .command('init')
  .description('Initialize a new next-forge project')
  .option('--name <name>', 'Name of the project')
  .option(
    '--package-manager <manager>',
    'Package manager to use (npm, yarn, bun, pnpm)'
  )
  .option('--disable-git', 'Disable git initialization')
  .action(initialize);

program
  .command('update')
  .description('Update the project from one version to another')
  .option('--from <version>', 'Version to update from e.g. 1.0.0')
  .option('--to <version>', 'Version to update to e.g. 2.0.0')
  .action(update);

program
  .command('create-mayoristas-collection')
  .description('Create the mayoristas collection in MongoDB with proper indexes')
  .action(createMayoristasCollection);

program
  .command('test-mayorista-search')
  .description('Test the mayorista search functionality')
  .action(testMayoristaSearch);

program
  .command('test-mayorista-autocomplete')
  .description('Test the mayorista autocomplete functionality')
  .action(testMayoristaAutocomplete);

program
  .command('test-product-mapping')
  .description('Test the product mapping functionality for autocomplete')
  .action(testProductMapping);

program
  .command('migrate-mayorista-data')
  .description('Migrate existing mayorista data to the new personal data structure')
  .action(migrateMayoristaData);

program
  .command('test-item-conversion')
  .description('Test the bidirectional item conversion between DB format and select options')
  .action(testItemConversion);

program
  .command('test-simple-conversion')
  .description('Test simple item conversion for debugging')
  .action(testSimpleConversion);

program
  .command('test-final-conversion')
  .description('Test the complete item conversion flow')
  .action(testFinalConversion);

program.parse(process.argv);
