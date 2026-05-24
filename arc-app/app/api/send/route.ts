import { NextRequest, NextResponse } from 'next/server';
import { AppKit } from '@circle-fin/app-kit';
import { createViemAdapterFromPrivateKey } from '@circle-fin/adapter-viem-v2';
import type { SendParams } from '@circle-fin/app-kit';

export async function POST(req: NextRequest) {
  try {
    const { chain, token, to, amount } = await req.json();

    if (!process.env.PRIVATE_KEY) {
      return NextResponse.json({ error: 'PRIVATE_KEY not set in environment' }, { status: 500 });
    }

    const kit = new AppKit();

    const adapter = createViemAdapterFromPrivateKey({
      privateKey: process.env.PRIVATE_KEY as string,
    });

    const sendParams: SendParams = {
      from: { adapter, chain },
      to,
      amount,
      token,
    };

    const result = await kit.send(sendParams);

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[send]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
