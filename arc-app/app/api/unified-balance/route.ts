import { NextRequest, NextResponse } from 'next/server';
import { AppKit } from '@circle-fin/app-kit';
import { createViemAdapterFromPrivateKey } from '@circle-fin/adapter-viem-v2';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode } = body;

    if (!process.env.PRIVATE_KEY) {
      return NextResponse.json({ error: 'PRIVATE_KEY not set in environment' }, { status: 500 });
    }

    const kit = new AppKit();

    const adapter = createViemAdapterFromPrivateKey({
      privateKey: process.env.PRIVATE_KEY as string,
    });

    let result;

    if (mode === 'deposit') {
      const { fromChain, amount } = body;
      result = await kit.unifiedBalance.deposit({
        from: { adapter, chain: fromChain },
        amount,
        token: 'USDC',
      });
    } else if (mode === 'spend') {
      const { spendChain, recipient, amount } = body;
      result = await kit.unifiedBalance.spend({
        from: { adapter },
        amountIn: amount,
        to: {
          adapter,
          chain: spendChain,
          recipientAddress: recipient,
        },
      });
    } else {
      return NextResponse.json({ error: 'Invalid mode. Use "deposit" or "spend".' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[unified-balance]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
