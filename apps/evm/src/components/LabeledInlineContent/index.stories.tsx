import type { Meta } from '@storybook/react';

import { lela } from '__mocks__/models/tokens';

import { withCenterStory } from 'stories/decorators';

import { LabeledInlineContent } from '.';

export default {
  title: 'Components/LabeledInlineContent',
  component: LabeledInlineContent,
  decorators: [withCenterStory({ width: 450 })],
} as Meta<typeof LabeledInlineContent>;

export const Default = () => (
  <LabeledInlineContent label="Available VAI LIMIT">2000 VAI</LabeledInlineContent>
);

export const WithIcon = () => (
  <LabeledInlineContent label="Available VAI LIMIT" iconSrc="magnifier">
    2000 VAI
  </LabeledInlineContent>
);

export const WithTokenIcon = () => (
  <LabeledInlineContent label="Available VAI LIMIT" iconSrc={lela}>
    2000 VAI
  </LabeledInlineContent>
);

export const WithInvertedTextColors = () => (
  <LabeledInlineContent label="Available VAI LIMIT" iconSrc="magnifier" invertTextColors>
    2000 VAI
  </LabeledInlineContent>
);
