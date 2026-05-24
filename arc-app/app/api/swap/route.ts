import { NextRequest, NextResponse } from 'next/server';
import { AppKit } from '@circle-fin/app-kit';
import { createViemAdapterFromPrivateKey } from '@circle-fin/adapter-viem-v2';
import type { SwapParams } from '@circle-fin/app-kit';

export async function POST(req: NextRequest) {
  try {
    const { chain, tokenIn, tokenOut, amountIn } = await req.json();

    if (!process.env.PRIVATE_KEY) {
      return NextResponse.json({ error: 'PRIVATE_KEY not set in environment' }, { status: 500 });
    }
    if (!process.env.KIT_KEY) {
      return NextResponse.json({ error: 'KIT_KEY not set in environment (required for swap). Get one free at console.circle.com' }, { status: 500 });
    }

    const kit = new AppKit();

    const adapter = createViemAdapterFromPrivateKey({
      privateKey: process.env.PRIVATE_KEY as string,
    });

    const swapParams: SwapParams = {
      from: { adapter, chain },
      tokenIn,
      tokenOut,
      amountIn,
      config: {
        kitKey: process.env.KIT_KEY as string,
      },
    };

    const result = await kit.swap(swapParams);

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[swap]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
