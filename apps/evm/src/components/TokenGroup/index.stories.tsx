import type { Meta } from '@storybook/react';

import { bnb, eth, lisUsd, usdc, usdt, lela } from '__mocks__/models/tokens';

import { withCenterStory } from 'stories/decorators';
import type { Token } from 'types';

import { TokenGroup } from '.';

export default {
  title: 'Components/TokenGroup',
  component: TokenGroup,
  decorators: [withCenterStory({ width: 600 })],
} as Meta<typeof TokenGroup>;

const tokens: Token[] = [usdt, eth, usdc, lela, bnb, lisUsd];

export const Default = () => <TokenGroup tokens={tokens} />;

export const WithLimit = () => <TokenGroup tokens={tokens} limit={3} />;
