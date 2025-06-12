import type Vi from 'vitest';

import tokens, { lela } from '__mocks__/models/tokens';
import { renderHook } from 'testUtils/render';

import { useGetTokens } from 'libs/tokens/hooks/useGetTokens';

import { useGetToken } from '..';

vi.mock('libs/tokens/hooks/useGetTokens');

describe('useGetToken', () => {
  beforeEach(() => {
    (useGetTokens as Vi.Mock).mockImplementation(() => tokens);
  });

  it('returns token when a corresponding symbol is found', () => {
    const { result } = renderHook(() =>
      useGetToken({
        symbol: 'LELA',
      }),
    );

    expect(result.current).toStrictEqual(lela);
  });

  it('returns undefined when no corresponding token is found', () => {
    const { result } = renderHook(() =>
      useGetToken({
        symbol: 'INVALID-TOKEN-SYMBOL',
      }),
    );

    expect(result.current).toBe(undefined);
  });
});
