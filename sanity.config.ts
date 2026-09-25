import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { schema } from './src/sanity/schemaTypes';

export default defineConfig({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID || 'missing-project-id',
  dataset: import.meta.env.PUBLIC_SANITY_DATASET || 'production',
  plugins: [structureTool()],
  schema,
});
