import type { SchemaTypeDefinition } from 'sanity';
import { blockContentType } from './blockContent';
import { commonplaceEntryType } from './commonplaceEntry';
import { postType } from './post';

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [blockContentType, postType, commonplaceEntryType],
};
